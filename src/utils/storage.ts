import { Car, Booking, AppNotification, LineNotifyMessage, UserAccount } from '../types';
import { INITIAL_CARS, INITIAL_USERS, generateSampleBookings, INITIAL_LINE_MESSAGES } from '../data/initialData';

const STORAGE_KEYS = {
  CARS: 'corp_fleet_cars_v2',
  BOOKINGS: 'corp_fleet_bookings_v2',
  NOTIFICATIONS: 'corp_fleet_notifications_v2',
  CURRENT_USER: 'corp_fleet_user_v2',
  LINE_TOKEN: 'corp_fleet_line_token_v2',
  LINE_MESSAGES: 'corp_fleet_line_msgs_v2',
};

export const getStoredCars = (): Car[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CARS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load cars from storage', e);
  }
  return INITIAL_CARS;
};

export const saveStoredCars = (cars: Car[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.CARS, JSON.stringify(cars));
  } catch (e) {
    console.error('Failed to save cars', e);
  }
};

export const getStoredBookings = (): Booking[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load bookings from storage', e);
  }
  return generateSampleBookings();
};

export const saveStoredBookings = (bookings: Booking[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
  } catch (e) {
    console.error('Failed to save bookings', e);
  }
};

export const getStoredUser = (): UserAccount => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load user from storage', e);
  }
  return {
    id: "usr-default",
    employeeId: "EMP-001",
    name: "พนักงาน",
    email: "employee@company.com",
    role: "employee",
    department: "ทั่วไป"
  };
};

export const saveStoredUser = (user: UserAccount) => {
  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } catch (e) {
    console.error('Failed to save user', e);
  }
};

export const getStoredLineMessages = (): LineNotifyMessage[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LINE_MESSAGES);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load line messages', e);
  }
  return INITIAL_LINE_MESSAGES;
};

export const saveStoredLineMessages = (msgs: LineNotifyMessage[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.LINE_MESSAGES, JSON.stringify(msgs));
  } catch (e) {
    console.error('Failed to save line messages', e);
  }
};

export const getStoredLineToken = (): string => {
  try {
    return localStorage.getItem(STORAGE_KEYS.LINE_TOKEN) || '';
  } catch (e) {
    return '';
  }
};

export const saveStoredLineToken = (token: string) => {
  try {
    localStorage.setItem(STORAGE_KEYS.LINE_TOKEN, token);
  } catch (e) {
    console.error('Failed to save line token', e);
  }
};

// Export bookings to CSV file for audits
export const exportBookingsToCSV = (bookings: Booking[], cars: Car[]) => {
  const headers = [
    'รหัสการจอง',
    'วันที่',
    'เวลาเริ่ม',
    'เวลากลับ',
    'รหัสรถ',
    'ทะเบียนรถ',
    'ยี่ห้อ/รุ่น',
    'ผู้ขอจอง',
    'แผนก',
    'เบอร์ติดต่อ',
    'จุดประสงค์',
    'จุดหมายปลายทาง',
    'สถานะ',
    'รหัส OTP รับกุญแจ',
    'ผู้อนุมัติ',
    'เลขไมล์ออก',
    'เลขไมล์เข้า'
  ];

  const rows = bookings.map(b => {
    const car = cars.find(c => c.id === b.carId);
    return [
      b.id,
      b.date,
      b.startTime,
      b.endTime,
      car ? car.vehicleId : b.carId,
      car ? car.plate : '',
      car ? car.brand : '',
      `"${(b.bookerName || '').replace(/"/g, '""')}"`,
      `"${(b.department || '').replace(/"/g, '""')}"`,
      b.phoneNumber || '',
      `"${(b.purpose || '').replace(/"/g, '""')}"`,
      `"${(b.destination || '').replace(/"/g, '""')}"`,
      b.status,
      b.otpCode || '',
      `"${(b.approvedBy || '').replace(/"/g, '""')}"`,
      b.handoverMileage || '',
      b.returnMileage || ''
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `corporate_fleet_bookings_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
