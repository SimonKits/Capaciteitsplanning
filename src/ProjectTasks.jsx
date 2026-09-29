import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { createId, formatHours, isValidDate } from './projectModel.js';
import { remainingProjectHours } from './projectPlanning.js';

function TaskPeople({ task, index, people, onChange }) {
  const [employee, setEmployee] = useState('');
  const [team, setTeam] = useState('');
  const available = people.filter(person => !task.employeeIds.includes(String(person.id)));
  const teams = [...new Set(people.map(person => (person.team || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'nl'));
  const teamIds = people.filter(person => (person.team || '').trim() === team).map(person => String(person.id));
  const add = ids => onChange([...new Set([...task.employeeIds, ...ids])]);
  const peopleById = new Map(people.map(person => [String(person.id), person]));
  const valid = isValidDate(task.startDate) && isValidDate(task.endDate) && task.startDate <= task.endDate && Number.isFinite(Number(task.hoursPerWeek)) && Number(task.hoursPerWeek) > 0;
  const preview = { allocations: task.employeeIds.map(employeeId => ({ employeeId, startDate: task.startDate, endDate: task.endDate, hoursPerWeek: Number(task.hoursPerWeek) })) };
  return <>
    <div className="task-add-controls">
      <div className="task-add-row"><label className="project-field"><span>Medewerker toevoegen</span><select aria-label={`Medewerker kiezen taak ${index + 1}`} value={employee} onChange={event => setEmployee(event.target.value)}><option value="">Kies een medewerker</option>{available.map(person => <option key={person.id} value={String(person.id)}>{person.name}{person.team ? ` · ${person.team}` : ''}</option>)}</select></label><button type="button" className="project-icon-button task-plus" aria-label={`Medewerker toevoegen aan taak ${index + 1}`} disabled={!available.some(person => String(person.id) === employee)} onClick={() => { add([employee]); setEmployee(''); }}><Plus size={18}/></button></div>
      <div className="task-add-row"><label className="project-field"><span>Heel team toevoegen</span><select aria-label={`Team kiezen taak ${index + 1}`} value={team} onChange={event => setTeam(event.target.value)}><option value="">Kies een team</option>{teams.map(name => <option key={name} value={name}>{name}</option>)}</select></label><button type="button" className="project-icon-button task-plus" aria-label={`Team toevoegen aan taak ${index + 1}`} disabled={!team || !teamIds.some(id => !task.employeeIds.includes(id))} onClick={() => { add(teamIds); setTeam(''); }}><Plus size={18}/></button></div>
    </div>
    <div className="task-selected" aria-label={`Toegevoegde medewerkers taak ${index + 1}`}>{task.employeeIds.map(id => <span className="task-person-chip" key={id}>{peopleById.get(id)?.name || 'Onbekende medewerker'}<button type="button" aria-label={`Verwijder ${peopleById.get(id)?.name || 'medewerker'} uit taak ${index + 1}`} onClick={() => onChange(task.employeeIds.filter(value => value !== id))}><X size={13}/></button></span>)}</div>
    <p className="project-form-hint">{task.employeeIds.length} medewerkers · {task.hoursPerWeek || 0} uur per persoon per week. Een team toevoegen voegt de huidige teamleden toe, zonder dubbele medewerkers.</p>
    <div className="task-hours-summary" aria-live="polite">{valid ? <><div><span>Totaal gepland voor deze taak</span><strong>{formatHours(remainingProjectHours(preview, peopleById, task.startDate))} uur</strong></div><div><span>Nog gepland vanaf vandaag</span><strong>{formatHours(remainingProjectHours(preview, peopleById))} uur</strong></div><small>Voor alle toegevoegde medewerkers samen, na aftrek van verlof. Alleen maandag t/m vrijdag telt mee.</small></> : <span>Vul een geldige periode en uren per week in om het taaktotaal te zien.</span>}</div>
  </>;
}

export default function ProjectTasks({ tasks, people, onChange }) {
  const update = (id, patch) => onChange(tasks.map(task => task.id === id ? { ...task, ...patch } : task));
  return <>
    <div className="project-allocation-heading"><div><h3>Taken en medewerkers</h3><p>Voeg medewerkers of een heel team toe. Iedereen krijgt de ingevulde uren per week.</p></div><span className="project-count">{tasks.length}</span></div>
    <div className="project-allocation-editor">{tasks.map((task, index) => <fieldset className="project-allocation-row" key={task.id}>
      <legend>Taak {index + 1}</legend>
      <div className="project-allocation-top"><label className="project-field"><span>Taaknaam *</span><input value={task.name} onChange={event => update(task.id, { name: event.target.value })} placeholder="Bijv. Voorbereiding"/></label><button type="button" className="project-icon-button" aria-label={`Verwijder taak ${index + 1}`} onClick={() => onChange(tasks.filter(item => item.id !== task.id))}><Trash2 size={16}/></button></div>
      <div className="project-allocation-dates">
        <label className="project-field"><span>Van *</span><input type="date" aria-label={`Startdatum taak ${index + 1}`} value={task.startDate} onChange={event => update(task.id, { startDate: event.target.value })}/></label>
        <label className="project-field"><span>Tot en met *</span><input type="date" aria-label={`Einddatum taak ${index + 1}`} min={task.startDate || undefined} value={task.endDate} onChange={event => update(task.id, { endDate: event.target.value })}/></label>
        <label className="project-field"><span>Uren per persoon / week *</span><input type="number" min="0.25" max="168" step="0.25" aria-label={`Uren per persoon taak ${index + 1}`} value={task.hoursPerWeek} onChange={event => update(task.id, { hoursPerWeek: event.target.value })}/></label>
      </div>
      <TaskPeople task={task} index={index} people={people} onChange={employeeIds => update(task.id, { employeeIds })}/>
    </fieldset>)}</div>
    <button type="button" className="project-add-allocation" disabled={!people.length} onClick={() => onChange([...tasks, { id: createId(), name: '', employeeIds: [], startDate: '', endDate: '', hoursPerWeek: '' }])}><Plus size={16}/> Taak toevoegen</button>
    <p className="project-form-hint">Je kunt meerdere taken toevoegen. Uren op verschillende taken worden bij elkaar opgeteld. Zonder taken kun je het project alvast opslaan.</p>
  </>;
}
