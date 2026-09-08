import React from 'react';
import { Car, Booking } from '../types';
import { exportBookingsToCSV } from '../utils/storage';
import { formatThaiDate } from '../utils/time';
import { 
  BarChart3, Car as CarIcon, CheckCircle2, Key, Clock, 
  TrendingUp, Download, ShieldCheck, Bolt, Fuel, Users, Activity
} from 'lucide-react';

interface DashboardAnalyticsProps {
  cars: Car[];
  bookings: Booking[];
  selectedDate: string;
}

export const DashboardAnalytics: React.FC<DashboardAnalyticsProps> = ({
  cars,
  bookings,
  selectedDate
}) => {
  const todayBookings = bookings.filter(b => b.date === selectedDate && b.status !== 'cancelled');

  const inUseCount = todayBookings.filter(b => b.status === 'in_use').length;
  const pendingCount = todayBookings.filter(b => b.status === 'pending' || b.status === 'approved').length;
  const completedCount = todayBookings.filter(b => b.status === 'completed').length;
  const totalCars = cars.length;
  const availableNow = Math.max(0, totalCars - inUseCount - pendingCount);

  // Utilization calculation
  const utilizationPct = totalCars > 0 ? Math.round(((inUseCount + pendingCount) / totalCars) * 100) : 0;

  // Energy distribution
  const evCars = cars.filter(c => (c.fuelType || '').includes('EV')).length;
  const fuelCars = totalCars - evCars;

  return (
    <div className="space-y-6">
      {/* Top Banner with Real-time metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total fleet */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">รถทั้งหมดในระบบ</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <CarIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900">{totalCars}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">กองยานพาหนะองค์กร</div>
          </div>
        </div>

        {/* Available */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">ว่าง (พร้อมจอง)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-emerald-600">{availableNow}</div>
            <div className="text-[11px] text-emerald-700/80 mt-0.5">ไม่มีคิวทับซ้อน</div>
          </div>
        </div>

        {/* In Use */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">กำลังใช้งาน</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
              <Activity className="w-4 h-4 text-[#1E3A8A]" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-[#1E3A8A]">{inUseCount}</div>
            <div className="text-[11px] text-blue-700/80 mt-0.5">เบิกกุญแจออกไปแล้ว</div>
          </div>
        </div>

        {/* Pending keys */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">รอรับกุญแจ/รออนุมัติ</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-[#F05A28] flex items-center justify-center">
              <Key className="w-4 h-4 text-[#F05A28]" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-[#F05A28]">{pendingCount}</div>
            <div className="text-[11px] text-orange-700/80 mt-0.5">มีคิวรอเบิกกุญแจ</div>
          </div>
        </div>

        {/* Utilization */}
        <div className="col-span-2 lg:col-span-1 bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">อัตราการใช้งานรถ</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-bold text-slate-800">{utilizationPct}%</div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-[#F05A28] h-full rounded-full transition-all duration-500"
                style={{ width: `${utilizationPct}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Energy & Fleet Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* EV Clean Fleet Info */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
              <Bolt className="w-4 h-4 text-amber-500" /> สัดส่วนพลังงานสะอาด (Clean Fleet)
            </h3>
            <span className="text-xs font-semibold text-[#1E3A8A] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
              EV 60%
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            บริษัทมุ่งสู่ความเป็นกลางทางคาร์บอน (Carbon Neutrality) ด้วยยานยนต์ไฟฟ้า 100% จำนวน {evCars} คัน และรถยนต์เครื่องยนต์สันดาป {fuelCars} คัน
          </p>
          <div className="flex items-center gap-2 pt-1 text-xs">
            <div className="flex-1 bg-blue-50 p-2.5 rounded-xl border border-blue-100 text-center">
              <div className="font-bold text-[#1E3A8A] text-lg">{evCars} คัน</div>
              <div className="text-[10px] text-slate-500">ไฟฟ้า EV 100%</div>
            </div>
            <div className="flex-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-center">
              <div className="font-bold text-slate-700 text-lg">{fuelCars} คัน</div>
              <div className="text-[10px] text-slate-500">น้ำมันเบนซิน</div>
            </div>
          </div>
        </div>

        {/* Security & Audit Summary */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3 md:col-span-2 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                ความปลอดภัยและการควบคุมกุญแจ (Zero Unauthorized Trips)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ระบบ OTP และบันทึกกุญแจ ช่วยให้ไม่มีการนำรถไปขับโดยไม่ได้รับอนุญาต 100%
              </p>
            </div>
            <button
              onClick={() => exportBookingsToCSV(bookings, cars)}
              className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-[#1E3A8A]" />
              ดาวน์โหลดรายงาน CSV
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">การจองทั้งหมด</span>
              <div className="text-lg font-bold text-slate-800 mt-0.5">{bookings.length} รายการ</div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">คืนรถสำเร็จแล้ว</span>
              <div className="text-lg font-bold text-emerald-600 mt-0.5">
                {bookings.filter(b => b.status === 'completed').length} รายการ
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">ยกเลิก/สละสิทธิ์</span>
              <div className="text-lg font-bold text-slate-500 mt-0.5">
                {bookings.filter(b => b.status === 'cancelled').length} รายการ
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Trips Audit Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-800 text-sm sm:text-base flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#1E3A8A]" />
              บันทึกประวัติการเบิก-คืนรถล่าสุด (Vehicle Audit Trail)
            </h3>
            <p className="text-xs text-slate-500">
              ตรวจสอบย้อนหลังได้ทุกการเดินทาง เพื่อความโปร่งใสและตรวจสอบง่าย
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[11px] uppercase border-b border-slate-200">
                <th className="p-3 pl-5 font-semibold">วัน/เวลา</th>
                <th className="p-3 font-semibold">รถยนต์</th>
                <th className="p-3 font-semibold">ผู้ขอใช้งาน / แผนก</th>
                <th className="p-3 font-semibold">จุดหมาย / วัตถุประสงค์</th>
                <th className="p-3 font-semibold">รหัส OTP</th>
                <th className="p-3 pr-5 font-semibold text-right">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.slice(0, 8).map((b) => {
                const car = cars.find(c => c.id === b.carId);
                return (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3 pl-5">
                      <div className="font-medium text-slate-800">{b.date}</div>
                      <div className="text-[11px] text-slate-400">{b.startTime} - {b.endTime} น.</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">[{car?.vehicleId || b.carId}] {car?.plate}</div>
                      <div className="text-[11px] text-slate-500">{car?.brand}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-slate-800">{b.bookerName}</div>
                      <div className="text-[11px] text-slate-400">{b.department}</div>
                    </td>
                    <td className="p-3 max-w-[200px] truncate">
                      <div className="truncate font-medium text-slate-700">{b.destination}</div>
                      <div className="truncate text-[11px] text-slate-400">{b.purpose}</div>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-700">
                      {b.otpCode}
                    </td>
                    <td className="p-3 pr-5 text-right">
                      {b.status === 'in_use' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#1E3A8A] border border-blue-200">
                          กำลังใช้งาน
                        </span>
                      )}
                      {b.status === 'approved' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          อนุมัติแล้ว
                        </span>
                      )}
                      {b.status === 'pending' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-[#F05A28] border border-orange-200">
                          รออนุมัติ
                        </span>
                      )}
                      {b.status === 'completed' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                          คืนรถแล้ว
                        </span>
                      )}
                      {b.status === 'cancelled' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-600">
                          ยกเลิก
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
