import { isHoliday } from './holidayModel.js';
import { isValidDate } from './projectModel.js';
import { isOnLeave, workdayIds } from './employeeModel.js';

const DAY = 86400000;
const iso = date => date.toISOString().slice(0, 10);
const rounded = value => Math.round(value * 1e8) / 1e8;
const todayDate = () => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; };
export function scheduledHours(person, date) {
  if (isHoliday(person, date)) return 0;
  const day = (new Date(`${date}T00:00:00Z`).getUTCDay() + 6) % 7;
  return day < 5 ? Math.max(0, Number(person.days?.[workdayIds[day]] ?? (person.days ? 0 : Number(person.contract) / 5)) || 0) : 0;
}
export function periodLeaveHours(person, start, end) {
  if (!isValidDate(start) || !isValidDate(end) || start > end) return 0;
  let hours = 0;
  const last = new Date(`${end}T00:00:00Z`);
  for (let day = new Date(`${start}T00:00:00Z`); day <= last; day = new Date(+day + DAY)) hours += scheduledHours(person, iso(day));
  return rounded(hours);
}

const cache = new WeakMap();
export function annualLeave(person, year, today = todayDate()) {
  let entries = cache.get(person);
  if (!entries) { entries = new Map(); cache.set(person, entries); }
  const key = `${year}:${today}`;
  if (entries.has(key)) return entries.get(key);
  const settings = person.leaveBudget || {};
  const budget = Math.max(0, Number(settings.years?.[year]) || 0);
  const dates = [];
  let planned = 0;
  for (let day = new Date(`${year}-01-01T00:00:00Z`); day.getUTCFullYear() === Number(year); day = new Date(+day + DAY)) {
    const date = iso(day), hours = scheduledHours(person, date);
    if (isOnLeave(person, date)) planned += hours;
    else if (hours > 0 && date >= today) dates.push({ date, hours });
  }
  let remaining = Math.max(0, rounded(budget - planned));
  const concept = new Map();
  if (settings.autoConcept !== false) for (const day of dates.reverse()) {
    if (remaining <= 0) break;
    const hours = Math.min(day.hours, remaining);
    concept.set(day.date, hours);
    remaining = rounded(remaining - hours);
  }
  const conceptHours = rounded([...concept.values()].reduce((sum, hours) => sum + hours, 0));
  const result = { budget, planned: rounded(planned), balance: rounded(budget - planned), concept, conceptHours, unallocated: rounded(Math.max(0, budget - planned - conceptHours)) };
  entries.set(key, result);
  return result;
}

export function leaveOnDate(person, date) {
  if (isHoliday(person, date)) return { hours: 0, fraction: 0, conceptHours: 0 };
  const hours = scheduledHours(person, date);
  if (isOnLeave(person, date)) return { hours, fraction: 1, conceptHours: 0 };
  const conceptHours = annualLeave(person, Number(date.slice(0, 4))).concept.get(date) || 0;
  return { hours: conceptHours, fraction: hours > 0 ? conceptHours / hours : 0, conceptHours };
}

export function validateLeaveBudget(budget) {
  if (!budget) return true;
  const validHours = value => value === '' || (Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 10000 && Number.isInteger(Number(value) * 4));
  return Object.entries(budget.years || {}).every(([year, hours]) => /^\d{4}$/.test(year) && Number(year) >= 1900 && Number(year) <= 9998 && validHours(hours));
}
