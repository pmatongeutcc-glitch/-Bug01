import React, { useState, useEffect } from 'react';
import { Booking, Car, BookingStatus } from '../types';
import { 
  X, Calendar, Clock, Car as CarIcon, User, 
  Trash2, CheckCircle2, AlertTriangle, Key, ArrowRight, Gauge
} from 'lucide-react';

interface AdminBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  cars?: Car[];
  allBookings?: Booking[];
  onSaveBooking: (bookingId: string, updates: Partial<Booking>) => Promise<void>;
  onDeleteBooking: (bookingId: string) => Promise<void>;
}

export const AdminBookingModal: React.FC<AdminBookingModalProps> = ({
  isOpen,
  onClose,
  booking,
  cars = [],
  allBookings = [],
  onSaveBooking,
  onDeleteBooking
}) => {
  const [carId, setCarId] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [bookerName, setBookerName] = useState('');
  const [department, setDepartment] = useState('');
  const [purpose, setPurpose] = useState('');
  const [destination, setDestination] = useState('');
  const [status, setStatus] = useState<BookingStatus>('pending');
  const [handoverMileage, setHandoverMileage] = useState<number | undefined>(undefined);
  const [returnMileage, setReturnMileage] = useState<number | undefined>(undefined);
  const [returnNotes, setReturnNotes] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (booking) {
      setCarId(booking.carId);
      setDate(booking.date);
      setStartTime(booking.startTime);
      setEndTime(booking.endTime);
      setBookerName(booking.bookerName);
      setDepartment(booking.department || 'พนักงานบริษัท');
      setPurpose(booking.purpose || '');
      setDestination(booking.destination || '');
      setStatus(booking.status);
      setHandoverMileage(booking.handoverMileage);
      setReturnMileage(booking.returnMileage);
      setReturnNotes(booking.returnNotes || '');
    }
    setShowDeleteConfirm(false);
    setErrorMessage('');
  }, [booking, isOpen]);

  if (!isOpen || !booking) return null;

  const currentCar = cars.find(c => c.id === carId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!bookerName.trim()) {
      setErrorMessage('กรุณาระบุชื่อผู้ขอจอง');
      return;
    }
    if (!carId) {
      setErrorMessage('กรุณาเลือกรถยนต์');
      return;
    }
    if (startTime >= endTime) {
      setErrorMessage('เวลาเริ่มต้นต้องมาก่อนเวลาสิ้นสุด');
      return;
    }

    // Check collision with other bookings for this car on this date
    const hasCollision = allBookings.some(b => {
      if (b.id === booking.id) return false;
      if (b.carId !== carId || b.date !== date || b.status === 'cancelled') return false;
      return startTime < b.endTime && endTime > b.startTime;
    });

    if (hasCollision) {
      setErrorMessage('ช่วงเวลาและรถคันนี้ มีการจองซ้อนทับกับรายการอื่นอยู่แล้ว');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSaveBooking(booking.id, {
        carId,
        date,
        startTime,
        endTime,
        bookerName: bookerName.trim(),
        department: department.trim(),
        purpose: purpose.trim(),
        destination: destination.trim(),
        status,
        handoverMileage: handoverMileage !== undefined ? Number(handoverMileage) : undefined,
        returnMileage: returnMileage !== undefined ? Number(returnMileage) : undefined,
        returnNotes: returnNotes.trim()
      });
      onClose();
    } catch (err) {
      console.error('Error saving booking:', err);
      setErrorMessage('เกิดข้อผิดพลาดในการบันทึกข้อมูลการจอง');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
    try {
      await onDeleteBooking(booking.id);
      onClose();
    } catch (err) {
      console.error('Error deleting booking:', err);
      setErrorMessage('เกิดข้อผิดพลาดในการลบรายการจอง');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1E3A8A] via-[#1e40af] to-[#0f172a] text-white px-5 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-[#F05A28]">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">
                แก้ไขข้อมูลการจอง (Admin Booking Editor)
              </h3>
              <p className="text-xs text-blue-200">
                รหัสรายการ: {booking.id} • ปรับปรุงรายละเอียดได้ทุกจุด
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Delete Confirm */}
        {showDeleteConfirm && (
          <div className="p-4 bg-rose-50 border-b border-rose-200 flex items-start justify-between gap-3 text-xs sm:text-sm">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-rose-900">ยืนยันการลบรายการจองนี้ออกจากระบบอย่างถาวร?</span>
                <p className="text-rose-700 text-xs mt-0.5">การกระทำนี้จะลบรายการออกจากฐานข้อมูล Cloud Firestore ทันที</p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1 bg-white border border-slate-300 rounded-lg text-xs"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDelete}
                className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold"
              >
                {isSubmitting ? '...' : 'ลบทันที'}
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {errorMessage && (
          <div className="mx-5 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs sm:text-sm">
          {/* Status Selection */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              สถานะการจอง (Booking Status)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <button
                type="button"
                onClick={() => setStatus('pending')}
                className={`p-2 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                  status === 'pending'
                    ? 'bg-orange-50 border-[#F05A28] text-[#F05A28] shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                รอรับกุญแจ
              </button>
              <button
                type="button"
                onClick={() => setStatus('in_use')}
                className={`p-2 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                  status === 'in_use'
                    ? 'bg-blue-50 border-[#1E3A8A] text-[#1E3A8A] shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                กำลังใช้งาน
              </button>
              <button
                type="button"
                onClick={() => setStatus('completed')}
                className={`p-2 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                  status === 'completed'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                คืนรถแล้ว
              </button>
              <button
                type="button"
                onClick={() => setStatus('cancelled')}
                className={`p-2 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                  status === 'cancelled'
                    ? 'bg-rose-50 border-rose-400 text-rose-600 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                ยกเลิกคิว
              </button>
            </div>
          </div>

          {/* Booker & Department */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-[#1E3A8A]" />
                <span>ชื่อผู้จอง *</span>
              </label>
              <input
                type="text"
                required
                value={bookerName}
                onChange={(e) => setBookerName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">แผนก / สังกัด</label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="เช่น วิศวกรรมซอฟต์แวร์"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none"
              />
            </div>
          </div>

          {/* Assigned Car */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <CarIcon className="w-3.5 h-3.5 text-[#1E3A8A]" />
              <span>คันรถที่จัดสรร (Vehicle Selection) *</span>
            </label>
            <select
              value={carId}
              onChange={(e) => setCarId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
            >
              {cars.map(c => (
                <option key={c.id} value={c.id}>
                  [{c.vehicleId}] {c.plate} - {c.brand} ({c.fuelType}) {c.status === 'maintenance' ? '⚠️ [ซ่อมบำรุง]' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>วันที่จอง</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs sm:text-sm font-semibold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>เวลาเริ่ม</span>
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs sm:text-sm font-semibold focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>เวลาสิ้นสุด</span>
              </label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs sm:text-sm font-semibold focus:outline-none"
              />
            </div>
          </div>

          {/* Purpose & Destination */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">จุดประสงค์การใช้รถ</label>
              <input
                type="text"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="เช่น พบลูกค้า หรือไปประชุม"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">สถานที่ปลายทาง</label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="เช่น อาคารไทยพาณิชย์ ปาร์ค พลาซ่า"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none"
              />
            </div>
          </div>

          {/* Inspection & Mileage Logs */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <span className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-[#1E3A8A]" />
              <span>บันทึกเลขไมล์และการตรวจสอบ (Inspection & Odometer Logs)</span>
            </span>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">เลขไมล์ก่อนออกเดินทาง (กม.)</label>
                <input
                  type="number"
                  value={handoverMileage ?? ''}
                  onChange={(e) => setHandoverMileage(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="เช่น 12500"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">เลขไมล์เมื่อส่งคืนรถ (กม.)</label>
                <input
                  type="number"
                  value={returnMileage ?? ''}
                  onChange={(e) => setReturnMileage(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="เช่น 12640"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">บันทึกสภาพรถ / หมายเหตุการคืน</label>
              <input
                type="text"
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                placeholder="เช่น รถเรียบร้อยดี, ล้างทำความสะอาดแล้ว, เติมน้ำมันเต็มถัง"
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3.5 py-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl text-xs font-bold border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ลบรายการจอง</span>
              </button>
            ) : <div />}

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-[#1E3A8A] hover:bg-[#152a65] text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4 text-[#F05A28]" />
                <span>{isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
