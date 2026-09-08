import React, { useState, useEffect } from 'react';
import { UserAccount, AppNotification } from '../types';
import { INITIAL_USERS } from '../data/initialData';
import { 
  Car, ShieldCheck, Bell, MessageSquare, Plus, User, 
  Wifi, WifiOff, CheckCircle2, ChevronDown, Lock, Crown, Briefcase, Calendar
} from 'lucide-react';

interface NavbarProps {
  currentUser: UserAccount;
  onSwitchUser: (user: UserAccount) => void;
  activeTab: 'timeline' | 'fleet' | 'my-bookings' | 'dashboard';
  setActiveTab: (tab: 'timeline' | 'fleet' | 'my-bookings' | 'dashboard') => void;
  onOpenBookingModal: () => void;
  onOpenSopModal: () => void;
  onOpenLineModal: () => void;
  notifications: AppNotification[];
  onMarkNotificationsRead: () => void;
  lineMessageCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onSwitchUser,
  activeTab,
  setActiveTab,
  onOpenBookingModal,
  onOpenSopModal,
  onOpenLineModal,
  notifications,
  onMarkNotificationsRead,
  lineMessageCount
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center gap-2">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#1E3A8A] to-[#2563EB] flex items-center justify-center text-white shadow-xs">
                <Car className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-[#1E3A8A] tracking-tight text-base sm:text-lg">
                    BUG
                  </span>
                  <span className="font-extrabold text-[#F05A28] tracking-tight text-base sm:text-lg">
                    SOLUTIONS
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase -mt-1 hidden sm:block">
                  Vehicle Booking System
                </div>
              </div>
            </div>

            {/* SOP Key Custody Guide button */}
            <button
              onClick={onOpenSopModal}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1E3A8A] text-xs font-semibold border border-blue-100 transition-colors ml-2"
              title="ดูแนวทางแก้ไขปัญหาคนอื่นแอบเอารถไปขับ"
            >
              <ShieldCheck className="w-4 h-4 text-[#F05A28]" />
              <span>SOP ควบคุมกุญแจ</span>
            </button>
          </div>

