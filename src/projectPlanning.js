import { createId } from './projectModel.js';
import { countWorkdays, localToday } from './capacityModel.js';

export function tasksFromProject(project) {
  const tasks = new Map();
  for (const item of project?.allocations || []) {
    const key = item.taskId || `legacy-${item.startDate}-${item.endDate}-${item.hoursPerWeek}`;
    if (!tasks.has(key)) tasks.set(key, { id: key, name: item.taskName || 'Projectinzet', startDate: item.startDate, endDate: item.endDate, hoursPerWeek: String(item.hoursPerWeek), employeeIds: [], allocationIds: {} });
    const task = tasks.get(key);
    task.employeeIds.push(String(item.employeeId));
    task.allocationIds[String(item.employeeId)] = item.id;
  }
  return [...tasks.values()];
}

export function allocationsFromTasks(tasks, people) {
  return tasks.flatMap(task => task.employeeIds.map(employeeId => ({
    id: task.allocationIds?.[employeeId] || createId(), taskId: task.id, taskName: task.name.trim(),
    employeeId, employeeName: people.find(person => String(person.id) === employeeId)?.name || '',
    startDate: task.startDate, endDate: task.endDate, hoursPerWeek: Number(task.hoursPerWeek),
  })));
}

// Merge overlapping leave before subtracting it, so each weekday is deducted once.
export function remainingProjectHours(project, peopleById, today = localToday()) {
  let total = 0;
  for (const allocation of project.allocations) {
    const start = allocation.startDate > today ? allocation.startDate : today;
    const end = allocation.endDate;
    if (start > end) continue;
    const person = peopleById.get(String(allocation.employeeId));
    if (!person) continue;
    const leave = (person.leave || []).map(item => ({ start: item.startDate > start ? item.startDate : start, end: item.endDate < end ? item.endDate : end }))
      .filter(item => item.start <= item.end).sort((a, b) => a.start.localeCompare(b.start));
    const merged = [];
    for (const item of leave) {
      const last = merged.at(-1);
      if (last && item.start <= last.end) { if (item.end > last.end) last.end = item.end; }
      else merged.push({ ...item });
    }
    const days = countWorkdays(start, end) - merged.reduce((sum, item) => sum + countWorkdays(item.start, item.end), 0);
    total += days * Number(allocation.hoursPerWeek) / 5;
  }
  return Math.round(total * 1e8) / 1e8;
}
