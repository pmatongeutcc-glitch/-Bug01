import React, { useState } from 'react';
import { FleetSettings, Car, Booking } from '../types';
import { 
  X, Settings, Shield, Bell, Clock, Database, Save, 
  RefreshCw, Download, Trash2, CheckCircle2, AlertTriangle, 
  Send, Lock, Megaphone, Info
} from 'lucide-react';

interface AdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings?: FleetSettings;
  cars?: Car[];
  bookings?: Booking[];
  onSaveSettings: (newSettings: Partial<FleetSettings>) => Promise<void>;
  onRestoreDefaultCars: () => Promise<void>;
  onClearAllBookings: () => Promise<void>;
  onSendTestLineNotification: () => void;
}

export const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({
  isOpen,
  onClose,
  settings = {} as FleetSettings,
  cars = [],
  bookings = [],
  onSaveSettings,
  onRestoreDefaultCars,
  onClearAllBookings,
  onSendTestLineNotification
}) => {
  const [activeTab, setActiveTab] = useState<'policy' | 'notifications' | 'security' | 'database'>('policy');
  
  // Settings Form State
  const [limitHours, setLimitHours] = useState<number>(settings?.reasonableLimitHours || 4);
  const [systemNotice, setSystemNotice] = useState<string>(settings?.systemNotice || '');
  const [operatingStart, setOperatingStart] = useState<number>(settings?.operatingHoursStart ?? 6);
  const [operatingEnd, setOperatingEnd] = useState<number>(settings?.operatingHoursEnd ?? 18);
  const [enableLine, setEnableLine] = useState<boolean>(settings?.enableLineNotifications ?? true);
  const [autoApprove, setAutoApprove] = useState<boolean>(settings?.autoApproveBookings ?? true);
  
  // PIN change state
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinMessage, setPinMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const currentAdminPin = settings.adminPin || '1234';

  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onSaveSettings({
        reasonableLimitHours: Number(limitHours),
        systemNotice: systemNotice.trim(),
        operatingHoursStart: Number(operatingStart),
        operatingHoursEnd: Number(operatingEnd),
        enableLineNotifications: enableLine,
        autoApproveBookings: autoApprove
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Save settings error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinMessage(null);

    if (currentPinInput !== currentAdminPin) {
      setPinMessage({ type: 'error', text: 'รหัส PIN ปัจจุบันไม่ถูกต้อง' });
      return;
    }

    if (!newPin || newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setPinMessage({ type: 'error', text: 'รหัส PIN ใหม่ต้องเป็นตัวเลข 4 หลักเท่านั้น' });
      return;
    }

    if (newPin !== confirmPin) {
      setPinMessage({ type: 'error', text: 'รหัส PIN ใหม่ไม่ตรงกัน' });
      return;
    }

    try {
      await onSaveSettings({ adminPin: newPin });
      setPinMessage({ type: 'success', text: 'เปลี่ยนรหัส PIN ผู้ดูแลระบบสำเร็จแล้ว!' });
      setCurrentPinInput('');
      setNewPin('');
      setConfirmPin('');
    } catch (err) {
      setPinMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการบันทึกรหัส PIN' });
    }
  };

  const handleExportData = () => {
    const exportPayload = {
      exportTimestamp: new Date().toISOString(),
      company: 'BUG SOLUTIONS CO., LTD.',
      fleetCount: cars.length,
      bookingsCount: bookings.length,
      settings: {
        reasonableLimitHours: limitHours,
        systemNotice,
        operatingHoursStart: operatingStart,
        operatingHoursEnd: operatingEnd,
        enableLineNotifications: enableLine
      },
      cars,
      bookings
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `bug_solutions_fleet_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1E3A8A] via-[#1e40af] to-[#0f172a] text-white px-5 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-[#F05A28]">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg flex items-center gap-2">
                <span>ศูนย์ตั้งค่าระบบผู้ดูแลระบบ (Admin Console)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  PRO
                </span>
              </h3>
              <p className="text-xs text-blue-200">ปรับแต่งนโยบายการจอง, การแจ้งเตือน, ความปลอดภัย และฐานข้อมูล</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 sm:px-6 gap-2 sm:gap-4 overflow-x-auto text-xs font-bold text-slate-600">
          <button
            onClick={() => setActiveTab('policy')}
            className={`py-3 px-2 sm:px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'policy' 
                ? 'border-[#1E3A8A] text-[#1E3A8A] font-extrabold' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>นโยบายและเวลาจอง</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`py-3 px-2 sm:px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'notifications' 
                ? 'border-[#1E3A8A] text-[#1E3A8A] font-extrabold' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>แจ้งเตือน LINE</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`py-3 px-2 sm:px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'security' 
                ? 'border-[#1E3A8A] text-[#1E3A8A] font-extrabold' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>รหัสผ่าน PIN</span>
          </button>

          <button
            onClick={() => setActiveTab('database')}
            className={`py-3 px-2 sm:px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'database' 
                ? 'border-[#1E3A8A] text-[#1E3A8A] font-extrabold' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>จัดการคลาวด์ & สำรอง</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 text-slate-700 text-xs sm:text-sm">
          {/* TAB 1: POLICY */}
          {activeTab === 'policy' && (
            <div className="space-y-4">
              <div className="bg-blue-50/60 rounded-xl p-3.5 border border-blue-100 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-[#1E3A8A] shrink-0 mt-0.5" />
                <p className="text-xs text-[#1E3A8A] leading-relaxed">
                  การตั้งค่าในส่วนนี้จะถูกซิงก์ขึ้น Google Cloud Firestore ทันที และมีผลบังคับใช้กับผู้ใช้งานทุกคนแบบเรียลไทม์
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1.5">
                  ⏱️ เกณฑ์ระยะเวลาการจองนานที่ต้องยืนยัน (Long Booking Threshold)
                </label>
                <div className="flex items-center gap-3">
                  <select
                    value={limitHours}
                    onChange={(e) => setLimitHours(Number(e.target.value))}
                    className="w-full sm:w-64 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
                  >
                    <option value={2}>2 ชั่วโมง</option>
                    <option value={3}>3 ชั่วโมง</option>
                    <option value={4}>4 ชั่วโมง (มาตรฐานแนะนำ)</option>
                    <option value={5}>5 ชั่วโมง</option>
                    <option value={6}>6 ชั่วโมง</option>
                    <option value={8}>8 ชั่วโมง</option>
                    <option value={10}>10 ชั่วโมง</option>
                    <option value={12}>12 ชั่วโมง</option>
                  </select>
                  <span className="text-xs text-slate-500">
                    หากจองเกินเวลานี้ ระบบจะแสดงป๊อปอัปให้ผู้ใช้ยืนยันความจำเป็น
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">
                    🌅 เวลาเริ่มเปิดจองของวัน (นาฬิกา)
                  </label>
                  <select
                    value={operatingStart}
                    onChange={(e) => setOperatingStart(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold focus:outline-none"
                  >
                    <option value={6}>06:00 น. (ค่ามาตรฐาน)</option>
                    <option value={7}>07:00 น.</option>
                    <option value={8}>08:00 น.</option>
                    <option value={9}>09:00 น.</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-800 mb-1.5">
                    🌙 เวลาสิ้นสุดบริการของวัน (นาฬิกา)
                  </label>
                  <select
                    value={operatingEnd}
                    onChange={(e) => setOperatingEnd(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold focus:outline-none"
                  >
                    <option value={18}>18:00 น. (ค่ามาตรฐาน)</option>
                    <option value={19}>19:00 น.</option>
                    <option value={20}>20:00 น.</option>
                    <option value={22}>22:00 น.</option>
                    <option value={24}>24:00 น. (ตลอด 24 ชม.)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                  <Megaphone className="w-4 h-4 text-[#F05A28]" />
                  <span>ข้อความประกาศด่วนจากผู้ดูแลระบบ (System Banner Notice)</span>
                </label>
                <textarea
                  rows={3}
                  value={systemNotice}
                  onChange={(e) => setSystemNotice(e.target.value)}
                  placeholder="เช่น กรุณานำรถกลับมาจอดที่ช่องเดิมทุกครั้ง และเสียบสายชาร์จสำหรับรถ EV เสมอ"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  * หากเว้นว่างไว้ ระบบจะไม่แสดงแถบประกาศด้านบน
                </p>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={autoApprove}
                    onChange={(e) => setAutoApprove(e.target.checked)}
                    className="w-4 h-4 rounded text-[#1E3A8A] focus:ring-[#1E3A8A] border-slate-300"
                  />
                  <div>
                    <span className="font-bold text-slate-800 text-xs sm:text-sm">อนุมัติการจองอัตโนมัติ (Instant Booking)</span>
                    <p className="text-[11px] text-slate-500">
                      เมื่อพนักงานส่งคำขอจองสำเร็จ ระบบจะลงคิวในไทม์ไลน์ทันทีโดยไม่ต้องรอแอดมินกดยืนยันทีละรายการ
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: NOTIFICATIONS */}
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shrink-0">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-900 text-xs sm:text-sm">ระบบจำลองสัญญาณ LINE Notify Broadcast</h4>
                    <p className="text-xs text-emerald-700 mt-0.5 leading-relaxed">
                      แจ้งเตือนเมื่อมีการจองใหม่, ส่งมอบกุญแจ, หรือคืนรถ พร้อมประวัติการแจ้งเตือนแบบเรียลไทม์
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onSendTestLineNotification}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>ทดสอบส่งข้อความ</span>
                </button>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableLine}
                    onChange={(e) => setEnableLine(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-600"
                  />
                  <div>
                    <span className="font-bold text-slate-800 text-xs sm:text-sm">เปิดใช้งานระบบส่งสัญญาณแจ้งเตือน</span>
                    <p className="text-[11px] text-slate-500">บันทึกประวัติการแจ้งเตือนลงคลาวด์และแสดงบนไอคอนกระดิ่ง</p>
                  </div>
                </label>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                  <span className="font-bold text-slate-700">เหตุการณ์ที่จะทำการแจ้งเตือน:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>จองรถใหม่สำเร็จ (New Booking)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>ส่งมอบกุญแจรถ (Key Handover)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>ส่งคืนรถยนต์ (Vehicle Returned)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-rose-500" />
                      <span>ยกเลิกการจอง (Booking Cancelled)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SECURITY & PIN */}
          {activeTab === 'security' && (
            <form onSubmit={handleChangePin} className="space-y-4">
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 leading-relaxed">
                  <span className="font-bold">รหัส PIN ปัจจุบัน:</span> ค่าเริ่มต้นของระบบคือ <strong>1234</strong> หรือรหัสที่ท่านได้เคยตั้งไว้บนคลาวด์
                </div>
              </div>

              {pinMessage && (
                <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                  pinMessage.type === 'success' 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-rose-50 border-rose-200 text-rose-700'
                }`}>
                  {pinMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  <span>{pinMessage.text}</span>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">รหัส PIN ปัจจุบัน</label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={currentPinInput}
                    onChange={(e) => setCurrentPinInput(e.target.value)}
                    placeholder="••••"
                    className="w-full sm:w-64 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-center tracking-widest font-bold focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">รหัส PIN ใหม่ (ตัวเลข 4 หลัก)</label>
                    <input
                      type="password"
                      maxLength={4}
                      required
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      placeholder="••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-center tracking-widest font-bold focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">ยืนยันรหัส PIN ใหม่อีกครั้ง</label>
                    <input
                      type="password"
                      maxLength={4}
                      required
                      value={confirmPin}
                      onChange={(e) => setConfirmPin(e.target.value)}
                      placeholder="••••"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-center tracking-widest font-bold focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1E3A8A] hover:bg-[#152a65] text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                >
                  บันทึกรหัส PIN ใหม่
                </button>
              </div>
            </form>
          )}

          {/* TAB 4: DATABASE & CLOUD */}
          {activeTab === 'database' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-400">จำนวนรถยนต์ในระบบ</span>
                  <div className="text-xl font-extrabold text-[#1E3A8A] mt-0.5">{cars.length} คัน</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-400">รายการประวัติการจอง</span>
                  <div className="text-xl font-extrabold text-slate-800 mt-0.5">{bookings.length} รายการ</div>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <h5 className="font-bold text-slate-800 text-xs sm:text-sm">สำรองข้อมูลระบบ (Export Backup JSON)</h5>
                    <p className="text-[11px] text-slate-500">ดาวน์โหลดข้อมูลรถยนต์และการจองทั้งหมดเก็บไว้เป็นไฟล์ JSON</p>
                  </div>
                  <button
                    onClick={handleExportData}
                    className="px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5 text-[#1E3A8A]" />
                    <span>ส่งออก JSON</span>
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-blue-50/50 rounded-xl border border-blue-100">
                  <div>
                    <h5 className="font-bold text-[#1E3A8A] text-xs sm:text-sm">กู้คืนรถยนต์มาตรฐาน (Restore Default Cars)</h5>
                    <p className="text-[11px] text-slate-500">รีเซ็ตรถยนต์ในระบบกลับเป็น 6 คันมาตรฐานของ BUG SOLUTIONS</p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('คุณต้องการรีเซ็ตกองรถยนต์กลับเป็น 6 คันมาตรฐานใช่หรือไม่?')) {
                        onRestoreDefaultCars();
                      }
                    }}
                    className="px-3.5 py-1.5 bg-white border border-blue-200 hover:bg-blue-100 text-[#1E3A8A] rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>กู้คืนรถ 6 คัน</span>
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-rose-50/50 rounded-xl border border-rose-100">
                  <div>
                    <h5 className="font-bold text-rose-700 text-xs sm:text-sm">ล้างประวัติการจองทั้งหมด (Purge Bookings)</h5>
                    <p className="text-[11px] text-slate-500">ลบประวัติการจองและการแจ้งเตือนทั้งหมดทั้งบนคลาวด์และเครื่อง</p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('คำเตือน: การกระทำนี้ไม่สามารถย้อนกลับได้ ต้องการลบประวัติการจองทั้งหมดใช่หรือไม่?')) {
                        onClearAllBookings();
                      }
                    }}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ล้างข้อมูลทั้งหมด</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div>
            {saveSuccess && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" /> บันทึกการตั้งค่าลง Cloud เรียบร้อยแล้ว
              </span>
            )}
          </div>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              ปิดหน้าต่าง
            </button>
            {activeTab === 'policy' && (
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveAll}
                className="px-5 py-2 bg-[#1E3A8A] hover:bg-[#152a65] text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5 text-[#F05A28]" />
                <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
