import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api';
import PaymentModal from '../components/PaymentModal';
import FeedbackModal from '../components/FeedbackModal';
import { Empty, Loading, Notice, Stars } from '../components/ui';
import { categoryColor, day, fmtDate, fmtDateTime, fmtTime, mon, money, payBadge } from '../utils';

export default function MyRegistrations() {
  const [regs, setRegs] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(null);
  const [paying, setPaying] = useState(null);
  const [rating, setRating] = useState(null);
  const [tab, setTab] = useState('active');

  const load = useCallback(async () => {
    try {
      const [r, f] = await Promise.all([api.get('/registrations/mine'), api.get('/feedback/mine')]);
      setRegs(r.data);
      setFeedback(f.data);
    } catch (e) { setError(errMsg(e)); }
  }, []);
  useEffect(() => { load(); }, [load]);

  const cancel = async (r) => {
    if (!confirm(`Cancel your registration for "${r.event.title}"?${r.paymentStatus === 'paid' ? ' Your payment will be refunded (simulated).' : ''}`)) return;
    try { await api.delete(`/registrations/${r._id}`); load(); } catch (e) { setError(errMsg(e)); }
  };

  if (!regs) return error ? <Notice>{error}</Notice> : <Loading />;
  const list = regs.filter((r) => (tab === 'active' ? r.status === 'registered' : r.status === 'cancelled'));

  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tight">My registrations</h1>
      <div className="mt-4 flex gap-2">
        {[['active', 'Active'], ['cancelled', 'Cancelled']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-lg px-3 py-1.5 text-sm font-bold ${tab === k ? 'bg-ink text-white' : 'bg-white'}`}>{l}</button>
        ))}
      </div>
      <div className="mt-4"><Notice>{error}</Notice></div>

      {list.length === 0 ? (
        <Empty title={tab === 'active' ? 'No registrations yet' : 'Nothing cancelled'} hint={tab === 'active' ? 'Pick an event and register to see your ticket here.' : ''}>
          {tab === 'active' && <Link className="btn-primary" to="/">Browse events</Link>}
        </Empty>
      ) : (
        <ul className="space-y-4">
          {list.map((r) => {
            const e = r.event;
            const started = new Date(e.startDate) < new Date();
            const fb = feedback.find((f) => f.event === e._id);
            return (
              <li key={r._id} className="panel overflow-hidden">
                <div className="flex">
                  <div className={`flex w-24 shrink-0 flex-col items-center justify-center border-r-2 border-dashed border-mist ${categoryColor[e.category]}`}>
                    <span className="font-display text-4xl font-extrabold leading-none">{day(e.startDate)}</span>
                    <span className="mt-1 text-sm font-bold">{mon(e.startDate)}</span>
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <Link to={`/events/${e._id}`} className="text-lg font-bold hover:text-brand">{e.title}</Link>
                        <p className="text-sm text-ink/60">{fmtTime(e.startDate)} at {e.venue?.name}, {e.venue?.city}</p>
                      </div>
                      <span className={`badge ${payBadge[r.paymentStatus]}`}>{r.paymentStatus === 'pending' ? 'payment due' : r.paymentStatus}</span>
                    </div>
                    <p className="mt-2 text-sm">Ticket <b className="font-mono">{r.ticketCode}</b>{r.attended && <span className="badge ml-2 bg-emerald-100 text-emerald-800">attended</span>}</p>
                    {fb && <p className="mt-1 flex items-center gap-2 text-sm text-ink/60">Your rating <Stars value={fb.rating} size="text-sm" /></p>}

                    {r.status === 'registered' && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {r.paymentStatus === 'pending' && <button className="btn-primary" onClick={() => setPaying(r)}>Pay {money(e.price)}</button>}
                        {started && <button className="btn-ghost" onClick={() => setRating(r)}>{fb ? 'Edit feedback' : 'Give feedback'}</button>}
                        {!started && <button className="btn-ghost text-bad" onClick={() => cancel(r)}>Cancel</button>}
                        <button className="btn-ghost" onClick={() => setOpen(open === r._id ? null : r._id)}>{open === r._id ? 'Hide details' : 'View details'}</button>
                      </div>
                    )}
                  </div>
                </div>
                {open === r._id && (
                  <div className="border-t border-ink/10 bg-mist/60 p-4 text-sm">
                    <p><b>When:</b> {fmtDateTime(e.startDate)} to {fmtTime(e.endDate)}</p>
                    <p><b>Address:</b> {e.venue?.address}, {e.venue?.city}</p>
                    <p><b>Registered on:</b> {fmtDate(r.createdAt)}</p>
                    <p className="mt-2 font-bold">Payments</p>
                    {r.payments.length === 0 ? <p className="text-ink/60">{r.paymentStatus === 'free' ? 'Free event. Nothing to pay.' : 'No payment attempts yet.'}</p> : (
                      <ul className="mt-1 space-y-1">
                        {r.payments.map((p) => (
                          <li key={p._id} className="flex flex-wrap items-center gap-x-3">
                            <span className={`badge ${payBadge[p.status]}`}>{p.status}</span>
                            <span>{money(p.amount)} via {p.method} ({p.reference})</span>
                            <span className="font-mono text-xs text-ink/60">{p.transactionId}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {paying && <PaymentModal registration={paying} onClose={() => setPaying(null)} onPaid={load} />}
      {rating && <FeedbackModal event={rating.event} existing={feedback.find((f) => f.event === rating.event._id)} onClose={() => setRating(null)} onSaved={load} />}
    </div>
  );
}
