import React, { useState } from 'react';
import { Check, Pencil, Search, X } from 'lucide-react';
import { annualLeave, validateLeaveBudget } from './leaveModel.js';
import { validateLeave } from './employeeModel.js';
import { formatHours } from './projectModel.js';
import LeaveBudget from './LeaveBudget.jsx';
import LeaveFields from './LeaveFields.jsx';
import { Dialog } from './Projects.jsx';
import './leave.css';

function BudgetInput({ person, year, onSave }) {
  const stored = String(person.leaveBudget?.years?.[year] ?? '');
  const [value, setValue] = useState(stored);
  const [error, setError] = useState('');
  const save = () => {
    if (value === stored) return;
    const years = { ...person.leaveBudget?.years };
    if (value === '') delete years[year]; else years[year] = Number(value);
    const leaveBudget = { autoConcept: true, ...person.leaveBudget, years };
    if (!validateLeaveBudget(leaveBudget)) { setError('Gebruik 0–10.000 uur, in stappen van 0,25.'); return; }
    if (!onSave({ ...person, leaveBudget })) { setError('Opslaan mislukt. Probeer opnieuw.'); return; }
    setError('');
  };
  return <><input className="leave-inline-budget" aria-label={`Verlofuren ${person.name} ${year}`} aria-invalid={!!error} type="number" min="0" max="10000" step="0.25" placeholder="Niet ingevuld" value={value} onChange={event => { setValue(event.target.value); setError(''); }} onBlur={save} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); event.currentTarget.blur(); } }}/>{error && <span className="leave-input-error" role="alert">{error}</span>}</>;
}

function LeaveEditor({ person, year, onSave, onClose }) {
  const [draft, setDraft] = useState(() => ({ ...person, leave: structuredClone(person.leave || []), leaveBudget: structuredClone(person.leaveBudget || { years: {}, autoConcept: true }) }));
  const [error, setError] = useState('');
  function submit(event) {
    event.preventDefault();
    if (!validateLeave(draft.leave)) { setError('Controleer de begin- en einddatums van het verlof.'); return; }
    if (!validateLeaveBudget(draft.leaveBudget)) { setError('Controleer de verlofbudgetten: 0–10.000 uur in stappen van 0,25.'); return; }
    if (onSave(draft) === false) { setError('Opslaan is niet gelukt. Je invoer blijft hier staan.'); return; }
    onClose();
  }
  return <Dialog titleId="leave-editor-title" onClose={onClose} className="leave-editor"><div className="project-dialog-header"><div><div className="eyebrow">VERLOFPLANNING</div><h2 id="leave-editor-title">Verlof · {person.name}</h2><p>Budget en saldo voor {year}. Hieronder kun je verlofperiodes voor alle jaren beheren.</p></div><button type="button" className="modal-close" aria-label="Verlofvenster sluiten" onClick={onClose}><X size={18}/></button></div>
    <form onSubmit={submit}><div className="project-dialog-body">{error && <p role="alert" className="project-form-error">{error}</p>}<LeaveBudget person={draft} initialYear={year} onChange={leaveBudget => setDraft({ ...draft, leaveBudget })}/><LeaveFields person={draft} periods={draft.leave} onChange={leave => setDraft({ ...draft, leave })}/></div><div className="project-dialog-footer"><button type="button" className="cancel-button" onClick={onClose}>Annuleren</button><button type="submit" className="primary-button"><Check size={16}/> Verlof opslaan</button></div></form>
  </Dialog>;
}

