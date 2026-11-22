import { useCallback, useEffect, useState } from 'react';
import api, { errMsg } from '../../api';
import { Empty, Loading, Modal, Notice } from '../../components/ui';

const blank = { name: '', address: '', city: '', capacity: 100, facilities: '' };

export default function AdminVenues() {
  const [venues, setVenues] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  const load = useCallback(() => { api.get('/venues').then((r) => setVenues(r.data)).catch((e) => setError(errMsg(e))); }, []);
  useEffect(load, [load]);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault(); setFormError('');
    try {
      if (form._id) await api.put(`/venues/${form._id}`, form); else await api.post('/venues', form);
      setForm(null); load();
    } catch (err) { setFormError(errMsg(err)); }
  };
  const remove = async (v) => {
    if (!confirm(`Delete venue "${v.name}"?`)) return;
    try { await api.delete(`/venues/${v._id}`); setError(''); load(); } catch (err) { setError(errMsg(err)); }
  };

  if (!venues) return error ? <Notice>{error}</Notice> : <Loading />;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-ink/70">{venues.length} venues</p>
        <button className="btn-primary" onClick={() => { setFormError(''); setForm(blank); }}>Add venue</button>
      </div>
      <Notice>{error}</Notice>
      {venues.length === 0 ? <Empty title="No venues yet" hint="Add a hall, arena or studio to host events in." /> : (
        <div className="grid gap-4 md:grid-cols-2">
          {venues.map((v) => (
            <div key={v._id} className="panel p-4">
              <h3 className="text-lg font-bold">{v.name}</h3>
              <p className="text-sm text-ink/60">{v.address}, {v.city}</p>
              <p className="mt-2 text-sm"><b>{v.capacity}</b> seats · {v.eventCount} event{v.eventCount !== 1 && 's'}</p>
              {v.facilities?.length > 0 && <p className="mt-1 text-sm text-ink/70">{v.facilities.join(', ')}</p>}
              <div className="mt-3 flex gap-2">
                <button className="btn-ghost" onClick={() => { setFormError(''); setForm({ ...v, facilities: v.facilities.join(', ') }); }}>Edit</button>
                <button className="btn-ghost text-bad" onClick={() => remove(v)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {form && (
        <Modal title={form._id ? 'Edit venue' : 'Add venue'} onClose={() => setForm(null)}>
          <Notice>{formError}</Notice>
          <form onSubmit={save} className="space-y-4">
            <div><label className="label" htmlFor="vn">Name</label><input id="vn" className="input" value={form.name} onChange={set('name')} required /></div>
            <div><label className="label" htmlFor="va">Address</label><input id="va" className="input" value={form.address} onChange={set('address')} required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label" htmlFor="vc">City</label><input id="vc" className="input" value={form.city} onChange={set('city')} required /></div>
              <div><label className="label" htmlFor="vp">Capacity</label><input id="vp" type="number" min="1" className="input" value={form.capacity} onChange={set('capacity')} required /></div>
            </div>
            <div><label className="label" htmlFor="vf">Facilities (comma separated)</label><input id="vf" className="input" placeholder="Wi-Fi, Projector, Parking" value={form.facilities} onChange={set('facilities')} /></div>
            <div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={() => setForm(null)}>Cancel</button><button className="btn-primary">Save venue</button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
