import React, { useState, useMemo } from 'react';
import { Car, Booking } from '../types';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, Car as CarIcon, 
  User, MapPin, Sparkles, Filter, CheckCircle2, AlertCircle, Eye, Plus, ArrowRight,
  TrendingUp, Shield, Zap, Fuel, Layers, X
} from 'lucide-react';
import { formatThaiDate } from '../utils/time';

interface MonthlyCalendarViewProps {
  cars: Car[];
  bookings: Booking[];
  currentDateStr: string; // YYYY-MM-DD
  onSelectDate: (dateStr: string) => void;
  onSwitchToTimeline: (dateStr: string) => void;
  onSelectBooking: (booking: Booking) => void;
  onQuickBookDate: (dateStr: string, carId?: string) => void;
}

const THAI_MONTH_NAMES = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const ENG_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = [
  { short: 'จ.', full: 'วันจันทร์', eng: 'Mon' },
  { short: 'อ.', full: 'วันอังคาร', eng: 'Tue' },
  { short: 'พ.', full: 'วันพุธ', eng: 'Wed' },
  { short: 'พฤ.', full: 'วันพฤหัสบดี', eng: 'Thu' },
  { short: 'ศ.', full: 'วันศุกร์', eng: 'Fri' },
  { short: 'ส.', full: 'วันเสาร์', eng: 'Sat', isWeekend: true },
  { short: 'อา.', full: 'วันอาทิตย์', eng: 'Sun', isWeekend: true }
];

