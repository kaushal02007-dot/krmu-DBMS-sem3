import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../../api';
import { Empty, Loading, Modal, Notice } from '../../components/ui';
import { CATEGORIES, fmtDateTime, money, toInputDT } from '../../utils';

const blank = { title: '', description: '', category: 'Technology', startDate: '', endDate: '', venue: '', capacity: 50, price: 0 };

export default function AdminEvents() {
  const [events, setEvents] = useState(null);
  const [venues, setVenues] = useState([]);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    Promise.all([api.get('/events', { params: { when: 'all' } }), api.get('/venues')])
      .then(([e, v]) => { setEvents(e.data); setVenues(v.data); })
      .catch((e) => setError(errMsg(e)));
  }, []);
  useEffect(load, [load]);

  const open = (e) => {
    setFormError('');
    setForm(e ? { ...e, venue: e.venue?._id, startDate: toInputDT(e.startDate), endDate: toInputDT(e.endDate) } : { ...blank, venue: venues[0]?._id || '' });
  };
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true); setFormError('');
    const body = { ...form, startDate: new Date(form.startDate).toISOString(), endDate: new Date(form.endDate).toISOString() };
    try {
      if (form._id) await api.put(`/events/${form._id}`, body); else await api.post('/events', body);
      setForm(null); load();
    } catch (err) { setFormError(errMsg(err)); } finally { setBusy(false); }
  };

  const remove = async (ev) => {
    if (!confirm(`Delete "${ev.title}"? This also removes its ${ev.registeredCount} registrations, payments and feedback.`)) return;
    try { await api.delete(`/events/${ev._id}`); load(); } catch (err) { setError(errMsg(err)); }
  };

  if (!events) return error ? <Notice>{error}</Notice> : <Loading />;
  const selected = venues.find((v) => v._id === form?.venue);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-ink/70">{events.length} events</p>
        <button className="btn-primary" onClick={() => open(null)} disabled={venues.length === 0}>Create event</button>
      </div>
      {venues.length === 0 && <Notice>Add a venue first. Every event needs one.</Notice>}
      <Notice>{error}</Notice>

      {events.length === 0 ? <Empty title="No events yet" hint="Create your first event to open registrations." /> : (
        <div className="panel overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-ink/10"><tr>{['Event', 'When', 'Venue', 'Price', 'Registered', ''].map((h, i) => <th key={i} className="th">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-ink/5">
              {events.map((e) => (
                <tr key={e._id}>
                  <td className="td"><b>{e.title}</b><br /><span className="text-xs text-ink/50">{e.category}</span></td>
                  <td className="td whitespace-nowrap">{fmtDateTime(e.startDate)}</td>
                  <td className="td">{e.venue?.name}</td>
                  <td className="td">{money(e.price)}</td>
                  <td className="td">{e.registeredCount}/{e.capacity}</td>
                  <td className="td whitespace-nowrap text-right">
                    <button className="btn-ghost mr-2" onClick={() => open(e)}>Edit</button>
                    <button className="btn-ghost text-bad" onClick={() => remove(e)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {form && (
        <Modal wide title={form._id ? 'Edit event' : 'Create event'} onClose={() => setForm(null)}>
          <Notice>{formError}</Notice>
          <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><label className="label" htmlFor="t">Title</label><input id="t" className="input" value={form.title} onChange={set('title')} required /></div>
            <div className="sm:col-span-2"><label className="label" htmlFor="d">Description</label><textarea id="d" rows={4} className="input" value={form.description} onChange={set('description')} required /></div>
            <div><label className="label" htmlFor="cat">Category</label>
              <select id="cat" className="input" value={form.category} onChange={set('category')}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
            <div><label className="label" htmlFor="v">Venue</label>
              <select id="v" className="input" value={form.venue} onChange={set('venue')} required>
                {venues.map((v) => <option key={v._id} value={v._id}>{v.name} ({v.capacity} seats)</option>)}
              </select></div>
            <div><label className="label" htmlFor="s">Starts</label><input id="s" type="datetime-local" className="input" value={form.startDate} onChange={set('startDate')} required /></div>
            <div><label className="label" htmlFor="e">Ends</label><input id="e" type="datetime-local" className="input" value={form.endDate} onChange={set('endDate')} required /></div>
            <div><label className="label" htmlFor="cap">Capacity{selected ? ` (max ${selected.capacity})` : ''}</label><input id="cap" type="number" min="1" max={selected?.capacity} className="input" value={form.capacity} onChange={set('capacity')} required /></div>
            <div><label className="label" htmlFor="pr">Price in ₹ (0 for free)</label><input id="pr" type="number" min="0" className="input" value={form.price} onChange={set('price')} required /></div>
            <div className="flex justify-end gap-2 sm:col-span-2">
              <button type="button" className="btn-ghost" onClick={() => setForm(null)}>Cancel</button>
              <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save event'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
