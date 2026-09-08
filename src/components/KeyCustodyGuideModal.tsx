import React from 'react';
import { ShieldCheck, Key, QrCode, Bell, UserCheck, AlertTriangle, CheckCircle2, X } from 'lucide-react';

interface KeyCustodyGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyCustodyGuideModal: React.FC<KeyCustodyGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#1E3A8A] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-[#F05A28]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">คู่มือมาตรฐานการจัดเก็บและควบคุมกุญแจรถยนต์</h3>
              <p className="text-xs text-blue-200">แนวทางแก้ไขปัญหา "มีคนจองแล้ว อีกคนแอบเอาไปขับ" แบบมืออาชีพ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-sm">
          {/* Problem analysis */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 items-start">
            <AlertTriangle className="w-5 h-5 text-[#F05A28] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-slate-800 text-sm">ต้นเหตุของปัญหา</h4>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                การที่ <b>"คนหนึ่งจอง แต่อีกคนหยิบรถไปขับ"</b> มักเกิดจากการที่ <i>กุญแจรถแขวนไว้ในจุดเปิด (เช่น บอร์ดรวม)</i> ใครเดินมาหยิบก็ขับออกไปได้เลย โดยไม่มีการตรวจสอบสิทธิ์หรือยืนยันตัวตนผู้ขับจริง
              </p>
            </div>
          </div>

          {/* 5 Pillars Solution */}
          <div>
            <h4 className="font-bold text-slate-900 text-base mb-3 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F05A28]"></span>
              5 มาตรการมาตรฐานระดับองค์กร (Best Practices)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Step 1 */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-[#1E3A8A]">
                  <Key className="w-4 h-4 text-[#F05A28]" />
                  1. จุดรวมกุญแจเดี่ยว (Key Custodian)
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  <b>ใครเก็บกุญแจ:</b> ให้ <b>"ฝ่ายธุรการ / รปภ. ประตูทางออก"</b> หรือ <b>"ตู้กุญแจดิจิทัล (Key Box)"</b> เป็นผู้เก็บกุญแจทั้งหมด ห้ามแขวนไว้ที่สาธารณะเด็ดขาด
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-[#1E3A8A]">
                  <QrCode className="w-4 h-4 text-[#F05A28]" />
                  2. บัตรเบิกกุญแจดิจิทัล (OTP 4 หลัก)
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  เมื่อระบบอนุมัติการจอง ผู้จองจะได้รับ <b>รหัส OTP 4 หลัก หรือ QR Pass</b> ในมือถือ ต้องยื่นให้ผู้ถือกุญแจเพื่อปลดล็อกเบิกกุญแจเท่านั้น คนที่ไม่ได้จองจะไม่มีรหัสนี้
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-[#1E3A8A]">
                  <UserCheck className="w-4 h-4 text-[#F05A28]" />
                  3. บันทึกส่งมอบ (Digital Handover Log)
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  แอดมินหรือ รปภ. ต้องกดปุ่ม <b>"ส่งมอบกุญแจ"</b> ในระบบ พร้อมลงบันทึกเลขไมล์และระดับน้ำมัน/แบตเตอรี่ ระบบจะล็อกสถานะรถเป็น <b>"กำลังใช้งาน"</b> ทันที
                </p>
              </div>

              {/* Step 4 */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
                <div className="flex items-center gap-2 font-semibold text-[#1E3A8A]">
                  <Bell className="w-4 h-4 text-[#F05A28]" />
                  4. แจ้งเตือนผ่าน LINE Notify แบบ Real-time
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  ทุกครั้งที่มีการจอง, อนุมัติ, หรือเบิกกุญแจออกไป ระบบจะส่งแจ้งเตือนเข้ากลุ่ม LINE ของบริษัท ทำให้ทุกคนเห็นทันทีว่าใครเป็นผู้ขับรถออกไป
                </p>
              </div>
            </div>
          </div>

          {/* Workflow Summary */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4">
            <h5 className="font-semibold text-[#1E3A8A] text-xs mb-2">ขั้นตอนการใช้งานจริงในแอพนี้:</h5>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600">
              <li><b className="text-slate-800">พนักงาน</b> ดูตารางเวลา 06:00 - 18:00 น. และกดจองรถที่ว่าง</li>
              <li><b className="text-slate-800">แอดมิน</b> กดยืนยันอนุมัติการจอง (ระบบส่งแจ้งเตือนเข้ามือถือพนักงาน)</li>
              <li><b className="text-slate-800">เมื่อถึงเวลารับรถ</b> พนักงานเปิด "บัตรจองของฉัน" แสดงรหัส OTP 4 หลักให้ผู้ถือกุญแจ</li>
              <li><b className="text-slate-800">ผู้ถือกุญแจ (Admin/รปภ.)</b> ตรวจสอบรหัส กด "ส่งมอบกุญแจ" พร้อมจดเลขไมล์</li>
              <li><b className="text-slate-800">เมื่อนำรถกลับมา</b> ผู้ถือกุญแจกด "รับคืนรถ" พร้อมตรวจสอบสภาพรถ เป็นอันเสร็จสมบูรณ์</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#1E3A8A] hover:bg-[#152a65] text-white font-medium text-xs shadow-sm transition-colors flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            เข้าใจแล้ว เริ่มใช้งานระบบ
          </button>
        </div>
      </div>
    </div>
  );
};
