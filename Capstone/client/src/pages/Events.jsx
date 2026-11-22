import { useEffect, useState } from 'react';
import api, { errMsg } from '../api';
import EventCard from '../components/EventCard';
import { Empty, Loading, Notice } from '../components/ui';
import { CATEGORIES } from '../utils';

const blank = { search: '', category: 'all', when: 'upcoming', price: 'any', from: '', to: '' };

export default function Events() {
  const [f, setF] = useState(blank);
  const [events, setEvents] = useState(null);
  const [error, setError] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  useEffect(() => {
    const t = setTimeout(() => {
      const params = Object.fromEntries(Object.entries(f).filter(([, v]) => v && v !== 'all' && v !== 'any'));
      params.when = f.when;
      api.get('/events', { params })
        .then((r) => { setEvents(r.data); setError(''); })
        .catch((e) => setError(errMsg(e)));
    }, 250);
    return () => clearTimeout(t);
  }, [f]);

  const dirty = JSON.stringify(f) !== JSON.stringify(blank);

  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">Find something to go to</h1>
      <p className="mt-2 max-w-xl text-ink/70">Browse workshops, concerts, talks and runs. Register in a minute and keep your tickets in one place.</p>

      <div className="panel mt-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
        <div className="lg:col-span-2">
          <label className="label" htmlFor="s">Search</label>
          <input id="s" className="input" placeholder="Title or keyword" value={f.search} onChange={set('search')} />
        </div>
        <div><label className="label" htmlFor="c">Category</label>
          <select id="c" className="input" value={f.category} onChange={set('category')}>
            <option value="all">All categories</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select></div>
        <div><label className="label" htmlFor="p">Price</label>
          <select id="p" className="input" value={f.price} onChange={set('price')}>
            <option value="any">Any price</option><option value="free">Free</option><option value="paid">Paid</option>
          </select></div>
        <div><label className="label" htmlFor="w">Show</label>
          <select id="w" className="input" value={f.when} onChange={set('when')}>
            <option value="upcoming">Upcoming</option><option value="past">Past</option><option value="all">All</option>
          </select></div>
        <div className="grid grid-cols-2 gap-2">
          <div><label className="label" htmlFor="fr">From</label><input id="fr" type="date" className="input" value={f.from} onChange={set('from')} /></div>
          <div><label className="label" htmlFor="to">To</label><input id="to" type="date" className="input" value={f.to} onChange={set('to')} /></div>
        </div>
        {dirty && <button className="btn-ghost sm:col-span-2 lg:col-span-6 lg:justify-self-start" onClick={() => setF(blank)}>Clear filters</button>}
      </div>

      <div className="mt-6">
        <Notice>{error}</Notice>
        {!events ? <Loading /> : events.length === 0 ? (
          <Empty title="No events match" hint="Try a different keyword, or widen the dates and category." />
        ) : (
          <>
            <p className="mb-3 text-sm text-ink/60">{events.length} event{events.length > 1 && 's'}</p>
            <div className="grid gap-4 md:grid-cols-2">{events.map((e) => <EventCard key={e._id} event={e} />)}</div>
          </>
        )}
      </div>
    </div>
  );
}
