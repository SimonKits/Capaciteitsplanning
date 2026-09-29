export const PROJECT_STORAGE_KEY = 'ruimte-projecten-v1';
const text = value => typeof value === 'string' ? value.trim() : '';

export function createId() {
  return crypto.randomUUID();
}

export function formatHours(value) {
  return new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 2 }).format(Number(value) || 0);
}

export function isValidDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function periodsOverlap(a, b) {
  return a.startDate <= b.endDate && b.startDate <= a.endDate;
}

export function validateProject(project, people, otherProjects = []) {
  if (!text(project.name)) return 'Vul de naam van het project in.';
  if (!text(project.exactCode)) return 'Vul de Exact-code in.';
  if (!text(project.leader)) return 'Vul de projectleider in.';
  if (!text(project.team)) return 'Selecteer een team.';
  if (project.type !== 'project') return 'Dit projecttype is nog niet beschikbaar.';
  const sameCode = otherProjects.some(p => p.id !== project.id && p.team === project.team && p.exactCode.trim().toLocaleLowerCase('nl-NL') === project.exactCode.trim().toLocaleLowerCase('nl-NL'));
  if (sameCode) return 'Er bestaat al een project met deze Exact-code binnen dit team.';
  if (!Array.isArray(project.allocations)) return 'De medewerkersplanning ontbreekt.';
  for (let i = 0; i < project.allocations.length; i++) {
    const allocation = project.allocations[i];
    const employee = people.find(p => String(p.id) === String(allocation.employeeId));
    const prefix = `Planning ${i + 1}: `;
    if (!employee) return `${prefix}selecteer een bestaande medewerker.`;
    if (!isValidDate(allocation.startDate) || !isValidDate(allocation.endDate)) return `${prefix}vul een geldige begin- en einddatum in.`;
    if (allocation.endDate < allocation.startDate) return `${prefix}de einddatum moet op of na de begindatum liggen.`;
    const hours = Number(allocation.hoursPerWeek);
    if (!Number.isFinite(hours) || hours <= 0 || hours > 168 || !Number.isInteger(hours * 4)) return `${prefix}vul uren per week in tussen 0,25 en 168, in stappen van 0,25.`;
    const overlaps = project.allocations.slice(0, i).some(a => String(a.employeeId) === String(allocation.employeeId) && periodsOverlap(a, allocation));
    if (overlaps) return `${prefix}${employee.name} is binnen dit project al ingepland in deze periode. Pas de bestaande periode aan of kies een andere periode.`;
  }
  return '';
}

function hasStoredShape(project) {
  return project && typeof project === 'object' && text(project.id) && project.type === 'project'
    && ['team', 'name', 'exactCode', 'leader'].every(key => text(project[key]))
    && Array.isArray(project.allocations) && project.allocations.every(a => a && text(a.id) && text(a.employeeId)
      && typeof a.employeeName === 'string' && isValidDate(a.startDate) && isValidDate(a.endDate)
      && a.startDate <= a.endDate && typeof a.hoursPerWeek === 'number' && Number.isFinite(a.hoursPerWeek)
      && a.hoursPerWeek > 0 && a.hoursPerWeek <= 168 && Number.isInteger(a.hoursPerWeek * 4));
}

export function readProjects(storage) {
  try {
    const raw = storage.getItem(PROJECT_STORAGE_KEY);
    if (raw === null) return { projects: [], error: '' };
    const saved = JSON.parse(raw);
    if (saved?.version !== 1 || !Array.isArray(saved.projects) || !saved.projects.every(hasStoredShape)) {
      throw new Error('Ongeldige projectgegevens');
    }
    return { projects: saved.projects, error: '' };
  } catch {
    return { projects: [], error: 'De opgeslagen projecten kunnen niet worden gelezen. Je gegevens zijn bewaard; opnieuw opslaan is geblokkeerd. Herlaad de pagina of laat de opslag herstellen.' };
  }
}

export function writeProjects(storage, projects) {
  if (!Array.isArray(projects) || !projects.every(hasStoredShape)) throw new Error('Ongeldige projectgegevens');
  storage.setItem(PROJECT_STORAGE_KEY, JSON.stringify({ version: 1, projects }));
}

// Capacity can join these records to employees by employeeId. Both dates are inclusive.
// Only allocations active on the selected date contribute to hoursPerWeek.
export function getAllocationsForDate(projects, date) {
  if (!isValidDate(date)) throw new Error('Ongeldige capaciteitsdatum');
  return projects.flatMap(project => project.allocations
    .filter(a => a.startDate <= date && date <= a.endDate)
    .map(a => ({ ...a, projectId: project.id, projectName: project.name, exactCode: project.exactCode, team: project.team, type: project.type })));
}
