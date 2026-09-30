import React, { useMemo, useRef, useState } from 'react';
import { Check, Plus, Trash2, X } from 'lucide-react';
import { createId, formatHours, validateProject, isValidDate } from './projectModel.js';
import { newSustainability, resolvePhases, phaseMembers, ROLES, sustainabilityAllocations, validateSustainability } from './sustainabilityModel.js';
import { remainingProjectHours } from './projectPlanning.js';
import './sustainability.css';

const dateLabel = value => isValidDate(value) ? new Date(`${value}T12:00:00`).toLocaleDateString('nl-NL') : 'Nog geen datum';
function MemberPicker({ people, members, onAdd, label }) {
  const [employeeId, setEmployeeId] = useState('');
  const [role, setRole] = useState(ROLES[0]);
  const duplicate = members.some(member => member.employeeId === employeeId && member.role === role);
  return <div className="sustainability-member-picker">
    <label className="project-field"><span>Medewerker</span><select aria-label={`Medewerker ${label}`} value={employeeId} onChange={event => setEmployeeId(event.target.value)}><option value="">Kies een medewerker</option>{people.map(person => <option key={person.id} value={String(person.id)}>{person.name} · {person.team}</option>)}</select></label>
    <label className="project-field"><span>Rol</span><select aria-label={`Rol ${label}`} value={role} onChange={event => setRole(event.target.value)}>{ROLES.map(value => <option key={value}>{value}</option>)}</select></label>
    <button type="button" className="project-icon-button task-plus" aria-label={`Medewerker toevoegen ${label}`} disabled={!employeeId || duplicate} onClick={() => { onAdd({ id: createId(), employeeId, role }); setEmployeeId(''); }}><Plus size={18}/></button>
    {duplicate && <small>Deze medewerker heeft deze rol al.</small>}
  </div>;
}

