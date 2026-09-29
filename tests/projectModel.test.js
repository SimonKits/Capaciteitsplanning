import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PROJECT_STORAGE_KEY,
  getAllocationsForDate,
  isValidDate,
  periodsOverlap,
  readProjects,
  validateProject,
  writeProjects,
} from '../src/projectModel.js';

const people = [{ id: 7, name: 'Alex' }, { id: '8', name: 'Sam' }];
const allocation = (changes = {}) => ({
  id: 'allocation-1',
  employeeId: '7',
  employeeName: 'Alex',
  startDate: '2026-10-01',
  endDate: '2026-10-31',
  hoursPerWeek: 8,
  ...changes,
});
const project = (changes = {}) => ({
  id: 'project-1',
  type: 'project',
  name: 'Nieuwbouw',
  exactCode: 'EX-100',
  leader: 'Robin',
  team: 'Team A',
  allocations: [allocation()],
  ...changes,
});

function memoryStorage(raw = null) {
  const values = new Map(raw === null ? [] : [[PROJECT_STORAGE_KEY, raw]]);
  return {
    values,
    writes: 0,
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { this.writes += 1; values.set(key, value); },
  };
}

test('calendar dates reject impossible dates, partial values and whitespace', () => {
  for (const value of ['2024-02-29', '2026-01-01', '2026-12-31']) {
    assert.equal(isValidDate(value), true, value);
  }
  for (const value of ['2026-02-29', '2026-04-31', '2026-13-01', '2026-00-01', '2026-1-01', '2026-10-01 ', ' 2026-10-01', '', null, undefined, 20261001]) {
    assert.equal(isValidDate(value), false, String(value));
  }
});

test('periods include both endpoints and allow adjacent nonoverlapping dates', () => {
  const period = allocation();
  assert.equal(periodsOverlap(period, allocation({ startDate: '2026-10-31', endDate: '2026-11-04' })), true);
  assert.equal(periodsOverlap(period, allocation({ startDate: '2026-09-28', endDate: '2026-10-01' })), true);
  assert.equal(periodsOverlap(period, allocation({ startDate: '2026-11-01', endDate: '2026-11-04' })), false);
  assert.equal(periodsOverlap(period, allocation({ startDate: '2026-09-01', endDate: '2026-09-30' })), false);
  assert.equal(validateProject(project({ allocations: [allocation({ endDate: '2026-10-01' })] }), people), '');
});

test('one employee can have separate periods with different weekly hours', () => {
  const planned = project({ allocations: [
    allocation(),
    allocation({ id: 'allocation-2', employeeId: 7, startDate: '2026-11-01', endDate: '2026-11-30', hoursPerWeek: 12 }),
  ] });
  assert.equal(validateProject(planned, people), '');
  planned.allocations[1].startDate = '2026-10-31';
  assert.match(validateProject(planned, people), /al ingepland/);
});

test('different employees may overlap and numeric and string IDs match employees', () => {
  assert.equal(validateProject(project({ allocations: [allocation({ employeeId: '7' }), allocation({ id: 'allocation-2', employeeId: 8 })] }), people), '');
  assert.equal(validateProject(project({ allocations: [allocation({ employeeId: 7 })] }), [{ id: '7', name: 'Alex' }]), '');
  assert.match(validateProject(project({ allocations: [allocation({ employeeId: 'missing' })] }), people), /bestaande medewerker/);
});

test('project details are required and whitespace-only values are rejected', () => {
  for (const field of ['name', 'exactCode', 'leader', 'team']) {
    assert.notEqual(validateProject(project({ [field]: ' \t ' }), people), '', field);
  }
  assert.equal(validateProject(project({ name: ' Nieuwbouw ', exactCode: ' EX-100 ', leader: ' Robin ', allocations: [] }), people), '');
  assert.match(validateProject(project({ type: 'sustainability' }), people), /nog niet beschikbaar/);
});

test('allocation dates must be real and the end cannot precede the start', () => {
  assert.match(validateProject(project({ allocations: [allocation({ startDate: '2026-02-30' })] }), people), /geldige begin- en einddatum/);
  assert.match(validateProject(project({ allocations: [allocation({ endDate: '2026-10-31 ' })] }), people), /geldige begin- en einddatum/);
  assert.match(validateProject(project({ allocations: [allocation({ endDate: '2026-09-30' })] }), people), /op of na/);
});

test('weekly hours require finite positive quarter-hour steps within a week', () => {
  for (const hoursPerWeek of [0, -1, NaN, Infinity, -Infinity, '', '   ', 'abc', 0.1, 8.3, 168.25]) {
    assert.match(validateProject(project({ allocations: [allocation({ hoursPerWeek })] }), people), /stappen van 0,25/, String(hoursPerWeek));
  }
  for (const hoursPerWeek of [0.25, 0.5, 8.75, 168, '12.25']) {
    assert.equal(validateProject(project({ allocations: [allocation({ hoursPerWeek })] }), people), '', String(hoursPerWeek));
  }
});

