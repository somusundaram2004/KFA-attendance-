/**
 * Date utility functions for KFA Academy Attendance (Asia/Kolkata timezone)
 */

export function getTodayISODate(): string {
  const now = new Date();
  // Adjust for local offset if needed or format directly in YYYY-MM-DD
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateDDMMYYYY(dateString: string | null | undefined): string {
  if (!dateString) return '';
  const parts = dateString.split('T')[0].split('-');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateString;
}

export function formatTime12Hour(timeString: string | null | undefined): string {
  if (!timeString) return '';
  const [hoursStr, minutesStr] = timeString.split(':');
  let hours = parseInt(hoursStr, 10);
  const minutes = minutesStr || '00';
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
}

export function getDayOfWeekName(dayNumber: number): string {
  const days = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  return days[dayNumber] || '';
}

export function getShortDayOfWeekName(dayNumber: number): string {
  const days = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days[dayNumber] || '';
}

export function getDayOfWeekFromDate(dateString: string): number {
  const date = new Date(dateString);
  const day = date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  return day === 0 ? 7 : day;
}

export function getFormattedDateHeader(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  const formattedDate = formatDateDDMMYYYY(dateString);
  return `${dayName}, ${formattedDate}`;
}
