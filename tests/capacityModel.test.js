import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPeriods, calculateCapacity, countWorkdays, shiftAnchor } from '../src/capacityModel.js';

const person = { id: 7, name: 'Alex', team: 'Team A', contract: 36 };
const week = { startDate: '2026-10-05', endDate: '2026-10-11' };
const allocation = (changes = {}) => ({
  id: 'allocation-1', employeeId: '7', employeeName: 'Alex',
  startDate: '2026-10-05', endDate: '2026-10-11', hoursPerWeek: 4,
  ...changes,
});
const project = (changes = {}) => ({
  id: 'project-1', type: 'project', name: 'Nieuwbouw', exactCode: 'EX-100',
  leader: 'Robin', team: 'Team A', allocations: [allocation()], ...changes,
});
const capacity = (allocations, period = week, employee = person) =>
  calculateCapacity(employee, [project({ allocations })], period);

test('a complete week uses 4 of 36 contract hours', () => {
  const result = capacity([allocation()]);
  assert.equal(result.usedHours, 4);
  assert.equal(result.contractHours, 36);
  assert.equal(result.remainingHours, 32);
  assert.ok(Math.abs(result.percentage - 11.11111111) < 1e-8);
  assert.equal(result.overbooked, false);
  assert.equal(result.breakdown[0].workdays, 5);
});

test('Wednesday through Friday contributes three workdays at one fifth of weekly hours per day', () => {
  const result = capacity([allocation({ startDate: '2026-10-07', endDate: '2026-10-09', hoursPerWeek: 10 })]);
  assert.equal(result.usedHours, 6);
  assert.equal(result.contractHours, 36);
  assert.equal(result.breakdown[0].workdays, 3);
  assert.equal(result.breakdown[0].startDate, '2026-10-07');
  assert.equal(result.breakdown[0].endDate, '2026-10-09');
});

test('projects outside the displayed period and allocations entirely on weekends use no capacity', () => {
  const result = capacity([
    allocation({ id: 'before', startDate: '2026-09-01', endDate: '2026-10-04' }),
    allocation({ id: 'after', startDate: '2026-10-12', endDate: '2026-11-30' }),
    allocation({ id: 'weekend', startDate: '2026-10-10', endDate: '2026-10-11' }),
  ]);
  assert.equal(result.usedHours, 0);
  assert.equal(result.contractHours, 36);
  assert.equal(result.percentage, 0);
  assert.deepEqual(result.breakdown, []);
  assert.equal(countWorkdays('2026-10-10', '2026-10-11'), 0);
});

test('allocation start and end dates are inclusive and clipped to the selected period', () => {
  const result = capacity([
    allocation({ id: 'ends-monday', startDate: '2026-09-28', endDate: '2026-10-05', hoursPerWeek: 5 }),
    allocation({ id: 'starts-friday', startDate: '2026-10-09', endDate: '2026-10-18', hoursPerWeek: 10 }),
  ]);
  assert.equal(result.usedHours, 3);
  assert.deepEqual(result.breakdown.map(item => [item.startDate, item.endDate, item.workdays, item.hours]), [
    ['2026-10-05', '2026-10-05', 1, 1],
    ['2026-10-09', '2026-10-11', 1, 2],
  ]);
  assert.equal(capacity([allocation({ startDate: '2026-10-07', endDate: '2026-10-07', hoursPerWeek: 5 })]).usedHours, 1);
});

test('an employee retains allocations from projects in every team and numeric/string IDs match', () => {
  const records = [
    project({ allocations: [allocation(), allocation({ id: 'other-person', employeeId: '99', hoursPerWeek: 80 })] }),
    project({ id: 'project-2', name: 'Renovatie', exactCode: 'EX-200', team: 'Team B', allocations: [allocation({ id: 'allocation-2', employeeId: 7, hoursPerWeek: 6 })] }),
  ];
  for (const employeeId of [7, '7']) {
    const result = calculateCapacity({ ...person, id: employeeId }, records, week);
    assert.equal(result.usedHours, 10);
    assert.equal(result.breakdown.length, 2);
    assert.deepEqual(result.breakdown.map(item => [item.projectName, item.exactCode, item.projectTeam, item.hours]), [
      ['Nieuwbouw', 'EX-100', 'Team A', 4],
      ['Renovatie', 'EX-200', 'Team B', 6],
    ]);
  }
});

test('successive allocations with changing weekly hours contribute only within their own dates', () => {
  const result = capacity([
    allocation({ id: 'first', endDate: '2026-10-06', hoursPerWeek: 5 }),
    allocation({ id: 'second', startDate: '2026-10-07', hoursPerWeek: 10 }),
  ]);
  assert.equal(result.usedHours, 8);
  assert.deepEqual(result.breakdown.map(item => item.hours), [2, 6]);
});

test('October 2026 has 22 workdays: a 36-hour contract gives 158.4 hours and 4 weekly project hours give 17.6', () => {
  const october = buildPeriods('2026-10-19', 'month', 1)[0];
  assert.equal(october.startDate, '2026-10-01');
  assert.equal(october.endDate, '2026-10-31');
  assert.equal(countWorkdays(october.startDate, october.endDate), 22);
  const result = capacity([allocation({ startDate: '2026-10-01', endDate: '2026-10-31' })], october);
  assert.equal(result.contractHours, 158.4);
  assert.equal(result.usedHours, 17.6);
  assert.equal(result.remainingHours, 140.8);
});

