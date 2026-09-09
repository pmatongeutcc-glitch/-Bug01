import React, { useState } from 'react';
import { Booking, Car, UserAccount } from '../types';
import { formatThaiDate } from '../utils/time';
import { 
  X, Calendar, Clock, MapPin, User, Phone, CheckCircle2, 
  Key, AlertTriangle, Edit3, Trash2, QrCode, ShieldCheck, Gauge, ArrowRight
} from 'lucide-react';

interface BookingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  car: Car | undefined;
  currentUser: UserAccount;
  onApprove: (bookingId: string) => void;
  onOpenHandoverModal: (booking: Booking) => void;
  onOpenReturnModal: (booking: Booking) => void;
  onCancelBooking: (bookingId: string, reason: string) => void;
  onEditBooking: (booking: Booking) => void;
}

export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  isOpen,
  onClose,
  booking,
  car,
  currentUser,
  onApprove,
  onOpenHandoverModal,
  onOpenReturnModal,
  onCancelBooking,
  onEditBooking
}) => {
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  if (!isOpen || !booking) return null;

  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'manager';
  const isOwner = currentUser.name === booking.bookerName || currentUser.id === booking.bookerId;
  const canModify = (isOwner || isAdmin) && booking.status !== 'completed' && booking.status !== 'cancelled';

  const handleConfirmCancel = () => {
    if (!cancelReason.trim()) {
      alert('กรุณาระบุเหตุผลในการยกเลิก');
      return;
    }
    onCancelBooking(booking.id, cancelReason);
    setShowCancelPrompt(false);
    setCancelReason('');
    onClose();
  };

  const getStatusBadge = () => {
    switch (booking.status) {
      case 'approved':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> อนุมัติแล้ว (รอรับกุญแจ)
          </span>
        );
      case 'in_use':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-[#1E3A8A] border border-blue-200 flex items-center gap-1">
            <Key className="w-3.5 h-3.5 text-[#1E3A8A]" /> กำลังใช้งาน (เบิกกุญแจแล้ว)
          </span>
        );
      case 'completed':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            คืนรถเรียบร้อยแล้ว
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 border border-rose-200">
            ยกเลิกการจองแล้ว
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-[#F05A28] border border-orange-200">
            รอการอนุมัติ
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#1E3A8A] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-[#F05A28]">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg leading-tight">
                รายละเอียดการจองรถยนต์
              </h3>
              <p className="text-xs text-blue-200">
                รหัสรายการ: {booking.id}
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

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-700 text-xs sm:text-sm">
          {/* Status & OTP Pass Banner */}
          <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
            <div>
              <div className="text-[11px] text-slate-500 font-medium mb-1">สถานะปัจจุบัน:</div>
              {getStatusBadge()}
            </div>

            {/* OTP Key Pass */}
            {booking.status !== 'cancelled' && booking.status !== 'completed' && (
              <div className="text-right bg-white p-2 px-3 rounded-lg border border-slate-200 shadow-xs">
                <div className="text-[10px] text-slate-500 font-medium uppercase tracking-wider flex items-center gap-1 justify-end">
                  <QrCode className="w-3 h-3 text-[#1E3A8A]" /> รหัสเบิกกุญแจ (OTP)
                </div>
                <div className="text-xl font-extrabold text-[#F05A28] tracking-widest font-mono">
                  {booking.otpCode || '1234'}
                </div>
              </div>
            )}
          </div>

          {/* Vehicle Info */}
          {car && (
            <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/40 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-500 font-medium">ยานพาหนะที่ขอจอง:</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">
                  [{car.vehicleId}] {car.plate}
                </div>
                <div className="text-xs text-slate-600">
                  {car.brand} • สี{car.color} • {car.fuelType}
                </div>
              </div>
              <div className="text-right text-xs">
                <span className="font-semibold text-[#1E3A8A] block">{car.notes || 'ช่องจอดปกติ'}</span>
                {car.mileage && (
                  <span className="text-[11px] text-slate-500 flex items-center gap-1 justify-end mt-1">
                    <Gauge className="w-3 h-3" /> ไมล์ปัจจุบัน: {car.mileage.toLocaleString()} กม.
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Time & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <div className="text-[11px] text-slate-500 flex items-center gap-1 mb-1">
                <Calendar className="w-3.5 h-3.5 text-[#1E3A8A]" /> วันที่
              </div>
              <div className="font-semibold text-slate-800">{formatThaiDate(booking.date)}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <div className="text-[11px] text-slate-500 flex items-center gap-1 mb-1">
                <Clock className="w-3.5 h-3.5 text-[#F05A28]" /> เวลา (06:00 - 18:00)
              </div>
              <div className="font-semibold text-slate-800">{booking.startTime} - {booking.endTime} น.</div>
            </div>
          </div>

          {/* Booker & Destination */}
          <div className="space-y-2.5 bg-slate-50/60 p-4 rounded-xl border border-slate-200/60">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11px] text-slate-500 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-[#1E3A8A]" /> ผู้ขอจอง:
                </div>
                <div className="font-bold text-slate-800 text-sm">{booking.bookerName}</div>
                <div className="text-xs text-slate-500">{booking.department}</div>
              </div>
              {booking.phoneNumber && (
                <div className="text-right">
                  <div className="text-[11px] text-slate-500 flex items-center gap-1 justify-end">
                    <Phone className="w-3.5 h-3.5 text-[#1E3A8A]" /> เบอร์ติดต่อ:
                  </div>
                  <a href={`tel:${booking.phoneNumber}`} className="text-xs font-semibold text-[#1E3A8A] hover:underline">
                    {booking.phoneNumber}
                  </a>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-200/60">
              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#F05A28]" /> จุดหมายปลายทาง:
              </div>
              <div className="font-semibold text-slate-800 mt-0.5">{booking.destination || '-'}</div>
            </div>

            <div className="pt-2 border-t border-slate-200/60">
              <div className="text-[11px] text-slate-500">วัตถุประสงค์:</div>
              <div className="text-slate-700 text-xs mt-0.5">{booking.purpose || '-'}</div>
            </div>
          </div>

          {/* Audit / Handover Logs */}
          {(booking.handoverTime || booking.returnTime) && (
            <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-2 text-xs">
              <div className="font-semibold text-emerald-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                บันทึกการส่งมอบกุญแจและการตรวจสอบ
              </div>
              {booking.handoverTime && (
                <div className="text-slate-700">
                  • <b>ส่งมอบกุญแจเวลา:</b> {booking.handoverTime} น. (ไมล์ออก: {booking.handoverMileage?.toLocaleString()} กม. / พลังงาน: {booking.handoverFuelLevel})
                </div>
              )}
              {booking.returnTime && (
                <div className="text-slate-700">
                  • <b>รับคืนรถเวลา:</b> {booking.returnTime} น. (ไมล์เข้า: {booking.returnMileage?.toLocaleString()} กม. / {booking.returnNotes})
                </div>
              )}
            </div>
          )}

          {/* Cancel Reason Display */}
          {booking.status === 'cancelled' && booking.cancellationReason && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
              <b>เหตุผลที่ยกเลิก:</b> {booking.cancellationReason}
            </div>
          )}

          {/* Cancel Prompt Input if toggled */}
          {showCancelPrompt && (
            <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl space-y-2">
              <div className="font-semibold text-rose-900 flex items-center gap-1.5 text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                ยืนยันการยกเลิกการจอง
              </div>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="ระบุเหตุผล เช่น ลูกค้าเลื่อนนัด / เปลี่ยนแปลงแผนงาน"
                className="w-full bg-white border border-rose-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setShowCancelPrompt(false)}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs"
                >
                  ย้อนกลับ
                </button>
                <button
                  onClick={handleConfirmCancel}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-lg text-xs"
                >
                  ยืนยันยกเลิกทันที
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          {/* Left Actions: Cancel / Edit */}
          <div className="flex items-center gap-2">
            {canModify && !showCancelPrompt && (
              <>
                <button
                  onClick={() => setShowCancelPrompt(true)}
                  className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200 font-medium text-xs transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> ยกเลิกการจอง
                </button>

                {booking.status === 'pending' && (
                  <button
                    onClick={() => {
                      onEditBooking(booking);
                      onClose();
                    }}
                    className="px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-200 font-medium text-xs transition-colors flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> ขอแก้ไขข้อมูล
                  </button>
                )}
              </>
            )}
          </div>

          {/* Right Actions: Admin approvals & Handover */}
          <div className="flex items-center gap-2 ml-auto">
            {isAdmin && booking.status === 'pending' && (
              <button
                onClick={() => {
                  onApprove(booking.id);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> อนุมัติการจอง
              </button>
            )}

            {isAdmin && (booking.status === 'approved' || booking.status === 'pending') && (
              <button
                onClick={() => {
                  onOpenHandoverModal(booking);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-[#1E3A8A] hover:bg-[#152a65] text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Key className="w-4 h-4 text-[#F05A28]" /> ตรวจ OTP & ส่งมอบกุญแจ
              </button>
            )}

            {isAdmin && booking.status === 'in_use' && (
              <button
                onClick={() => {
                  onOpenReturnModal(booking);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-[#F05A28] hover:bg-[#d94a1d] text-white font-semibold text-xs shadow-xs transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> ตรวจรับคืนรถยนต์
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium"
            >
              ปิด
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
