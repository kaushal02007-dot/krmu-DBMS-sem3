import { useEffect, useState } from 'react';
import api, { downloadCsv, errMsg } from '../../api';
import { Loading, Notice, Stars } from '../../components/ui';
import { fmtDate, money } from '../../utils';

const Stat = ({ label, value, sub }) => (
  <div className="panel p-4">
    <p className="text-sm text-ink/60">{label}</p>
    <p className="font-display text-3xl font-extrabold">{value}</p>
    {sub && <p className="text-xs text-ink/50">{sub}</p>}
  </div>
);

export default function AdminReports() {
  const [d, setD] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { api.get('/reports/summary').then((r) => setD(r.data)).catch((e) => setError(errMsg(e))); }, []);

  if (!d) return error ? <Notice>{error}</Notice> : <Loading />;
  const t = d.totals;
  const maxRev = Math.max(1, ...d.perEvent.map((e) => e.revenue));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-ink/70">Totals across every event. Revenue counts successful payments only.</p>
        <button className="btn-primary" onClick={() => downloadCsv('/reports/events.csv', 'event-report.csv').catch((e) => setError(errMsg(e)))}>Download report (CSV)</button>
      </div>
      <Notice>{error}</Notice>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Events" value={t.events} sub={`${t.upcoming} upcoming`} />
        <Stat label="Registrations" value={t.registrations} />
        <Stat label="Attendance rate" value={`${t.attendanceRate}%`} />
        <Stat label="Revenue" value={money(t.revenue) === 'Free' ? '₹0' : money(t.revenue)} />
        <Stat label="Average rating" value={t.avgRating ?? '-'} sub={`${t.feedbackCount} reviews`} />
      </div>

      <div className="panel overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-ink/10"><tr>
            {['Event', 'Date', 'Registered', 'Filled', 'Attended', 'Revenue', 'Rating'].map((h) => <th key={h} className="th">{h}</th>)}
          </tr></thead>
          <tbody className="divide-y divide-ink/5">
            {d.perEvent.map((e) => (
              <tr key={e.id}>
                <td className="td"><b>{e.title}</b><br /><span className="text-xs text-ink/50">{e.category} at {e.venue}</span></td>
                <td className="td whitespace-nowrap">{fmtDate(e.startDate)}</td>
                <td className="td">{e.registered}/{e.capacity}</td>
                <td className="td w-32">
                  <div className="h-2 rounded bg-mist"><div className="h-2 rounded bg-brand" style={{ width: `${Math.min(100, e.fillRate)}%` }} /></div>
                  <span className="text-xs text-ink/60">{e.fillRate}%</span>
                </td>
                <td className="td">{e.attended} ({e.attendanceRate}%)</td>
                <td className="td w-40">
                  <span className="font-bold">₹{e.revenue.toLocaleString('en-IN')}</span>
                  <div className="mt-1 h-2 rounded bg-mist"><div className="h-2 rounded bg-sun" style={{ width: `${(e.revenue / maxRev) * 100}%` }} /></div>
                </td>
                <td className="td">{e.avgRating ? <span className="flex items-center gap-1"><Stars value={e.avgRating} size="text-sm" />{e.avgRating}</span> : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="panel overflow-x-auto">
        <h2 className="px-4 pt-4 text-lg font-bold">By category</h2>
        <table className="w-full">
          <thead className="border-b border-ink/10"><tr>{['Category', 'Events', 'Registrations', 'Revenue'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-ink/5">
            {d.byCategory.map((c) => (
              <tr key={c.category}><td className="td font-bold">{c.category}</td><td className="td">{c.events}</td><td className="td">{c.registered}</td><td className="td">₹{c.revenue.toLocaleString('en-IN')}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
