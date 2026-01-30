import Holidays from 'date-holidays';

const hd = new Holidays('KR');

export interface HolidayInfo {
  name: string;
  type: string;
}

export function getHoliday(date: Date): HolidayInfo | null {
  const holidays = hd.isHoliday(date);
  if (holidays && holidays.length > 0) {
    return {
      name: holidays[0].name,
      type: holidays[0].type
    };
  }
  return null;
}

export function isHoliday(date: Date): boolean {
  return hd.isHoliday(date) !== false;
}

export function getMonthHolidays(year: number, month: number): Map<number, HolidayInfo> {
  const holidays = new Map<number, HolidayInfo>();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const holiday = getHoliday(date);
    if (holiday) {
      holidays.set(day, holiday);
    }
  }
  
  return holidays;
}
