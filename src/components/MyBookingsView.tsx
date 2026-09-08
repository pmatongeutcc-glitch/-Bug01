import React from 'react';
import { Booking, Car, UserAccount } from '../types';
import { formatThaiDate } from '../utils/time';
import { 
  Calendar, Clock, Car as CarIcon, MapPin, QrCode, 
  Trash2, Edit3, CheckCircle2, AlertCircle, Key, ChevronRight
} from 'lucide-react';

interface MyBookingsViewProps {
  bookings: Booking[];
  cars: Car[];
  currentUser: UserAccount;
  onSelectBooking: (booking: Booking) => void;
  onOpenBookingModal: () => void;
  onCancelBooking: (bookingId: string, reason: string) => void;
  onEditBooking: (booking: Booking) => void;
}

export const MyBookingsView: React.FC<MyBookingsViewProps> = ({
  bookings,
  cars,
  currentUser,
  onSelectBooking,
  onOpenBookingModal,
  onCancelBooking,
  onEditBooking
}) => {
  // Filter bookings for current user or all if admin wants to see all employee bookings
  const myBookings = bookings
    .filter(b => b.bookerName === currentUser.name || b.bookerId === currentUser.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-[#F05A28]" />
            รายการจองและบัตรเบิกกุญแจดิจิทัล (My Bookings)
          </h2>
          <p className="text-xs text-slate-500">
            แสดงสถานะการจอง บัตรผ่านเบิกกุญแจรถยนต์ และปุ่มจัดการข้อมูล
          </p>
        </div>

        <button
          onClick={onOpenBookingModal}
          className="px-4 py-2 rounded-xl bg-[#F05A28] hover:bg-[#d94a1d] text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5"
        >
          <CarIcon className="w-4 h-4" /> + จองรถยนต์ใหม่
        </button>
      </div>

      {myBookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-700 text-sm">ยังไม่มีรายการจองของคุณในระบบ</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            คุณสามารถตรวจสอบตารางรถว่างในหน้า Timeline แล้วกดจองเพื่อใช้งานได้ทันที
          </p>
          <button
            onClick={onOpenBookingModal}
            className="px-4 py-2 rounded-xl bg-[#1E3A8A] text-white text-xs font-semibold"
          >
            เริ่มการจองรถ
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myBookings.map((b) => {
            const car = cars.find(c => c.id === b.carId);
            const isApproved = b.status === 'approved';
            const isInUse = b.status === 'in_use';
            const isPending = b.status === 'pending';
            const isCompleted = b.status === 'completed';
            const isCancelled = b.status === 'cancelled';

            return (
              <div
                key={b.id}
                onClick={() => onSelectBooking(b)}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-sm hover:border-slate-300 transition-all cursor-pointer flex flex-col justify-between space-y-4 relative group"
              >
                {/* Header of card */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm sm:text-base">
                        [{car?.vehicleId || b.carId}] {car?.plate}
                      </span>
                      <span className="text-xs text-slate-500 font-medium">
                        {car?.brand}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                      <Calendar className="w-3.5 h-3.5 text-[#1E3A8A]" />
                      <span>{formatThaiDate(b.date)}</span>
                      <span>•</span>
                      <Clock className="w-3.5 h-3.5 text-[#F05A28]" />
                      <span className="font-semibold text-slate-700">{b.startTime} - {b.endTime} น.</span>
                    </div>
                  </div>

                  {/* Status pill */}
                  <div>
                    {isApproved && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 shadow-xs">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> อนุมัติแล้ว
                      </span>
                    )}
                    {isInUse && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-[#1E3A8A] border border-blue-200 flex items-center gap-1">
                        <Key className="w-3 h-3 text-[#1E3A8A]" /> กำลังใช้งาน
                      </span>
                    )}
                    {isPending && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-orange-50 text-[#F05A28] border border-orange-200 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#F05A28]" /> รออนุมัติ
                      </span>
                    )}
                    {isCompleted && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                        คืนรถแล้ว
                      </span>
                    )}
                    {isCancelled && (
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-rose-50 text-rose-600 border border-rose-200">
                        ยกเลิกแล้ว
                      </span>
                    )}
                  </div>
                </div>

                {/* Destination & Purpose */}
                <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-700 font-medium truncate">
                    <MapPin className="w-3.5 h-3.5 text-[#F05A28] shrink-0" />
                    <span className="truncate">{b.destination}</span>
                  </div>
                  <div className="text-slate-500 text-[11px] truncate pl-5">
                    วัตถุประสงค์: {b.purpose}
                  </div>
                </div>

                {/* Digital Key Pass Box (Show OTP to custodian) */}
                {!isCompleted && !isCancelled && (
                  <div className="p-3 bg-gradient-to-r from-blue-50/80 to-amber-50/80 rounded-xl border border-blue-100/80 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider flex items-center gap-1">
                        <QrCode className="w-3.5 h-3.5 text-[#1E3A8A]" /> รหัสแสดงเพื่อรับกุญแจ (OTP)
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        ยื่นรหัสนี้แก่ผู้ถือกุญแจ (รปภ./ธุรการ) เพื่อรับรถ
                      </div>
                    </div>
                    <div className="bg-white px-3 py-1.5 rounded-lg border border-slate-300 shadow-xs text-center">
                      <span className="text-lg font-mono font-extrabold text-[#F05A28] tracking-widest">
                        {b.otpCode}
                      </span>
                    </div>
                  </div>
                )}

                {/* Actions bottom */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">
                    รหัสจอง: #{b.id}
                  </span>

                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    {!isCompleted && !isCancelled && (
                      <>
                        <button
                          onClick={() => {
                            const reason = prompt('กรุณาระบุเหตุผลในการยกเลิกการจอง:');
                            if (reason && reason.trim()) {
                              onCancelBooking(b.id, reason.trim());
                            }
                          }}
                          className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-medium border border-rose-200 transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" /> ยกเลิก
                        </button>

                        {isPending && (
                          <button
                            onClick={() => onEditBooking(b)}
                            className="px-2.5 py-1 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-medium border border-slate-200 transition-colors flex items-center gap-1"
                          >
                            <Edit3 className="w-3 h-3" /> แก้ไข
                          </button>
                        )}
                      </>
                    )}

                    <button
                      onClick={() => onSelectBooking(b)}
                      className="text-[#1E3A8A] font-semibold text-xs flex items-center hover:underline ml-1"
                    >
                      ดูข้อมูล <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