test('Exact codes are unique per team, ignoring code case and surrounding whitespace', () => {
  const existing = project();
  assert.match(validateProject(project({ id: 'project-2', exactCode: ' ex-100 ' }), people, [existing]), /al een project/);
  assert.equal(validateProject(project({ id: 'project-2', exactCode: ' ex-100 ', team: 'Team B' }), people, [existing]), '');
  assert.equal(validateProject(project({ name: 'Aangepaste naam' }), people, [existing]), '');
});

test('projects persist and reload with separate allocation periods intact', () => {
  const storage = memoryStorage();
  assert.deepEqual(readProjects(storage), { projects: [], error: '' });
  const records = [project({ allocations: [allocation(), allocation({ id: 'allocation-2', startDate: '2026-11-01', endDate: '2026-11-30', hoursPerWeek: 12.5 })] })];
  writeProjects(storage, records);
  assert.deepEqual(JSON.parse(storage.getItem(PROJECT_STORAGE_KEY)), { version: 1, projects: records });
  assert.deepEqual(readProjects(storage), { projects: records, error: '' });
});

test('corrupt or future storage is reported without changing its original contents', () => {
  const brokenRecords = [
    '{broken json',
    JSON.stringify({ version: 2, projects: [project()] }),
    JSON.stringify({ version: 1, projects: [project({ allocations: [allocation({ endDate: '2026-02-30' })] })] }),
    JSON.stringify({ version: 1, projects: [project({ allocations: [allocation({ hoursPerWeek: 0 })] })] }),
    JSON.stringify({ version: 1, projects: {} }),
  ];
  for (const raw of brokenRecords) {
    const storage = memoryStorage(raw);
    const result = readProjects(storage);
    assert.deepEqual(result.projects, []);
    assert.match(result.error, /opnieuw opslaan is geblokkeerd/);
    assert.equal(storage.getItem(PROJECT_STORAGE_KEY), raw);
    assert.equal(storage.writes, 0);
  }
});

test('storage read and write failures surface without destroying existing data', () => {
  const original = JSON.stringify({ version: 1, projects: [project()] });
  const readBlocked = memoryStorage(original);
  readBlocked.getItem = () => { throw new Error('Storage access denied'); };
  assert.notEqual(readProjects(readBlocked).error, '');
  assert.equal(readBlocked.values.get(PROJECT_STORAGE_KEY), original);
  assert.equal(readBlocked.writes, 0);

  const writeBlocked = memoryStorage(original);
  writeBlocked.setItem = () => { throw new Error('Quota exceeded'); };
  assert.throws(() => writeProjects(writeBlocked, []), /Quota exceeded/);
  assert.equal(writeBlocked.getItem(PROJECT_STORAGE_KEY), original);

  const storage = memoryStorage(original);
  assert.throws(() => writeProjects(storage, [project({ allocations: [allocation({ hoursPerWeek: NaN })] })]), /Ongeldige projectgegevens/);
  assert.equal(storage.getItem(PROJECT_STORAGE_KEY), original);
  assert.equal(storage.writes, 0);
});

test('capacity selects inclusive active periods with complete project and employee identity', () => {
  const records = [project({ allocations: [
    allocation(),
    allocation({ id: 'allocation-2', startDate: '2026-11-01', endDate: '2026-11-30', hoursPerWeek: 12 }),
  ] })];
  for (const date of ['2026-10-01', '2026-10-31']) {
    const active = getAllocationsForDate(records, date);
    assert.equal(active.length, 1);
    assert.equal(active[0].id, 'allocation-1');
    assert.equal(active[0].hoursPerWeek, 8);
    assert.equal(active[0].employeeId, '7');
    assert.equal(active[0].projectId, 'project-1');
    assert.equal(active[0].projectName, 'Nieuwbouw');
    assert.equal(active[0].exactCode, 'EX-100');
    assert.equal(active[0].team, 'Team A');
    assert.equal(active[0].type, 'project');
  }
  for (const date of ['2026-11-01', '2026-11-30']) {
    const active = getAllocationsForDate(records, date);
    assert.equal(active.length, 1);
    assert.equal(active[0].id, 'allocation-2');
    assert.equal(active[0].hoursPerWeek, 12);
  }
  assert.deepEqual(getAllocationsForDate(records, '2026-09-30'), []);
  assert.deepEqual(getAllocationsForDate(records, '2026-12-01'), []);
  assert.throws(() => getAllocationsForDate(records, '2026-02-30'), /Ongeldige capaciteitsdatum/);
  assert.deepEqual(records[0].allocations[0], allocation());
});