export default function SustainabilityEditor({ project, selectedTeam, teams, people, projects, onSave, onClose, Dialog }) {
  const [draft, setDraft] = useState(() => project ? structuredClone(project) : newSustainability(selectedTeam));
  const [error, setError] = useState('');
  const errorRef = useRef(null);
  const phases = resolvePhases(draft.phases);
  const peopleById = useMemo(() => new Map(people.map(person => [String(person.id), person])), [people]);
  const sortedPeople = useMemo(() => [...people].sort((a, b) => a.name.localeCompare(b.name, 'nl')), [people]);
  const change = patch => { setDraft(current => ({ ...current, ...patch })); setError(''); };
  const updatePhase = (code, patch) => change({ phases: draft.phases.map(phase => phase.code === code ? { ...phase, ...patch } : phase) });
  const updateOverride = (phase, id, patch) => updatePhase(phase.code, { overrides: { ...phase.overrides, [id]: { ...phase.overrides[id], ...patch } } });
  const showError = message => { setError(message); requestAnimationFrame(() => errorRef.current?.focus()); };
  function submit(event) {
    event.preventDefault();
    const validation = validateSustainability(draft, people);
    if (validation) return showError(validation);
    const now = new Date().toISOString();
    const candidate = { ...draft, name: draft.name.trim(), exactCode: draft.exactCode.trim(), leader: peopleById.get(draft.leaderId)?.name || '', phases: phases.map(({ endDate, ...phase }) => phase), allocations: sustainabilityAllocations(draft, people), createdAt: project?.createdAt || now, updatedAt: now };
    const commonError = validateProject(candidate, people, projects.filter(item => item.id !== candidate.id));
    if (commonError) return showError(commonError);
    if (onSave(candidate) === false) showError('Opslaan is niet gelukt. Je invoer blijft bewaard in dit venster.');
  }
  return <Dialog titleId="sustainability-title" className="project-editor-fullscreen sustainability-dialog" onClose={onClose}>
    <div className="project-dialog-header"><div><div className="eyebrow">VERDUURZAMING</div><h2 id="sustainability-title">{project ? 'Verduurzamingsproject bewerken' : 'Nieuw verduurzamingsproject'}</h2><p>Projectgegevens links, fasedatums, stuurgroepen en medewerkerinzet rechts.</p></div><button type="button" className="modal-close" aria-label="Projectvenster sluiten" onClick={onClose}><X size={18}/></button></div>
    <form onSubmit={submit} noValidate><div className="project-dialog-body">
      {error && <div className="project-form-error" role="alert" tabIndex={-1} ref={errorRef}>{error}</div>}
      <div className="normal-project-layout"><aside className="normal-project-info"><h3>Projectgegevens</h3><div className="project-form-grid">
        <label className="project-field project-field-wide"><span>Projectnaam *</span><input data-autofocus value={draft.name} onChange={event => change({ name: event.target.value })}/></label>
        <label className="project-field"><span>Exact-code *</span><input value={draft.exactCode} onChange={event => change({ exactCode: event.target.value })}/></label>
        <label className="project-field"><span>Projectleider *</span><select value={draft.leaderId} onChange={event => { const leaderId = event.target.value; change({ leaderId, members: leaderId && !draft.members.some(member => member.employeeId === leaderId && member.role === 'Projectleider') ? [...draft.members, { id: createId(), employeeId: leaderId, role: 'Projectleider' }] : draft.members }); }}><option value="">Kies een medewerker</option>{sortedPeople.map(person => <option key={person.id} value={String(person.id)}>{person.name}</option>)}</select></label>
        <label className="project-field project-field-wide"><span>Team *</span><select value={draft.team} onChange={event => change({ team: event.target.value })}>{teams.map(team => <option key={team}>{team}</option>)}</select></label>
      </div>
      </aside><section className="normal-project-tasks" aria-label="Faseplanning en medewerkerinzet">
      <section className="sustainability-section sustainability-date-window"><h3>Fasedatums en stuurgroepen</h3><p>Pas hier de startdatum en duur aan. Gekoppelde fases schuiven mee en beginnen de dag na de vorige fase. Elke stuurgroep duurt één dag en plant geen uren. Standaard volgt deze de dag na de fase; kies een eigen datum om hiervan af te wijken. Een stuurgroep verschuift de volgende fase niet.</p>
        <div className="sustainability-date-scroll"><table className="sustainability-date-table"><thead><tr><th>Fase</th><th>Koppeling</th><th>Begindatum</th><th>Weken</th><th>Einddatum</th><th>Stuurgroep · 0 uur</th></tr></thead><tbody>{phases.map((phase, index) => <tr key={phase.code}>
          <th scope="row">{phase.code}</th>
          <td>{index > 0 ? <label className="leave-toggle"><input type="checkbox" checked={phase.linked} onChange={event => updatePhase(phase.code, { linked: event.target.checked, startDate: phase.startDate })}/><span>Volgt {phases[index - 1].code}</span></label> : 'Eigen start'}</td>
          <td><input aria-label={`Begindatum ${phase.code}`} type="date" value={phase.startDate} disabled={phase.linked && index > 0} onChange={event => updatePhase(phase.code, { startDate: event.target.value })}/></td>
          <td><input aria-label={`Duur ${phase.code} in weken`} type="number" min="1" max="520" step="1" value={phase.weeks} onChange={event => updatePhase(phase.code, { weeks: event.target.value })}/></td>
          <td>{dateLabel(phase.endDate)}</td>
          <td><input aria-label={`Stuurgroepdatum ${phase.code}`} type="date" value={phase.steeringDate} disabled={phase.steeringLinked !== false} onChange={event => updatePhase(phase.code, { steeringDate: event.target.value })}/><label className="leave-toggle"><input type="checkbox" checked={phase.steeringLinked !== false} onChange={event => updatePhase(phase.code, { steeringLinked: event.target.checked, steeringDate: phase.steeringDate })}/><span>Volgt fase</span></label></td>
        </tr>)}</tbody></table></div>
        <ol className="sustainability-timeline">{phases.map(phase => <li key={phase.code}><strong>{phase.code}</strong><span>{dateLabel(phase.startDate)} – {dateLabel(phase.endDate)}</span><span className="sustainability-steering">◆ Stuurgroep {dateLabel(phase.steeringDate)} · 0 u</span></li>)}</ol>
      </section>
      <section className="sustainability-section"><h3>Medewerkers en rollen voor alle fases</h3><p>Deze medewerkers volgen automatisch de datums en roluren van iedere fase. De gekozen projectleider wordt hier ook toegevoegd. Bij wijzigen van de projectleider kun je de eerdere inzet hieronder verwijderen.</p>
        <MemberPicker people={sortedPeople} members={draft.members} label="voor alle fases" onAdd={member => change({ members: [...draft.members, member] })}/>
        <div className="sustainability-members">{draft.members.map(member => <div key={member.id}><span><strong>{peopleById.get(member.employeeId)?.name || 'Onbekende medewerker'}</strong><small>{member.role}</small></span><button type="button" className="project-icon-button" aria-label={`Verwijder ${peopleById.get(member.employeeId)?.name} als ${member.role}`} onClick={() => change({ members: draft.members.filter(item => item.id !== member.id) })}><Trash2 size={15}/></button></div>)}</div>
      </section>
      {phases.map(phase => {
        const members = phaseMembers(draft, phase);
        const allocations = sustainabilityAllocations(draft, people).filter(item => item.phaseCode === phase.code);
        const validPreview = isValidDate(phase.startDate) && isValidDate(phase.endDate) && allocations.every(item => isValidDate(item.startDate) && isValidDate(item.endDate) && item.startDate <= item.endDate && Number.isFinite(item.hoursPerWeek));
        const total = validPreview ? remainingProjectHours({ allocations }, peopleById, allocations.reduce((start, item) => item.startDate < start ? item.startDate : start, phase.startDate)) : null;
        return <fieldset className="sustainability-phase" key={phase.code}><legend>{phase.code}</legend>
          <p className="project-form-hint">{dateLabel(phase.startDate)} – {dateLabel(phase.endDate)} · Stuurgroep {dateLabel(phase.steeringDate)} (0 uur)</p>
          <h4>Uren per medewerker per week, per rol</h4><div className="sustainability-role-hours">{ROLES.map(role => <label key={role} className="project-field"><span>{role}</span><input aria-label={`${phase.code} uren ${role}`} type="number" min="0" max="168" step="0.25" value={phase.roleHours[role]} onChange={event => updatePhase(phase.code, { roleHours: { ...phase.roleHours, [role]: event.target.value } })}/></label>)}</div>
          <h4>Inzet in {phase.code}</h4><p className="project-form-hint">0 uur betekent geen inzet. Eigen datums blijven vaststaan als de fase verschuift; schakel ze uit om de fase weer te volgen. Meerdere rollen voor dezelfde medewerker tellen bij elkaar op.</p>
          {members.map(member => {
            const override = phase.overrides[member.id] || {};
            const extra = phase.extras.some(item => item.id === member.id);
            return <div className="sustainability-person" key={member.id}>
              <div className="sustainability-person-heading"><strong>{peopleById.get(member.employeeId)?.name || 'Onbekende medewerker'} <small>· {member.role}{extra ? ' · Alleen deze fase' : ''}</small></strong>{extra && <button type="button" className="project-icon-button" aria-label={`Verwijder extra medewerker uit ${phase.code}`} onClick={() => updatePhase(phase.code, { extras: phase.extras.filter(item => item.id !== member.id) })}><Trash2 size={15}/></button>}</div>
              <label className="leave-toggle"><input type="checkbox" checked={!override.excluded} onChange={event => updateOverride(phase, member.id, { excluded: !event.target.checked })}/><span>Inplannen in {phase.code}</span></label>
              {!override.excluded && <><label className="leave-toggle"><input type="checkbox" checked={!!override.customDates} onChange={event => updateOverride(phase, member.id, { customDates: event.target.checked, startDate: override.startDate || phase.startDate, endDate: override.endDate || phase.endDate })}/><span>Eigen tijdlijn voor deze medewerker</span></label>
              <div className="project-allocation-dates">{override.customDates ? <><label className="project-field"><span>Eigen begindatum</span><input aria-label={`${phase.code} eigen begin ${member.role} ${peopleById.get(member.employeeId)?.name}`} type="date" value={override.startDate || ''} onChange={event => updateOverride(phase, member.id, { startDate: event.target.value })}/></label><label className="project-field"><span>Eigen einddatum</span><input aria-label={`${phase.code} eigen einde ${member.role} ${peopleById.get(member.employeeId)?.name}`} type="date" value={override.endDate || ''} min={override.startDate || undefined} onChange={event => updateOverride(phase, member.id, { endDate: event.target.value })}/></label></> : <span className="project-form-hint">Volgt fase: {dateLabel(phase.startDate)} – {dateLabel(phase.endDate)}</span>}
              <label className="project-field"><span>Eigen uren / week (optioneel)</span><input aria-label={`${phase.code} eigen uren ${member.role} ${peopleById.get(member.employeeId)?.name}`} type="number" min="0" max="168" step="0.25" placeholder={`Rol: ${phase.roleHours[member.role]} u`} value={override.hoursPerWeek ?? ''} onChange={event => updateOverride(phase, member.id, { hoursPerWeek: event.target.value === '' ? undefined : event.target.value })}/></label></div></>}
            </div>;
          })}
          <h4>Extra medewerker voor alleen {phase.code}</h4><MemberPicker people={sortedPeople} members={members} label={`alleen ${phase.code}`} onAdd={member => updatePhase(phase.code, { extras: [...phase.extras, member] })}/>
          <div className="task-hours-summary"><span>Totaal ingepland in {phase.code}, na verlof en conceptverlof</span><strong>{total === null ? 'Vul geldige datums in' : `${formatHours(total)} uur`}</strong></div>
        </fieldset>;
      })}
    </section></div></div><div className="project-dialog-footer"><button type="button" className="cancel-button" onClick={onClose}>Annuleren</button><button type="submit" className="primary-button"><Check size={16}/>{project ? 'Wijzigingen opslaan' : 'Project toevoegen'}</button></div></form>
  </Dialog>;
}
