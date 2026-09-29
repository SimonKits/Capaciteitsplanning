import { createId, isValidDate } from './projectModel.js';

export const ROLES = ['Projectleider', 'Projectleider Participatie', 'Planontwikkelaar', 'Programmamanager'];
export const PHASES = ['EAR', 'PP', 'RP', 'DE'];
export function shiftDate(value, days) {
  if (!isValidDate(value)) return '';
  const date = new Date(`${value}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  const result = date.toISOString().slice(0, 10);
  return isValidDate(result) ? result : '';
}
export function newSustainability(team) {
  return { id: createId(), type: 'sustainability', team, name: '', exactCode: '', leader: '', leaderId: '', members: [], allocations: [], phases: PHASES.map((code, index) => ({ code, weeks: 4, startDate: '', linked: index > 0, roleHours: Object.fromEntries(ROLES.map(role => [role, 0])), extras: [], overrides: {} })) };
}
export function resolvePhases(phases) {
  const resolved = [];
  for (const phase of phases) {
    const previous = resolved.at(-1);
    const startDate = previous && phase.linked ? shiftDate(previous.endDate, 1) : phase.startDate;
    const weeks = Number(phase.weeks);
    const endDate = Number.isInteger(weeks) && weeks > 0 && weeks <= 520 ? shiftDate(startDate, weeks * 7 - 1) : '';
    resolved.push({ ...phase, startDate, endDate });
  }
  return resolved;
}
export function phaseMembers(project, phase) { return [...project.members, ...phase.extras]; }
export function sustainabilityAllocations(project, people) {
  return resolvePhases(project.phases).flatMap(phase => phaseMembers(project, phase).flatMap(member => {
    const override = phase.overrides[member.id] || {};
    const hoursPerWeek = Number(override.hoursPerWeek ?? phase.roleHours[member.role]);
    if (override.excluded || !(hoursPerWeek > 0)) return [];
    return [{ id: `${project.id}-${phase.code}-${member.id}`, taskId: `${phase.code}-${member.role}`, taskName: `${phase.code} · ${member.role}`, phaseCode: phase.code, role: member.role, employeeId: member.employeeId, employeeName: people.find(person => String(person.id) === member.employeeId)?.name || '', hoursPerWeek, startDate: override.customDates ? override.startDate : phase.startDate, endDate: override.customDates ? override.endDate : phase.endDate }];
  }));
}
const hoursValid = value => value !== '' && Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 168 && Number.isInteger(Number(value) * 4);
export function hasSustainabilityShape(project) {
  const memberShape = member => member && typeof member.id === 'string' && typeof member.employeeId === 'string' && ROLES.includes(member.role);
  return typeof project.leaderId === 'string' && project.leaderId.length > 0 && Array.isArray(project.members) && project.members.every(memberShape)
    && Array.isArray(project.phases) && project.phases.length === 4 && project.phases.every((phase, index) => phase && phase.code === PHASES[index]
      && Number.isInteger(Number(phase.weeks)) && Number(phase.weeks) > 0 && Number(phase.weeks) <= 520 && typeof phase.linked === 'boolean'
      && phase.roleHours && ROLES.every(role => hoursValid(phase.roleHours[role])) && Array.isArray(phase.extras) && phase.extras.every(memberShape)
      && phase.overrides && typeof phase.overrides === 'object' && !Array.isArray(phase.overrides)
      && Object.values(phase.overrides).every(value => value && typeof value === 'object' && (value.hoursPerWeek === undefined || hoursValid(value.hoursPerWeek))
        && (!value.customDates || (isValidDate(value.startDate) && isValidDate(value.endDate) && value.startDate <= value.endDate))))
    && resolvePhases(project.phases).every(phase => isValidDate(phase.startDate) && isValidDate(phase.endDate));
}
export function validateSustainability(project, people) {
  if (!people.some(person => String(person.id) === project.leaderId)) return 'Selecteer een projectleider uit de medewerkerslijst.';
  if (!hasSustainabilityShape(project)) return 'Controleer alle fases: vul een begindatum, een duur van 1–520 hele weken en geldige uren (0–168, in stappen van 0,25) in. Controleer ook eigen tijdlijnen.';
  for (const phase of project.phases) {
    const seen = new Set();
    for (const member of phaseMembers(project, phase)) {
      if (!people.some(person => String(person.id) === member.employeeId)) return `${phase.code}: een gekoppelde medewerker bestaat niet meer.`;
      const key = `${member.employeeId}:${member.role}`;
      if (seen.has(key)) return `${phase.code}: dezelfde medewerker en rol staan dubbel in de fase. Verwijder de dubbele inzet.`;
      seen.add(key);
    }
  }
  return '';
}
