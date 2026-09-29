import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { periodLeaveHours } from './leaveModel.js';
import { formatHours } from './projectModel.js';

export default function LeaveFields({ periods, person, onChange }) {
  const update = (index, field, value) => onChange(periods.map((period, i) => i === index ? { ...period, [field]: value } : period));
  return <section className="field full employee-leave" aria-labelledby="leave-title">
    <div className="days-heading"><span id="leave-title">Verlof</span><small>Begin- en einddatum tellen mee</small></div>
    <p>Op verlofdagen zijn er geen beschikbare uren en worden geen projecturen gemaakt. Bij een hele week verlof is de capaciteit 0 uur.</p>
    {periods.map((period, index) => <div className="leave-row" key={index}>
      <label className="field"><span>Van</span><input aria-label={`Verlof ${index + 1} begindatum`} required type="date" value={period.startDate} onChange={e => update(index, 'startDate', e.target.value)}/></label>
      <label className="field"><span>Tot en met</span><input aria-label={`Verlof ${index + 1} einddatum`} required type="date" min={period.startDate || undefined} value={period.endDate} onChange={e => update(index, 'endDate', e.target.value)}/></label>
      <button type="button" className="cancel-button" aria-label={`Verlof ${index + 1} verwijderen`} onClick={() => onChange(periods.filter((_, i) => i !== index))}><Trash2 size={16}/></button>
      <span className="leave-period-hours">{formatHours(periodLeaveHours(person, period.startDate, period.endDate))} contracturen verlof in deze periode</span>
    </div>)}
    <button type="button" className="secondary-button" onClick={() => onChange([...periods, { startDate: '', endDate: '' }])}><Plus size={16}/> Verlof toevoegen</button>
  </section>;
}
