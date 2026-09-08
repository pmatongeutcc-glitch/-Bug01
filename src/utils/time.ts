export const START_HOUR = 6;
export const END_HOUR = 18;
export const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60; // 720 mins (12 hours)

// Format date to Thai locale
export const formatThaiDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return dateStr;
  
  const thaiMonths = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  
  const thaiYear = year + 543;
  return `${day} ${thaiMonths[month - 1]} ${thaiYear}`;
};

// Format time to 06:00
export const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + (m || 0);
};

// Check if two time ranges overlap on the same date
export const isTimeOverlap = (
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean => {
  const aStart = timeToMinutes(startA);
  const aEnd = timeToMinutes(endA);
  const bStart = timeToMinutes(startB);
  const bEnd = timeToMinutes(endB);
  return aStart < bEnd && aEnd > bStart;
};

// Calculate percentage position on timeline (06:00 - 18:00)
export const calculateTimelinePercent = (timeStr: string): number => {
  const [h, m] = timeStr.split(':').map(Number);
  const totalMins = (h - START_HOUR) * 60 + (m || 0);
  const pct = (totalMins / TOTAL_MINUTES) * 100;
  return Math.min(Math.max(pct, 0), 100);
};

// Generate 4-digit PIN OTP
export const generateOtp = (): string => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};
