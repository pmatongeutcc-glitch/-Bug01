import React, { useState, useEffect, useRef } from 'react';
import { Car, Booking, FleetSettings } from './types';
import { 
  getStoredCars, saveStoredCars, 
  getStoredBookings, saveStoredBookings, 
  getStoredLineMessages, saveStoredLineMessages 
} from './utils/storage';
import { getTodayDateString, INITIAL_CARS } from './data/initialData';
import { START_HOUR, END_HOUR, TOTAL_MINUTES } from './utils/time';
import { 
  Car as CarIcon, Clock, Calendar, ChevronLeft, ChevronRight, ChevronDown, ChevronUp,
  CheckCircle2, Plus, Shield, Lock, X, Send, Bell, 
  Trash2, AlertCircle, Bolt, Fuel, User, MapPin, AlertTriangle, Cloud,
  Radio, Globe, RefreshCw, Tv, Users, Check, Settings, Wrench, Megaphone, Edit3, Sparkles,
  Printer
} from 'lucide-react';
import { 
  testConnection, subscribeCars, subscribeBookings, subscribeLineMessages, subscribeSettings,
  saveBookingToCloud, updateBookingInCloud, deleteBookingFromCloud, saveCarToCloud,
  updateCarInCloud, deleteCarFromCloud, resetCarsInCloud,
  saveLineMessageToCloud, saveSettingsToCloud, clearAllBookingsFromCloud, fetchFreshDataFromCloud
} from './lib/firebase';
import { BugSolutionsLogo } from './components/BugSolutionsLogo';
import { MonthlyCalendarView } from './components/MonthlyCalendarView';
import { AdminSettingsModal } from './components/AdminSettingsModal';
import { AdminCarModal } from './components/AdminCarModal';
import { AdminBookingModal } from './components/AdminBookingModal';
import { BookingDetailModal } from './components/BookingDetailModal';
import { AdminKeyModal } from './components/AdminKeyModal';
import { UserAccount } from './types';

