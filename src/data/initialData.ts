import { Car, Booking, UserAccount, LineNotifyMessage } from '../types';

export const INITIAL_CARS: Car[] = [
  {
    id: "A01",
    vehicleId: "A01",
    plate: "1กถ9995",
    brand: "BYD Atto 3",
    color: "เขียว",
    fuelType: "ไฟฟ้า 100% (EV)",
    mileage: 18450,
    status: 'available',
    seats: 5,
    notes: "ชาร์จไฟเต็ม 100% ประจำช่องจอด E-01"
  },
  {
    id: "A06",
    vehicleId: "A06",
    plate: "6ขศ4876",
    brand: "NETA V",
    color: "เทา",
    fuelType: "ไฟฟ้า 100% (EV)",
    mileage: 24320,
    status: 'available',
    seats: 5,
    notes: "ชาร์จไฟ 85% ประจำช่องจอด E-02"
  },
  {
    id: "A07",
    vehicleId: "A07",
    plate: "7ขฆ2965",
    brand: "Changan Deepal SL03",
    color: "ขาว",
    fuelType: "ไฟฟ้า 100% (EV)",
    mileage: 9150,
    status: 'available',
    seats: 5,
    notes: "ชาร์จไฟเต็ม 95% ประจำช่องจอด E-03 (รถผู้บริหาร/VIP)"
  },
  {
    id: "055",
    vehicleId: "055",
    plate: "6กข9070",
    brand: "SUZUKI CIAZ",
    color: "ดำ",
    fuelType: "เบนซิน",
    mileage: 65200,
    status: 'available',
    seats: 5,
    notes: "น้ำมันเต็มถัง ประจำช่องจอด G-04 (มีบัตร Fleet Card ในรถ)"
  },
  {
    id: "056",
    vehicleId: "056",
    plate: "5กฮ6260",
    brand: "SUZUKI CIAZ",
    color: "ขาว",
    fuelType: "เบนซิน",
    mileage: 48900,
    status: 'available',
    seats: 5,
    notes: "น้ำมัน 3/4 ถัง ประจำช่องจอด G-05"
  }
];

export const INITIAL_USERS: UserAccount[] = [];

// Helper to get today's ISO date (YYYY-MM-DD)
export const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const generateSampleBookings = (): Booking[] => {
  return [];
};

export const INITIAL_LINE_MESSAGES: LineNotifyMessage[] = [];

