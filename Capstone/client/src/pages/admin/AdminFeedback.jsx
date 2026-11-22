import { useEffect, useState } from 'react';
import api, { errMsg } from '../../api';
import { Empty, Loading, Notice, Stars } from '../../components/ui';
import { fmtDate } from '../../utils';

export default function AdminFeedback() {
  const [events, setEvents] = useState([]);
  const [eventId, setEventId] = useState('');
  const [list, setList] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { api.get('/events', { params: { when: 'all' } }).then((r) => setEvents(r.data)).catch((e) => setError(errMsg(e))); }, []);
  useEffect(() => {
    setList(null);
    api.get('/feedback', { params: eventId ? { eventId } : {} }).then((r) => setList(r.data)).catch((e) => setError(errMsg(e)));
  }, [eventId]);

  const avg = list?.length ? (list.reduce((s, f) => s + f.rating, 0) / list.length).toFixed(1) : null;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-64"><label className="label" htmlFor="fe">Event</label>
          <select id="fe" className="input" value={eventId} onChange={(e) => setEventId(e.target.value)}>
            <option value="">All events</option>{events.map((e) => <option key={e._id} value={e._id}>{e.title}</option>)}
          </select></div>
        {avg && <p className="flex items-center gap-2 text-sm"><Stars value={avg} /> <b>{avg}</b> from {list.length} review{list.length > 1 && 's'}</p>}
      </div>
      <Notice>{error}</Notice>
      {!list ? <Loading /> : list.length === 0 ? <Empty title="No feedback yet" hint="Participants can rate an event once it has started." /> : (
        <ul className="grid gap-3 md:grid-cols-2">
          {list.map((f) => (
            <li key={f._id} className="panel p-4">
              <div className="flex items-center justify-between"><b>{f.user?.name}</b><Stars value={f.rating} size="text-base" /></div>
              <p className="text-xs text-ink/50">{f.event?.title} · {fmtDate(f.createdAt)}</p>
              <p className="mt-2 text-sm">{f.comment || <span className="text-ink/50">No comment</span>}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
