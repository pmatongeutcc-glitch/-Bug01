import React, { useState, useEffect } from 'react';
import { Car, FuelType } from '../types';
import { Car as CarIcon, X, CheckCircle2 } from 'lucide-react';

interface AddEditCarModalProps {
  isOpen: boolean;
  onClose: () => void;
  carToEdit?: Car | null;
  onSaveCar: (carData: Car) => void;
}

export const AddEditCarModal: React.FC<AddEditCarModalProps> = ({
  isOpen,
  onClose,
  carToEdit,
  onSaveCar
}) => {
  const [vehicleId, setVehicleId] = useState('');
  const [plate, setPlate] = useState('');
  const [brand, setBrand] = useState('');
  const [color, setColor] = useState('ขาว');
  const [fuelType, setFuelType] = useState<FuelType>('ไฟฟ้า 100% (EV)');
  const [mileage, setMileage] = useState<number>(10000);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (carToEdit) {
      setVehicleId(carToEdit.vehicleId);
      setPlate(carToEdit.plate);
      setBrand(carToEdit.brand);
      setColor(carToEdit.color);
      setFuelType(carToEdit.fuelType);
      setMileage(carToEdit.mileage || 0);
      setNotes(carToEdit.notes || '');
    } else {
      setVehicleId('');
      setPlate('');
      setBrand('');
      setColor('ขาว');
      setFuelType('ไฟฟ้า 100% (EV)');
      setMileage(10000);
      setNotes('');
    }
  }, [carToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = carToEdit ? carToEdit.id : vehicleId.trim() || `CAR-${Date.now().toString().slice(-4)}`;
    onSaveCar({
      id,
      vehicleId: vehicleId.trim(),
      plate: plate.trim(),
      brand: brand.trim(),
      color: color.trim(),
      fuelType,
      mileage: Number(mileage),
      notes: notes.trim(),
      status: 'available',
      seats: 5
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-[#1E3A8A] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-[#F05A28]">
              <CarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                {carToEdit ? 'แก้ไขข้อมูลรถยนต์' : 'เพิ่มรถยนต์เข้าสู่ระบบ'}
              </h3>
              <p className="text-xs text-blue-200">จัดการข้อมูลกองยานพาหนะของบริษัท</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-slate-700 text-xs sm:text-sm">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">รหัสรถ (Vehicle ID)</label>
              <input
                type="text"
                required
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                placeholder="เช่น A08 หรือ 057"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ทะเบียนรถ</label>
              <input
                type="text"
                required
                value={plate}
                onChange={(e) => setPlate(e.target.value)}
                placeholder="เช่น 9กท 1234"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">ยี่ห้อ / รุ่นรถยนต์</label>
            <input
              type="text"
              required
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="เช่น BYD Dolphin, Honda City"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">สีรถ</label>
              <input
                type="text"
                required
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="เช่น ขาว, เทา, ดำ"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ประเภทพลังงาน</label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value as FuelType)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
              >
                <option value="ไฟฟ้า 100% (EV)">ไฟฟ้า 100% (EV)</option>
                <option value="เบนซิน">เบนซิน</option>
                <option value="ดีเซล">ดีเซล</option>
                <option value="ไฮบริด (HEV/PHEV)">ไฮบริด (HEV/PHEV)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">เลขไมล์ปัจจุบัน (กม.)</label>
              <input
                type="number"
                value={mileage}
                onChange={(e) => setMileage(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">ตำแหน่งช่องจอด / หมายเหตุ</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="เช่น ประจำช่อง E-04"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
              />
            </div>
          </div>

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
              className="px-5 py-2 rounded-xl bg-[#1E3A8A] hover:bg-[#152a65] text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              บันทึกข้อมูลรถ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
