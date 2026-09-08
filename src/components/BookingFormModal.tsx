import React, { useState, useEffect } from 'react';
import { Car, Booking, UserAccount } from '../types';
import { isTimeOverlap, generateOtp, START_HOUR, END_HOUR } from '../utils/time';
import { Calendar, Clock, Car as CarIcon, MapPin, FileText, User, Phone, AlertCircle, CheckCircle, X, Sparkles } from 'lucide-react';

interface BookingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  cars: Car[];
  bookings: Booking[];
  currentUser: UserAccount;
  selectedDate: string;
  prefilledCarId?: string;
  prefilledStartTime?: string;
  editingBooking?: Booking | null;
  onSubmitBooking: (bookingData: Omit<Booking, 'id' | 'createdAt'>) => void;
  onUpdateBooking?: (bookingId: string, updatedData: Partial<Booking>) => void;
}

export const BookingFormModal: React.FC<BookingFormModalProps> = ({
  isOpen,
  onClose,
  cars,
  bookings,
  currentUser,
  selectedDate,
  prefilledCarId,
  prefilledStartTime,
  editingBooking,
  onSubmitBooking,
  onUpdateBooking
}) => {
  const [carId, setCarId] = useState<string>('');
  const [date, setDate] = useState<string>(selectedDate);
  const [startTime, setStartTime] = useState<string>('09:00');
  const [endTime, setEndTime] = useState<string>('12:00');
  const [bookerName, setBookerName] = useState<string>(currentUser.name);
  const [department, setDepartment] = useState<string>(currentUser.department);
  const [phoneNumber, setPhoneNumber] = useState<string>('081-000-0000');
  const [purpose, setPurpose] = useState<string>('');
  const [destination, setDestination] = useState<string>('');
  const [passengers, setPassengers] = useState<number>(1);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [availableAlternativeCars, setAvailableAlternativeCars] = useState<Car[]>([]);

  useEffect(() => {
    if (editingBooking) {
      setCarId(editingBooking.carId);
      setDate(editingBooking.date);
      setStartTime(editingBooking.startTime);
      setEndTime(editingBooking.endTime);
      setBookerName(editingBooking.bookerName);
      setDepartment(editingBooking.department);
      setPhoneNumber(editingBooking.phoneNumber);
      setPurpose(editingBooking.purpose);
      setDestination(editingBooking.destination);
      setPassengers(editingBooking.passengers || 1);
    } else {
      setCarId(prefilledCarId || (cars.length > 0 ? cars[0].id : ''));
      setDate(selectedDate);
      if (prefilledStartTime) {
        setStartTime(prefilledStartTime);
        const [h, m] = prefilledStartTime.split(':').map(Number);
        const nextH = Math.min(h + 2, END_HOUR);
        setEndTime(`${String(nextH).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`);
      }
      setBookerName(currentUser.name);
      setDepartment(currentUser.department);
    }
    setErrorMessage('');
    setAvailableAlternativeCars([]);
  }, [editingBooking, prefilledCarId, prefilledStartTime, selectedDate, currentUser, cars, isOpen]);

  // Real-time conflict checking
  useEffect(() => {
    if (!carId || !date || !startTime || !endTime) return;

    if (startTime >= endTime) {
      setErrorMessage('เวลาเริ่มต้องมาก่อนเวลาคืนรถ (ช่วง 06:00 - 18:00 น.)');
      return;
    }

    // Check collision for selected car
    const conflict = bookings.some(b => {
      if (editingBooking && b.id === editingBooking.id) return false;
      if (b.status === 'cancelled' || b.status === 'rejected') return false;
      return b.carId === carId && b.date === date && isTimeOverlap(startTime, endTime, b.startTime, b.endTime);
    });

    if (conflict) {
      setErrorMessage('❌ รถคันนี้ถูกจองในช่วงเวลาดังกล่าวแล้ว กรุณาเลือกช่วงเวลาอื่น หรือเลือกรถว่างด้านล่าง');
      // Find cars that are free during this slot
      const alternatives = cars.filter(c => {
        if (c.id === carId) return false;
        const hasCollision = bookings.some(b => {
          if (editingBooking && b.id === editingBooking.id) return false;
          if (b.status === 'cancelled' || b.status === 'rejected') return false;
          return b.carId === c.id && b.date === date && isTimeOverlap(startTime, endTime, b.startTime, b.endTime);
        });
        return !hasCollision;
      });
      setAvailableAlternativeCars(alternatives);
    } else {
      setErrorMessage('');
      setAvailableAlternativeCars([]);
    }
  }, [carId, date, startTime, endTime, bookings, cars, editingBooking]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (errorMessage) return;

    if (editingBooking && onUpdateBooking) {
      onUpdateBooking(editingBooking.id, {
        carId,
        date,
        startTime,
        endTime,
        bookerName,
        department,
        phoneNumber,
        purpose,
        destination,
        passengers
      });
    } else {
      onSubmitBooking({
        carId,
        date,
        startTime,
        endTime,
        bookerName,
        bookerId: currentUser.id,
        department,
        phoneNumber,
        purpose,
        destination,
        passengers,
        status: currentUser.role === 'admin' ? 'approved' : 'pending',
        otpCode: generateOtp()
      });
    }

    onClose();
  };

  const selectedCar = cars.find(c => c.id === carId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#1E3A8A] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-[#F05A28]">
              <CarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                {editingBooking ? 'แก้ไขข้อมูลการจองรถ' : 'แบบฟอร์มขอจองรถยนต์องค์กร'}
              </h3>
              <p className="text-xs text-blue-200">
                {editingBooking ? 'ปรับปรุงรายละเอียดการเดินทาง' : 'จองง่ายใน 3 ขั้นตอน พร้อมตรวจสอบรถว่างอัตโนมัติ'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-slate-700 text-sm">
          {/* Step 1: Car Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <CarIcon className="w-4 h-4 text-[#F05A28]" />
              เลือกรถยนต์ที่ต้องการใช้งาน
            </label>
            <select
              value={carId}
              onChange={(e) => setCarId(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] font-medium"
            >
              {cars.map((car) => {
                const isEV = (car.fuelType || '').includes('EV');
                return (
                  <option key={car.id} value={car.id}>
                    [{car.vehicleId}] {car.plate} - {car.brand} ({car.color}) {isEV ? '⚡ EV' : '⛽ เบนซิน'}
                  </option>
                );
              })}
            </select>
            {selectedCar && (
              <div className="mt-1.5 text-[11px] text-slate-500 flex items-center justify-between px-1">
                <span>ความจุ: {selectedCar.seats || 5} ที่นั่ง • {selectedCar.fuelType}</span>
                {selectedCar.notes && <span className="text-[#1E3A8A] font-medium">{selectedCar.notes}</span>}
              </div>
            )}
          </div>

          {/* Step 2: Date & Time (06:00 - 18:00) */}
          <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-[#1E3A8A]" />
                  วันที่ใช้งาน
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#F05A28]" />
                  เวลาเริ่ม (06:00-18:00)
                </label>
                <input
                  type="time"
                  min="06:00"
                  max="18:00"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#1E3A8A]" />
                  เวลากลับ (ถึง 18:00)
                </label>
                <input
                  type="time"
                  min="06:00"
                  max="18:00"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
                />
              </div>
            </div>

            {/* Collision Error Alert & Smart Alternative Suggestion */}
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-xs text-red-700 space-y-2">
                <div className="flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{errorMessage}</span>
                </div>

                {availableAlternativeCars.length > 0 && (
                  <div className="pt-2 border-t border-red-200">
                    <span className="font-semibold text-slate-800 flex items-center gap-1 mb-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#F05A28]" />
                      รถคันอื่นที่ว่างในช่วงเวลานี้ (คลิกเพื่อเปลี่ยน):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {availableAlternativeCars.map((altCar) => (
                        <button
                          key={altCar.id}
                          type="button"
                          onClick={() => setCarId(altCar.id)}
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-300 hover:border-[#1E3A8A] text-slate-800 hover:text-[#1E3A8A] text-xs font-medium transition-colors flex items-center gap-1 shadow-xs"
                        >
                          [{altCar.vehicleId}] {altCar.plate} ({altCar.brand})
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 3: Booker Info & Purpose */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-[#1E3A8A]" />
                ชื่อ-นามสกุล ผู้ขอจอง
              </label>
              <input
                type="text"
                value={bookerName}
                onChange={(e) => setBookerName(e.target.value)}
                required
                placeholder="เช่น สมชาย ใจดี"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-[#1E3A8A]" />
                เบอร์โทรศัพท์ติดต่อ
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                placeholder="เช่น 081-234-5678"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                แผนก / ฝ่าย
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
                placeholder="เช่น ฝ่ายขาย / ฝ่ายไอที"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                จำนวนผู้โดยสาร
              </label>
              <input
                type="number"
                min="1"
                max="7"
                value={passengers}
                onChange={(e) => setPassengers(Number(e.target.value))}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#F05A28]" />
              สถานที่ปลายทาง
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              required
              placeholder="เช่น บ.คู่ค้า ถ.สาทร / ศูนย์ราชการแจ้งวัฒนะ"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              วัตถุประสงค์การเดินทาง
            </label>
            <textarea
              rows={2}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              required
              placeholder="เช่น พบลูกค้าเพื่อเซ็นสัญญา / ตรวจสอบระบบไซต์งาน"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
            />
          </div>

          {/* Security Notice */}
          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-[#1E3A8A] shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-600 leading-relaxed">
              เมื่อจองแล้ว ระบบจะสร้าง <b>รหัส OTP 4 หลัก</b> ประจำการจอง เพื่อใช้เป็นบัตรผ่านเบิกกุญแจรถจากผู้ดูแล (ป้องกันบุคคลอื่นนำรถไปขับโดยไม่ได้รับอนุญาต)
            </div>
          </div>

          {/* Submit buttons */}
          <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={!!errorMessage}
              className={`px-6 py-2.5 rounded-xl text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-2 ${
                errorMessage
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-[#F05A28] hover:bg-[#d94a1d] active:scale-98'
              }`}
            >
              <CheckCircle className="w-4 h-4" />
              {editingBooking ? 'บันทึกการแก้ไข' : 'ยืนยันส่งคำขอจอง'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
