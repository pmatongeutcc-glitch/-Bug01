import React, { useState } from 'react';
import { LineNotifyMessage } from '../types';
import { Bell, MessageSquare, Send, CheckCircle2, Shield, X, Sparkles, Key, AlertTriangle } from 'lucide-react';

interface LineNotifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: LineNotifyMessage[];
  token: string;
  onSaveToken: (token: string) => void;
  onSendTestNotification: () => void;
}

export const LineNotifyModal: React.FC<LineNotifyModalProps> = ({
  isOpen,
  onClose,
  messages,
  token,
  onSaveToken,
  onSendTestNotification
}) => {
  const [inputToken, setInputToken] = useState(token);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveToken(inputToken);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header with LINE Green / Brand */}
        <div className="bg-[#06C755] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-white">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg">
                ระบบแจ้งเตือนผ่าน LINE Notify อัตโนมัติ
              </h3>
              <p className="text-xs text-green-100">
                แจ้งเตือนทันทีเมื่ออนุมัติการจอง ส่งมอบกุญแจ และคืนรถ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-700 text-xs sm:text-sm">
          {/* Token Configuration Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-[#06C755]" />
                การเชื่อมต่อ LINE Notify Token (กลุ่มงานของบริษัท)
              </h4>
              <button
                type="button"
                onClick={onSendTestNotification}
                className="px-3 py-1 bg-white border border-[#06C755] text-[#06C755] hover:bg-green-50 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors shadow-xs"
              >
                <Send className="w-3 h-3" /> ยิงข้อความทดสอบ
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              นำ Token จาก <code>notify-bot.line.me</code> มาใส่เพื่อให้ระบบส่งการแจ้งเตือนเข้ากลุ่ม LINE พนักงานจริง (หากเว้นว่าง ระบบจะจำลองการส่งในหน้าต่างนี้)
            </p>

            <form onSubmit={handleSave} className="flex gap-2">
              <input
                type="password"
                value={inputToken}
                onChange={(e) => setInputToken(e.target.value)}
                placeholder="กรอก LINE Notify Token เช่น eyJhbGciOi..."
                className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#06C755]"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#06C755] hover:bg-[#05a847] text-white font-semibold rounded-xl text-xs shadow-xs transition-colors shrink-0"
              >
                {savedSuccess ? 'บันทึกแล้ว!' : 'บันทึก Token'}
              </button>
            </form>
          </div>

          {/* Live Notification Feed */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
                <Bell className="w-4 h-4 text-[#F05A28]" />
                ประวัติการแจ้งเตือนแบบเรียลไทม์ (Live Alerts Log)
              </h4>
              <span className="text-[11px] text-slate-400">
                {messages.length} ข้อความล่าสุด
              </span>
            </div>

            <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {messages.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 rounded-xl">
                  ยังไม่มีประวัติการแจ้งเตือน
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-[#06C755] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> LINE Notification
                      </span>
                      <span className="text-slate-400 font-mono">{msg.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-800 leading-relaxed font-normal bg-slate-50/70 p-2 rounded-lg border border-slate-100 whitespace-pre-line">
                      {msg.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Format preview rules */}
          <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3.5 text-xs text-slate-600 space-y-1.5">
            <span className="font-bold text-[#1E3A8A] block">
              💡 ข้อดีของการแจ้งเตือนผ่าน LINE:
            </span>
            <p className="text-[11px] leading-relaxed">
              เมื่อแอดมินส่งมอบกุญแจ ระบบจะส่งข้อความเข้ากลุ่ม LINE แผนกทันที เพื่อให้ทุกคนรับรู้ว่า <b>"คุณ... ได้รับกุญแจรถทะเบียน... ไปใช้งานแล้ว"</b> ป้องกันการสับสนและหมดปัญหาคนอื่นมาแอบเอาไปขับโดยไม่ได้รับอนุญาต
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs shadow-xs"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
