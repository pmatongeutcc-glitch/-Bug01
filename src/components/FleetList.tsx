import React from 'react';
import { Car, Booking, UserAccount } from '../types';
import { Car as CarIcon, Bolt, Fuel, Key, CheckCircle2, Plus, Clock, Shield } from 'lucide-react';

interface FleetListProps {
  cars: Car[];
  bookings: Booking[];
  selectedDate: string;
  currentUser: UserAccount;
  onOpenBookingModalWithCar: (carId: string) => void;
  onOpenHandoverModal: (booking: Booking) => void;
  onOpenReturnModal: (booking: Booking) => void;
  onOpenAddCarModal: () => void;
  onOpenEditCarModal: (car: Car) => void;
}

export const FleetList: React.FC<FleetListProps> = ({
  cars,
  bookings,
  selectedDate,
  currentUser,
  onOpenBookingModalWithCar,
  onOpenHandoverModal,
  onOpenReturnModal,
  onOpenAddCarModal,
  onOpenEditCarModal
}) => {
  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'manager';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap gap-3 items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1E3A8A]/10 text-[#1E3A8A] flex items-center justify-center">
            <CarIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800">
              สถานะกองยานพาหนะและควบคุมกุญแจ (Fleet Status)
            </h2>
            <p className="text-xs text-slate-500">
              ติดตามสถานะความพร้อมและส่งมอบกุญแจรถยนต์ขององค์กร
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={onOpenAddCarModal}
              className="px-3 py-1.5 rounded-xl bg-[#1E3A8A] hover:bg-[#152a65] text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> เพิ่มรถใหม่ในระบบ
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase tracking-wider border-b border-slate-200">
              <th className="p-3.5 pl-5 font-semibold">รหัสรถ / ทะเบียน</th>
              <th className="p-3.5 font-semibold">ยี่ห้อ • รุ่น / สี</th>
              <th className="p-3.5 font-semibold">ประเภทพลังงาน</th>
              <th className="p-3.5 font-semibold">คิวจองในวันที่เลือก</th>
              <th className="p-3.5 pr-5 font-semibold text-right">
                {isAdmin ? 'การจัดการกุญแจ (Admin Action)' : 'การดำเนินการ'}
              </th>
            </tr>
          </thead>
          <tbody className="text-xs sm:text-sm divide-y divide-slate-100">
            {cars.map((car) => {
              const isEV = (car.fuelType || '').includes('EV');
              const dateBookings = bookings
                .filter(b => b.carId === car.id && b.date === selectedDate && b.status !== 'cancelled' && b.status !== 'rejected')
                .sort((a, b) => a.startTime.localeCompare(b.startTime));

              const activeBooking = dateBookings.find(b => b.status !== 'completed');

              return (
                <tr key={car.id} className="hover:bg-slate-50/70 transition-colors">
                  {/* ID & Plate */}
                  <td className="p-3.5 pl-5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-xs">
                        {car.vehicleId}
                      </span>
                      <span className="font-bold text-slate-800 text-sm">
                        {car.plate}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      ไมล์: {car.mileage?.toLocaleString() || '-'} กม.
                    </div>
                  </td>

                  {/* Brand & Color */}
                  <td className="p-3.5">
                    <div className="font-semibold text-slate-800">
                      {car.brand}
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <span>สี{car.color}</span>
                      {car.notes && <span className="text-[#1E3A8A]">({car.notes})</span>}
                    </div>
                  </td>

                  {/* Fuel Type */}
                  <td className="p-3.5">
                    {isEV ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-[#1E3A8A] text-xs font-semibold border border-blue-100">
                        <Bolt className="w-3.5 h-3.5 text-amber-500" /> ไฟฟ้า EV
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
                        <Fuel className="w-3 h-3 text-slate-500" /> เบนซิน
                      </span>
                    )}
                  </td>

                  {/* Booking queue */}
                  <td className="p-3.5">
                    {dateBookings.length === 0 ? (
                      <span className="text-emerald-600 font-medium text-xs flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> ว่างตลอดวัน
                      </span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {dateBookings.map((b) => (
                          <div
                            key={b.id}
                            className={`text-[11px] px-2 py-0.5 rounded-md inline-flex items-center gap-1.5 border ${
                              b.status === 'in_use'
                                ? 'bg-blue-50 text-[#1E3A8A] border-blue-200 font-semibold'
                                : b.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : b.status === 'completed'
                                ? 'bg-slate-100 text-slate-500 border-slate-200'
                                : 'bg-orange-50 text-[#F05A28] border-orange-200'
                            }`}
                          >
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>{b.startTime}-{b.endTime}</span>
                            <span className="truncate max-w-[120px]">({b.bookerName})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* Actions column */}
                  <td className="p-3.5 pr-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Admin Custodian Actions */}
                      {isAdmin && activeBooking && activeBooking.status === 'approved' && (
                        <button
                          onClick={() => onOpenHandoverModal(activeBooking)}
                          className="px-3 py-1.5 rounded-lg bg-[#1E3A8A] hover:bg-[#152a65] text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                        >
                          <Key className="w-3.5 h-3.5 text-[#F05A28]" /> ส่งมอบกุญแจ
                        </button>
                      )}

                      {isAdmin && activeBooking && activeBooking.status === 'pending' && (
                        <button
                          onClick={() => onOpenHandoverModal(activeBooking)}
                          className="px-3 py-1.5 rounded-lg bg-[#F05A28] hover:bg-[#d94a1d] text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                        >
                          <Key className="w-3.5 h-3.5 text-white" /> อนุมัติ & ส่งมอบ
                        </button>
                      )}

                      {isAdmin && activeBooking && activeBooking.status === 'in_use' && (
                        <button
                          onClick={() => onOpenReturnModal(activeBooking)}
                          className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> ตรวจรับคืนรถ
                        </button>
                      )}

                      {/* Quick Book Button for Employees or any user */}
                      <button
                        onClick={() => onOpenBookingModalWithCar(car.id)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-[#1E3A8A] text-slate-700 hover:text-[#1E3A8A] bg-white text-xs font-medium transition-colors shadow-xs"
                      >
                        จองคันนี้
                      </button>

                      {isAdmin && (
                        <button
                          onClick={() => onOpenEditCarModal(car)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="แก้ไขข้อมูลรถ"
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
