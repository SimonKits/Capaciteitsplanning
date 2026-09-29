import React, { useState } from 'react';
import { annualLeave } from './leaveModel.js';
import { formatHours } from './projectModel.js';

export default function LeaveBudget({ person, onChange }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const budget = person.leaveBudget || { annualHours: '', autoConcept: true, years: {} };
  const change = patch => onChange({ ...budget, ...patch });
  const summary = annualLeave(person, year);
  const override = Object.hasOwn(budget.years || {}, year);
  const configured = String((override ? budget.years[year] : budget.annualHours) ?? '') !== ''; 
  return <section className="field full leave-budget" aria-label="Jaarlijks verlofbudget">
    <div className="days-heading"><span>Verlofbudget</span><small>In contracturen</small></div>
    <label className="field"><span>Standaard verlofuren per jaar</span><input type="number" min="0" max="10000" step="0.25" value={budget.annualHours ?? ''} placeholder="Bijv. 200" onChange={event => change({ annualHours: event.target.value })}/></label>
    <p>Dit budget geldt ieder jaar opnieuw. Kies een jaar om daarvan af te wijken. Verlofuren worden berekend met de ingevulde uren per werkdag.</p>
    <div className="leave-year-controls"><button className="cancel-button" type="button" disabled={year <= 1900} onClick={() => setYear(year - 1)} aria-label="Vorig verlofjaar">‹</button><label className="field"><span>Verlofjaar</span><input type="number" min="1900" max="9998" step="1" value={year} onChange={event => { const next = Number(event.target.value); if (Number.isInteger(next) && next >= 1900 && next <= 9998) setYear(next); }}/></label><button className="cancel-button" type="button" disabled={year >= 9998} onClick={() => setYear(year + 1)} aria-label="Volgend verlofjaar">›</button></div>
    <label className="leave-toggle"><input type="checkbox" checked={override} onChange={event => { const years = { ...budget.years }; if (event.target.checked) years[year] = summary.budget; else delete years[year]; change({ years }); }}/><span>Afwijkend budget voor {year}</span></label>
    {override && <label className="field"><span>Verlofuren in {year}</span><input type="number" min="0" max="10000" step="0.25" value={budget.years[year]} onChange={event => change({ years: { ...budget.years, [year]: event.target.value } })}/></label>}
    <label className="leave-toggle"><input type="checkbox" checked={budget.autoConcept !== false} onChange={event => change({ autoConcept: event.target.checked })}/><span>Resterende uren automatisch als conceptverlof plannen</span></label>
    <p>Conceptverlof vult de laatste beschikbare werkdagen van ieder jaar, vanaf vandaag. Het telt mee in capaciteit en projecturen, maar blijft apart van echt gepland verlof. Zet de optie uit om alleen echt verlof mee te tellen. Een rest van een werkdag wordt in uren gepland.</p>
    <div className="leave-balance" aria-live="polite"><div><span>Budget {year}</span><strong>{configured ? `${formatHours(summary.budget)} u` : 'Nog niet ingevuld'}</strong></div><div><span>Echt gepland</span><strong>{formatHours(summary.planned)} u</strong></div><div><span>{configured && summary.balance < 0 ? 'Boven budget' : 'Nog te besteden'}</span><strong>{configured ? `${formatHours(Math.abs(summary.balance))} u` : '—'}</strong></div><div><span>Conceptverlof</span><strong>{formatHours(summary.conceptHours)} u</strong></div></div>
    {configured && summary.balance < 0 && <p role="status">Het echte verlof overschrijdt het budget met {formatHours(-summary.balance)} uur.</p>}
    {summary.unallocated > 0 && budget.autoConcept !== false && <p role="status">{formatHours(summary.unallocated)} uur past niet meer op de beschikbare werkdagen van {year}.</p>}
    {summary.concept.size > 0 && <details className="leave-concept"><summary>Conceptplanning {year} bekijken</summary><ul>{[...summary.concept].sort(([a], [b]) => a.localeCompare(b)).map(([date, hours]) => <li key={date}>{new Date(`${date}T12:00:00`).toLocaleDateString('nl-NL')} <strong>{formatHours(hours)} uur</strong></li>)}</ul></details>}
    <p>Verlof over een jaargrens wordt verdeeld over de betreffende jaren. Dubbele verlofdatums tellen één keer. Er is geen automatische overdracht van saldo naar een volgend jaar.</p>
  </section>;
}
