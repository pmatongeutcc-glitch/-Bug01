import React, { useState, useEffect } from 'react';
import { Car, Booking, UserAccount } from '../types';
import { START_HOUR, END_HOUR, TOTAL_MINUTES, timeToMinutes, calculateTimelinePercent } from '../utils/time';
import { ChevronLeft, ChevronRight, Calendar, Clock, Bolt, Fuel, User, Check, Eye } from 'lucide-react';

interface TimelineViewProps {
  cars: Car[];
  bookings: Booking[];
  selectedDate: string;
  onDateChange: (newDate: string) => void;
  currentUser: UserAccount;
  onSelectBooking: (booking: Booking) => void;
  onQuickBookCar: (carId: string, startTime?: string) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  cars,
  bookings,
  selectedDate,
  onDateChange,
  currentUser,
  onSelectBooking,
  onQuickBookCar
}) => {
  const [fuelFilter, setFuelFilter] = useState<'all' | 'ev' | 'gas'>('all');
  const [currentTimePct, setCurrentTimePct] = useState<number | null>(null);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');

  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = selectedDate === todayStr;

  // Calculate current time position on the 06:00 - 18:00 timeline
  useEffect(() => {
    const updateCurrentTime = () => {
      if (!isToday) {
        setCurrentTimePct(null);
        return;
      }
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      
      if (h >= START_HOUR && h < END_HOUR) {
        const totalMinutesPassed = (h - START_HOUR) * 60 + m;
        const pct = (totalMinutesPassed / TOTAL_MINUTES) * 100;
        setCurrentTimePct(pct);
        setCurrentTimeStr(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      } else {
        setCurrentTimePct(null);
      }
    };

    updateCurrentTime();
    const interval = setInterval(updateCurrentTime, 30000); // update every 30s
    return () => clearInterval(interval);
  }, [isToday]);

  // Navigate date
  const changeDateByDays = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    onDateChange(d.toISOString().split('T')[0]);
  };

  // Filter cars
  const filteredCars = cars.filter(car => {
    if (fuelFilter === 'ev') return (car.fuelType || '').includes('EV');
    if (fuelFilter === 'gas') return !(car.fuelType || '').includes('EV');
    return true;
  });

  // Time hour marks: 06:00, 07:00, ..., 18:00 (13 points)
  const hourTicks = [];
  for (let h = START_HOUR; h <= END_HOUR; h++) {
    hourTicks.push(h);
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap gap-4 items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1E3A8A]/10 text-[#1E3A8A] flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-800">
                ตารางสถานะรถยนต์ (Timeline Schedule)
              </h2>
              {isToday && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  เรียลไทม์วันนี้
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              ตรวจสอบเวลาจองและการใช้งานจริง ช่วงเวลา 06:00 - 18:00 น.
            </p>
          </div>
        </div>

        {/* Filters and Date Picker */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Fuel Filter */}
          <div className="flex bg-slate-200/60 p-1 rounded-xl text-xs font-medium text-slate-600">
            <button
              onClick={() => setFuelFilter('all')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                fuelFilter === 'all' ? 'bg-white text-slate-800 shadow-xs font-semibold' : 'hover:text-slate-900'
              }`}
            >
              ทั้งหมด ({cars.length})
            </button>
            <button
              onClick={() => setFuelFilter('ev')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                fuelFilter === 'ev' ? 'bg-white text-[#1E3A8A] shadow-xs font-semibold' : 'hover:text-slate-900'
              }`}
            >
              <Bolt className="w-3 h-3 text-amber-500" /> EV ไฟฟ้า
            </button>
            <button
              onClick={() => setFuelFilter('gas')}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                fuelFilter === 'gas' ? 'bg-white text-slate-800 shadow-xs font-semibold' : 'hover:text-slate-900'
              }`}
            >
              <Fuel className="w-3 h-3 text-slate-500" /> น้ำมัน
            </button>
          </div>

          {/* Date Selector with Next/Prev */}
          <div className="flex items-center bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
            <button
              onClick={() => changeDateByDays(-1)}
              className="p-2 hover:bg-slate-100 text-slate-600 transition-colors"
              title="วันก่อนหน้า"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-[#1E3A8A]" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-800 outline-none cursor-pointer"
              />
            </div>
            <button
              onClick={() => changeDateByDays(1)}
              className="p-2 hover:bg-slate-100 text-slate-600 transition-colors"
              title="วันถัดไป"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Jump to today button */}
          {!isToday && (
            <button
              onClick={() => onDateChange(todayStr)}
              className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium transition-colors"
            >
              กลับสู่วันนี้
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/30 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-semibold text-slate-500 text-[11px]">สถานะการจอง:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <span className="text-[11px]">อนุมัติแล้ว (Approved)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F05A28]"></span>
            <span className="text-[11px]">รออนุมัติ / รอรับกุญแจ</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1E3A8A]"></span>
            <span className="text-[11px]">กำลังใช้งาน (In Use)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span>
            <span className="text-[11px]">คืนรถแล้ว (Completed)</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400">
          *คลิกที่แถบการจองเพื่อดูรายละเอียด หรือคลิกที่แถบว่างเพื่อจองรถทันที
        </div>
      </div>

      {/* Timeline Scroll Area */}
      <div className="p-4 overflow-x-auto relative">
        <div className="min-w-[860px]">
          {/* Timeline Header with hours */}
          <div className="flex ml-[180px] border-b border-slate-200 pb-2 mb-2 relative h-7">
            <div className="w-full relative h-full">
              {hourTicks.map((hour) => {
                const pct = ((hour - START_HOUR) / (END_HOUR - START_HOUR)) * 100;
                return (
                  <div
                    key={hour}
                    className="absolute -translate-x-1/2 flex flex-col items-center"
                    style={{ left: `${pct}%` }}
                  >
                    <span className="text-[11px] font-medium text-slate-400">
                      {String(hour).padStart(2, '0')}:00
                    </span>
                    <div className="h-1.5 w-px bg-slate-300 mt-0.5"></div>
                  </div>
                );
              })}

              {/* Current Time Indicator Vertical Red Line */}
              {currentTimePct !== null && (
                <div
                  className="absolute top-0 bottom-[-1000px] w-[2px] bg-red-500 z-30 pointer-events-none transition-all duration-300"
                  style={{ left: `${currentTimePct}%` }}
                >
                  <div className="absolute -top-1 -translate-x-1/2 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-md flex items-center gap-0.5 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                    {currentTimeStr} น.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Vehicle Rows */}
          <div className="flex flex-col gap-2 relative">
            {/* Background grid lines behind all rows */}
            <div className="absolute inset-y-0 left-[180px] right-0 pointer-events-none flex justify-between">
              {hourTicks.map((hour, idx) => (
                <div
                  key={`grid-${hour}`}
                  className={`h-full w-px ${idx === 0 || idx === hourTicks.length - 1 ? 'bg-transparent' : 'bg-slate-100'}`}
                />
              ))}
            </div>

            {filteredCars.map((car) => {
              const isEV = (car.fuelType || '').includes('EV');
              const carBookings = bookings.filter(
                (b) => b.carId === car.id && b.date === selectedDate && b.status !== 'cancelled' && b.status !== 'rejected'
              );

              return (
                <div
                  key={car.id}
                  className="flex items-center min-h-[58px] relative bg-white rounded-xl p-1 border border-slate-200/80 hover:border-slate-300 transition-all hover:shadow-xs group"
                >
                  {/* Left Column: Car Identity */}
                  <div className="w-[170px] shrink-0 pr-3 pl-2 flex items-center justify-between border-r border-slate-100">
                    <div className="truncate flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800 group-hover:text-[#1E3A8A] transition-colors">
                          [{car.vehicleId}] {car.plate}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                        <span>{car.brand}</span>
                        <span className="text-[10px] text-slate-400">• {car.color}</span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isEV ? (
                        <span className="w-6 h-6 rounded-lg bg-blue-50 text-[#1E3A8A] flex items-center justify-center text-[10px] font-bold border border-blue-100" title="รถยนต์ไฟฟ้า EV">
                          <Bolt className="w-3.5 h-3.5 text-amber-500" />
                        </span>
                      ) : (
                        <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center text-[10px]" title="รถน้ำมัน">
                          <Fuel className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Interactive Timeline Track */}
                  <div
                    className="flex-1 h-11 relative cursor-pointer ml-2"
                    onClick={(e) => {
                      // If clicked on the empty track, calculate estimated hour and open booking
                      const target = e.target as HTMLElement;
                      if (target === e.currentTarget) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const clickX = e.clientX - rect.left;
                        const pct = clickX / rect.width;
                        const estimatedMinutes = pct * TOTAL_MINUTES + START_HOUR * 60;
                        const hour = Math.min(Math.max(Math.floor(estimatedMinutes / 60), START_HOUR), END_HOUR - 1);
                        const timeStr = `${String(hour).padStart(2, '0')}:00`;
                        onQuickBookCar(car.id, timeStr);
                      }
                    }}
                    title="คลิกบริเวณที่ว่างเพื่อจองรถคันนี้ทันที"
                  >
                    {/* Booking Blocks */}
                    {carBookings.map((booking) => {
                      const bStartParts = booking.startTime.split(':').map(Number);
                      const bEndParts = booking.endTime.split(':').map(Number);
                      const bStartMins = (bStartParts[0] - START_HOUR) * 60 + (bStartParts[1] || 0);
                      const bEndMins = (bEndParts[0] - START_HOUR) * 60 + (bEndParts[1] || 0);

                      if (bEndMins > 0 && bStartMins < TOTAL_MINUTES) {
                        const drawStart = Math.max(0, bStartMins);
                        const drawEnd = Math.min(TOTAL_MINUTES, bEndMins);
                        const leftPct = (drawStart / TOTAL_MINUTES) * 100;
                        const widthPct = Math.max(((drawEnd - drawStart) / TOTAL_MINUTES) * 100, 4);

                        // Styling per status
                        let blockStyle = 'bg-orange-500 text-white border-orange-600';
                        let statusText = 'รออนุมัติ';

                        if (booking.status === 'in_use') {
                          blockStyle = 'bg-[#1E3A8A] text-white border-[#152a65] shadow-xs';
                          statusText = 'กำลังใช้งาน';
                        } else if (booking.status === 'approved') {
                          blockStyle = 'bg-emerald-600 text-white border-emerald-700 shadow-xs';
                          statusText = 'อนุมัติแล้ว (รอรับกุญแจ)';
                        } else if (booking.status === 'completed') {
                          blockStyle = 'bg-slate-400 text-white border-slate-500 opacity-80';
                          statusText = 'คืนรถแล้ว';
                        }

                        return (
                          <button
                            key={booking.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectBooking(booking);
                            }}
                            className={`absolute top-1 bottom-1 rounded-lg ${blockStyle} px-2.5 py-1 text-left flex flex-col justify-center transition-all hover:scale-[1.01] hover:brightness-105 z-20 overflow-hidden shadow-xs cursor-pointer border`}
                            style={{
                              left: `${leftPct}%`,
                              width: `${widthPct}%`,
                            }}
                            title={`${booking.bookerName} (${booking.startTime} - ${booking.endTime})\nสถานะ: ${statusText}\nจุดหมาย: ${booking.destination || booking.purpose}`}
                          >
                            <div className="flex items-center gap-1 leading-none font-bold text-xs truncate">
                              <span className="truncate">{booking.bookerName}</span>
                            </div>
                            <div className="text-[10px] opacity-90 truncate leading-tight flex items-center gap-1 mt-0.5">
                              <span>{booking.startTime}-{booking.endTime}</span>
                              <span className="hidden sm:inline opacity-75">| {booking.department}</span>
                            </div>
                          </button>
                        );
                      }
                      return null;
                    })}

                    {/* Quick plus indicator on hover if empty */}
                    {carBookings.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity text-slate-400 text-xs font-medium">
                        <span className="bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                          + คลิกเพื่อจองคันนี้
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
