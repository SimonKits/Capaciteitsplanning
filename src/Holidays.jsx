import React, { useState } from 'react';
import { Check, Plus, Trash2, X } from 'lucide-react';
import { Dialog } from './Projects.jsx';
import { validHolidays } from './holidayModel.js';

export default function Holidays({ holidays, year, onSave, onClose, storageError }) {
  const [draft, setDraft] = useState(() => holidays.map(item => ({ ...item })));
  const [error, setError] = useState('');
  const update = (index, patch) => setDraft(draft.map((item, i) => i === index ? { ...item, ...patch } : item));
  function submit(event) {
    event.preventDefault();
    if (!validHolidays(draft)) { setError('Vul voor iedere feestdag een naam en geldige datum in. Elke datum mag maar één keer voorkomen.'); return; }
    if (onSave(draft.map(item => ({ ...item, name: item.name.trim() })).sort((a, b) => a.date.localeCompare(b.date))) === false) { setError('Opslaan is niet gelukt. Je invoer blijft hier staan.'); return; }
    onClose();
  }
  return <Dialog titleId="holiday-title" onClose={onClose} className="holiday-editor"><div className="project-dialog-header"><div><div className="eyebrow">VOOR ALLE MEDEWERKERS</div><h2 id="holiday-title">Feestdagen</h2><p>Beheer datums voor alle jaren. Feestdagen gelden voor iedereen en worden niet jaarlijks herhaald.</p></div><button type="button" className="modal-close" aria-label="Feestdagen sluiten" onClick={onClose}><X size={18}/></button></div>
    <form onSubmit={submit}><div className="project-dialog-body"><p className="holiday-info">Op deze datums zijn capaciteit en projecturen 0. Een feestdag kost ook geen verlofuren binnen een vakantie. De datum staat alleen hier, niet tussen het persoonlijke verlof.</p>{(error || storageError) && <p role="alert" className="project-form-error">{storageError || error}</p>}
      {draft.length === 0 && <p className="holiday-info">Nog geen feestdagen toegevoegd.</p>}
      {draft.map((item, index) => <div className="holiday-row" key={index}><label className="project-field"><span>Naam feestdag</span><input required aria-label={`Naam feestdag ${index + 1}`} value={item.name} placeholder="Bijv. Nieuwjaarsdag" onChange={event => update(index, { name: event.target.value })}/></label><label className="project-field"><span>Datum</span><input required aria-label={`Datum feestdag ${index + 1}`} type="date" value={item.date} onChange={event => update(index, { date: event.target.value })}/></label><button type="button" className="project-icon-button" aria-label={`Feestdag ${index + 1} verwijderen`} onClick={() => setDraft(draft.filter((_, i) => i !== index))}><Trash2 size={16}/></button></div>)}
      <button type="button" className="secondary-button" disabled={!!storageError} onClick={() => setDraft([...draft, { name: '', date: `${year}-01-01` }])}><Plus size={16}/> Feestdag toevoegen</button>
    </div><div className="project-dialog-footer"><button type="button" className="cancel-button" onClick={onClose}>Annuleren</button><button type="submit" className="primary-button" disabled={!!storageError}><Check size={16}/> Feestdagen opslaan</button></div></form>
  </Dialog>;
}
