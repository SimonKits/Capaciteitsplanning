import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { createId } from './projectModel.js';

export default function ProjectTasks({ tasks, people, onChange }) {
  const update = (id, patch) => onChange(tasks.map(task => task.id === id ? { ...task, ...patch } : task));
  return <>
    <div className="project-allocation-heading"><div><h3>Taken en medewerkers</h3><p>Kies per taak meerdere medewerkers. Iedereen krijgt de ingevulde uren per week.</p></div><span className="project-count">{tasks.length}</span></div>
    <div className="project-allocation-editor">{tasks.map((task, index) => <fieldset className="project-allocation-row" key={task.id}>
      <legend>Taak {index + 1}</legend>
      <div className="project-allocation-top"><label className="project-field"><span>Taaknaam *</span><input value={task.name} onChange={event => update(task.id, { name: event.target.value })} placeholder="Bijv. Voorbereiding"/></label><button type="button" className="project-icon-button" aria-label={`Verwijder taak ${index + 1}`} onClick={() => onChange(tasks.filter(item => item.id !== task.id))}><Trash2 size={16}/></button></div>
      <div className="project-allocation-dates">
        <label className="project-field"><span>Van *</span><input type="date" aria-label={`Startdatum taak ${index + 1}`} value={task.startDate} onChange={event => update(task.id, { startDate: event.target.value })}/></label>
        <label className="project-field"><span>Tot en met *</span><input type="date" aria-label={`Einddatum taak ${index + 1}`} min={task.startDate || undefined} value={task.endDate} onChange={event => update(task.id, { endDate: event.target.value })}/></label>
        <label className="project-field"><span>Uren per persoon / week *</span><input type="number" min="0.25" max="168" step="0.25" aria-label={`Uren per persoon taak ${index + 1}`} value={task.hoursPerWeek} onChange={event => update(task.id, { hoursPerWeek: event.target.value })}/></label>
      </div>
      <div className="task-people" role="group" aria-label={`Medewerkers taak ${index + 1}`}>{people.map(person => <label key={person.id}><input type="checkbox" checked={task.employeeIds.includes(String(person.id))} onChange={event => update(task.id, { employeeIds: event.target.checked ? [...task.employeeIds, String(person.id)] : task.employeeIds.filter(id => id !== String(person.id)) })}/><span>{person.name}<small>{person.team}</small></span></label>)}</div>
      <p className="project-form-hint">{task.employeeIds.length} medewerkers · {task.hoursPerWeek || 0} uur per persoon per week. Verlof wordt automatisch afgetrokken.</p>
    </fieldset>)}</div>
    <button type="button" className="project-add-allocation" disabled={!people.length} onClick={() => onChange([...tasks, { id: createId(), name: '', employeeIds: [], startDate: '', endDate: '', hoursPerWeek: '' }])}><Plus size={16}/> Taak toevoegen</button>
    <p className="project-form-hint">Je kunt meerdere taken toevoegen. Uren op verschillende taken worden bij elkaar opgeteld. Zonder taken kun je het project alvast opslaan.</p>
  </>;
}