          {/* Center Navigation Tabs (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'timeline'
                  ? 'bg-white text-[#1E3A8A] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ตาราง Timeline (06:00 - 18:00)
            </button>
            <button
              onClick={() => setActiveTab('fleet')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'fleet'
                  ? 'bg-white text-[#1E3A8A] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              สถานะรถยนต์ & กุญแจ
            </button>
            <button
              onClick={() => setActiveTab('my-bookings')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'my-bookings'
                  ? 'bg-white text-[#1E3A8A] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              บัตรจองของฉัน (OTP)
            </button>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-white text-[#1E3A8A] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              แดชบอร์ดสรุปผล
            </button>
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Online/Offline Status Indicator */}
            <div
              className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                isOnline
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
              title={isOnline ? 'เชื่อมต่อออนไลน์พร้อมบันทึกข้อมูล' : 'กำลังใช้งานโหมดออฟไลน์ (Offline Mode)'}
            >
              {isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="hidden sm:inline">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-amber-500" />
                  <span>Offline</span>
                </>
              )}
            </div>

            {/* LINE Notify Button */}
            <button
              onClick={onOpenLineModal}
              className="relative p-2 text-slate-600 hover:text-[#06C755] hover:bg-slate-100 rounded-xl transition-colors"
              title="การแจ้งเตือน LINE Notify"
            >
              <MessageSquare className="w-5 h-5" />
              {lineMessageCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#06C755] rounded-full ring-2 ring-white"></span>
              )}
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotificationMenu(!showNotificationMenu);
                  if (!showNotificationMenu && unreadCount > 0) {
                    onMarkNotificationsRead();
                  }
                }}
                className="relative p-2 text-slate-600 hover:text-[#1E3A8A] hover:bg-slate-100 rounded-xl transition-colors"
                title="การแจ้งเตือนในระบบ"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#F05A28] text-white text-[9px] font-extrabold flex items-center justify-center rounded-full ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification dropdown */}
              {showNotificationMenu && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in duration-100">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 px-1">
                    <span className="font-bold text-xs text-slate-800">การแจ้งเตือนทั้งหมด</span>
                    <button
                      onClick={onMarkNotificationsRead}
                      className="text-[11px] text-[#1E3A8A] hover:underline"
                    >
                      ทำเครื่องหมายอ่านแล้ว
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 mt-2">
                    {notifications.length === 0 ? (
                      <div className="text-center py-6 text-slate-400 text-xs">
                        ไม่มีการแจ้งเตือนใหม่
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className="py-2.5 px-2 hover:bg-slate-50 rounded-lg transition-colors text-xs">
                          <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            {n.title}
                          </div>
                          <p className="text-slate-600 text-[11px] mt-0.5">{n.message}</p>
                          <span className="text-[10px] text-slate-400 mt-1 block">{n.timestamp}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Book Button */}
            <button
              onClick={onOpenBookingModal}
              className="hidden sm:flex items-center gap-1.5 bg-[#F05A28] hover:bg-[#d94a1d] text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-xs hover:shadow transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>จองรถด่วน</span>
            </button>

            {/* User Account / Role Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-[#1E3A8A] text-white flex items-center justify-center font-bold text-xs">
                  {currentUser.name.slice(0, 1)}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <span>{currentUser.name}</span>
                    {currentUser.role === 'admin' ? (
                      <Crown className="w-3 h-3 text-amber-500" />
                    ) : currentUser.role === 'manager' ? (
                      <Briefcase className="w-3 h-3 text-purple-600" />
                    ) : null}
                  </div>
                  <div className="text-[10px] text-slate-500 -mt-0.5">
                    {currentUser.role === 'admin' ? 'แอดมินดูแลรถ' : currentUser.role === 'manager' ? 'ผู้บริหาร' : 'พนักงาน'}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Switcher Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in duration-100">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      สลับบัญชีทดสอบระบบ (RBAC)
                    </span>
                    <span className="text-[10px] text-slate-500">
                      คลิกเพื่อเปลี่ยนสิทธิ์พนักงาน / แอดมินผู้ถือกุญแจ
                    </span>
                  </div>

                  <div className="space-y-1">
                    {INITIAL_USERS.map((user) => {
                      const isSelected = user.id === currentUser.id;
                      return (
                        <button
                          key={user.id}
                          onClick={() => {
                            onSwitchUser(user);
                            setShowUserMenu(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center justify-between ${
                            isSelected
                              ? 'bg-blue-50 border border-blue-200 text-[#1E3A8A] font-semibold'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                              user.role === 'admin'
                                ? 'bg-amber-100 text-amber-800'
                                : user.role === 'manager'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}>
                              {user.name.slice(0, 1)}
                            </div>
                            <div>
                              <div className="font-bold">{user.name}</div>
                              <div className="text-[10px] text-slate-500 truncate max-w-[160px]">{user.department}</div>
                            </div>
                          </div>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {user.role}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar for easy one-thumb control */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 py-2 px-4 flex justify-around items-center z-40 shadow-lg">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex flex-col items-center gap-1 text-[11px] ${
            activeTab === 'timeline' ? 'text-[#1E3A8A] font-bold' : 'text-slate-500'
          }`}
        >
          <Calendar className="w-5 h-5" />
          <span>Timeline</span>
        </button>
        <button
          onClick={() => setActiveTab('fleet')}
          className={`flex flex-col items-center gap-1 text-[11px] ${
            activeTab === 'fleet' ? 'text-[#1E3A8A] font-bold' : 'text-slate-500'
          }`}
        >
          <Car className="w-5 h-5" />
          <span>กองรถ</span>
        </button>
        <button
          onClick={onOpenBookingModal}
          className="w-10 h-10 rounded-full bg-[#F05A28] text-white flex items-center justify-center shadow-md -mt-5"
          title="จองรถด่วน"
        >
          <Plus className="w-6 h-6" />
        </button>
        <button
          onClick={() => setActiveTab('my-bookings')}
          className={`flex flex-col items-center gap-1 text-[11px] ${
            activeTab === 'my-bookings' ? 'text-[#1E3A8A] font-bold' : 'text-slate-500'
          }`}
        >
          <ShieldCheck className="w-5 h-5" />
          <span>บัตร OTP</span>
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 text-[11px] ${
            activeTab === 'dashboard' ? 'text-[#1E3A8A] font-bold' : 'text-slate-500'
          }`}
        >
          <Crown className="w-5 h-5" />
          <span>รายงาน</span>
        </button>
      </div>
    </header>
  );
};
