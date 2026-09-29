import { isValidDate } from './projectModel.js';

export const workdayIds = ['ma', 'di', 'wo', 'do', 'vr'];
export const weeklyHours = person => workdayIds.reduce((total, day) => total + (Number(person.days?.[day]) || 0), 0);
export const normalizePerson = person => ({ ...person, contract: weeklyHours(person), days: Object.fromEntries(workdayIds.map(day => [day, Number(person.days?.[day]) || 0])), leave: person.leave || [] });
export const isOnLeave = (person, date) => (person.leave || []).some(period => isValidDate(period.startDate) && isValidDate(period.endDate) && period.startDate <= date && date <= period.endDate);
export function validateLeave(periods) {
  return periods.every(period => isValidDate(period.startDate) && isValidDate(period.endDate) && period.startDate <= period.endDate);
}
