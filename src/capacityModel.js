import { isValidDate } from './projectModel.js';
import { isOnLeave, workdayIds } from './employeeModel.js';

const DAY = 86400000;
const dateOf = value => {
  if (!isValidDate(value)) throw new Error('Kies een geldige datum.');
  return new Date(`${value}T00:00:00Z`);
};
const iso = date => date.toISOString().slice(0, 10);
const addDays = (date, amount) => new Date(date.getTime() + amount * DAY);
const round = value => Math.round((value + Number.EPSILON) * 1e8) / 1e8;
const dateFormat = new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', timeZone: 'UTC' });

export function localToday() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function periodStart(value, mode) {
  const date = dateOf(value);
  if (mode === 'week') return addDays(date, -((date.getUTCDay() + 6) % 7));
  if (mode === 'month') { date.setUTCDate(1); return date; }
  throw new Error('Kies week of maand.');
}

export function shiftAnchor(value, mode, amount) {
  if (!Number.isInteger(amount)) throw new Error('Ongeldig aantal periodes.');
  const date = periodStart(value, mode);
  if (mode === 'week') return iso(addDays(date, 7 * amount));
  date.setUTCMonth(date.getUTCMonth() + amount);
  return iso(date);
}

function isoWeek(date) {
  const thursday = addDays(date, 3 - ((date.getUTCDay() + 6) % 7));
  const year = thursday.getUTCFullYear();
  const first = new Date(thursday);
  first.setUTCMonth(0, 1);
  return { year, number: Math.ceil(((thursday - first) / DAY + 1) / 7) };
}

export function buildPeriods(anchor, mode, count) {
  if (!Number.isInteger(count) || count < 1 || count > 120) throw new Error('Ongeldig aantal periodes.');
  return Array.from({ length: count }, (_, index) => {
    const start = dateOf(shiftAnchor(anchor, mode, index));
    const next = dateOf(shiftAnchor(iso(start), mode, 1));
    const end = addDays(next, -1);
    const week = isoWeek(start);
    return {
      key: `${mode}-${iso(start)}`,
      startDate: iso(start), endDate: iso(end),
      label: mode === 'week' ? `Week ${week.number}` : new Intl.DateTimeFormat('nl-NL', { month: 'long', timeZone: 'UTC' }).format(start),
      sublabel: mode === 'week' ? `${dateFormat.format(start)} – ${dateFormat.format(end)} · ${week.year}` : String(start.getUTCFullYear()),
    };
  });
}

// Calendar weekdays, Monday through Friday, inclusive. UTC avoids DST rounding.
export function countWorkdays(startDate, endDate) {
  const start = dateOf(startDate);
  const end = dateOf(endDate);
  const days = Math.floor((end - start) / DAY) + 1;
  if (days <= 0) return 0;
  let count = Math.floor(days / 7) * 5;
  for (let i = 0; i < days % 7; i++) {
    const weekday = (start.getUTCDay() + i) % 7;
    if (weekday !== 0 && weekday !== 6) count++;
  }
  return count;
}

export function calculateCapacity(person, projects, period) {
  const availableDays = [];
  let availableHours = 0;
  let leaveDays = 0;
  let leaveHours = 0;
  for (let day = dateOf(period.startDate); day <= dateOf(period.endDate); day = addDays(day, 1)) {
    const weekday = (day.getUTCDay() + 6) % 7;
    if (weekday > 4) continue;
    const date = iso(day);
    const hours = person.days ? Number(person.days[workdayIds[weekday]]) || 0 : Math.max(0, Number(person.contract) || 0) / 5;
    if (isOnLeave(person, date)) { leaveDays++; leaveHours += hours; }
    else { availableDays.push(date); availableHours += hours; }
  }
  const contractHours = round(availableHours);
  const breakdown = [];
  for (const project of projects) {
    for (const allocation of project.allocations) {
      if (String(allocation.employeeId) !== String(person.id)) continue;
      const startDate = allocation.startDate > period.startDate ? allocation.startDate : period.startDate;
      const endDate = allocation.endDate < period.endDate ? allocation.endDate : period.endDate;
      if (startDate > endDate) continue;
      const workdays = availableDays.filter(date => startDate <= date && date <= endDate).length;
      if (!workdays) continue;
      const hours = Number(allocation.hoursPerWeek) * workdays / 5;
      breakdown.push({
        projectId: project.id, projectName: project.name, exactCode: project.exactCode, projectTeam: project.team,
        allocationId: allocation.id, startDate, endDate, workdays,
        hoursPerWeek: Number(allocation.hoursPerWeek), hours: round(hours),
      });
    }
  }
  const usedHours = round(breakdown.reduce((total, item) => total + item.hours, 0));
  return {
    usedHours, contractHours, leaveDays, leaveHours: round(leaveHours),
    percentage: contractHours > 0 ? round(100 * usedHours / contractHours) : null,
    remainingHours: round(contractHours - usedHours),
    overbooked: usedHours - contractHours > 1e-7,
    breakdown,
  };
}
