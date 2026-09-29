import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { UsersRound, LayoutDashboard, CalendarDays, ChartNoAxesCombined, Settings, Plus, Search, ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal, X, Clock3, BriefcaseBusiness, Check, Trash2, Pencil, Menu, Sparkles, ArrowUpRight } from 'lucide-react';
import './styles.css';
import Projects from './Projects.jsx';
import Capacity from './Capacity.jsx';
import LeaveFields from './LeaveFields.jsx';
import LeaveBudget from './LeaveBudget.jsx';
import { validateLeaveBudget } from './leaveModel.js';
import { normalizePerson, weeklyHours, validateLeave } from './employeeModel.js';
import { readProjects, writeProjects } from './projectModel.js';
import './tsavo-theme.css';

const weekdays = [
  { id: 'ma', label: 'Maandag', short: 'Ma' }, { id: 'di', label: 'Dinsdag', short: 'Di' },
  { id: 'wo', label: 'Woensdag', short: 'Wo' }, { id: 'do', label: 'Donderdag', short: 'Do' },
  { id: 'vr', label: 'Vrijdag', short: 'Vr' },
];
const samplePeople = [
  { id: 1, name: 'Sophie de Vries', role: 'Senior verpleegkundige', team: 'Team Noord', contract: 32, days: { ma: 8, di: 8, wo: 8, do: 8 }, color: 'lilac', initials: 'SV' },
  { id: 2, name: 'Daan Bakker', role: 'Verpleegkundige', team: 'Team Noord', contract: 36, days: { ma: 8, di: 8, wo: 8, do: 6, vr: 6 }, color: 'peach', initials: 'DB' },
  { id: 3, name: 'Noor Jansen', role: 'Praktijkondersteuner', team: 'Team Zuid', contract: 24, days: { ma: 8, wo: 8, vr: 8 }, color: 'mint', initials: 'NJ' },
  { id: 4, name: 'Milan Visser', role: 'Verpleegkundige', team: 'Team Zuid', contract: 32, days: { ma: 8, di: 8, do: 8, vr: 8 }, color: 'blue', initials: 'MV' },
  { id: 5, name: 'Eva Smit', role: 'Planner', team: 'Planning', contract: 28, days: { di: 7, wo: 7, do: 7, vr: 7 }, color: 'rose', initials: 'ES' },
  { id: 6, name: 'Luca de Jong', role: 'Verpleegkundige', team: 'Team Noord', contract: 20, days: { ma: 5, di: 5, wo: 5, do: 5 }, color: 'gold', initials: 'LJ' },
];
const colors = ['lilac', 'peach', 'mint', 'blue', 'rose', 'gold'];
const initialStored = () => { try { const saved = localStorage.getItem('ruimte-medewerkers'); return (saved ? JSON.parse(saved) : samplePeople).map(normalizePerson); } catch { return samplePeople.map(normalizePerson); } };

