export type FuelType = 'ไฟฟ้า 100% (EV)' | 'เบนซิน' | 'ดีเซล' | 'ไฮบริด (HEV/PHEV)';

export type BookingStatus = 'pending' | 'approved' | 'in_use' | 'completed' | 'cancelled' | 'rejected';

export type UserRole = 'employee' | 'admin' | 'manager';

export interface Car {
  id: string;
  vehicleId: string;
  plate: string;
  brand: string;
  color: string;
  fuelType: FuelType;
  mileage?: number;
  status?: 'available' | 'in_use' | 'maintenance';
  seats?: number;
  imagePlaceholder?: string;
  notes?: string;
}

export interface Booking {
  id: string;
  carId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  bookerName: string;
  bookerId?: string;
  department: string;
  phoneNumber: string;
  purpose: string;
  destination: string;
  passengers?: number;
  status: BookingStatus;
  otpCode?: string;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  handoverMileage?: number;
  handoverFuelLevel?: string;
  handoverTime?: string;
  handoverBy?: string;
  returnMileage?: number;
  returnFuelLevel?: string;
  returnTime?: string;
  returnNotes?: string;
  cancellationReason?: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  avatarUrl?: string;
  employeeId: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  bookingId?: string;
}

export interface LineNotifyMessage {
  id: string;
  timestamp: string;
  event: 'booking_created' | 'booking_approved' | 'key_handover' | 'car_returned' | 'booking_cancelled';
  message: string;
  status: 'sent' | 'simulated' | 'failed';
}

export interface FleetSettings {
  reasonableLimitHours?: number;
  adminPin?: string;
  autoApproveBookings?: boolean;
  enableLineNotifications?: boolean;
  operatingHoursStart?: number; // default 6
  operatingHoursEnd?: number; // default 18
  systemNotice?: string;
}