export const MonthlyCalendarView: React.FC<MonthlyCalendarViewProps> = ({
  cars,
  bookings,
  currentDateStr,
  onSelectDate,
  onSwitchToTimeline,
  onSelectBooking,
  onQuickBookDate
}) => {
  // Parse initial year/month from currentDateStr or today
  const [viewDate, setViewDate] = useState(() => {
    if (currentDateStr) {
      const [y, m] = currentDateStr.split('-').map(Number);
      if (y && m) return new Date(y, m - 1, 1);
    }
    return new Date();
  });

  const [selectedDayModalDate, setSelectedDayModalDate] = useState<string | null>(null);
  const [carFilter, setCarFilter] = useState<string>('all'); // 'all' | 'ev' | 'ice' | carId

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0 - 11

  // Navigation handlers
  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleCurrentMonth = () => {
    const today = new Date();
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  // Today string YYYY-MM-DD
  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, []);

  // Filter cars based on filter option
  const filteredCars = useMemo(() => {
    if (carFilter === 'all') return cars;
    if (carFilter === 'ev') return cars.filter(c => c.fuelType.includes('EV'));
    if (carFilter === 'ice') return cars.filter(c => !c.fuelType.includes('EV'));
    return cars.filter(c => c.id === carFilter);
  }, [cars, carFilter]);

  const filteredCarIds = useMemo(() => new Set(filteredCars.map(c => c.id)), [filteredCars]);

  // Filter bookings in current view month
  const monthBookings = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    return bookings.filter(b => {
      if (b.status === 'cancelled') return false;
      if (!b.date.startsWith(prefix)) return false;
      if (carFilter !== 'all' && !filteredCarIds.has(b.carId)) return false;
      return true;
    });
  }, [bookings, year, month, carFilter, filteredCarIds]);

  // Group bookings by date string YYYY-MM-DD
  const bookingsByDate = useMemo(() => {
    const map = new Map<string, Booking[]>();
    for (const b of bookings) {
      if (b.status === 'cancelled') continue;
      if (carFilter !== 'all' && !filteredCarIds.has(b.carId)) continue;
      const list = map.get(b.date) || [];
      list.push(b);
      map.set(b.date, list);
    }
    return map;
  }, [bookings, carFilter, filteredCarIds]);

  // Monthly Executive Metrics
  const metrics = useMemo(() => {
    const totalMonthBookings = monthBookings.length;
    
    // Unique days with at least 1 booking
    const activeDates = new Set(monthBookings.map(b => b.date));
    const daysInThisMonth = new Date(year, month + 1, 0).getDate();
    const utilizationRate = daysInThisMonth > 0 ? Math.round((activeDates.size / daysInThisMonth) * 100) : 0;

    // Peak day
    const countPerDay = new Map<string, number>();
    for (const b of monthBookings) {
      countPerDay.set(b.date, (countPerDay.get(b.date) || 0) + 1);
    }
    let peakDate = '';
    let peakCount = 0;
    countPerDay.forEach((cnt, dt) => {
      if (cnt > peakCount) {
        peakCount = cnt;
        peakDate = dt;
      }
    });

    // Top utilized car
    const countPerCar = new Map<string, number>();
    for (const b of monthBookings) {
      countPerCar.set(b.carId, (countPerCar.get(b.carId) || 0) + 1);
    }
    let topCarId = '';
    let topCarCount = 0;
    countPerCar.forEach((cnt, id) => {
      if (cnt > topCarCount) {
        topCarCount = cnt;
        topCarId = id;
      }
    });
    const topCar = cars.find(c => c.id === topCarId);

    return {
      totalMonthBookings,
      utilizationRate,
      activeDaysCount: activeDates.size,
      peakDate,
      peakCount,
      topCar: topCar ? `${topCar.brand} (${topCar.vehicleId})` : '-'
    };
  }, [monthBookings, year, month, cars]);

  // Generate 35 or 42 grid cells (Monday-based week)
  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sun, 1 is Mon...
    // Offset for Monday = 0:
    const startOffset = (firstDayIndex + 6) % 7; 

    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthLastDate = new Date(year, month, 0).getDate();

    const cells: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      isWeekend: boolean;
    }> = [];

    // 1. Previous month trailing days
    for (let i = startOffset - 1; i >= 0; i--) {
      const d = prevMonthLastDate - i;
      const prevDate = new Date(year, month - 1, d);
      const y = prevDate.getFullYear();
      const m = String(prevDate.getMonth() + 1).padStart(2, '0');
      const dayFormatted = String(d).padStart(2, '0');
      const dateStr = `${y}-${m}-${dayFormatted}`;
      const dayOfWeek = prevDate.getDay();
      cells.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6
      });
    }

    // 2. Current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const currDate = new Date(year, month, d);
      const dayFormatted = String(d).padStart(2, '0');
      const monthFormatted = String(month + 1).padStart(2, '0');
      const dateStr = `${year}-${monthFormatted}-${dayFormatted}`;
      const dayOfWeek = currDate.getDay();
      cells.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6
      });
    }

    // 3. Next month leading days to complete grid (multiples of 7)
    const remainingSlots = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remainingSlots; d++) {
      const nextDate = new Date(year, month + 1, d);
      const y = nextDate.getFullYear();
      const m = String(nextDate.getMonth() + 1).padStart(2, '0');
      const dayFormatted = String(d).padStart(2, '0');
      const dateStr = `${y}-${m}-${dayFormatted}`;
      const dayOfWeek = nextDate.getDay();
      cells.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6
      });
    }

    return cells;
  }, [year, month, todayStr]);

  // Car lookup helper
  const carMap = useMemo(() => {
    const map = new Map<string, Car>();
    for (const c of cars) {
      map.set(c.id, c);
    }
    return map;
  }, [cars]);

  // Selected Day Bookings for Modal / Inspector
  const selectedDayBookings = useMemo(() => {
    if (!selectedDayModalDate) return [];
    return (bookingsByDate.get(selectedDayModalDate) || []).sort((a, b) => 
      a.startTime.localeCompare(b.startTime)
    );
  }, [selectedDayModalDate, bookingsByDate]);

  return (
    <div className="flex flex-col space-y-4">
      {/* 1. LUXURY EXECUTIVE HEADER BAR */}
      <div className="bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#1E3A8A] text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Title & Month Navigator */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 border border-white/20 shadow-inner flex items-center justify-center shrink-0">
            <CalendarIcon className="w-6 h-6 text-orange-400" />
          </div>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                <span>{THAI_MONTH_NAMES[month]} {year + 543}</span>
                <span className="text-xs font-semibold text-slate-300">({ENG_MONTH_NAMES[month]} {year})</span>
              </h2>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-400/30 flex items-center gap-1 uppercase tracking-wider">
                <Sparkles className="w-3 h-3 text-orange-400" />
                Executive View
              </span>
            </div>
            <p className="text-xs text-slate-300/80 mt-0.5">
              ตารางช่องปฏิทินรายเดือน คมชัด วางแผนคิวกองยานพาหนะล่วงหน้าได้อย่างมือโปร
            </p>
          </div>
        </div>

        {/* Right: Controls (Prev, Today, Next & Car Selector) */}
        <div className="flex items-center gap-2 flex-wrap self-start md:self-center">
          {/* Car Filter Selector */}
          <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1.5 rounded-xl border border-white/15 text-xs text-white">
            <Filter className="w-3.5 h-3.5 text-blue-300" />
            <select
              value={carFilter}
              onChange={(e) => setCarFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white outline-none cursor-pointer pr-1 [&>option]:text-slate-800"
            >
              <option value="all">รถทุกคัน ({cars.length})</option>
              <option value="ev">⚡ รถยนต์ไฟฟ้า EV 100%</option>
              <option value="ice">⛽ รถยนต์น้ำมัน / ไฮบริด</option>
              <optgroup label="เลือกรถเฉพาะคัน">
                {cars.map(c => (
                  <option key={c.id} value={c.id}>
                    [{c.vehicleId}] {c.brand} ({c.plate})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Month Navigation Buttons */}
          <div className="flex items-center bg-white/10 rounded-xl border border-white/15 p-1 gap-1">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg hover:bg-white/20 active:scale-95 text-white transition-all cursor-pointer"
              title="เดือนก่อนหน้า"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleCurrentMonth}
              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white/20 hover:bg-white/30 text-white transition-all cursor-pointer"
              title="กลับมาเดือนปัจจุบัน"
            >
              เดือนนี้
            </button>

            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-white/20 active:scale-95 text-white transition-all cursor-pointer"
              title="เดือนถัดไป"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. EXECUTIVE KPI RIBBON */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/80 flex items-center justify-center text-[#1E3A8A] shrink-0">
            <Layers className="w-5 h-5 text-[#1E3A8A]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-slate-500 truncate">การจองเดือนนี้</div>
            <div className="text-lg font-black text-slate-800 flex items-baseline gap-1.5">
              <span>{metrics.totalMonthBookings}</span>
              <span className="text-xs font-normal text-slate-400">รายการ</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 shrink-0">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-slate-500 truncate">วันที่มีการใช้งาน</div>
            <div className="text-lg font-black text-emerald-600 flex items-baseline gap-1.5">
              <span>{metrics.activeDaysCount}</span>
              <span className="text-xs font-normal text-slate-400">วัน ({metrics.utilizationRate}%)</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-[#F05A28] shrink-0">
            <Zap className="w-5 h-5 text-[#F05A28]" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-slate-500 truncate">รถที่มีคิวสูงสุด</div>
            <div className="text-sm font-bold text-slate-800 truncate" title={metrics.topCar}>
              {metrics.topCar}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200/80 flex items-center justify-center text-purple-600 shrink-0">
            <Clock className="w-5 h-5 text-purple-600" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-slate-500 truncate">วันหนาแน่นสูงสุด</div>
            <div className="text-sm font-bold text-slate-800 truncate">
              {metrics.peakDate ? `${formatThaiDate(metrics.peakDate).split(' ')[0]} ${formatThaiDate(metrics.peakDate).split(' ')[1]} (${metrics.peakCount} คิว)` : 'ไม่มีการจอง'}
            </div>
          </div>
        </div>
      </div>

      {/* 3. CALENDAR MONTH GRID */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden">
        {/* Day-of-week header row */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 text-center select-none">
          {WEEKDAY_NAMES.map((w, idx) => (
            <div 
              key={idx} 
              className={`py-3 px-1 border-r last:border-r-0 border-slate-200/70 text-xs font-bold ${
                w.isWeekend ? 'text-amber-700/80 bg-amber-50/30' : 'text-slate-700'
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                <span>{w.short}</span>
                <span className="hidden sm:inline text-[10px] text-slate-400 font-normal">({w.eng})</span>
              </div>
            </div>
          ))}
        </div>

        {/* 7-column calendar day matrix */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100/90 border-b border-slate-200">
          {calendarCells.map((cell, idx) => {
            const dayBookings = bookingsByDate.get(cell.dateStr) || [];
            const bookingCount = dayBookings.length;
            const isSelected = cell.dateStr === currentDateStr;

            return (
              <div
                key={idx}
                onClick={() => setSelectedDayModalDate(cell.dateStr)}
                className={`min-h-[110px] sm:min-h-[135px] p-2 flex flex-col justify-between transition-all duration-150 relative group cursor-pointer ${
                  !cell.isCurrentMonth
                    ? 'bg-slate-50/40 text-slate-400'
                    : cell.isWeekend
                    ? 'bg-amber-50/15 hover:bg-white'
                    : 'bg-white hover:bg-blue-50/30'
                } ${
                  isSelected ? 'ring-2 ring-inset ring-[#1E3A8A] bg-blue-50/20' : ''
                }`}
              >
                {/* Cell Header: Day number + status chip */}
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1">
                    {cell.isToday ? (
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-lg bg-gradient-to-r from-[#1E3A8A] to-[#1e40af] text-white font-extrabold text-xs shadow-xs">
                        {cell.dayNumber}
                        <span className="hidden md:inline ml-1 text-[9px] font-medium text-blue-200">วันนี้</span>
                      </span>
                    ) : (
                      <span className={`text-xs font-bold ${
                        !cell.isCurrentMonth 
                          ? 'text-slate-400' 
                          : cell.isWeekend 
                          ? 'text-amber-700' 
                          : 'text-slate-700'
                      }`}>
                        {cell.dayNumber}
                      </span>
                    )}
                  </div>

                  {/* Booking count indicator */}
                  {bookingCount > 0 ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-100/80 text-[#1E3A8A] border border-blue-200/60 shrink-0">
                      {bookingCount} <span className="hidden sm:inline">คิว</span>
                    </span>
                  ) : cell.isCurrentMonth ? (
                    <span className="text-[9px] text-slate-300 hidden group-hover:inline-block font-medium">
                      ว่าง
                    </span>
                  ) : null}
                </div>

                {/* Booking list chips inside day cell (up to 2 visible, +more pill) */}
                <div className="flex flex-col gap-1 overflow-hidden my-auto">
                  {dayBookings.slice(0, 2).map((b) => {
                    const car = carMap.get(b.carId);
                    const isEV = car?.fuelType.includes('EV');

                    return (
                      <div
                        key={b.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectBooking(b);
                        }}
                        className={`text-[10px] font-medium px-1.5 py-1 rounded-md border flex items-center gap-1 shadow-2xs transition-all hover:scale-[1.02] cursor-pointer ${
                          isEV 
                            ? 'bg-orange-50/90 text-orange-950 border-orange-200/80 hover:bg-orange-100' 
                            : 'bg-blue-50/90 text-blue-950 border-blue-200/80 hover:bg-blue-100'
                        }`}
                        title={`[${car?.vehicleId || 'รถ'}] ${b.startTime}-${b.endTime} น. โดย ${b.bookerName}\nปลายทาง: ${b.destination || '-'}`}
                      >
                        <span className={`px-1 py-0.2 rounded text-[9px] font-bold shrink-0 ${
                          isEV ? 'bg-[#F05A28] text-white' : 'bg-[#1E3A8A] text-white'
                        }`}>
                          {car?.vehicleId || 'CAR'}
                        </span>
                        <span className="truncate text-slate-700 font-semibold">{b.bookerName}</span>
                        <span className="text-[9px] text-slate-500 ml-auto hidden sm:inline shrink-0">{b.startTime}</span>
                      </div>
                    );
                  })}

                  {/* If more than 2 bookings, show "+อีก X คิว" pill */}
                  {bookingCount > 2 && (
                    <div 
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDayModalDate(cell.dateStr);
                      }}
                      className="text-[9px] font-bold text-center py-0.5 px-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 cursor-pointer"
                    >
                      +อีก {bookingCount - 2} รายการ
                    </div>
                  )}
                </div>

                {/* Hover footer action: Quick Jump or Book */}
                <div className="pt-1 mt-auto flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectDate(cell.dateStr);
                      onSwitchToTimeline(cell.dateStr);
                    }}
                    className="text-[9px] text-[#1E3A8A] hover:underline font-bold flex items-center gap-0.5"
                    title="ไปที่ไทม์ไลน์รายชั่วโมงของวันนี้"
                  >
                    <span>ไทม์ไลน์</span>
                    <ArrowRight className="w-2.5 h-2.5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuickBookDate(cell.dateStr);
                    }}
                    className="text-[9px] text-[#F05A28] hover:bg-orange-50 font-bold px-1 rounded flex items-center gap-0.5"
                    title="จองรถสำหรับวันนี้"
                  >
                    <Plus className="w-2.5 h-2.5" />
                    <span>จอง</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Calendar Footer Legend */}
        <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="font-semibold text-slate-600">คำอธิบายสี:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-orange-50 border border-orange-300 inline-block"></span>
              <span className="text-[11px] font-medium text-slate-700">⚡ รถยนต์ไฟฟ้า EV 100%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-blue-50 border border-blue-300 inline-block"></span>
              <span className="text-[11px] font-medium text-slate-700">⛽ รถยนต์น้ำมัน / ไฮบริด</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#1E3A8A] text-white inline-block"></span>
              <span className="text-[11px] font-medium text-slate-700">วันนี้ (Today)</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400">
            * คลิกที่ช่องวันที่ใดๆ เพื่อเปิดดูรายละเอียดคิวรถและตรวจสอบความพร้อม
          </div>
        </div>
      </div>

      {/* 4. LUXURY DAY INSPECTOR MODAL / DRAWER */}
      {selectedDayModalDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#1E3A8A] text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-orange-400">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-white">
                    {formatThaiDate(selectedDayModalDate)}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-blue-200 mt-0.5">
                    <span>{selectedDayBookings.length} รายการจองในวันนี้</span>
                    {selectedDayModalDate === todayStr && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold">
                        วันนี้
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedDayModalDate(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content / Bookings list */}
            <div className="p-5 overflow-y-auto space-y-3 flex-1">
              {selectedDayBookings.length === 0 ? (
                <div className="py-12 text-center flex flex-col items-center justify-center">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mb-3">
                    <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                  </div>
                  <h4 className="text-base font-bold text-slate-800">ไม่มีคิวจองในวันที่นี้</h4>
                  <p className="text-xs text-slate-500 max-w-xs mt-1">
                    รถทุกคันในกองยานพาหนะพร้อมใช้งานตลอดทั้งวัน สามารถกดจองได้ทันที
                  </p>
                  <button
                    onClick={() => {
                      onQuickBookDate(selectedDayModalDate);
                      setSelectedDayModalDate(null);
                    }}
                    className="mt-4 px-4 py-2 bg-[#F05A28] hover:bg-[#d84818] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>จองรถสำหรับวันนี้ทันที</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="text-xs font-bold text-slate-700 flex items-center justify-between pb-1 border-b border-slate-100">
                    <span>ตารางการใช้รถ ({selectedDayBookings.length} คิว)</span>
                    <span className="text-[11px] text-slate-400 font-normal">เรียงตามเวลา</span>
                  </div>

                  {selectedDayBookings.map((b) => {
                    const car = carMap.get(b.carId);
                    const isEV = car?.fuelType.includes('EV');

                    return (
                      <div
                        key={b.id}
                        className="p-3.5 rounded-2xl border border-slate-200 hover:border-blue-300 bg-slate-50/50 hover:bg-blue-50/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 font-extrabold text-xs shadow-xs ${
                            isEV ? 'bg-[#F05A28]' : 'bg-[#1E3A8A]'
                          }`}>
                            {car?.vehicleId || 'CAR'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-slate-800 text-sm">
                                {car?.brand} ({car?.plate})
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                isEV ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}>
                                {isEV ? '⚡ EV 100%' : '⛽ น้ำมัน'}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-xs text-slate-600 mt-1 flex-wrap">
                              <span className="flex items-center gap-1 font-semibold text-[#1E3A8A]">
                                <Clock className="w-3.5 h-3.5" />
                                {b.startTime} - {b.endTime} น.
                              </span>
                              <span className="flex items-center gap-1 text-slate-700 font-medium">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                {b.bookerName}
                              </span>
                              {b.destination && (
                                <span className="flex items-center gap-1 text-slate-500">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                  {b.destination}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          <button
                            onClick={() => {
                              onSelectBooking(b);
                              setSelectedDayModalDate(null);
                            }}
                            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#1E3A8A]" />
                            <span>ดูคิวนี้</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => {
                  onSelectDate(selectedDayModalDate);
                  onSwitchToTimeline(selectedDayModalDate);
                  setSelectedDayModalDate(null);
                }}
                className="px-4 py-2 bg-gradient-to-r from-[#1E3A8A] to-[#1e40af] hover:from-[#152a65] hover:to-[#173282] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Clock className="w-4 h-4" />
                <span>เปิดดูไทม์ไลน์รายชั่วโมง (06:00 - 18:00)</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onQuickBookDate(selectedDayModalDate);
                    setSelectedDayModalDate(null);
                  }}
                  className="px-3.5 py-2 bg-[#F05A28] hover:bg-[#d84818] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>จองรถวันนี้</span>
                </button>
                <button
                  onClick={() => setSelectedDayModalDate(null)}
                  className="px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-medium cursor-pointer"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonthlyCalendarView;
