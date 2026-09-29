import React, { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, BriefcaseBusiness, UsersRound, X } from 'lucide-react';
import { formatHours } from './projectModel.js';
import { localToday, buildPeriods, shiftAnchor, calculateCapacity } from './capacityModel.js';
import './capacity.css';

const dateLabel = date => new Intl.DateTimeFormat('nl-NL', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${date}T12:00:00`));

function CapacityCell({ person, period, value, selected, onSelect }) {
  const { usedHours, contractHours, percentage, overbooked, leaveDays } = value;
  const percentLabel = Number.isFinite(percentage) ? `${Math.round(percentage)}%` : '—';
  const state = usedHours === 0 ? 'empty' : overbooked ? 'over' : 'planned';
  return <button
    type="button"
    className={`capacity-cell ${selected ? 'is-selected' : ''}`}
    aria-pressed={selected}
    aria-label={`${person.name}, ${period.label}: ${formatHours(usedHours)} van ${formatHours(contractHours)} contracturen ingepland${overbooked ? ', overbezet' : ''}. Toon projecten.`}
    onClick={onSelect}
  >
    <span className={`capacity-ring ${state}`} style={{ '--fill': `${overbooked ? 100 : Math.min(100, Math.max(0, percentage || 0))}%` }} aria-hidden="true"><span>{percentLabel}</span></span>
    <span className="capacity-hours">{formatHours(usedHours)} <span>/ {formatHours(contractHours)} u</span></span>
    <span className={`capacity-cell-state ${state}`}>{overbooked ? 'Overbezet' : leaveDays && contractHours === 0 ? 'Verlof' : usedHours === 0 ? 'Vrij' : 'Ingepland'}</span>
    {leaveDays > 0 && contractHours > 0 && <span className="capacity-cell-state">{leaveDays} {leaveDays === 1 ? 'dag' : 'dagen'} verlof</span>}
  </button>;
}

export default function Capacity({ people, projects, error, onProjects }) {
  const [mode, setMode] = useState('week');
  const [anchor, setAnchor] = useState(localToday);
  const [team, setTeam] = useState('');
  const [selection, setSelection] = useState(null);
  const count = mode === 'week' ? 6 : 4;
  const periods = useMemo(() => buildPeriods(anchor, mode, count), [anchor, mode, count]);
  const teams = useMemo(() => [...new Set(people.map(person => person.team).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'nl')), [people]);
  const visiblePeople = useMemo(() => people.filter(person => !team || person.team === team), [people, team]);
  const rows = useMemo(() => error ? [] : visiblePeople.map(person => ({ person, values: periods.map(period => calculateCapacity(person, projects, period)) })), [visiblePeople, projects, periods, error]);
  const selectedRow = selection && rows.find(row => String(row.person.id) === String(selection.personId));
  const selectedIndex = selection ? periods.findIndex(period => period.key === selection.periodKey) : -1;
  const detail = selectedRow && selectedIndex >= 0 ? { person: selectedRow.person, period: periods[selectedIndex], value: selectedRow.values[selectedIndex] } : null;
  function changeAnchor(next) { if (next) { setAnchor(next); setSelection(null); } }

  return <section className="page-content capacity-page">
    <div className="page-heading">
      <div><div className="eyebrow">RUIMTE IN JE TEAM</div><h1>Capaciteit<span className="heading-period">.</span></h1><p className="page-subtitle">Zie per medewerker hoeveel contracturen de projecten gebruiken.</p></div>
      <button type="button" className="secondary-button" onClick={onProjects}><BriefcaseBusiness size={16}/> Naar projecten</button>
    </div>

    <div className="capacity-controls">
      <div className="capacity-period-switch" role="group" aria-label="Weergave">
        <button type="button" aria-pressed={mode === 'week'} onClick={() => { setMode('week'); setSelection(null); }}>Per week</button>
        <button type="button" aria-pressed={mode === 'month'} onClick={() => { setMode('month'); setSelection(null); }}>Per maand</button>
      </div>
      <label className="capacity-field"><span>Team</span><select aria-label="Filter medewerkers op team" value={team} onChange={event => { setTeam(event.target.value); setSelection(null); }}><option value="">Alle teams</option>{teams.map(name => <option key={name} value={name}>{name}</option>)}</select></label>
      <label className="capacity-field capacity-date"><span>Datum in overzicht</span><input type="date" aria-label="Datum in overzicht" value={anchor} min="1900-01-01" max="9998-12-31" onChange={event => { if (event.target.validity.valid) changeAnchor(event.target.value); }}/></label>
    </div>

    <div className="capacity-overview-heading">
      <div><h2>{mode === 'week' ? 'Weekoverzicht' : 'Maandoverzicht'}</h2><p>{dateLabel(periods[0].startDate)} – {dateLabel(periods[periods.length - 1].endDate)}</p></div>
      <div className="capacity-navigation">
        <button type="button" aria-label={`Vorige ${count} ${mode === 'week' ? 'weken' : 'maanden'}`} onClick={() => changeAnchor(shiftAnchor(anchor, mode, -count))}><ChevronLeft size={17}/></button>
        <button type="button" className="capacity-today" onClick={() => changeAnchor(localToday())}>Vandaag</button>
        <button type="button" aria-label={`Volgende ${count} ${mode === 'week' ? 'weken' : 'maanden'}`} onClick={() => changeAnchor(shiftAnchor(anchor, mode, count))}><ChevronRight size={17}/></button>
      </div>
    </div>

    {error ? <div className="capacity-error" role="alert"><strong>Capaciteit is niet beschikbaar</strong><p>{error}</p><span>Herstel eerst de projectgegevens om de bezetting te kunnen berekenen.</span></div> : <>
      {projects.length === 0 && people.length > 0 && <div className="capacity-notice"><BriefcaseBusiness size={18}/><span>Er zijn nog geen projecten. Voeg medewerkers en hun uren aan een project toe om de bezetting te zien.</span><button type="button" onClick={onProjects}>Naar projecten</button></div>}
      {visiblePeople.length === 0 ? <div className="capacity-empty"><UsersRound size={26}/><h2>{people.length === 0 ? 'Nog geen medewerkers' : 'Geen medewerkers in dit team'}</h2><p>{people.length === 0 ? 'Voeg eerst medewerkers met contracturen toe via Medewerkers.' : 'Kies een ander team om de capaciteit te bekijken.'}</p></div> : <div className="capacity-table-card">
        <div className="capacity-table-scroll" role="region" aria-label="Capaciteit per medewerker en periode" tabIndex={0}>
          <table className={`capacity-table capacity-table-${mode}`}>
            <caption className="sr-only">Ingeplande uren ten opzichte van contracturen. Selecteer een periode bij een medewerker om de projecten te bekijken.</caption>
            <thead><tr><th scope="col" className="capacity-person-column">Medewerker</th>{periods.map(period => <th scope="col" key={period.key}><strong>{period.label}</strong><span>{period.sublabel}</span></th>)}</tr></thead>
            <tbody>{rows.map(({ person, values }) => <tr key={person.id}>
              <th scope="row" className="capacity-person-column"><div className="capacity-person"><div className={`person-avatar ${person.color || 'mint'}`} aria-hidden="true">{person.initials || person.name.slice(0, 1)}</div><div><strong>{person.name}</strong><span>{person.team || 'Geen team'}</span><small>{formatHours(person.contract)} u contract / week</small></div></div></th>
              {periods.map((period, index) => <td key={period.key}><CapacityCell person={person} period={period} value={values[index]} selected={selection?.personId === person.id && selection?.periodKey === period.key} onSelect={() => setSelection(current => current?.personId === person.id && current?.periodKey === period.key ? null : { personId: person.id, periodKey: period.key })}/></td>)}
            </tr>)}</tbody>
          </table>
        </div>
        <div className="capacity-table-footer"><span>{visiblePeople.length} {visiblePeople.length === 1 ? 'medewerker' : 'medewerkers'}{team ? ` · ${team}` : ' · Alle teams'}</span><span>Klik op een bolletje voor de projecten.</span></div>
      </div>}

      {detail && <section className="capacity-detail" aria-label={`Projecten van ${detail.person.name}`}>
        <div className="capacity-detail-heading"><div><div className="eyebrow">PROJECTEN IN DEZE PERIODE</div><h2>{detail.person.name} · {detail.period.label}</h2><p>{dateLabel(detail.period.startDate)} – {dateLabel(detail.period.endDate)}</p></div><button type="button" className="capacity-close" aria-label="Projectdetails sluiten" onClick={() => setSelection(null)}><X size={18}/></button></div>
        <dl className="capacity-detail-totals"><div><dt>Ingepland</dt><dd>{formatHours(detail.value.usedHours)} u</dd></div><div><dt>Contracturen</dt><dd>{formatHours(detail.value.contractHours)} u</dd></div><div className={detail.value.overbooked ? 'is-over' : ''}><dt>{detail.value.overbooked ? 'Te veel ingepland' : 'Nog beschikbaar'}</dt><dd>{formatHours(Math.abs(detail.value.remainingHours))} u</dd></div></dl>
        {detail.value.leaveDays > 0 && <p className="capacity-detail-empty">{detail.value.leaveDays} {detail.value.leaveDays === 1 ? 'werkdag' : 'werkdagen'} verlof in deze periode: {formatHours(detail.value.leaveHours)} contracturen vervallen. Projecturen op deze verlofdagen tellen niet mee.</p>}
        {detail.value.breakdown.length > 0 ? <div className="capacity-breakdown-scroll"><table className="capacity-breakdown"><thead><tr><th scope="col">Project</th><th scope="col">Planning</th><th scope="col">Uren / week</th><th scope="col">In deze periode</th></tr></thead><tbody>{detail.value.breakdown.map(item => <tr key={`${item.projectId}-${item.allocationId}`}><td><strong>{item.projectName}</strong><span>Exact: {item.exactCode} · {item.projectTeam}</span></td><td>{dateLabel(item.startDate)} – {dateLabel(item.endDate)}<span>{item.workdays} {item.workdays === 1 ? 'werkdag' : 'werkdagen'} in deze periode</span></td><td>{formatHours(item.hoursPerWeek)} u</td><td><strong>{formatHours(item.hours)} u</strong></td></tr>)}</tbody></table></div> : <p className="capacity-detail-empty">Geen projecturen in deze periode.</p>}
        <button type="button" className="secondary-button" onClick={onProjects}>Planning aanpassen bij Projecten</button>
      </section>}
    </>}

    <div className="capacity-explanation"><div className="capacity-legend"><span><i className="planned"/> Ingepland</span><span><i className="over"/> Meer dan contracturen</span><span><i className="empty"/> Geen projecturen</span></div><p>Contracturen zijn de som van de ingevulde uren van maandag t/m vrijdag. De beschikbare uren in een week of maand volgen deze persoonlijke werkdagen, verminderd met verlof. Bij een hele week verlof is de capaciteit 0 uur.</p><p>Projecturen tellen alleen binnen de ingeplande begin- en einddatum. We verdelen de projecturen per week over vijf werkdagen (maandag t/m vrijdag); op verlofdagen vervallen die uren. Feestdagen zijn nog niet apart verrekend.</p><p>Het teamfilter selecteert medewerkers. Hun projecten uit alle teams tellen mee.</p></div>
  </section>;
}