test('allocations crossing months and years split hours across the actual workdays', () => {
  const autumn = [allocation({ startDate: '2026-09-30', endDate: '2026-10-02' })];
  const months = buildPeriods('2026-09-01', 'month', 2);
  assert.deepEqual(months.map(period => capacity(autumn, period).usedHours), [0.8, 1.6]);

  const yearEnd = [allocation({ startDate: '2026-12-28', endDate: '2027-01-01' })];
  const yearMonths = buildPeriods('2026-12-31', 'month', 2);
  assert.deepEqual(yearMonths.map(period => period.startDate), ['2026-12-01', '2027-01-01']);
  // Monday–Thursday fall in December; Friday falls in January. Public holidays are weekdays.
  assert.deepEqual(yearMonths.map(period => capacity(yearEnd, period).usedHours), [3.2, 0.8]);
});

test('calendar weeks run Monday–Sunday and ISO week 53 belongs to 2020 across New Year', () => {
  const periods = buildPeriods('2021-01-01', 'week', 2);
  assert.deepEqual(periods.map(period => [period.startDate, period.endDate, period.label]), [
    ['2020-12-28', '2021-01-03', 'Week 53'],
    ['2021-01-04', '2021-01-10', 'Week 1'],
  ]);
  assert.match(periods[0].sublabel, /2020$/);
  assert.match(periods[1].sublabel, /2021$/);
  assert.equal(shiftAnchor('2021-01-03', 'week', 1), '2021-01-04');
  assert.equal(shiftAnchor('2021-01-03', 'week', -1), '2020-12-21');
});

test('leap February includes February 29 and month navigation never skips a short month', () => {
  const february = buildPeriods('2024-02-29', 'month', 1)[0];
  assert.equal(february.startDate, '2024-02-01');
  assert.equal(february.endDate, '2024-02-29');
  assert.equal(countWorkdays(february.startDate, february.endDate), 21);
  const result = capacity([allocation({ startDate: '2024-02-01', endDate: '2024-02-29' })], february);
  assert.equal(result.contractHours, 151.2);
  assert.equal(result.usedHours, 16.8);
  assert.equal(shiftAnchor('2024-01-31', 'month', 1), '2024-02-01');
  assert.equal(shiftAnchor('2024-03-31', 'month', -1), '2024-02-01');
});

test('daylight saving changes do not remove or duplicate working days', () => {
  // Amsterdam clocks move forward on March 29 and back on October 25, 2026.
  assert.equal(countWorkdays('2026-03-23', '2026-04-03'), 10);
  assert.equal(countWorkdays('2026-10-19', '2026-10-30'), 10);
  for (const anchor of ['2026-03-23', '2026-10-19']) {
    const periods = buildPeriods(anchor, 'week', 2);
    assert.deepEqual(periods.map(period => countWorkdays(period.startDate, period.endDate)), [5, 5]);
  }
});

test('overcapacity preserves the actual hours and percentage above 100', () => {
  const full = capacity([allocation({ hoursPerWeek: 36 })]);
  assert.equal(full.percentage, 100);
  assert.equal(full.overbooked, false);
  const excess = capacity([allocation({ hoursPerWeek: 40 })]);
  assert.equal(excess.usedHours, 40);
  assert.equal(excess.contractHours, 36);
  assert.equal(excess.remainingHours, -4);
  assert.equal(excess.overbooked, true);
  assert.ok(excess.percentage > 111 && excess.percentage < 112);
});

test('zero contract hours preserve booked hours and report no numeric percentage', () => {
  const result = capacity([allocation()], week, { ...person, contract: 0 });
  assert.equal(result.contractHours, 0);
  assert.equal(result.usedHours, 4);
  assert.equal(result.remainingHours, -4);
  assert.equal(result.percentage, null);
  assert.equal(result.overbooked, true);
  const empty = capacity([], week, { ...person, contract: 0 });
  assert.equal(empty.usedHours, 0);
  assert.equal(empty.percentage, null);
  assert.equal(empty.overbooked, false);
});

test('capacity calculations leave employee, project allocations, and period data unchanged', () => {
  const employee = Object.freeze({ ...person });
  const planned = Object.freeze(allocation());
  const records = Object.freeze([Object.freeze(project({ allocations: Object.freeze([planned]) }))]);
  const period = Object.freeze({ ...week });
  const before = JSON.stringify({ employee, records, period });
  const first = calculateCapacity(employee, records, period);
  first.breakdown[0].hours = 99;
  first.breakdown.push({ projectName: 'Unrelated result change' });
  const second = calculateCapacity(employee, records, period);
  assert.equal(second.usedHours, 4);
  assert.equal(second.breakdown[0].hours, 4);
  assert.equal(second.breakdown.length, 1);
  assert.equal(JSON.stringify({ employee, records, period }), before);
});