function App() {
  const [people, setPeople] = useState(initialStored);
  const [active, setActive] = useState(() => ({ '#projecten': 'Projecten', '#capaciteit': 'Capaciteit' })[window.location.hash] || 'Medewerkers');
  const [projectState, setProjectState] = useState(() => readProjects({ getItem: key => localStorage.getItem(key) }));
  const [projectSaveError, setProjectSaveError] = useState('');
  const [query, setQuery] = useState('');
  const [teamFilter, setTeamFilter] = useState('Alle teams');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [mobileNav, setMobileNav] = useState(false);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({ name: '', role: '', team: '', days: {}, leave: [], leaveBudget: { years: {}, autoConcept: true } });
  const teams = useMemo(() => [...new Set(people.map(p => p.team).filter(Boolean))], [people]);
  const filtered = people.filter(p => `${p.name} ${p.role} ${p.team}`.toLowerCase().includes(query.toLowerCase()) && (teamFilter === 'Alle teams' || p.team === teamFilter));
  function persist(next) {
    try { const normalized = next.map(normalizePerson); localStorage.setItem('ruimte-medewerkers', JSON.stringify(normalized)); setPeople(normalized); return true; }
    catch { notify('Opslaan is niet gelukt. Je wijzigingen staan nog in het formulier.'); return false; }
  }
  function persistProjects(next) {
    if (projectState.error) return false;
    try {
      writeProjects(localStorage, next);
      setProjectState({ projects: next, error: '' });
      setProjectSaveError('');
      return true;
    } catch {
      setProjectSaveError('Opslaan is niet gelukt. Controleer of je browser lokale opslag toestaat en probeer opnieuw. Je wijzigingen zijn nog niet opgeslagen.');
      return false;
    }
  }
  function notify(message) { setToast(message); window.setTimeout(() => setToast(''), 2600); }
  function openAdd() { setEditing(null); setForm({ name: '', role: '', team: '', days: {}, leave: [], leaveBudget: { years: {}, autoConcept: true } }); setModal(true); }
  function openEdit(p) { setEditing(p.id); setForm({ name: p.name, role: p.role, team: p.team, days: { ...p.days }, leave: (p.leave || []).map(period => ({ ...period })), leaveBudget: { autoConcept: p.leaveBudget?.autoConcept !== false, years: { ...p.leaveBudget?.years } } }); setModal(true); }
  function savePerson(e) {
    e.preventDefault();
    const weekly = weeklyHours(form);
    if (!form.name.trim() || !form.team.trim()) { notify('Vul een naam en team in.'); return; }
    if (!validateLeave(form.leave)) { notify('Vul geldige verlofdatums in. De einddatum mag niet voor de begindatum liggen.'); return; }
    if (!validateLeaveBudget(form.leaveBudget)) { notify('Vul geldige verlofuren in, van 0 tot 10.000 in stappen van 0,25.'); return; }
    const old = people.find(p => p.id === editing);
    const next = { ...form, id: editing || Date.now(), contract: weekly, color: old?.color || colors[people.length % colors.length], initials: form.name.trim().split(/\s+/).slice(0, 2).map(s => s[0]).join('').toUpperCase() };
    if (!persist(editing ? people.map(p => p.id === editing ? next : p) : [next, ...people])) return; setModal(false); notify(editing ? 'Medewerker bijgewerkt' : 'Medewerker toegevoegd');
  }
  function removePerson(p) {
    if (projectState.error) { notify('Medewerkers verwijderen is geblokkeerd zolang de projectplanning niet kan worden gelezen.'); return; }
    if (projectState.projects.some(project => project.allocations.some(a => String(a.employeeId) === String(p.id)) || project.leaderId === String(p.id) || project.members?.some(member => member.employeeId === String(p.id)) || project.phases?.some(phase => phase.extras.some(member => member.employeeId === String(p.id))))) {
      notify('Deze medewerker is gekoppeld aan een project. Verwijder eerst diens projectplanning.');
      return;
    }
    if (window.confirm(`Weet je zeker dat je ${p.name} wilt verwijderen?`)) { persist(people.filter(x => x.id !== p.id)); notify('Medewerker verwijderd'); }
  }
  const nav = [{ label: 'Overzicht', icon: LayoutDashboard }, { label: 'Medewerkers', icon: UsersRound }, { label: 'Projecten', icon: BriefcaseBusiness }, { label: 'Capaciteit', icon: ChartNoAxesCombined }];
  return <div className="app-shell">
    <aside className={`sidebar ${mobileNav ? 'sidebar-open' : ''}`}>
      <a className="brand" href="#" onClick={e => e.preventDefault()} aria-label="Tuesday capaciteitsplanning"><span>Tuesday<span className="brand-dot">.</span></span></a>
      <a className="tsavo-brand" href="https://tsavo.eu/" target="_blank" rel="noreferrer" aria-label="Tsavo website"><img src="/tsavo-logo.svg" alt="Tsavo"/><span>Capaciteitsplanning</span></a>
      <nav>{nav.map(item => <button key={item.label} className={`nav-item ${active === item.label ? 'active' : ''}`} onClick={() => { setActive(item.label); setMobileNav(false); }}><item.icon size={18}/><span>{item.label}</span></button>)}</nav>
      <div className="sidebar-divider"/><div className="side-label">BEHEER</div><button className="nav-item" onClick={() => notify('Instellingen komen binnenkort')}><Settings size={18}/><span>Instellingen</span></button>
      <div className="sidebar-spacer"/><div className="help-card"><div className="help-icon"><Sparkles size={17}/></div><strong>Even sparren?</strong><p>We helpen je op weg met je planning.</p><button onClick={() => notify('Je accountbeheerder helpt je graag verder')}>Bekijk de hulpgids <ArrowUpRight size={14}/></button></div>
      <button className="profile"><div className="profile-avatar">MV</div><span className="profile-copy"><strong>Marieke van Dijk</strong><small>Beheerder</small></span><MoreHorizontal size={19}/></button>
    </aside>
    {mobileNav && <button aria-label="Menu sluiten" className="mobile-scrim" onClick={() => setMobileNav(false)}/>}
    <main className="main-area">
      <header className="topbar"><button className="mobile-menu" aria-label="Menu" onClick={() => setMobileNav(true)}><Menu size={20}/></button><div className="breadcrumbs"><strong>{active}</strong></div><div className="topbar-right"><span className="today-pill"><span className="live-dot"/>{new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date())}</span><div className="top-avatar">MV</div></div></header>
      {active === 'Medewerkers' ? <section className="page-content">
        <div className="page-heading"><div><div className="eyebrow">JE TEAM</div><h1>Medewerkers<span className="heading-period">.</span></h1><p className="page-subtitle">Houd contracten, werkdagen en teams op één plek bij.</p></div><button className="primary-button" onClick={openAdd}><Plus size={18}/> Medewerker toevoegen</button></div>
        <div className="table-card"><div className="table-toolbar"><div className="search-box"><Search size={17}/><input aria-label="Zoek medewerkers" placeholder="Zoek op naam of functie..." value={query} onChange={e => setQuery(e.target.value)}/>{query && <button className="clear-search" onClick={() => setQuery('')}><X size={15}/></button>}</div><label className="filter-select"><BriefcaseBusiness size={15}/><select aria-label="Filter op team" value={teamFilter} onChange={e => setTeamFilter(e.target.value)}><option>Alle teams</option>{teams.map(t => <option key={t}>{t}</option>)}</select><ChevronDown size={14}/></label></div>
          <div className="table-scroll"><table><thead><tr><th>MEDEWERKER</th><th>TEAM</th><th>CONTRACT</th><th>WERKDAGEN</th><th>UREN / WEEK</th><th><span className="sr-only">Acties</span></th></tr></thead><tbody>{filtered.map(p => { const hours = Object.values(p.days).reduce((a,b) => a + Number(b || 0), 0); return <tr key={p.id}><td><div className="person-cell"><div className={`person-avatar ${p.color}`}>{p.initials}</div><div><strong>{p.name}</strong><span>{p.role || 'Medewerker'}</span></div></div></td><td><span className="team-tag"><span className={`team-dot ${p.color}`}/>{p.team}</span></td><td><strong className="contract-value">{p.contract} <small>uur</small></strong></td><td><div className="day-list">{weekdays.filter(d => Number(p.days[d.id]) > 0).map(d => <span title={`${d.label}: ${p.days[d.id]} uur`} className="day-chip" key={d.id}>{d.short}</span>)}</div></td><td><div className="hours-cell"><span className={`hours-track ${hours > p.contract ? 'over' : ''}`}><i style={{ width: `${(p.contract > 0 ? Math.min(100, hours / p.contract * 100) : 0)}%` }}/></span><span>{hours} <small>/ {p.contract} u</small></span></div></td><td><div className="row-actions"><button aria-label={`Bewerk ${p.name}`} title="Bewerken" onClick={() => openEdit(p)}><Pencil size={15}/></button><button aria-label={`Verwijder ${p.name}`} title="Verwijderen" onClick={() => removePerson(p)}><Trash2 size={15}/></button></div></td></tr>; })}</tbody></table></div>
          {filtered.length === 0 && <div className="empty-state"><div className="empty-icon"><UsersRound size={23}/></div><strong>Geen medewerkers gevonden</strong><span>Probeer een andere zoekterm of voeg iemand toe.</span>{people.length === 0 && <button className="primary-button" onClick={openAdd}><Plus size={16}/> Medewerker toevoegen</button>}</div>}
        </div>
      </section> : active === 'Projecten' ? <>
        {(projectState.error || projectSaveError) && <div role="alert" className="project-storage-error">{projectState.error || projectSaveError}</div>}
        <Projects people={people} projects={projectState.projects} onChange={persistProjects} onEmployees={() => setActive('Medewerkers')}/>
      </> : active === 'Capaciteit' ? <Capacity people={people} projects={projectState.projects} error={projectState.error} onProjects={() => setActive('Projecten')}/> : <section className="page-content placeholder-page"><div className="eyebrow">JE TEAM</div><h1>{active}<span className="heading-period">.</span></h1><div className="placeholder-card"><div className="placeholder-icon"><CalendarDays size={24}/></div><h2>Dit onderdeel volgt binnenkort</h2><p>We bouwen stap voor stap verder. Je medewerkers, contracturen en projectplanning staan alvast klaar om hier straks mee te plannen.</p><button className="secondary-button" onClick={() => setActive('Projecten')}>Bekijk projecten <ArrowUpRight size={15}/></button></div></section>}
    </main>
    {modal && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModal(false); }}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><div className="modal-header"><div><div className="eyebrow">TEAMBEHEER</div><h2 id="modal-title">{editing ? 'Medewerker bewerken' : 'Nieuwe medewerker'}</h2><p>{editing ? 'Pas de medewerker, werkdagen en verlof aan.' : 'Vul naam, team en uren per werkdag in.'}</p></div><button className="modal-close" aria-label="Sluiten" onClick={() => setModal(false)}><X size={19}/></button></div>
      <form onSubmit={savePerson}><div className="form-grid"><label className="field full"><span>Naam medewerker <b>*</b></span><input required autoFocus placeholder="Bijv. Noor Jansen" value={form.name} onChange={e => setForm({...form, name:e.target.value})}/></label>{editing && <label className="field"><span>Functie</span><input placeholder="Bijv. Verpleegkundige" value={form.role} onChange={e => setForm({...form, role:e.target.value})}/></label>}<label className={editing ? 'field' : 'field full'}><span>Team <b>*</b></span><input required list="team-options" placeholder="Bijv. Team Noord" value={form.team} onChange={e => setForm({...form, team:e.target.value})}/><datalist id="team-options">{teams.map(t => <option key={t} value={t}/>)}</datalist></label><div className="field full"><div className="days-heading"><span>Werkdagen en uren</span><small>Vul de uren per dag in</small></div><div className="day-fields">{weekdays.map(d => <label className={`day-field ${Number(form.days[d.id]) > 0 ? 'day-selected' : ''}`} key={d.id}><span>{d.short}</span><input aria-label={`${d.label} uren`} type="number" min="0" max="24" step="0.5" placeholder="–" value={form.days[d.id] ?? ''} onChange={e => setForm({...form, days:{...form.days,[d.id]:e.target.value}})}/><small>uur</small></label>)}</div><div className="form-total"><span>Contracturen per week</span><strong>{weeklyHours(form)} uur</strong></div></div>{editing && <><LeaveBudget person={form} onChange={leaveBudget => setForm({ ...form, leaveBudget })}/><LeaveFields person={form} periods={form.leave} onChange={leave => setForm({ ...form, leave })}/></>}</div><div className="modal-footer"><button type="button" className="cancel-button" onClick={() => setModal(false)}>Annuleren</button><button type="submit" className="primary-button"><Check size={16}/>{editing ? 'Wijzigingen opslaan' : 'Medewerker toevoegen'}</button></div></form></div></div>}
    {toast && <div className="toast"><Check size={17}/>{toast}</div>}
  </div>;
}
createRoot(document.getElementById('root')).render(<App/>);