export default function Leave({ people, onChange }) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [query, setQuery] = useState('');
  const [team, setTeam] = useState('');
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState('');
  const teams = [...new Set(people.map(person => person.team).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'nl'));
  const filtered = people.filter(person => (!team || person.team === team) && `${person.name} ${person.team}`.toLocaleLowerCase('nl').includes(query.toLocaleLowerCase('nl')));
  function save(person) {
    if (onChange(people.map(item => item.id === person.id ? person : item)) === false) return false;
    setMessage(`Verlofgegevens van ${person.name} opgeslagen.`);
    return true;
  }
  return <section className="page-content employees-page leave-page">
    <div className="page-heading"><div><div className="eyebrow">VERLOF PER JAAR</div><h1>Verlof<span className="heading-period">.</span></h1><p className="page-subtitle">Verlofbudget, ingeplande uren en resterend saldo per medewerker.</p></div>
      <div className="leave-page-year"><button type="button" className="cancel-button" aria-label="Vorig jaar" disabled={year <= 1900} onClick={() => setYear(year - 1)}>‹</button><label><span>Jaar</span><input aria-label="Jaar verlofoverzicht" type="number" min="1900" max="9998" step="1" value={year} onChange={event => { const next = Number(event.target.value); if (Number.isInteger(next) && next >= 1900 && next <= 9998) setYear(next); }}/></label><button type="button" className="cancel-button" aria-label="Volgend jaar" disabled={year >= 9998} onClick={() => setYear(year + 1)}>›</button><button type="button" className="secondary-button" onClick={() => setYear(currentYear)}>Huidig jaar</button></div>
    </div>
    <div className="table-card"><div className="table-toolbar"><div className="search-box"><Search size={16}/><input aria-label="Zoek medewerkers voor verlof" placeholder="Zoek op naam of team…" value={query} onChange={event => setQuery(event.target.value)}/></div><label className="filter-select"><select aria-label="Filter verlof op team" value={team} onChange={event => setTeam(event.target.value)}><option value="">Alle teams</option>{teams.map(name => <option key={name}>{name}</option>)}</select></label></div>
    <div className="table-scroll"><table><thead><tr><th>MEDEWERKER</th><th>TEAM</th><th>VERLOFBUDGET {year}</th><th>INGEPLAND</th><th>RESTEREND</th><th>CONCEPT</th><th><span className="sr-only">Verlof bewerken</span></th></tr></thead><tbody>{filtered.map(person => {
      const summary = annualLeave(person, year);
      const configured = String(person.leaveBudget?.years?.[year] ?? '') !== '';
      return <tr key={person.id}><td><div className="person-cell"><div className={`person-avatar ${person.color}`}>{person.initials}</div><strong>{person.name}</strong></div></td><td>{person.team}</td><td><BudgetInput key={`${person.id}-${year}-${person.leaveBudget?.years?.[year] ?? ''}`} person={person} year={year} onSave={save}/></td><td>{formatHours(summary.planned)} u</td><td className={configured && summary.balance < 0 ? 'leave-negative' : ''}>{configured ? `${formatHours(summary.balance)} u` : '—'}</td><td>{formatHours(summary.conceptHours)} u</td><td><div className="row-actions"><button type="button" aria-label={`Bewerk verlof ${person.name}`} title="Verlof inplannen" onClick={() => setEditing(person.id)}><Pencil size={15}/></button></div></td></tr>;
    })}</tbody></table></div>{!filtered.length && <div className="empty-state"><strong>{people.length ? 'Geen medewerkers gevonden' : 'Nog geen medewerkers'}</strong><span>{people.length ? 'Pas de zoekterm of het teamfilter aan.' : 'Voeg medewerkers toe op het blad Medewerkers.'}</span></div>}</div>
    <p className="leave-page-note">Budgetten worden opgeslagen zodra je het veld verlaat of op Enter drukt. Ingepland is echt verlof, berekend in contracturen. Resterend is het budget min echt verlof; conceptverlof staat apart. Gebruik het potloodje om verlofperiodes en conceptverlof te beheren.</p>
    <p className="leave-save-status" role="status">{message}</p>
    {editing !== null && people.some(person => person.id === editing) && <LeaveEditor person={people.find(person => person.id === editing)} year={year} onSave={save} onClose={() => setEditing(null)}/>}
  </section>;
}