export default function App() {
  // Cloud Sync & Central Hub State
  const [cloudStatus, setCloudStatus] = useState<'connecting' | 'connected' | 'offline'>('connecting');
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [liveToast, setLiveToast] = useState<{ message: string; timestamp: number } | null>(null);
  const [isKioskMode, setIsKioskMode] = useState(false);
  const [isCentralBannerExpanded, setIsCentralBannerExpanded] = useState(false);
  const [scheduleViewMode, setScheduleViewMode] = useState<'timeline' | 'monthly'>('timeline');
  const initialLoadRef = useRef(true);
  const bookingFormRef = useRef<HTMLDivElement | null>(null);

  // State
  const [isAdmin, setIsAdmin] = useState(false);
  const [cars, setCars] = useState<Car[]>(getStoredCars);
  // Ensure no legacy mock bookings are loaded
  const [bookings, setBookings] = useState<Booking[]>(() => {
    const loaded = getStoredBookings();
    return loaded.filter(b => !['สมชาย ใจดี', 'วิภาดา รัตนกุล', 'ชัยวัฒน์ กิจบริรักษ์', 'ดร. กานต์สินี อัศวเมฆินทร์', 'ปิยะพงษ์ วิริยะ', 'ก้องเกียรติ ยิ่งยง'].includes(b.bookerName));
  });
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString);
  const [currentTimePct, setCurrentTimePct] = useState<number | null>(null);
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  // 5-Slot Display Limit & Filter controls
  const [carFilter, setCarFilter] = useState<'all' | 'ev' | 'ice'>('all');
  const [carPage, setCarPage] = useState(0);
  const SLOTS_LIMIT = 5;

  const filteredAllCars = cars.filter(c => {
    if (carFilter === 'ev') return (c.fuelType || '').includes('EV');
    if (carFilter === 'ice') return !(c.fuelType || '').includes('EV');
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredAllCars.length / SLOTS_LIMIT));
  const safePage = Math.min(carPage, totalPages - 1);
  const visibleCars = filteredAllCars.slice(safePage * SLOTS_LIMIT, (safePage + 1) * SLOTS_LIMIT);

  // Form State
  const [bookerName, setBookerName] = useState('');
  const [selectedCarId, setSelectedCarId] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [purpose, setPurpose] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Quick book helper from monthly calendar or external
  const handleQuickBookDate = (dateStr: string, carId?: string) => {
    setSelectedDate(dateStr);
    if (carId) setSelectedCarId(carId);
    setTimeout(() => {
      bookingFormRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 80);
  };

  // Reasonable duration limit warning (Default 4 hours)
  const [reasonableLimitHours, setReasonableLimitHours] = useState<number>(4);
  const [showLongBookingModal, setShowLongBookingModal] = useState<boolean>(false);
  const [longBookingConfirmed, setLongBookingConfirmed] = useState<boolean>(false);

  // Helper to calculate duration
  const calculateDuration = (start: string, end: string) => {
    if (!start || !end) return { totalMinutes: 0, hours: 0, minutes: 0, formatted: '' };
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    const totalMinutes = (eH * 60 + (eM || 0)) - (sH * 60 + (sM || 0));
    if (totalMinutes <= 0) return { totalMinutes: 0, hours: 0, minutes: 0, formatted: '0 ชม.' };
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    let formatted = '';
    if (hours > 0 && minutes > 0) {
      formatted = `${hours} ชั่วโมง ${minutes} นาที`;
    } else if (hours > 0) {
      formatted = `${hours} ชั่วโมง`;
    } else {
      formatted = `${minutes} นาที`;
    }
    return { totalMinutes, hours, minutes, formatted };
  };

  // Modals & Admin State
  const [showPinModal, setShowPinModal] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [pinError, setPinError] = useState(false);

  // Pro Admin Fleet Management Modals
  const [fleetSettings, setFleetSettings] = useState<FleetSettings>({
    reasonableLimitHours: 4,
    adminPin: '1234',
    enableLineNotifications: true,
    autoApproveBookings: true,
    operatingHoursStart: 6,
    operatingHoursEnd: 18,
    systemNotice: ''
  });
  const [showAdminSettingsModal, setShowAdminSettingsModal] = useState(false);
  const [showCarModal, setShowCarModal] = useState(false);
  const [carToEdit, setCarToEdit] = useState<Car | null>(null);
  const [showAdminBookingModal, setShowAdminBookingModal] = useState(false);
  const [bookingToEdit, setBookingToEdit] = useState<Booking | null>(null);

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [keyModalMode, setKeyModalMode] = useState<'handover' | 'return'>('handover');
  const [keyModalBooking, setKeyModalBooking] = useState<Booking | null>(null);

  const currentUser: UserAccount = {
    id: isAdmin ? 'usr-admin' : 'usr-employee',
    name: bookerName.trim() || (isAdmin ? 'ผู้ดูแลระบบ' : 'พนักงานบริษัท'),
    email: 'staff@company.com',
    role: isAdmin ? 'admin' : 'employee',
    department: 'ฝ่ายยานพาหนะ/ส่วนกลาง',
    employeeId: isAdmin ? 'ADM-001' : 'EMP-001'
  };
  const [showLineModal, setShowLineModal] = useState(false);
  const [lineMessages, setLineMessages] = useState(getStoredLineMessages);

  const todayStr = getTodayDateString();
  const isToday = selectedDate === todayStr;

  // Cloud Real-time Subscriptions (Atomic Firestore Sync)
  useEffect(() => {
    testConnection().then(isOnline => {
      setCloudStatus(isOnline ? 'connected' : 'offline');
    });

    const unsubCars = subscribeCars((cloudCars) => {
      if (cloudCars && cloudCars.length > 0) {
        setCars(cloudCars);
        saveStoredCars(cloudCars);
      }
      setCloudStatus('connected');
      setLastSyncTime(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' น.');
    }, () => setCloudStatus('offline'));

    const unsubBookings = subscribeBookings((cloudBookings) => {
      setBookings(prev => {
        if (!initialLoadRef.current && cloudBookings.length > prev.length) {
          const newest = cloudBookings[0];
          if (newest) {
            setLiveToast({
              message: `คุณ ${newest.bookerName} เพิ่งจองรถ (${newest.startTime} - ${newest.endTime} น.) อัปเดตตารางให้เรียลไทม์แล้ว`,
              timestamp: Date.now()
            });
          }
        }
        return cloudBookings;
      });
      saveStoredBookings(cloudBookings);
      setCloudStatus('connected');
      setLastSyncTime(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' น.');
      initialLoadRef.current = false;
    }, () => setCloudStatus('offline'));

    const unsubMsgs = subscribeLineMessages((cloudMsgs) => {
      if (cloudMsgs && cloudMsgs.length > 0) {
        setLineMessages(cloudMsgs);
        saveStoredLineMessages(cloudMsgs);
      }
      setCloudStatus('connected');
    });

    const unsubSettings = subscribeSettings((settings) => {
      if (settings) {
        setFleetSettings(prev => ({ ...prev, ...settings }));
        if (typeof settings.reasonableLimitHours === 'number') {
          setReasonableLimitHours(settings.reasonableLimitHours);
        }
      }
    });

    return () => {
      unsubCars();
      unsubBookings();
      unsubMsgs();
      unsubSettings();
    };
  }, []);

  // Auto-dismiss live toast after 6 seconds
  useEffect(() => {
    if (!liveToast) return;
    const timer = setTimeout(() => setLiveToast(null), 6000);
    return () => clearTimeout(timer);
  }, [liveToast]);

  // Manual Force Refresh from Cloud
  const handleManualRefresh = async () => {
    setIsManualRefreshing(true);
    try {
      const data = await fetchFreshDataFromCloud();
      if (data.cars.length > 0) {
        setCars(data.cars);
        saveStoredCars(data.cars);
      }
      setBookings(data.bookings);
      saveStoredBookings(data.bookings);
      if (data.lineMessages.length > 0) {
        setLineMessages(data.lineMessages);
        saveStoredLineMessages(data.lineMessages);
      }
      setCloudStatus('connected');
      setLastSyncTime(new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' น.');
    } catch (err) {
      console.error('Error refreshing from cloud:', err);
    } finally {
      setTimeout(() => setIsManualRefreshing(false), 400);
    }
  };

  // Save changes locally as fallback cache
  useEffect(() => {
    saveStoredCars(cars);
  }, [cars]);

  useEffect(() => {
    saveStoredBookings(bookings);
  }, [bookings]);

  useEffect(() => {
    saveStoredLineMessages(lineMessages);
  }, [lineMessages]);

  // Current time marker
  useEffect(() => {
    const updateTime = () => {
      if (!isToday) {
        setCurrentTimePct(null);
        return;
      }
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();

      if (h >= START_HOUR && h < END_HOUR) {
        const passedMins = (h - START_HOUR) * 60 + m;
        const pct = (passedMins / TOTAL_MINUTES) * 100;
        setCurrentTimePct(pct);
        setCurrentTimeStr(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      } else {
        setCurrentTimePct(null);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, [isToday]);

  // Add LINE Notify log helper (with Cloud Sync)
  const addLineLog = (text: string) => {
    const newMsg = {
      id: 'ln-' + Date.now(),
      timestamp: new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.',
      event: 'booking_created' as const,
      message: text,
      status: 'sent' as const
    };
    setLineMessages(prev => [newMsg, ...prev]);
    saveLineMessageToCloud(newMsg).catch(err => console.error('Cloud Line msg error:', err));
  };

  // Execute and Save Booking (Atomic Cloud Firestore sync)
  const finalizeBooking = (isConfirmedLongBooking: boolean = false) => {
    const newBooking: Booking = {
      id: 'bk-' + Date.now().toString().slice(-4),
      carId: selectedCarId,
      date: selectedDate,
      startTime,
      endTime,
      bookerName: bookerName.trim(),
      department: 'พนักงานบริษัท',
      phoneNumber: '',
      purpose: purpose.trim() || 'ติดต่อประสานงาน',
      destination: purpose.trim() || 'ภายนอกบริษัท',
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    // Optimistic local state update
    setBookings(prev => [newBooking, ...prev]);

    // Atomic cloud persistence
    saveBookingToCloud(newBooking).catch(err => console.error('Cloud save booking error:', err));

    const car = cars.find(c => c.id === selectedCarId);
    const duration = calculateDuration(startTime, endTime);
    const durationNote = isConfirmedLongBooking 
      ? ` [⚠️ ยืนยันจองระยะยาว ${duration.formatted}]` 
      : ` [ระยะเวลา ${duration.formatted}]`;

    addLineLog(`🚗 [จองรถสำเร็จ] รถ ${car?.brand} [${car?.vehicleId}: ${car?.plate}] วันที่ ${selectedDate} เวลา ${startTime}-${endTime} น.${durationNote} โดยคุณ ${bookerName}`);

    // Reset Form & Modals
    setBookerName('');
    setPurpose('');
    setShowLongBookingModal(false);
    setLongBookingConfirmed(false);
    setBookingSuccess(true);
    setTimeout(() => setBookingSuccess(false), 2500);
  };

  // Submit Booking Form
  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError('');

    if (!bookerName.trim()) {
      setBookingError('กรุณากรอกชื่อผู้จอง');
      return;
    }
    if (!selectedCarId) {
      setBookingError('กรุณาเลือกรถยนต์');
      return;
    }

    const chosenCar = cars.find(c => c.id === selectedCarId);
    if (chosenCar?.status === 'maintenance') {
      setBookingError('❌ รถคันนี้อยู่ระหว่างส่งซ่อมบำรุง / งดให้บริการชั่วคราว กรุณาเลือกรถคันอื่น');
      return;
    }

    if (startTime >= endTime) {
      setBookingError('เวลาเริ่มต้องมาก่อนเวลากลับ (ช่วง 06:00 - 18:00 น.)');
      return;
    }

    // Check collision
    const collision = bookings.some(b => {
      if (b.carId === selectedCarId && b.date === selectedDate && b.status !== 'cancelled' && b.status !== 'completed') {
        return startTime < b.endTime && endTime > b.startTime;
      }
      return false;
    });

    if (collision) {
      setBookingError('❌ รถคันนี้ถูกจองในช่วงเวลานี้แล้ว กรุณาเลือกช่วงเวลาอื่น หรือเลือกรถคันอื่น');
      return;
    }

    // Check if booking duration exceeds reasonable limit (e.g. 4 hours)
    const duration = calculateDuration(startTime, endTime);
    const limitMinutes = reasonableLimitHours * 60;

    if (duration.totalMinutes > limitMinutes) {
      setLongBookingConfirmed(false);
      setShowLongBookingModal(true);
      return;
    }

    // Standard booking within reasonable limit
    finalizeBooking(false);
  };

  // Status handlers
  const updateBookingStatus = (bookingId: string, newStatus: Booking['status']) => {
    setBookings(prev => prev.map(b => {
      if (b.id === bookingId) {
        return { ...b, status: newStatus };
      }
      return b;
    }));

    // Cloud Firestore atomic update
    updateBookingInCloud(bookingId, { status: newStatus }).catch(err => console.error('Cloud update error:', err));

    const b = bookings.find(item => item.id === bookingId);
    const car = cars.find(c => c.id === b?.carId);

    if (newStatus === 'in_use') {
      addLineLog(`🔑 [ส่งมอบกุญแจแล้ว] รถ ${car?.brand} [${car?.vehicleId}: ${car?.plate}] ให้คุณ ${b?.bookerName} มีกำหนดคืน ${b?.endTime} น.`);
    } else if (newStatus === 'completed') {
      addLineLog(`🏁 [คืนรถเรียบร้อย] รถ ${car?.brand} [${car?.vehicleId}: ${car?.plate}] ส่งคืนแล้วโดยคุณ ${b?.bookerName}`);
    } else if (newStatus === 'cancelled') {
      addLineLog(`❌ [ยกเลิกการจอง] รายการจองรถ ${car?.brand} [${car?.vehicleId}] เวลา ${b?.startTime}-${b?.endTime} น. ถูกยกเลิก`);
    }

    setSelectedBooking(null);
  };

  // Verify PIN for Admin (checks cloud settings or default 1234)
  const handleVerifyPin = () => {
    const validPin = fleetSettings.adminPin || '1234';
    if (adminPin === validPin) {
      setIsAdmin(true);
      setShowPinModal(false);
      setAdminPin('');
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  // ADMIN FLEET CRUD: Save / Update Car
  const handleSaveCar = async (carData: Car) => {
    const exists = cars.some(c => c.id === carData.id);
    if (exists) {
      setCars(prev => prev.map(c => c.id === carData.id ? carData : c));
      await updateCarInCloud(carData.id, carData).catch(err => console.error('Cloud car update error:', err));
      addLineLog(`🚗 [อัปเดตข้อมูลรถ] รหัส ${carData.vehicleId} ทะเบียน ${carData.plate} (${carData.brand}) อัปเดตข้อมูลสำเร็จ`);
    } else {
      setCars(prev => [...prev, carData]);
      await saveCarToCloud(carData).catch(err => console.error('Cloud car add error:', err));
      addLineLog(`🚗 [เพิ่มรถใหม่] รหัส ${carData.vehicleId} ทะเบียน ${carData.plate} (${carData.brand}) ถูกเพิ่มเข้าสู่ระบบ`);
    }
  };

  // ADMIN FLEET CRUD: Delete Car
  const handleDeleteCar = async (carId: string) => {
    const carToDelete = cars.find(c => c.id === carId);
    setCars(prev => prev.filter(c => c.id !== carId));
    await deleteCarFromCloud(carId).catch(err => console.error('Cloud car delete error:', err));
    if (carToDelete) {
      addLineLog(`🗑️ [ลบรถยนต์] รหัส ${carToDelete.vehicleId} ทะเบียน ${carToDelete.plate} ถูกลบออกจากระบบ`);
    }
  };

  // ADMIN FLEET CRUD: Quick Toggle Maintenance
  const handleToggleMaintenance = async (car: Car) => {
    const newStatus: 'available' | 'maintenance' = car.status === 'maintenance' ? 'available' : 'maintenance';
    const updated = { ...car, status: newStatus };
    setCars(prev => prev.map(c => c.id === car.id ? updated : c));
    await updateCarInCloud(car.id, { status: newStatus }).catch(err => console.error('Cloud maintenance toggle error:', err));
    addLineLog(
      newStatus === 'maintenance'
        ? `🛠️ [ส่งซ่อมบำรุง] รถ ${car.brand} [${car.vehicleId}] ถูกปรับสถานะเป็นงดให้บริการ/ส่งซ่อม`
        : `🟢 [พร้อมใช้งาน] รถ ${car.brand} [${car.vehicleId}] ซ่อมบำรุงเสร็จสิ้น พร้อมให้บริการ`
    );
  };

  // ADMIN FLEET: Restore Default 6 Cars
  const handleRestoreDefaultCars = async () => {
    setCars(INITIAL_CARS);
    await resetCarsInCloud(INITIAL_CARS).catch(err => console.error('Cloud car reset error:', err));
    addLineLog(`🔄 [กู้คืนรถเริ่มต้น] รีเซ็ตข้อมูลกองยานพาหนะกลับเป็น 6 คันมาตรฐานแล้ว`);
  };

  // ADMIN SETTINGS: Save Global System Settings
  const handleSaveSettings = async (newSettings: Partial<FleetSettings>) => {
    setFleetSettings(prev => ({ ...prev, ...newSettings }));
    if (newSettings.reasonableLimitHours !== undefined) {
      setReasonableLimitHours(newSettings.reasonableLimitHours);
    }
    await saveSettingsToCloud(newSettings).catch(err => console.error('Cloud save settings error:', err));
    addLineLog(`⚙️ [ตั้งค่าระบบ] ผู้ดูแลระบบได้อัปเดตการตั้งค่านโยบายส่วนกลางของระบบ`);
  };

  // ADMIN BOOKING CRUD: Edit Any Booking
  const handleAdminSaveBooking = async (bookingId: string, updates: Partial<Booking>) => {
    setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, ...updates } : b));
    await updateBookingInCloud(bookingId, updates).catch(err => console.error('Cloud booking update error:', err));
    addLineLog(`✏️ [แก้ไขคิวจอง] รายการจอง ID ${bookingId} ได้รับการปรับปรุงข้อมูลโดยผู้ดูแลระบบ`);
  };

  // ADMIN BOOKING CRUD: Delete Any Booking
  const handleAdminDeleteBooking = async (bookingId: string) => {
    setBookings(prev => prev.filter(b => b.id !== bookingId));
    await deleteBookingFromCloud(bookingId).catch(err => console.error('Cloud booking delete error:', err));
    addLineLog(`🗑️ [ลบรายการจอง] รายการจอง ID ${bookingId} ถูกลบออกจากระบบเรียบร้อย`);
  };

  // ADMIN: Clear All Bookings
  const handleClearAllBookings = async () => {
    setBookings([]);
    setLineMessages([]);
    await clearAllBookingsFromCloud().catch(err => console.error('Cloud clear error:', err));
    addLineLog(`🧹 [ล้างข้อมูลระบบ] ประวัติการจองและบันทึกข้อความทั้งหมดถูกล้างเรียบร้อย`);
  };

  // Test Line Notification
  const handleSendTestLineNotification = () => {
    addLineLog(`🔔 [ทดสอบระบบ] สัญญาณแจ้งเตือน LINE Notify ทำงานได้อย่างสมบูรณ์แบบ - BUG SOLUTIONS FLEET`);
  };

  // Stats calculation for selected date
  const activeDateBookings = bookings.filter(b => b.date === selectedDate && b.status !== 'cancelled');
  const statPending = activeDateBookings.filter(b => b.status === 'pending' || b.status === 'approved').length;
  const statInUse = activeDateBookings.filter(b => b.status === 'in_use').length;
  const statTotal = cars.length;
  const statAvailable = Math.max(0, statTotal - statPending - statInUse);

  // Time header ticks
  const hourTicks = [];
  for (let h = START_HOUR; h <= END_HOUR; h++) {
    hourTicks.push(h);
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col antialiased">
      {/* Navbar: Clean, light white header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            {/* Logo: Official BUG SOLUTIONS Logo */}
            <div className="flex items-center gap-3">
              <BugSolutionsLogo height={44} showTagline={true} />
              <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
              <div className="hidden md:flex flex-col">
                <span className="text-slate-800 font-bold text-xs leading-none">Vehicle Booking</span>
                <span className="text-slate-400 font-medium text-[10px] mt-1">ระบบจองรถส่วนกลาง</span>
              </div>
            </div>

            {/* Right status & Role */}
            <div className="flex items-center gap-2.5">
              {/* Cloud Real-time Sync Status */}
              <div 
                className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-all ${
                  cloudStatus === 'connected' 
                    ? 'bg-blue-50 text-[#1E3A8A] border-blue-200' 
                    : cloudStatus === 'connecting'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
                title={cloudStatus === 'connected' ? '⚡ ซิงก์เรียลไทม์กับ Google Cloud Firestore ทุกเครื่องอัปเดตตรงกันทันที' : 'กำลังเชื่อมต่อ Cloud Firestore...'}
              >
                <Cloud className={`w-3.5 h-3.5 ${cloudStatus === 'connected' ? 'text-[#1E3A8A]' : 'text-amber-500'}`} />
                <span className="hidden sm:inline font-bold">Cloud Sync</span>
                <span className={`w-2 h-2 rounded-full ${
                  cloudStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-ping'
                }`}></span>
              </div>

              {/* LINE Notify Modal Trigger */}
              <button
                onClick={() => setShowLineModal(true)}
                className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-xl transition-colors relative"
                title="ดูการแจ้งเตือน LINE"
              >
                <Bell className="w-4 h-4" />
                {lineMessages.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500"></span>
                )}
              </button>

              {/* Role Toggle & Admin Quick Access */}
              {isAdmin ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAdminSettingsModal(true)}
                    className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                    title="ศูนย์ตั้งค่าระบบผู้ดูแลระบบ (Pro Admin Console)"
                  >
                    <Settings className="w-3.5 h-3.5 text-[#1E3A8A]" />
                    <span className="hidden sm:inline">ตั้งค่าระบบ</span>
                  </button>

                  <button
                    onClick={() => {
                      setCarToEdit(null);
                      setShowCarModal(true);
                    }}
                    className="flex items-center gap-1.5 bg-[#1E3A8A] hover:bg-[#152a65] text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                    title="เพิ่มรถยนต์ใหม่เข้าสู่ระบบ"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#F05A28]" />
                    <span className="hidden sm:inline">เพิ่มรถ</span>
                  </button>

                  <button
                    onClick={() => setIsAdmin(false)}
                    className="flex items-center gap-1.5 bg-blue-50 text-[#1E3A8A] hover:bg-blue-100 px-3 py-1.5 rounded-xl text-xs font-bold border border-blue-200 transition-colors cursor-pointer"
                    title="คลิกเพื่อสลับกลับสู่โหมดพนักงานทั่วไป"
                  >
                    <Shield className="w-3.5 h-3.5 text-[#F05A28]" />
                    <span>แอดมิน (Admin)</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setAdminPin('');
                    setPinError(false);
                    setShowPinModal(true);
                  }}
                  className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 transition-colors cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>พนักงาน (User)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5 transition-all ${
        isKioskMode ? 'max-w-[98%] lg:max-w-[96%]' : 'max-w-7xl'
      }`}>

        {/* SYSTEM NOTICE BANNER (Configurable via Admin Console) */}
        {fleetSettings.systemNotice && (
          <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-300/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-2xs animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                <Megaphone className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <span>ประกาศด่วนจากผู้ดูแลระบบ</span>
                  <span className="text-[10px] bg-amber-200/80 text-amber-900 px-1.5 py-0.2 rounded font-semibold">Official Notice</span>
                </span>
                <p className="text-xs text-amber-900/90 leading-snug mt-0.5">{fleetSettings.systemNotice}</p>
              </div>
            </div>
            {isAdmin && (
              <button 
                onClick={() => setShowAdminSettingsModal(true)} 
                className="text-[11px] text-amber-900 font-bold hover:underline shrink-0 bg-white/70 px-2.5 py-1 rounded-lg border border-amber-200/80 shadow-2xs cursor-pointer"
              >
                แก้ไขประกาศ
              </button>
            )}
          </div>
        )}
        
        {/* ENTERPRISE CENTRAL HUB BANNER (Collapsed by default, click to expand) */}
        {!isCentralBannerExpanded ? (
          <div
            onClick={() => setIsCentralBannerExpanded(true)}
            className="group bg-gradient-to-r from-[#1E3A8A] via-[#1e40af] to-[#0f172a] text-white rounded-xl sm:rounded-2xl px-3.5 sm:px-5 py-2.5 sm:py-3 shadow-xs flex items-center justify-between gap-3 border border-blue-900/40 hover:border-blue-500/50 hover:shadow-md transition-all cursor-pointer select-none"
            title="คลิกเพื่อขยายดูรายละเอียดศูนย์กลางระบบและเครื่องมือ"
          >
            <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
              <div className="shrink-0 drop-shadow-sm group-hover:scale-105 transition-transform">
                <BugSolutionsLogo variant="badge" height={38} />
              </div>
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <h1 className="text-xs sm:text-sm md:text-base font-bold tracking-tight text-white truncate">
                  BUG SOLUTIONS • ศูนย์กลางระบบจองรถองค์กร
                </h1>
                <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1 shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Live Real-time
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden sm:flex text-[11px] text-blue-200 bg-white/10 px-2.5 py-1 rounded-lg border border-white/10 items-center gap-1.5">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span>{lastSyncTime || 'อัปเดตสด'}</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsCentralBannerExpanded(true);
                }}
                className="flex items-center gap-1.5 text-xs font-semibold bg-white/15 group-hover:bg-white/25 text-white px-3 py-1.5 rounded-xl border border-white/20 transition-all cursor-pointer shadow-xs"
              >
                <span>ขยาย</span>
                <ChevronDown className="w-3.5 h-3.5 transition-transform group-hover:translate-y-0.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-[#1E3A8A] via-[#1e40af] to-[#0f172a] text-white rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 border border-blue-900/40 transition-all animate-fadeIn">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="shrink-0 drop-shadow-md">
                <BugSolutionsLogo variant="badge" height={52} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white flex items-center gap-2">
                    BUG SOLUTIONS • ศูนย์กลางระบบจองรถองค์กร
                  </h1>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Live Real-time Sync
                  </span>
                </div>
                <p className="text-xs text-blue-100/90 mt-1">
                  เปิดสาธารณะสำหรับทุกคน — ไม่ต้องล็อกอินก็ดูตารางความพร้อมของรถและกดจองได้ทันที ข้อมูลซิงก์ตรงกันทุกเครื่องแบบเรียลไทม์
                </p>
              </div>
            </div>

            {/* Real-time sync action buttons & timestamp */}
            <div className="flex items-center gap-2 self-start md:self-center shrink-0 flex-wrap">
              <div className="text-[11px] text-blue-200 bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span>ซิงก์คลาวด์: <strong className="text-white font-medium">{lastSyncTime || 'อัปเดตสด'}</strong></span>
              </div>
              <button
                onClick={handleManualRefresh}
                disabled={isManualRefreshing}
                className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 active:scale-95 text-white px-3 py-1.5 rounded-xl text-xs font-semibold border border-white/20 transition-all cursor-pointer disabled:opacity-50"
                title="ดึงข้อมูลล่าสุดจาก Cloud Firestore ทันที"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isManualRefreshing ? 'animate-spin text-amber-300' : ''}`} />
                <span>{isManualRefreshing ? 'กำลังดึง...' : 'รีเฟรชคลาวด์'}</span>
              </button>
              <button
                onClick={() => setIsKioskMode(!isKioskMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  isKioskMode 
                    ? 'bg-[#F05A28] text-white border-orange-400 shadow-sm' 
                    : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                }`}
                title="สลับโหมดจอแสดงผลส่วนกลาง (TV / Kiosk Display)"
              >
                <Tv className="w-3.5 h-3.5" />
                <span>{isKioskMode ? 'ย่อขนาดจอปกติ' : 'โหมดจอทีวีส่วนกลาง'}</span>
              </button>
              <button
                onClick={() => setIsCentralBannerExpanded(false)}
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white px-3 py-1.5 rounded-xl text-xs font-semibold border border-white/20 transition-all cursor-pointer ml-1"
                title="ย่อแถบข้อมูลนี้กลับ"
              >
                <ChevronUp className="w-3.5 h-3.5" />
                <span>ย่อเก็บ</span>
              </button>
            </div>
          </div>
        )}

        {/* SECTION 1: SCHEDULE VIEW (TIMELINE OR MONTHLY CALENDAR) */}
        <section className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden flex flex-col">
          {/* Header & View Mode Switcher */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap gap-4 justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-white to-blue-50/80 border border-blue-200/90 shadow-xs flex items-center justify-center text-[#1E3A8A] ring-1 ring-white/80">
                {scheduleViewMode === 'timeline' ? (
                  <Clock className="w-5 h-5 drop-shadow-2xs text-[#1E3A8A]" />
                ) : (
                  <Calendar className="w-5 h-5 drop-shadow-2xs text-[#1E3A8A]" />
                )}
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                  <span>{scheduleViewMode === 'timeline' ? 'ตารางเวลาจองรถ (Timeline)' : 'ตารางช่องรายเดือน (Monthly Calendar)'}</span>
                </h2>
                <p className="text-xs text-slate-500">
                  {scheduleViewMode === 'timeline'
                    ? 'ดูสถานะรถยนต์แบบ Real-time ช่วงเวลา 06:00 - 18:00 น.'
                    : 'ภาพรวมตารางการจัดสรรรถยนต์ทั้งเดือน คลีน สวยงามระดับลัคชูลี วางแผนล่วงหน้าง่ายดาย'}
                </p>
              </div>
            </div>

            {/* View Mode Switcher Tabs */}
            <div className="flex items-center bg-slate-200/80 p-1 rounded-xl shadow-2xs gap-1">
              <button
                type="button"
                onClick={() => setScheduleViewMode('timeline')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  scheduleViewMode === 'timeline'
                    ? 'bg-white text-[#1E3A8A] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>ไทม์ไลน์รายวัน</span>
              </button>
              <button
                type="button"
                onClick={() => setScheduleViewMode('monthly')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  scheduleViewMode === 'monthly'
                    ? 'bg-gradient-to-r from-[#1E3A8A] to-[#1e40af] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>ตารางช่องรายเดือน</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#F05A28] text-white font-extrabold ml-0.5 shadow-2xs">
                  Pro
                </span>
              </button>
            </div>
          </div>

          {/* Conditional Rendering: Monthly View or Daily Timeline */}
          {scheduleViewMode === 'monthly' ? (
            <div className="p-4 sm:p-5">
              <MonthlyCalendarView
                cars={cars}
                bookings={bookings}
                currentDateStr={selectedDate}
                onSelectDate={(dateStr) => setSelectedDate(dateStr)}
                onSwitchToTimeline={(dateStr) => {
                  setSelectedDate(dateStr);
                  setScheduleViewMode('timeline');
                }}
                onSelectBooking={(b) => setSelectedBooking(b)}
                onQuickBookDate={handleQuickBookDate}
              />
            </div>
          ) : (
            <>
              {/* Daily Timeline Toolbar (Filter & Date Selector) */}
              <div className="p-3 sm:px-5 border-b border-slate-100 flex flex-wrap gap-2.5 justify-between items-center bg-white">
                <div className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>ตารางวันที่: <strong className="text-[#1E3A8A]">{selectedDate}</strong></span>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Filter Pills (5 slots limit) */}
                  <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl text-[11px] font-semibold">
                    <button
                      onClick={() => { setCarFilter('all'); setCarPage(0); }}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        carFilter === 'all'
                          ? 'bg-white text-[#1E3A8A] shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      ทั้งหมด (5 ช่อง)
                    </button>
                    <button
                      onClick={() => { setCarFilter('ev'); setCarPage(0); }}
                      className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                        carFilter === 'ev'
                          ? 'bg-white text-[#1E3A8A] shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      ⚡ EV
                    </button>
                    <button
                      onClick={() => { setCarFilter('ice'); setCarPage(0); }}
                      className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                        carFilter === 'ice'
                          ? 'bg-white text-[#1E3A8A] shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      ⛽ น้ำมัน
                    </button>
                  </div>

                  {/* If cars exceed 5, show pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center gap-1 text-xs bg-white border border-slate-200 px-2 py-1 rounded-xl shadow-xs">
                      <button
                        disabled={safePage === 0}
                        onClick={() => setCarPage(p => Math.max(0, p - 1))}
                        className="p-0.5 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[10px] text-slate-500 font-bold px-1">
                        หน้า {safePage + 1}/{totalPages}
                      </span>
                      <button
                        disabled={safePage >= totalPages - 1}
                        onClick={() => setCarPage(p => Math.min(totalPages - 1, p + 1))}
                        className="p-0.5 rounded text-slate-600 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Date Input */}
                  <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#1E3A8A]" />
                    <span className="text-xs font-medium text-slate-500">วันที่:</span>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="text-xs font-bold text-slate-800 outline-none bg-transparent cursor-pointer"
                    />
                  </div>

                  {!isToday && (
                    <button
                      onClick={() => setSelectedDate(todayStr)}
                      className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium transition-colors"
                    >
                      วันนี้
                    </button>
                  )}
                </div>
              </div>

          {/* Timeline Grid */}
          <div className="p-4 overflow-x-auto relative">
            <div className="min-w-[820px]">
              {/* Time header axis */}
              <div className="flex ml-[180px] border-b border-slate-200 mb-2 relative h-6">
                <div className="w-full relative h-full">
                  {hourTicks.map((h) => {
                    const pct = ((h - START_HOUR) / (END_HOUR - START_HOUR)) * 100;
                    return (
                      <div
                        key={h}
                        className="absolute -translate-x-1/2 flex flex-col items-center"
                        style={{ left: `${pct}%` }}
                      >
                        <span className="text-[11px] font-medium text-slate-400">
                          {String(h).padStart(2, '0')}:00
                        </span>
                      </div>
                    );
                  })}

                  {/* Current Time Marker */}
                  {currentTimePct !== null && (
                    <div
                      className="absolute top-0 bottom-[-1000px] w-px bg-red-500 z-20 pointer-events-none"
                      style={{ left: `${currentTimePct}%` }}
                    >
                      <div className="absolute -top-1 -translate-x-1/2 bg-red-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold shadow-xs whitespace-nowrap">
                        {currentTimeStr}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Car Rows (Strictly 5 Slots) */}
              <div className="flex flex-col gap-2 relative">
                {visibleCars.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    ไม่พบรถยนต์ตามตัวกรองที่เลือก
                  </div>
                ) : (
                  visibleCars.map((car, index) => {
                    const slotNum = safePage * SLOTS_LIMIT + index + 1;
                    const isEV = (car.fuelType || '').includes('EV');
                    const carBookings = bookings.filter(
                      b => b.carId === car.id && b.date === selectedDate && b.status !== 'cancelled'
                    );

                    return (
                      <div
                        key={car.id}
                        className="flex items-center min-h-[50px] relative bg-slate-50/70 hover:bg-slate-100/80 rounded-xl p-1 border border-slate-100 transition-colors"
                      >
                        {/* Left: Car Title & Slot Number */}
                        <div className="w-[185px] shrink-0 pl-2 pr-2 flex items-center justify-between z-10">
                          <div className="truncate">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-100 text-[#1E3A8A]">
                                ช่อง {slotNum}
                              </span>
                              <span className="text-xs font-bold text-slate-800 truncate">
                                [{car.vehicleId}] {car.plate}
                              </span>
                              {car.status === 'maintenance' && (
                                <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                                  ซ่อมบำรุง
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 truncate block mt-0.5">
                              {car.brand} ({car.color})
                            </span>
                          </div>
                          {isEV ? (
                            <span className="text-[10px] text-blue-600 font-bold ml-1 shrink-0" title="EV">
                              ⚡
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400 ml-1 shrink-0" title="น้ำมัน">
                              ⛽
                            </span>
                          )}
                        </div>

                      {/* Right: Booking Bars Track or Maintenance State */}
                      <div className="flex-1 h-8 relative ml-2">
                        {car.status === 'maintenance' ? (
                          <div className="absolute inset-0 bg-amber-500/10 border border-dashed border-amber-300 rounded-lg flex items-center justify-center text-amber-800 text-[11px] font-semibold gap-1.5 z-10">
                            <Wrench className="w-3.5 h-3.5 text-amber-600" />
                            <span>งดให้บริการชั่วคราว (อยู่ระหว่างตรวจเช็ก / ซ่อมบำรุง)</span>
                          </div>
                        ) : (
                          <>
                            {carBookings.map((b) => {
                              const [sH, sM] = b.startTime.split(':').map(Number);
                              const [eH, eM] = b.endTime.split(':').map(Number);
                              const startMins = (sH - START_HOUR) * 60 + (sM || 0);
                              const endMins = (eH - START_HOUR) * 60 + (eM || 0);

                              if (endMins > 0 && startMins < TOTAL_MINUTES) {
                                const dStart = Math.max(0, startMins);
                                const dEnd = Math.min(TOTAL_MINUTES, endMins);
                                const leftPct = (dStart / TOTAL_MINUTES) * 100;
                                const widthPct = Math.max(((dEnd - dStart) / TOTAL_MINUTES) * 100, 3);

                                let bgClass = "bg-[#F05A28]";
                                if (b.status === 'in_use') bgClass = "bg-[#1E3A8A]";
                                else if (b.status === 'completed') bgClass = "bg-slate-400";

                                return (
                                  <button
                                    key={b.id}
                                    onClick={() => setSelectedBooking(b)}
                                    className={`absolute top-0.5 bottom-0.5 rounded-lg ${bgClass} opacity-95 text-white px-2 text-left flex items-center cursor-pointer transition-transform hover:scale-[1.01] z-10 overflow-hidden shadow-xs`}
                                    style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                                    title={`จองโดย: ${b.bookerName} (${b.startTime} - ${b.endTime})\nวัตถุประสงค์: ${b.purpose}\nคลิกเพื่อดูข้อมูลหรือยกเลิก`}
                                  >
                                    <span className="text-[10px] font-bold truncate">
                                      {b.bookerName} ({b.startTime}-{b.endTime})
                                    </span>
                                  </button>
                                );
                              }
                              return null;
                            })}

                            {/* Quick hint if no bookings */}
                            {carBookings.length === 0 && (
                              <div
                                onClick={() => {
                                  setSelectedCarId(car.id);
                                }}
                                className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 text-[10px] text-slate-400 cursor-pointer font-medium"
                              >
                                + ว่างตลอดวัน (คลิกเพื่อเลือกคันนี้)
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                }))}
              </div>
            </div>
          </div>
        </>
      )}
    </section>

        {/* SECTION 2: BOOKING FORM + REALTIME STATS & FLEET TABLE */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* LEFT: Quick Booking Form (Direct on screen, clean & fast) */}
          <section ref={bookingFormRef} className="lg:col-span-1 bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h2 className="text-base font-bold text-[#1E3A8A] flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-b from-orange-50 to-orange-100/80 border border-orange-200/90 shadow-2xs flex items-center justify-center text-[#F05A28] ring-1 ring-white">
                  <CarIcon className="w-4 h-4 text-[#F05A28]" />
                </div>
                <span>จองรถยนต์ด่วน</span>
              </h2>
              <span className="text-[11px] text-slate-400">จองง่าย ใช้ง่าย</span>
            </div>

            <form onSubmit={handleBookingSubmit} className="p-4 sm:p-5 flex flex-col gap-3.5">
              {/* Booker Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  ชื่อ-นามสกุล ผู้จอง
                </label>
                <input
                  type="text"
                  required
                  value={bookerName}
                  onChange={(e) => setBookerName(e.target.value)}
                  placeholder="ระบุชื่อผู้จอง"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] transition-all"
                />
              </div>

              {/* Car Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  เลือกรถยนต์
                </label>
                <select
                  required
                  value={selectedCarId}
                  onChange={(e) => setSelectedCarId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] transition-all font-medium text-slate-800"
                >
                  <option value="">-- กรุณาเลือกรถยนต์ --</option>
                  {cars.map((c) => {
                    const isEV = (c.fuelType || '').includes('EV');
                    const isMaintenance = c.status === 'maintenance';
                    const isOccupied = !isMaintenance && startTime < endTime && bookings.some(b => 
                      b.carId === c.id && 
                      b.date === selectedDate && 
                      b.status !== 'cancelled' && 
                      b.status !== 'completed' &&
                      (startTime < b.endTime && endTime > b.startTime)
                    );
                    return (
                      <option 
                        key={c.id} 
                        value={c.id} 
                        disabled={isMaintenance}
                        className={isMaintenance ? 'text-slate-400 italic bg-slate-100' : isOccupied ? 'text-amber-700 font-semibold' : 'text-slate-800'}
                      >
                        [{c.vehicleId}] {c.plate} - {c.brand} ({c.color}) {isEV ? '⚡ EV' : '⛽'} {isMaintenance ? '⚠️ [🛠️ ส่งซ่อมบำรุง / งดให้บริการ]' : isOccupied ? '⚠️ [มีคิวจองช่วงนี้]' : '✓ [ว่างพร้อมจอง]'}
                      </option>
                    );
                  })}
                </select>

                {/* Real-time vacancy preview badge or maintenance warning */}
                {selectedCarId && (() => {
                  const targetCar = cars.find(c => c.id === selectedCarId);
                  if (targetCar?.status === 'maintenance') {
                    return (
                      <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-amber-800 bg-amber-50 border border-amber-300 px-2.5 py-1 rounded-lg">
                        <Wrench className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                        <span>รถยนต์คันนี้อยู่ระหว่างส่งซ่อมบำรุง / งดให้บริการชั่วคราว</span>
                      </div>
                    );
                  }

                  if (startTime < endTime) {
                    const occupiedBooking = bookings.find(b => 
                      b.carId === selectedCarId && 
                      b.date === selectedDate && 
                      b.status !== 'cancelled' && 
                      b.status !== 'completed' &&
                      (startTime < b.endTime && endTime > b.startTime)
                    );
                    if (occupiedBooking) {
                      return (
                        <div className="mt-1.5 flex items-center gap-1.5 text-[11px] text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                          <span>คันนี้ติดจองช่วง <strong>{occupiedBooking.startTime} - {occupiedBooking.endTime} น.</strong> (โดย {occupiedBooking.bookerName})</span>
                        </div>
                      );
                    }
                    return (
                      <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                        <Check className="w-3 h-3" />
                        <span>คันนี้ว่างตลอดช่วงเวลาที่คุณเลือก (พร้อมใช้งาน)</span>
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    เวลาไป (เริ่ม 06:00)
                  </label>
                  <input
                    type="time"
                    min="06:00"
                    max="18:00"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    เวลากลับ (ถึง 18:00)
                  </label>
                  <input
                    type="time"
                    min="06:00"
                    max="18:00"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
                  />
                </div>
              </div>

              {/* Dynamic Duration Indicator & Warning */}
              {startTime < endTime && (() => {
                const duration = calculateDuration(startTime, endTime);
                const isOverLimit = duration.totalMinutes > reasonableLimitHours * 60;

                if (isOverLimit) {
                  return (
                    <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-2.5 text-xs text-amber-950 flex items-start gap-2 animate-in fade-in duration-200">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex-1 leading-tight">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold">ระยะเวลา: {duration.formatted}</span>
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-amber-200/80 text-amber-900 rounded">
                            เกินเกณฑ์ปกติ {reasonableLimitHours} ชม.
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-800 mt-1 font-normal">
                          การจองเกิน {reasonableLimitHours} ชม. จะมีหน้าต่างให้ยืนยันความจำเป็นก่อนบันทึก
                        </p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="text-[11px] text-slate-500 flex items-center justify-between px-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#1E3A8A]" />
                      ระยะเวลาจอง: <strong className="text-slate-700 font-semibold">{duration.formatted}</strong>
                    </span>
                    <span className="text-[10px] text-slate-400">
                      (เกณฑ์ปกติ ≤ {reasonableLimitHours} ชม.)
                    </span>
                  </div>
                );
              })()}

              {/* Purpose / Location */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  จุดประสงค์การเดินทาง / สถานที่
                </label>
                <input
                  type="text"
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="เช่น ไปพบลูกค้า บ.เอบีซี จก. (สาทร)"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
                />
              </div>

              {/* Error alert */}
              {bookingError && (
                <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-xl font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{bookingError}</span>
                </div>
              )}

              {/* Submit button */}
              <button
                type="submit"
                className={`mt-1 w-full font-bold py-2.5 px-4 rounded-xl text-xs shadow-xs hover:shadow transition-all flex items-center justify-center gap-1.5 text-white ${
                  bookingSuccess
                    ? 'bg-emerald-600'
                    : 'bg-[#F05A28] hover:bg-[#d94a1d]'
                }`}
              >
                {bookingSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>จองสำเร็จแล้ว!</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>ยืนยันการจอง</span>
                  </>
                )}
              </button>
            </form>
          </section>

          {/* RIGHT: Stats Cards & Vehicle Fleet Table */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* 4 Clean Stats Cards with 3D cut-edge beveled icons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-3.5 flex flex-col justify-center items-center text-center hover:border-slate-300 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-white to-slate-100/80 border border-slate-200/90 shadow-xs flex items-center justify-center text-slate-600 mb-1.5 ring-1 ring-white">
                  <CarIcon className="w-4 h-4" />
                </div>
                <div className="text-xl font-extrabold text-slate-800">{statTotal}</div>
                <div className="text-[11px] text-slate-500 font-medium">รถทั้งหมดในระบบ</div>
              </div>

              <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-3.5 flex flex-col justify-center items-center text-center hover:border-emerald-200 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-emerald-50 to-emerald-100/80 border border-emerald-200/90 shadow-xs flex items-center justify-center text-emerald-600 mb-1.5 ring-1 ring-white">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="text-xl font-extrabold text-emerald-600">{statAvailable}</div>
                <div className="text-[11px] text-slate-500 font-medium">ว่าง (พร้อมจอง)</div>
              </div>

              <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-3.5 flex flex-col justify-center items-center text-center hover:border-orange-200 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-orange-50 to-orange-100/80 border border-orange-200/90 shadow-xs flex items-center justify-center text-[#F05A28] mb-1.5 ring-1 ring-white">
                  <Clock className="w-4 h-4 text-[#F05A28]" />
                </div>
                <div className="text-xl font-extrabold text-[#F05A28]">{statPending}</div>
                <div className="text-[11px] text-slate-500 font-medium">รอรับกุญแจ</div>
              </div>

              <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-3.5 flex flex-col justify-center items-center text-center hover:border-blue-200 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-b from-blue-50 to-blue-100/80 border border-blue-200/90 shadow-xs flex items-center justify-center text-[#1E3A8A] mb-1.5 ring-1 ring-white">
                  <Shield className="w-4 h-4 text-[#1E3A8A]" />
                </div>
                <div className="text-xl font-extrabold text-[#1E3A8A]">{statInUse}</div>
                <div className="text-[11px] text-slate-500 font-medium">กำลังใช้งาน</div>
              </div>
            </div>

            {/* Fleet Status Table */}
            <section className="bg-white rounded-2xl shadow-xs border border-slate-200 overflow-hidden flex flex-col">
              <div className="p-4 border-b border-slate-100 flex flex-wrap justify-between items-center gap-2 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-bold text-slate-800">
                    สถานะรถยนต์ในกองยานพาหนะ
                  </h2>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-[#1E3A8A] border border-blue-100">
                    5 ช่องแสดงผล
                  </span>
                </div>
                {isAdmin ? (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => setShowAdminSettingsModal(true)}
                      className="flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                      title="เปิดศูนย์ตั้งค่าระบบผู้ดูแลระบบ"
                    >
                      <Settings className="w-3.5 h-3.5 text-[#1E3A8A]" />
                      <span className="hidden sm:inline">ตั้งค่าระบบ</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('ต้องการรีเซ็ตรถยนต์ในระบบกลับเป็น 6 คันมาตรฐานใช่หรือไม่?')) {
                          handleRestoreDefaultCars();
                        }
                      }}
                      className="flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-600 px-2 py-1 rounded-lg text-xs font-medium border border-slate-200 transition-colors cursor-pointer"
                      title="กู้คืนรายชื่อ 6 คันมาตรฐานของ BUG SOLUTIONS"
                    >
                      <RefreshCw className="w-3 h-3 text-slate-500" />
                      <span className="hidden md:inline">กู้คืน 6 คัน</span>
                    </button>
                    <button
                      onClick={() => {
                        setCarToEdit(null);
                        setShowCarModal(true);
                      }}
                      className="flex items-center gap-1 bg-[#1E3A8A] hover:bg-[#152a65] text-white px-2.5 py-1 rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>เพิ่มรถใหม่</span>
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase border-b border-slate-200">
                      <th className="p-3 pl-4 font-semibold">ช่อง / รหัสรถ</th>
                      <th className="p-3 font-semibold">รุ่น / สี</th>
                      <th className="p-3 font-semibold">พลังงาน</th>
                      <th className="p-3 pr-4 font-semibold text-right">
                        {isAdmin ? 'การจัดการ (Admin)' : 'สถานะ / การจอง'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleCars.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-slate-400">
                          ไม่พบรถยนต์ตามตัวกรองที่เลือก
                        </td>
                      </tr>
                    ) : (
                      visibleCars.map((car, index) => {
                        const slotNum = safePage * SLOTS_LIMIT + index + 1;
                        const isEV = (car.fuelType || '').includes('EV');
                        const isMaintenance = car.status === 'maintenance';
                        const carBookings = bookings
                          .filter(b => b.carId === car.id && b.date === selectedDate && b.status !== 'cancelled')
                          .sort((a, b) => a.startTime.localeCompare(b.startTime));

                        const activeBooking = carBookings.find(b => b.status !== 'completed');

                      return (
                        <tr key={car.id} className={`hover:bg-slate-50/60 transition-colors ${isMaintenance ? 'bg-amber-50/30' : ''}`}>
                          <td className="p-3 pl-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-100 text-[#1E3A8A]">
                                ช่อง {slotNum}
                              </span>
                              <span className="font-bold text-slate-800">[{car.vehicleId}]</span>
                              {isMaintenance && (
                                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                                  🛠️ ซ่อมบำรุง
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{car.plate}</div>
                          </td>

                          <td className="p-3">
                            <div className="font-semibold text-slate-700">{car.brand}</div>
                            <div className="text-[10px] text-slate-400">
                              สี: {car.color} {car.seats ? `• ${car.seats} ที่นั่ง` : ''}
                            </div>
                          </td>

                          <td className="p-3">
                            {isEV ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-[#1E3A8A] text-[10px] font-semibold border border-blue-100">
                                ⚡ EV
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold border border-slate-200">
                                ⛽ น้ำมัน
                              </span>
                            )}
                          </td>

                          <td className="p-3 pr-4 text-right align-middle">
                            {isAdmin ? (
                              <div className="flex flex-col items-end gap-1.5">
                                {/* Admin Pro Vehicle Controls */}
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => {
                                      setCarToEdit(car);
                                      setShowCarModal(true);
                                    }}
                                    className="p-1 text-slate-500 hover:text-[#1E3A8A] hover:bg-slate-100 rounded-md border border-slate-200 transition-colors"
                                    title="แก้ไขข้อมูลรถคันนี้ (Pro Edit)"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleToggleMaintenance(car)}
                                    className={`p-1 rounded-md border transition-colors ${
                                      isMaintenance 
                                        ? 'bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200' 
                                        : 'text-slate-500 hover:text-amber-600 hover:bg-amber-50 border-slate-200'
                                    }`}
                                    title={isMaintenance ? 'เปลี่ยนเป็น: พร้อมใช้งาน' : 'เปลี่ยนเป็น: ส่งซ่อมบำรุง'}
                                  >
                                    <Wrench className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm(`คุณต้องการลบรถ [${car.vehicleId}] ${car.plate} (${car.brand}) ออกจากระบบใช่หรือไม่?`)) {
                                        handleDeleteCar(car.id);
                                      }
                                    }}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md border border-slate-200 transition-colors"
                                    title="ลบรถคันนี้ออกจากระบบ"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {/* Active Booking Handover Controls */}
                                {activeBooking && (
                                  <div className="flex items-center gap-1 mt-0.5">
                                    {activeBooking.status === 'pending' && (
                                      <button
                                        onClick={() => updateBookingStatus(activeBooking.id, 'in_use')}
                                        className="bg-[#1E3A8A] hover:bg-[#152a65] text-white text-[10px] px-2 py-0.5 rounded-md shadow-2xs transition-colors whitespace-nowrap font-medium"
                                      >
                                        🔑 ส่งมอบ ({activeBooking.bookerName})
                                      </button>
                                    )}
                                    {activeBooking.status === 'in_use' && (
                                      <button
                                        onClick={() => updateBookingStatus(activeBooking.id, 'completed')}
                                        className="bg-slate-700 hover:bg-slate-800 text-white text-[10px] px-2 py-0.5 rounded-md shadow-2xs transition-colors whitespace-nowrap font-medium"
                                      >
                                        🔄 รับคืน ({activeBooking.bookerName})
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              /* Standard User View */
                              activeBooking ? (
                                <div className="flex flex-col items-end gap-1">
                                  {activeBooking.status === 'pending' && (
                                    <>
                                      <span
                                        onClick={() => setSelectedBooking(activeBooking)}
                                        className="cursor-pointer text-[10px] font-semibold text-[#F05A28] bg-orange-50 px-2 py-0.5 rounded border border-orange-100 hover:underline"
                                      >
                                        คิว: {activeBooking.startTime} ({activeBooking.bookerName})
                                      </span>
                                      <button
                                        onClick={() => setSelectedBooking(activeBooking)}
                                        className="text-slate-500 hover:text-slate-800 text-[10px] underline cursor-pointer"
                                      >
                                        ดูรายละเอียด
                                      </button>
                                    </>
                                  )}

                                  {activeBooking.status === 'in_use' && (
                                    <>
                                      <span
                                        onClick={() => setSelectedBooking(activeBooking)}
                                        className="cursor-pointer text-[10px] font-semibold text-[#1E3A8A] bg-blue-50 px-2 py-0.5 rounded border border-blue-100 hover:underline"
                                      >
                                        ใช้งาน: {activeBooking.bookerName}
                                      </span>
                                      <span className="text-[10px] text-slate-400">กำหนดคืน {activeBooking.endTime} น.</span>
                                    </>
                                  )}
                                </div>
                              ) : isMaintenance ? (
                                <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-medium">
                                  งดให้บริการ
                                </span>
                              ) : carBookings.length > 0 ? (
                                <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                  ✓ คืนรถครบแล้ว
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400 italic">
                                  ไม่มีคิวจอง
                                </span>
                              )
                            )}
                          </td>
                        </tr>
                      );
                    }))}
                  </tbody>
                </table>
              </div>
            </section>

          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BugSolutionsLogo height={30} showTagline={false} />
            <span className="text-xs text-slate-300">|</span>
            <span className="text-xs text-slate-600 font-semibold">Building Ultimate Growth</span>
          </div>
          <div className="text-[11px] text-slate-400">
            ระบบบริหารยานพาหนะส่วนกลาง (Enterprise Vehicle Booking) • Real-time Cloud Firestore
          </div>
        </div>
      </footer>

      {/* MODAL: Booking Detail & Cancellation */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm">ข้อมูลการจองรถยนต์</h3>
              <button
                onClick={() => setSelectedBooking(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-2 text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-400">ผู้ขอจอง:</span>
                <span className="font-bold text-slate-800">{selectedBooking.bookerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">วันที่:</span>
                <span className="font-semibold text-slate-700">{selectedBooking.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">เวลา:</span>
                <span className="font-semibold text-[#1E3A8A]">{selectedBooking.startTime} - {selectedBooking.endTime} น.</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">จุดประสงค์:</span>
                <span className="font-medium text-slate-800 text-right">{selectedBooking.purpose}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">สถานะ:</span>
                <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                  selectedBooking.status === 'in_use'
                    ? 'bg-blue-50 text-[#1E3A8A]'
                    : selectedBooking.status === 'completed'
                    ? 'bg-slate-100 text-slate-600'
                    : 'bg-orange-50 text-[#F05A28]'
                }`}>
                  {selectedBooking.status === 'in_use' ? 'กำลังใช้งาน' : selectedBooking.status === 'completed' ? 'คืนรถแล้ว' : 'รอรับกุญแจ'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2 justify-end">
              {isAdmin && (
                <button
                  onClick={() => {
                    setBookingToEdit(selectedBooking);
                    setShowAdminBookingModal(true);
                    setSelectedBooking(null);
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 border border-slate-200 transition-colors cursor-pointer"
                  title="แก้ไขรายละเอียดคิวนี้ในฐานะผู้ดูแลระบบ"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#1E3A8A]" />
                  <span>แก้ไขคิว (Pro)</span>
                </button>
              )}

              {selectedBooking.status !== 'completed' && (
                <button
                  onClick={() => {
                    if (confirm('คุณต้องการยกเลิกการจองรายการนี้ใช่หรือไม่?')) {
                      updateBookingStatus(selectedBooking.id, 'cancelled');
                    }
                  }}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-semibold border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ยกเลิกการจอง</span>
                </button>
              )}

              {isAdmin && selectedBooking.status === 'pending' && (
                <button
                  onClick={() => updateBookingStatus(selectedBooking.id, 'in_use')}
                  className="px-3 py-1.5 bg-[#1E3A8A] hover:bg-[#152a65] text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
                >
                  ส่งมอบกุญแจ
                </button>
              )}

              {isAdmin && selectedBooking.status === 'in_use' && (
                <button
                  onClick={() => updateBookingStatus(selectedBooking.id, 'completed')}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
                >
                  รับรถคืน
                </button>
              )}

              <button
                onClick={() => setSelectedBooking(null)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium cursor-pointer"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Admin PIN Verification (Default PIN: 1234) */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm overflow-hidden p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-[#1E3A8A] mx-auto flex items-center justify-center text-xl">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">ยืนยันตัวตนผู้ดูแลระบบ</h3>
              <p className="text-xs text-slate-500 mt-1">กรุณาใส่รหัส PIN 4 หลัก (ค่าเริ่มต้น: 1234)</p>
            </div>

            <input
              type="password"
              maxLength={4}
              value={adminPin}
              onChange={(e) => {
                setAdminPin(e.target.value);
                setPinError(false);
              }}
              placeholder="••••"
              className="w-full text-center tracking-widest text-2xl font-bold bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/40"
            />

            {pinError && (
              <div className="text-xs text-rose-500 font-medium">
                รหัส PIN ไม่ถูกต้อง (ค่าเริ่มต้น 1234)
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowPinModal(false)}
                className="flex-1 bg-white border border-slate-200 text-slate-600 font-semibold py-2 rounded-xl hover:bg-slate-50 text-xs"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleVerifyPin}
                className="flex-1 bg-[#1E3A8A] hover:bg-[#152a65] text-white font-semibold py-2 rounded-xl shadow-xs text-xs"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Pro Admin Vehicle Management (Add / Edit / Delete / Maintenance) */}
      <AdminCarModal
        isOpen={showCarModal}
        onClose={() => {
          setShowCarModal(false);
          setCarToEdit(null);
        }}
        carToEdit={carToEdit}
        existingCars={cars}
        activeBookings={bookings}
        onSaveCar={handleSaveCar}
        onDeleteCar={handleDeleteCar}
      />

      {/* MODAL: Pro Admin Booking Management (Edit Booker, Time, Status, Car, Purpose) */}
      <AdminBookingModal
        isOpen={showAdminBookingModal}
        onClose={() => {
          setShowAdminBookingModal(false);
          setBookingToEdit(null);
        }}
        booking={bookingToEdit}
        cars={cars}
        allBookings={bookings}
        onSaveBooking={handleAdminSaveBooking}
        onDeleteBooking={handleAdminDeleteBooking}
      />

      {/* MODAL: Pro Admin System Settings & Maintenance Console */}
      <AdminSettingsModal
        isOpen={showAdminSettingsModal}
        onClose={() => setShowAdminSettingsModal(false)}
        settings={fleetSettings}
        cars={cars}
        bookings={bookings}
        onSaveSettings={handleSaveSettings}
        onRestoreDefaultCars={handleRestoreDefaultCars}
        onClearAllBookings={handleClearAllBookings}
        onSendTestLineNotification={handleSendTestLineNotification}
      />

      {/* MODAL: LINE Notify Logs */}
      {showLineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden p-5 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-sm">การแจ้งเตือน LINE Notify</h3>
              </div>
              <button onClick={() => setShowLineModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 space-y-2 max-h-64 overflow-y-auto">
              {lineMessages.length === 0 ? (
                <div className="text-center py-6 text-slate-400">ยังไม่มีประวัติการแจ้งเตือน</div>
              ) : (
                lineMessages.map(msg => (
                  <div key={msg.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span className="font-semibold text-emerald-600">LINE Notify Alert</span>
                      <span>{msg.timestamp}</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">{msg.message}</p>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowLineModal(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Long Booking Confirmation Warning */}
      {showLongBookingModal && (() => {
        const targetCar = cars.find(c => c.id === selectedCarId);
        const duration = calculateDuration(startTime, endTime);
        const isEV = (targetCar?.fuelType || '').includes('EV');

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl border border-amber-300 w-full max-w-md overflow-hidden flex flex-col">
              {/* Header with amber warning styling */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 p-4 sm:p-5 flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-600 shrink-0">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-extrabold text-slate-800 text-sm sm:text-base">
                    ยืนยันการจองรถระยะยาว
                  </h3>
                  <p className="text-xs text-amber-800 mt-0.5">
                    ระยะเวลาการจองเกินเกณฑ์ปกติที่แนะนำ ({reasonableLimitHours} ชั่วโมง)
                  </p>
                </div>
                <button
                  onClick={() => setShowLongBookingModal(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4 text-xs">
                {/* Booking Summary Box */}
                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2.5">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
                    <span className="text-slate-500">รถยนต์ที่เลือก:</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      [{targetCar?.vehicleId}] {targetCar?.plate} ({targetCar?.brand})
                      {isEV ? ' ⚡' : ''}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
                    <span className="text-slate-500">ผู้ขอจอง:</span>
                    <span className="font-bold text-slate-800">{bookerName}</span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
                    <span className="text-slate-500">วันที่และช่วงเวลา:</span>
                    <span className="font-bold text-[#1E3A8A]">
                      {selectedDate} | {startTime} - {endTime} น.
                    </span>
                  </div>

                  <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
                    <span className="text-slate-500">จุดประสงค์ / ปลายทาง:</span>
                    <span className="font-semibold text-slate-700 truncate max-w-[200px]">
                      {purpose || 'ติดต่อประสานงาน'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-0.5">
                    <span className="text-slate-600 font-semibold">ระยะเวลาการใช้งานรวม:</span>
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-extrabold text-xs">
                      {duration.formatted}
                    </span>
                  </div>
                </div>

                {/* Caution note */}
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-amber-900 leading-relaxed text-[11px] space-y-1">
                  <div className="font-bold text-amber-950 flex items-center gap-1">
                    <span>💡 เหตุผลในการตรวจสอบ:</span>
                  </div>
                  <p>
                    เนื่องจากรถยนต์ส่วนกลางของบริษัทมีจำนวนจำกัด การจองใช้งานเกินกว่า <strong>{reasonableLimitHours} ชั่วโมง</strong> อาจส่งผลให้เพื่อนร่วมงานท่านอื่นไม่สามารถจองรถเพื่อปฏิบัติภารกิจเร่งด่วนได้
                  </p>
                </div>

                {/* Agreement Checkbox */}
                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors bg-white">
                  <input
                    type="checkbox"
                    checked={longBookingConfirmed}
                    onChange={(e) => setLongBookingConfirmed(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded text-[#1E3A8A] focus:ring-[#1E3A8A] border-slate-300 cursor-pointer"
                  />
                  <span className="text-xs text-slate-700 leading-snug">
                    ข้าพเจ้ายืนยันว่ามีความจำเป็นต้องใช้รถตลอดช่วงเวลา <strong>{duration.formatted}</strong> ดังกล่าวจริง และได้วางแผนเวลาการเดินทางไว้อย่างเหมาะสม
                  </span>
                </label>
              </div>

              {/* Footer Actions */}
              <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex gap-2.5 justify-end">
                <button
                  type="button"
                  onClick={() => setShowLongBookingModal(false)}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
                >
                  กลับไปปรับเวลา
                </button>
                <button
                  type="button"
                  disabled={!longBookingConfirmed}
                  onClick={() => finalizeBooking(true)}
                  className="px-4 py-2 bg-[#F05A28] hover:bg-[#d94a1d] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>ยืนยันการจองระยะยาว</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Real-time live toast notification for incoming bookings */}
      {liveToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 backdrop-blur text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300 max-w-md">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div className="text-xs flex-1">
            <p className="font-bold text-emerald-300">อัปเดตสดจาก Cloud Firestore</p>
            <p className="text-slate-200 mt-0.5 leading-snug">{liveToast.message}</p>
          </div>
          <button 
            onClick={() => setLiveToast(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
}
