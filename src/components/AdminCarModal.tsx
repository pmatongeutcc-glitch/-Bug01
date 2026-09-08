import React, { useState, useEffect } from 'react';
import { Car, FuelType, Booking } from '../types';
import { 
  Car as CarIcon, X, CheckCircle2, Trash2, AlertTriangle, 
  Wrench, Shield, Gauge, Users, MapPin, Hash, Sparkles
} from 'lucide-react';

interface AdminCarModalProps {
  isOpen: boolean;
  onClose: () => void;
  carToEdit?: Car | null;
  existingCars?: Car[];
  activeBookings?: Booking[];
  onSaveCar: (carData: Car) => Promise<void>;
  onDeleteCar: (carId: string) => Promise<void>;
}

export const AdminCarModal: React.FC<AdminCarModalProps> = ({
  isOpen,
  onClose,
  carToEdit,
  existingCars = [],
  activeBookings = [],
  onSaveCar,
  onDeleteCar
}) => {
  const [vehicleId, setVehicleId] = useState('');
  const [plate, setPlate] = useState('');
  const [brand, setBrand] = useState('');
  const [color, setColor] = useState('ขาว');
  const [fuelType, setFuelType] = useState<FuelType>('ไฟฟ้า 100% (EV)');
  const [seats, setSeats] = useState<number>(5);
  const [mileage, setMileage] = useState<number>(10000);
  const [status, setStatus] = useState<'available' | 'in_use' | 'maintenance'>('available');
  const [notes, setNotes] = useState('');

  // Delete confirmation mode
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const safeCarsList = existingCars || [];
  const safeBookingsList = activeBookings || [];

  useEffect(() => {
    if (carToEdit) {
      setVehicleId(carToEdit.vehicleId || carToEdit.id);
      setPlate(carToEdit.plate || '');
      setBrand(carToEdit.brand || '');
      setColor(carToEdit.color || 'ขาว');
      setFuelType(carToEdit.fuelType || 'ไฟฟ้า 100% (EV)');
      setSeats(carToEdit.seats || 5);
      setMileage(carToEdit.mileage || 10000);
      setStatus(carToEdit.status || 'available');
      setNotes(carToEdit.notes || '');
    } else {
      // Suggest next vehicle id like A07, A08...
      const nextNum = (safeCarsList.length || 0) + 1;
      const suggestedId = nextNum < 10 ? `A0${nextNum}` : `A${nextNum}`;
      setVehicleId(suggestedId);
      setPlate('');
      setBrand('');
      setColor('ขาว');
      setFuelType('ไฟฟ้า 100% (EV)');
      setSeats(5);
      setMileage(10000);
      setStatus('available');
      setNotes('');
    }
    setShowDeleteConfirm(false);
    setErrorMessage('');
  }, [carToEdit, isOpen, safeCarsList.length]);

  if (!isOpen) return null;

  // Active bookings related to this car
  const relatedBookings = carToEdit 
    ? safeBookingsList.filter(b => b.carId === carToEdit.id && b.status !== 'completed' && b.status !== 'cancelled')
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!vehicleId.trim()) {
      setErrorMessage('กรุณาระบุรหัสรถ (Vehicle ID)');
      return;
    }
    if (!plate.trim()) {
      setErrorMessage('กรุณาระบุเลขทะเบียนรถ');
      return;
    }
    if (!brand.trim()) {
      setErrorMessage('กรุณาระบุยี่ห้อและรุ่นรถ');
      return;
    }

    // Check duplicate ID if new car
    if (!carToEdit) {
      const isDuplicate = existingCars.some(c => c.id.toLowerCase() === vehicleId.trim().toLowerCase() || c.vehicleId.toLowerCase() === vehicleId.trim().toLowerCase());
      if (isDuplicate) {
        setErrorMessage(`รหัสรถ "${vehicleId}" มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const carId = carToEdit ? carToEdit.id : vehicleId.trim();
      const updatedCar: Car = {
        id: carId,
        vehicleId: vehicleId.trim(),
        plate: plate.trim(),
        brand: brand.trim(),
        color: color.trim(),
        fuelType,
        seats: Number(seats) || 5,
        mileage: Number(mileage) || 0,
        status,
        notes: notes.trim()
      };

      await onSaveCar(updatedCar);
      onClose();
    } catch (err) {
      console.error('Error saving car:', err);
      setErrorMessage('เกิดข้อผิดพลาดในการบันทึกข้อมูลรถ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!carToEdit) return;
    setIsSubmitting(true);
    try {
      await onDeleteCar(carToEdit.id);
      onClose();
    } catch (err) {
      console.error('Error deleting car:', err);
      setErrorMessage('เกิดข้อผิดพลาดในการลบรถยนต์');
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
              <CarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg flex items-center gap-2">
                <span>{carToEdit ? 'แก้ไขข้อมูลรถยนต์ (Pro Fleet Manager)' : 'เพิ่มรถยนต์ใหม่เข้าสู่ระบบ'}</span>
              </h3>
              <p className="text-xs text-blue-200">
                {carToEdit ? `จัดการข้อมูลรถ [${carToEdit.vehicleId}] ${carToEdit.plate}` : 'บันทึกรถยนต์คันใหม่เข้าสู่ฐานข้อมูลคลาวด์'}
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

        {/* Delete Confirmation Overlay inside modal */}
        {showDeleteConfirm && (
          <div className="p-5 sm:p-6 bg-rose-50 border-b border-rose-200 text-slate-800 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 text-xs sm:text-sm">
                <h4 className="font-extrabold text-rose-900">
                  ยืนยันการลบรถยนต์ [{carToEdit?.vehicleId}] {carToEdit?.plate}?
                </h4>
                <p className="text-rose-700 mt-1 leading-relaxed">
                  การลบจะนำรถคันนี้ออกจากฐานข้อมูล Cloud Firestore อย่างถาวร และจะไม่สามารถย้อนกลับได้
                </p>
                {relatedBookings.length > 0 && (
                  <div className="mt-2.5 p-2.5 bg-rose-100/70 rounded-xl border border-rose-200 text-rose-950 font-bold text-xs">
                    ⚠️ คำเตือน: รถคันนี้มีรายการจองค้างอยู่ {relatedBookings.length} รายการ (รายการจองจะยังคงอยู่ในประวัติแต่รถจะถูกลบออก)
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleDelete}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'กำลังลบ...' : 'ยืนยันลบรถคันนี้'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mx-5 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs sm:text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Hash className="w-3.5 h-3.5 text-[#1E3A8A]" />
                <span>รหัสรถ (Vehicle ID) *</span>
              </label>
              <input
                type="text"
                required
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                placeholder="เช่น A07 หรือ EV-01"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <CarIcon className="w-3.5 h-3.5 text-[#1E3A8A]" />
                <span>เลขทะเบียนรถ *</span>
              </label>
              <input
                type="text"
                required
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                placeholder="เช่น 1กข 9876 กทม."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ยี่ห้อและรุ่นรถยนต์ (Brand & Model) *
            </label>
            <input
              type="text"
              required
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="เช่น BYD Atto 3 Extended Range, Honda CR-V"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">สีตัวถังรถ</label>
              <input
                type="text"
                required
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="เช่น ขาวมุก, ดำเงา, เทา"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ประเภทพลังงานเชื้อเพลิง</label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value as FuelType)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-[#1E3A8A] focus:outline-none"
              >
                <option value="ไฟฟ้า 100% (EV)">⚡ ไฟฟ้า 100% (EV)</option>
                <option value="เบนซิน">⛽ เบนซิน</option>
                <option value="ดีเซล">🛢️ ดีเซล</option>
                <option value="ไฮบริด (HEV/PHEV)">🔋 ไฮบริด (HEV/PHEV)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>จำนวนที่นั่ง</span>
              </label>
              <select
                value={seats}
                onChange={(e) => setSeats(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs sm:text-sm font-semibold focus:outline-none"
              >
                <option value={4}>4 ที่นั่ง</option>
                <option value={5}>5 ที่นั่ง (มาตรฐาน)</option>
                <option value={7}>7 ที่นั่ง (SUV)</option>
                <option value={11}>11 ที่นั่ง (Van)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-slate-500" />
                <span>เลขไมล์ (กม.)</span>
              </label>
              <input
                type="number"
                value={mileage}
                onChange={(e) => setMileage(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs sm:text-sm font-semibold focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Wrench className="w-3.5 h-3.5 text-slate-500" />
                <span>สถานะรถยนต์</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className={`w-full border rounded-xl px-2 py-2 text-xs sm:text-sm font-bold focus:outline-none ${
                  status === 'available'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : status === 'maintenance'
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-blue-50 text-[#1E3A8A] border-blue-300'
                }`}
              >
                <option value="available">🟢 ว่างพร้อมใช้งาน</option>
                <option value="maintenance">🛠️ ซ่อมบำรุง / งดใช้</option>
                <option value="in_use">🔵 กำลังใช้งาน</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>ตำแหน่งช่องจอดประจำ / ข้อมูลประกันภัย / บันทึกเพิ่มเติม</span>
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="เช่น ช่องจอด B-04 ใกล้จุดชาร์จ EV, บัตร EasyPass ในเก๊ะหน้ารถ, ประกันชั้น 1 ถึง ธ.ค."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
            />
          </div>

          {/* Quick Info Box */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-500 space-y-1">
            <div className="flex items-center gap-1 font-semibold text-slate-700">
              <Sparkles className="w-3.5 h-3.5 text-[#F05A28]" />
              <span>ความพร้อมของระบบ:</span>
            </div>
            <p>
              ข้อมูลรถยนต์จะถูกอัปเดตลง Cloud Firestore และสะท้อนบนหน้าจอคีออสและหน้าจอพนักงานทุกคนแบบอัตโนมัติทันที
            </p>
          </div>

          {/* Bottom Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            {carToEdit && !showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3.5 py-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl text-xs font-bold border border-rose-200 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ลบรถคันนี้</span>
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
                <span>{isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูลรถ'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
