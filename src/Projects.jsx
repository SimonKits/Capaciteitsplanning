import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, BriefcaseBusiness, CalendarDays, Check, FolderKanban, Leaf, Pencil, Plus, Search, Trash2, UsersRound, X } from 'lucide-react';
import { validateProject, createId, formatHours } from './projectModel.js';
import './projects.css';
import ProjectTasks from './ProjectTasks.jsx';
import SustainabilityEditor from './SustainabilityEditor.jsx';
import { tasksFromProject, allocationsFromTasks, remainingProjectHours } from './projectPlanning.js';

const dateLabel = value => {
  if (!value) return '—';
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' });
};

function handleTabKeys(event) {
  if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
  const tabs = [...event.currentTarget.querySelectorAll('[role="tab"]')];
  const current = tabs.indexOf(document.activeElement);
  if (current < 0 || !tabs.length) return;
  event.preventDefault();
  const index = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (current + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
  tabs[index].focus();
  tabs[index].click();
}

export function Dialog({ titleId, onClose, children, className = '' }) {
  const dialog = useRef(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const element = dialog.current;
    const focusable = () => [...element.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], [tabindex="0"]')].filter(node => node.getClientRects().length);
    (element.querySelector('[data-autofocus]') || focusable()[0] || element).focus();
    const onKey = event => {
      if (event.key === 'Escape') { event.preventDefault(); close.current(); }
      if (event.key !== 'Tab') return;
      const items = focusable();
      if (!items.length) { event.preventDefault(); element.focus(); return; }
      if (event.shiftKey && (document.activeElement === items[0] || !element.contains(document.activeElement))) { event.preventDefault(); items.at(-1).focus(); }
      if (!event.shiftKey && (document.activeElement === items.at(-1) || !element.contains(document.activeElement))) { event.preventDefault(); items[0].focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return <div className={`project-dialog-backdrop ${className.includes('project-editor-fullscreen') ? 'project-backdrop-fullscreen' : ''}`} onMouseDown={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className={`project-dialog ${className}`} ref={dialog} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1}>{children}</div>
  </div>;
}

function ProjectEditor({ project, selectedTeam, teams, people, projects, onSave, onClose, onEmployees }) {
  const [draft, setDraft] = useState(() => project ? { ...project, allocations: project.allocations.map(item => ({ ...item, employeeId: String(item.employeeId), hoursPerWeek: String(item.hoursPerWeek) })) } : {
    id: createId(), type: 'project', team: selectedTeam, name: '', exactCode: '', leader: '', allocations: [],
  });
  const [tasks, setTasks] = useState(() => tasksFromProject(project));
  const [error, setError] = useState('');
  const errorRef = useRef(null);
  const availablePeople = useMemo(() => [...people].sort((a, b) => {
    const ownTeam = Number((b.team || '').trim() === draft.team) - Number((a.team || '').trim() === draft.team);
    return ownTeam || a.name.localeCompare(b.name, 'nl');
  }), [people, draft.team]);
  const change = (key, value) => { setDraft(current => ({ ...current, [key]: value })); setError(''); };
  const showError = message => {
    setError(message);
    requestAnimationFrame(() => errorRef.current?.focus());
  };
  const submit = event => {
    event.preventDefault();
    if (tasks.some(task => !task.name.trim() || !task.employeeIds.length)) { showError('Vul voor iedere taak een naam in en kies minimaal één medewerker.'); return; }
    const now = new Date().toISOString();
    const candidate = {
      ...draft, name: draft.name.trim(), exactCode: draft.exactCode.trim(), leader: draft.leader.trim(), team: draft.team.trim(),
      createdAt: project?.createdAt || now, updatedAt: now,
      allocations: allocationsFromTasks(tasks, people),
    };
    const validationError = validateProject(candidate, people, projects.filter(item => item.id !== candidate.id));
    if (validationError) { showError(validationError); return; }
    if (onSave(candidate) === false) showError('Opslaan is niet gelukt. Controleer of je browser gegevens mag opslaan en probeer het opnieuw. Je invoer blijft hier staan.');
  };
  return <Dialog titleId="project-editor-title" className="project-editor-fullscreen" onClose={onClose}>
    <div className="project-dialog-header"><div><div className="eyebrow">PROJECTPLANNING</div><h2 id="project-editor-title">{project ? 'Project bewerken' : 'Nieuw project'}</h2><p>Projectgegevens links, taken en medewerkerinzet rechts.</p></div><button className="modal-close" aria-label="Projectvenster sluiten" onClick={onClose}><X size={18}/></button></div>
    <form onSubmit={submit} noValidate>
      <div className="project-dialog-body">
        {error && <div className="project-form-error" role="alert" ref={errorRef} tabIndex={-1}>{error}</div>}
        <div className="normal-project-layout"><aside className="normal-project-info"><h3>Projectgegevens</h3><div className="project-form-grid">
          <label className="project-field project-field-wide"><span>Projectnaam <b aria-hidden="true">*</b></span><input data-autofocus required value={draft.name} onChange={event => change('name', event.target.value)} placeholder="Bijv. Renovatie Parklaan" autoComplete="off"/></label>
          <label className="project-field"><span>Exact-code <b aria-hidden="true">*</b></span><input required value={draft.exactCode} onChange={event => change('exactCode', event.target.value)} placeholder="Bijv. PR-2026-001" autoComplete="off"/></label>
          <label className="project-field"><span>Projectleider <b aria-hidden="true">*</b></span><input required value={draft.leader} onChange={event => change('leader', event.target.value)} placeholder="Naam van de projectleider" autoComplete="off"/></label>
          {project ? <label className="project-field project-field-wide"><span>Team <b aria-hidden="true">*</b></span><select required value={draft.team} onChange={event => change('team', event.target.value)}>{teams.map(team => <option key={team}>{team}</option>)}</select></label> : <div className="project-team-assignment"><BriefcaseBusiness size={15}/><span>Dit project hoort bij <strong>{draft.team}</strong>.</span></div>}
        </div>
        <div className="normal-project-counts"><span><strong>{tasks.length}</strong> taken</span><span><strong>{new Set(tasks.flatMap(task => task.employeeIds)).size}</strong> medewerkers</span></div>
        <p className="project-form-hint">De uren in de taakregels houden rekening met verlof en ingeschakeld conceptverlof.</p>
        </aside><section className="normal-project-tasks" aria-label="Taken en medewerkerinzet">
        <ProjectTasks tasks={tasks} people={availablePeople} onChange={value => { setTasks(value); setError(''); }}/>
        {!people.length && <button type="button" className="project-text-button" onClick={onEmployees}>Eerst medewerkers toevoegen</button>}
        </section></div>
      </div>
      <div className="project-dialog-footer"><span><b>*</b> Verplicht</span><button type="button" className="cancel-button" onClick={onClose}>Annuleren</button><button type="submit" className="primary-button"><Check size={16}/>{project ? 'Wijzigingen opslaan' : 'Project toevoegen'}</button></div>
    </form>
  </Dialog>;
}

function ProjectCard({ project, peopleById, onEdit, onDelete }) {
  const names = [...new Set(project.allocations.map(item => peopleById.get(String(item.employeeId))?.name || item.employeeName))];
  const remaining = remainingProjectHours(project, peopleById);
  return <article className="project-card project-card-compact">
    <div className="project-card-header"><span className="project-card-icon"><FolderKanban size={21}/></span><div className="project-card-title"><div className="project-title-line"><h3>{project.name}</h3><span className="project-code">{project.exactCode}</span></div><p>Projectleider <strong>{peopleById.get(project.leaderId)?.name || project.leader}</strong></p></div><div className="project-remaining"><strong>{formatHours(remaining)} u</strong><span>Nog gepland</span></div><div className="project-card-actions"><button className="project-icon-button" onClick={() => onEdit(project)} title="Project bewerken" aria-label={`Bewerk project ${project.name}`}><Pencil size={16}/></button><button className="project-icon-button project-delete-button" onClick={() => onDelete(project)} title="Project verwijderen" aria-label={`Verwijder project ${project.name}`}><Trash2 size={16}/></button></div></div>
    <div className="project-compact-people">{names.length ? names.slice(0, 3).join(', ') + (names.length > 3 ? ` +${names.length - 3}` : '') : 'Nog geen medewerkers ingepland'}</div>
    <details className="project-details"><summary>Planning bekijken <span>{project.allocations.length} inzetregels</span></summary>
    {project.allocations.length ? <div className="project-allocation-table-wrap"><table className="project-allocation-table"><caption className="sr-only">Geplande inzet voor {project.name}</caption><thead><tr><th>MEDEWERKER / TAAK</th><th>PERIODE</th><th>UREN / WEEK</th></tr></thead><tbody>{project.allocations.map(allocation => {
      const person = peopleById.get(String(allocation.employeeId));
      const name = person?.name || allocation.employeeName || 'Onbekende medewerker';
      return <tr key={allocation.id}><td><div className="project-person"><span className={`person-avatar ${person?.color || 'mint'}`}>{person?.initials || name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('')}</span><div><strong>{name}</strong><span>{allocation.taskName || 'Projectinzet'}</span><span>{person ? person.team || 'Geen team' : 'Niet meer in medewerkers'}</span></div></div></td><td><div className="project-period"><CalendarDays size={13}/><span><time dateTime={allocation.startDate}>{dateLabel(allocation.startDate)}</time><span className="project-date-separator">t/m</span><time dateTime={allocation.endDate}>{dateLabel(allocation.endDate)}</time></span></div></td><td><span className="project-weekly-hours">{formatHours(allocation.hoursPerWeek)} <small>uur</small></span></td></tr>;
    })}</tbody></table></div> : <div className="project-card-unplanned"><UsersRound size={16}/><span>Nog geen medewerkers ingepland</span><button className="project-text-button" onClick={() => onEdit(project)}>Inplannen <ArrowUpRight size={13}/></button></div>}
    </details>
  </article>;
}

export default function Projects({ people, projects, onChange, onEmployees }) {
  const teams = useMemo(() => [...new Set([...people.map(person => person.team), ...projects.map(project => project.team)].map(team => (team || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'nl')), [people, projects]);
  const [team, setTeam] = useState(() => teams[0] || '');
  const selectedTeam = teams.includes(team) ? team : teams[0] || '';
  const [type, setType] = useState('project');
  const [query, setQuery] = useState('');
  const [editor, setEditor] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [feedback, setFeedback] = useState('');
  const peopleById = useMemo(() => new Map(people.map(person => [String(person.id), person])), [people]);
  const teamProjects = projects.filter(project => project.team.trim() === selectedTeam && project.type === type);
  const search = query.trim().toLocaleLowerCase('nl');
  const filtered = teamProjects.filter(project => [project.name, project.exactCode, project.leader, ...project.allocations.map(item => peopleById.get(String(item.employeeId))?.name || item.employeeName || '')].join(' ').toLocaleLowerCase('nl').includes(search));
  const teamPeopleCount = people.filter(person => (person.team || '').trim() === selectedTeam).length;
  useEffect(() => {
    if (!feedback) return;
    const timeout = window.setTimeout(() => setFeedback(''), 5000);
    return () => window.clearTimeout(timeout);
  }, [feedback]);
  const save = candidate => {
    const existing = projects.some(project => project.id === candidate.id);
    const next = existing ? projects.map(project => project.id === candidate.id ? candidate : project) : [candidate, ...projects];
    if (onChange(next) === false) return false;
    setTeam(candidate.team);
    setQuery('');
    setEditor(null);
    setFeedback(existing ? 'Project bijgewerkt.' : 'Project toegevoegd.');
    return true;
  };
  const remove = () => {
    if (onChange(projects.filter(project => project.id !== deleting.id)) === false) { setDeleteError('Verwijderen is niet gelukt. Probeer het opnieuw.'); return; }
    setDeleting(null);
    setDeleteError('');
    setFeedback('Project en bijbehorende inzet verwijderd.');
  };
  return <section className="page-content projects-page">
    <div className="page-heading"><div><div className="eyebrow">PLANNEN PER TEAM</div><h1>Projecten<span className="heading-period">.</span></h1><p className="page-subtitle">Je projecten, medewerkers en geplande inzet op één plek.</p></div>{selectedTeam && <button className="primary-button" onClick={() => setEditor({ project: null })}><Plus size={18}/> Project toevoegen</button>}</div>
    <div className="project-feedback" role="status" aria-live="polite">{feedback && <><Check size={15}/>{feedback}</>}</div>
    {!teams.length ? <div className="project-empty-state project-no-teams"><div className="project-empty-icon"><BriefcaseBusiness size={27}/></div><h2>Begin met een team</h2><p>Koppel een medewerker aan een team via Medewerkers. Elk team krijgt hier automatisch een eigen projectblad.</p><button className="primary-button" onClick={onEmployees}>Naar medewerkers <ArrowUpRight size={15}/></button></div> : <>
      <div className="project-team-tabs" role="tablist" aria-label="Team kiezen" onKeyDown={handleTabKeys}>{teams.map((item, index) => <button key={item} id={`project-team-tab-${index}`} role="tab" aria-selected={selectedTeam === item} aria-controls="project-team-panel" tabIndex={selectedTeam === item ? 0 : -1} className={`project-team-tab ${selectedTeam === item ? 'selected' : ''}`} onClick={() => { setTeam(item); setQuery(''); }}><BriefcaseBusiness size={15}/><span>{item}</span><span className="project-team-count">{projects.filter(project => project.team.trim() === item).length}</span></button>)}</div>
      <div id="project-team-panel" role="tabpanel" aria-labelledby={`project-team-tab-${teams.indexOf(selectedTeam)}`} className="project-team-panel">
        <div className="project-team-heading"><div><h2>{selectedTeam}</h2><p>{teamPeopleCount} {teamPeopleCount === 1 ? 'medewerker' : 'medewerkers'} in dit team <span>·</span> {teamProjects.length} {teamProjects.length === 1 ? 'project' : 'projecten'}</p></div><span className="project-team-label"><UsersRound size={14}/> Teamblad</span></div>
        <div className="project-type-tabs" role="tablist" aria-label="Soort project" onKeyDown={handleTabKeys}><button role="tab" id="standard-projects-tab" aria-selected={type === 'project'} aria-controls="project-type-panel" tabIndex={type === 'project' ? 0 : -1} onClick={() => setType('project')} className={type === 'project' ? 'selected' : ''}><FolderKanban size={16}/>Projecten <span className="project-count">{projects.filter(p => p.team.trim() === selectedTeam && p.type === 'project').length}</span></button><button role="tab" id="sustainability-projects-tab" aria-selected={type === 'sustainability'} aria-controls="project-type-panel" tabIndex={type === 'sustainability' ? 0 : -1} onClick={() => setType('sustainability')} className={type === 'sustainability' ? 'selected' : ''}><Leaf size={16}/>Verduurzamingsprojecten <span className="project-count">{projects.filter(p => p.team.trim() === selectedTeam && p.type === 'sustainability').length}</span></button></div>
        <div id="project-type-panel" role="tabpanel" aria-labelledby={type === 'project' ? 'standard-projects-tab' : 'sustainability-projects-tab'}>
          {<> 
            <div className="project-list-toolbar"><span>{query.trim() ? `${filtered.length} van ${teamProjects.length} projecten` : 'Alle projecten van dit team'}</span><div className="project-search"><Search size={16}/><input aria-label="Zoek projecten" placeholder="Zoek project, code of medewerker…" value={query} onChange={event => setQuery(event.target.value)}/>{query && <button aria-label="Zoekopdracht wissen" onClick={() => setQuery('')}><X size={15}/></button>}</div></div>
            {filtered.length ? <div className="project-list">{filtered.map(project => <ProjectCard key={project.id} project={project} peopleById={peopleById} onEdit={item => setEditor({ project: item })} onDelete={item => { setDeleting(item); setDeleteError(''); }}/>)}</div> : <div className="project-empty-state"><div className="project-empty-icon">{query.trim() ? <Search size={26}/> : <FolderKanban size={27}/>}</div><h2>{query.trim() ? 'Geen projecten gevonden' : 'Het eerste project begint hier'}</h2><p>{query.trim() ? 'Probeer een andere projectnaam, Exact-code, projectleider of medewerker.' : `Voeg een project toe aan ${selectedTeam} en plan medewerkers in voor de gewenste periode.`}</p>{query.trim() ? <button className="secondary-button" onClick={() => setQuery('')}>Zoekopdracht wissen</button> : <button className="primary-button" onClick={() => setEditor({ project: null })}><Plus size={16}/> Project toevoegen</button>}</div>}
            <p className="project-list-note"><CalendarDays size={14}/><span>Nog gepland: alle projecturen vanaf vandaag (inclusief), zonder weekenden, verlof en ingeschakeld conceptverlof. Iedere medewerker krijgt de uren per week van de taak; de uren worden niet verdeeld over de medewerkers.</span></p>
          </>}
        </div>
      </div>
    </>}
    {editor && (editor.project?.type || type) === 'sustainability' ? <SustainabilityEditor Dialog={Dialog} project={editor.project} selectedTeam={selectedTeam} teams={teams} people={people} projects={projects} onSave={save} onClose={() => setEditor(null)}/> : editor && <ProjectEditor project={editor.project} selectedTeam={selectedTeam} teams={teams} people={people} projects={projects} onSave={save} onClose={() => setEditor(null)} onEmployees={() => { setEditor(null); onEmployees(); }}/>}
    {deleting && <Dialog titleId="delete-project-title" className="project-delete-dialog" onClose={() => setDeleting(null)}><div className="project-dialog-header"><div><div className="eyebrow">PROJECT VERWIJDEREN</div><h2 id="delete-project-title">Project verwijderen?</h2></div><button className="modal-close" aria-label="Venster sluiten" onClick={() => setDeleting(null)}><X size={18}/></button></div><div className="project-dialog-body"><p className="project-delete-copy">Je verwijdert <strong>{deleting.name}</strong> en alle bijbehorende inzetperiodes. Dit kun je niet ongedaan maken.</p>{deleteError && <p className="project-form-error" role="alert">{deleteError}</p>}</div><div className="project-dialog-footer"><button data-autofocus className="cancel-button" onClick={() => setDeleting(null)}>Annuleren</button><button className="project-danger-button" onClick={remove}><Trash2 size={15}/> Project verwijderen</button></div></Dialog>}
  </section>;
}
