import { Link } from 'react-router-dom';
import { categoryColor, day, fmtTime, mon, money } from '../utils';
import { Stars } from './ui';

export default function EventCard({ event: e }) {
  const left = e.capacity - e.registeredCount;
  const full = left <= 0;
  return (
    <Link to={`/events/${e._id}`} className="group flex overflow-hidden rounded-xl border border-ink/10 bg-white transition hover:border-brand hover:shadow-md">
      <div className={`flex w-24 shrink-0 flex-col items-center justify-center border-r-2 border-dashed border-mist ${categoryColor[e.category]}`}>
        <span className="font-display text-4xl font-extrabold leading-none">{day(e.startDate)}</span>
        <span className="mt-1 text-sm font-bold">{mon(e.startDate)}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-4">
        <p className="text-xs font-bold text-brand">{e.category}</p>
        <h3 className="mt-0.5 text-lg font-bold leading-snug group-hover:text-brand">{e.title}</h3>
        <p className="mt-1 text-sm text-ink/60">{fmtTime(e.startDate)} at {e.venue?.name}, {e.venue?.city}</p>
        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3 text-sm">
          <span className="font-bold">{money(e.price)}</span>
          {e.avgRating && <span className="flex items-center gap-1"><Stars value={e.avgRating} size="text-sm" /><span className="text-ink/60">{e.avgRating}</span></span>}
          <span className={full ? 'font-bold text-bad' : left <= 10 ? 'font-bold text-amber-700' : 'text-ink/60'}>
            {full ? 'Sold out' : `${left} seats left`}
          </span>
        </div>
      </div>
    </Link>
  );
}
