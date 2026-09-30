import { isValidDate } from './projectModel.js';

export const HOLIDAY_STORAGE_KEY = 'tuesday-feestdagen-v1';
export const isHoliday = (person, date) => (person.holidays || []).some(holiday => holiday.date === date);
export function validHolidays(holidays) {
  return Array.isArray(holidays) && holidays.every(item => item && typeof item.name === 'string' && item.name.trim() && isValidDate(item.date)) && new Set(holidays.map(item => item.date)).size === holidays.length;
}
export function readHolidays(storage) {
  try {
    const raw = storage.getItem(HOLIDAY_STORAGE_KEY);
    if (raw === null) return { holidays: [], error: '' };
    const saved = JSON.parse(raw);
    if (saved.version !== 1 || !validHolidays(saved.holidays)) throw new Error();
    return { holidays: saved.holidays, error: '' };
  } catch { return { holidays: [], error: 'De feestdagen kunnen niet worden gelezen. De opgeslagen gegevens zijn bewaard. Herstel deze voordat je verder plant.' }; }
}
