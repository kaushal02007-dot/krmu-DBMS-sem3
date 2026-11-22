import { useEffect, useState } from 'react';
import api, { downloadCsv, errMsg } from '../../api';
import { Empty, Loading, Notice } from '../../components/ui';
import { fmtDate, payBadge } from '../../utils';

export default function AdminParticipants() {
  const [events, setEvents] = useState(null);
  const [eventId, setEventId] = useState('');
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/events', { params: { when: 'all' } }).then((r) => {
      setEvents(r.data);
      const now = new Date();
      const pick = r.data.filter((e) => new Date(e.startDate) <= now).pop() || r.data[0]; // latest started event
      if (pick) setEventId(pick._id);
    }).catch((e) => setError(errMsg(e)));
  }, []);

  const load = (id = eventId) => id && api.get(`/events/${id}/participants`).then((r) => setRows(r.data)).catch((e) => setError(errMsg(e)));
  useEffect(() => { setRows(null); load(); }, [eventId]); // eslint-disable-line

  const toggle = async (r) => {
    try {
      await api.patch(`/registrations/${r._id}/attendance`, { attended: !r.attended });
      setRows((rs) => rs.map((x) => (x._id === r._id ? { ...x, attended: !r.attended } : x)));
    } catch (e) { setError(errMsg(e)); }
  };

  if (!events) return error ? <Notice>{error}</Notice> : <Loading />;
  if (events.length === 0) return <Empty title="No events yet" hint="Create an event to see its participants here." />;

  const active = (rows || []).filter((r) => r.status === 'registered');
  const attended = active.filter((r) => r.attended).length;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-64 flex-1"><label className="label" htmlFor="ev">Event</label>
          <select id="ev" className="input" value={eventId} onChange={(e) => setEventId(e.target.value)}>
            {events.map((e) => <option key={e._id} value={e._id}>{e.title} ({fmtDate(e.startDate)})</option>)}
          </select></div>
        <button className="btn-ghost" onClick={() => downloadCsv(`/events/${eventId}/participants.csv`, 'participants.csv').catch((e) => setError(errMsg(e)))}>Download list (CSV)</button>
      </div>
      <Notice>{error}</Notice>
      {!rows ? <Loading /> : rows.length === 0 ? <Empty title="No registrations yet" /> : (
        <>
          <p className="mb-3 text-sm text-ink/70"><b>{active.length}</b> registered · <b>{attended}</b> attended · tick the box when someone arrives</p>
          <div className="panel overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-ink/10"><tr>{['Attended', 'Name', 'Contact', 'Ticket', 'Payment', 'Status'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-ink/5">
                {rows.map((r) => (
                  <tr key={r._id} className={r.status === 'cancelled' ? 'opacity-50' : ''}>
                    <td className="td"><input type="checkbox" className="h-5 w-5 accent-brand" checked={r.attended} disabled={r.status !== 'registered'} onChange={() => toggle(r)} aria-label={`Mark ${r.user?.name} attended`} /></td>
                    <td className="td font-bold">{r.user?.name}</td>
                    <td className="td">{r.user?.email}<br /><span className="text-xs text-ink/50">{r.user?.phone}</span></td>
                    <td className="td font-mono text-xs">{r.ticketCode}</td>
                    <td className="td"><span className={`badge ${payBadge[r.paymentStatus]}`}>{r.paymentStatus}</span></td>
                    <td className="td">{r.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
