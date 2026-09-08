import React, { useState, useEffect } from 'react';
import { Booking, Car, UserAccount } from '../types';
import { Key, ShieldCheck, CheckCircle2, AlertCircle, X, Gauge, BatteryCharging, Check } from 'lucide-react';

interface AdminKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'handover' | 'return';
  booking: Booking | null;
  car: Car | undefined;
  currentUser: UserAccount;
  onConfirmHandover: (bookingId: string, mileage: number, fuelLevel: string, verifiedOtp: string) => void;
  onConfirmReturn: (bookingId: string, mileage: number, fuelLevel: string, notes: string) => void;
}

export const AdminKeyModal: React.FC<AdminKeyModalProps> = ({
  isOpen,
  onClose,
  mode,
  booking,
  car,
  currentUser,
  onConfirmHandover,
  onConfirmReturn
}) => {
  const [enteredOtp, setEnteredOtp] = useState('');
  const [mileage, setMileage] = useState<number>(0);
  const [fuelLevel, setFuelLevel] = useState('100%');
  const [notes, setNotes] = useState('สภาพรถปกติ เรียบร้อยดี');
  const [otpError, setOtpError] = useState(false);

  useEffect(() => {
    if (booking && car) {
      if (mode === 'handover') {
        setMileage(car.mileage || 15000);
        setFuelLevel((car.fuelType || '').includes('EV') ? '95% (แบตเตอรี่)' : 'เต็มถัง');
        setEnteredOtp('');
        setOtpError(false);
      } else {
        // Return mode
        setMileage((booking.handoverMileage || car.mileage || 15000) + 45); // estimated +45 km
        setFuelLevel((car.fuelType || '').includes('EV') ? '80% (แบตเตอรี่)' : '3/4 ถัง');
        setNotes('รถสะอาดเรียบร้อย ส่งคืนกุญแจครบถ้วน');
      }
    }
  }, [booking, car, mode, isOpen]);

  if (!isOpen || !booking || !car) return null;

  const isEV = (car.fuelType || '').includes('EV');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === 'handover') {
      // Verify OTP matches the booking OTP to prevent unauthorised people from taking the keys
      if (enteredOtp.trim() !== booking.otpCode.trim()) {
        setOtpError(true);
        return;
      }
      onConfirmHandover(booking.id, Number(mileage), fuelLevel, enteredOtp);
    } else {
      onConfirmReturn(booking.id, Number(mileage), fuelLevel, notes);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#1E3A8A] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-[#F05A28]">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                {mode === 'handover' ? 'ขั้นตอนส่งมอบกุญแจ (Key Handover)' : 'ขั้นตอนตรวจรับคืนรถ (Vehicle Return)'}
              </h3>
              <p className="text-xs text-blue-200">
                {mode === 'handover' ? 'ตรวจสอบ OTP ป้องกันการสวมสิทธิ์รับรถ' : 'บันทึกเลขไมล์และตรวจความเรียบร้อย'}
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

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-slate-700 text-xs sm:text-sm">
          {/* Target vehicle & booker info */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-900 text-sm">[{car.vehicleId}] {car.plate}</span>
              <span className="text-[11px] font-semibold text-[#1E3A8A] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                {car.brand}
              </span>
            </div>
            <div className="text-slate-600 text-xs">
              <b>ผู้รับมอบ:</b> {booking.bookerName} ({booking.department})
            </div>
            <div className="text-slate-500 text-[11px]">
              <b>ช่วงเวลาจอง:</b> {booking.startTime} - {booking.endTime} น.
            </div>
          </div>

          {/* If Handover: Require OTP verification */}
          {mode === 'handover' && (
            <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-xl space-y-2">
              <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-slate-900">
                  <ShieldCheck className="w-4 h-4 text-[#F05A28]" />
                  กรอกรหัส OTP 4 หลักจากมือถือผู้ขอเบิกกุญแจ
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  (รหัสจำลอง: <code className="bg-amber-200/60 px-1 py-0.5 rounded font-mono font-bold text-slate-800">{booking.otpCode}</code>)
                </span>
              </label>
              <input
                type="text"
                required
                maxLength={4}
                value={enteredOtp}
                onChange={(e) => {
                  setEnteredOtp(e.target.value);
                  setOtpError(false);
                }}
                placeholder="••••"
                className="w-full text-center tracking-widest text-2xl font-bold bg-white border border-slate-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] font-mono"
              />
              {otpError && (
                <div className="text-xs text-rose-600 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  รหัส OTP ไม่ถูกต้อง! กรุณาขอดูหน้าจอบัตรจองของผู้เบิกอีกครั้ง
                </div>
              )}
              <p className="text-[11px] text-slate-500">
                *ขั้นตอนนี้ป้องกันการที่บุคคลอื่นเดินมาแอบหยิบกุญแจไปขับโดยไม่ได้จอง
              </p>
            </div>
          )}

          {/* Mileage & Fuel Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-[#1E3A8A]" />
                {mode === 'handover' ? 'เลขไมล์ก่อนออก (กม.)' : 'เลขไมล์ตอนส่งคืน (กม.)'}
              </label>
              <input
                type="number"
                required
                value={mileage}
                onChange={(e) => setMileage(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <BatteryCharging className="w-3.5 h-3.5 text-emerald-600" />
                {isEV ? 'ระดับแบตเตอรี่' : 'ระดับน้ำมัน'}
              </label>
              <input
                type="text"
                required
                value={fuelLevel}
                onChange={(e) => setFuelLevel(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
              />
            </div>
          </div>

          {/* If Return mode: inspection notes */}
          {mode === 'return' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ผลการตรวจสภาพรถและช่องจอดคืน
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="เช่น คืนช่องจอด E-01 ชาร์จไฟเสียบสายแล้ว สภาพปกติ"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
              />
            </div>
          )}

          {/* Footer buttons */}
          <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className={`px-5 py-2 rounded-xl text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-1.5 ${
                mode === 'handover'
                  ? 'bg-[#1E3A8A] hover:bg-[#152a65]'
                  : 'bg-[#F05A28] hover:bg-[#d94a1d]'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {mode === 'handover' ? 'ยืนยันการส่งมอบกุญแจ' : 'ยืนยันรับคืนรถสำเร็จ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
