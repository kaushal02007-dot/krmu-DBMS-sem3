import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import PaymentModal from '../components/PaymentModal';
import FeedbackModal from '../components/FeedbackModal';
import { Loading, Notice, Stars } from '../components/ui';
import { categoryColor, fmtDateTime, fmtTime, money, payBadge } from '../utils';

export default function EventDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [event, setEvent] = useState(null);
  const [feedback, setFeedback] = useState([]);
  const [myReg, setMyReg] = useState(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [paying, setPaying] = useState(false);
  const [rating, setRating] = useState(false);

  const load = useCallback(async () => {
    try {
      const [e, f] = await Promise.all([api.get(`/events/${id}`), api.get(`/events/${id}/feedback`)]);
      setEvent(e.data);
      setFeedback(f.data);
      if (user?.role === 'participant') {
        const regs = await api.get('/registrations/mine');
        setMyReg(regs.data.find((r) => r.event._id === id && r.status === 'registered') || null);
      }
    } catch (err) {
      setError(errMsg(err));
    }
  }, [id, user]);

  useEffect(() => { load(); }, [load]);

  const register = async () => {
    if (!user) return nav('/login');
    setBusy(true); setError(''); setMsg('');
    try {
      const { data } = await api.post('/registrations', { eventId: id });
      setMyReg(data);
      if (data.paymentStatus === 'pending') setPaying(true);
      else setMsg('You are registered. See your ticket under My registrations.');
      load();
    } catch (err) { setError(errMsg(err)); } finally { setBusy(false); }
  };

  const cancel = async () => {
    if (!confirm('Cancel your registration?')) return;
    try { await api.delete(`/registrations/${myReg._id}`); setMsg('Registration cancelled.'); setMyReg(null); load(); }
    catch (err) { setError(errMsg(err)); }
  };

  if (!event) return error ? <Notice>{error}</Notice> : <Loading />;

  const left = event.capacity - event.registeredCount;
  const ended = new Date(event.endDate) < new Date();
  const started = new Date(event.startDate) < new Date();
  const myFeedback = feedback.find((f) => f.user?._id === user?.id);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Link to="/" className="text-sm font-bold text-brand">Back to events</Link>
        <span className={`badge ml-3 ${categoryColor[event.category]}`}>{event.category}</span>
        <h1 className="mt-2 text-4xl font-extrabold tracking-tight">{event.title}</h1>
        {event.avgRating && (
          <p className="mt-2 flex items-center gap-2 text-sm"><Stars value={event.avgRating} /> <b>{event.avgRating}</b> <span className="text-ink/60">({event.feedbackCount} review{event.feedbackCount > 1 && 's'})</span></p>
        )}
        <p className="mt-5 whitespace-pre-line leading-relaxed text-ink/80">{event.description}</p>

        <section className="mt-8">
          <h2 className="text-2xl font-extrabold">Feedback</h2>
          {feedback.length === 0 ? <p className="mt-2 text-sm text-ink/60">No feedback yet.</p> : (
            <ul className="mt-3 space-y-3">
              {feedback.map((f) => (
                <li key={f._id} className="panel p-4">
                  <div className="flex items-center justify-between"><b>{f.user?.name}</b><Stars value={f.rating} size="text-base" /></div>
                  {f.comment && <p className="mt-1 text-sm text-ink/80">{f.comment}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <aside className="h-fit space-y-4 lg:sticky lg:top-24">
        <div className="panel p-5">
          <p className="font-display text-3xl font-extrabold">{money(event.price)}</p>
          <dl className="mt-4 space-y-3 text-sm">
            <div><dt className="font-bold">When</dt><dd className="text-ink/70">{fmtDateTime(event.startDate)} to {fmtTime(event.endDate)}</dd></div>
            <div><dt className="font-bold">Where</dt><dd className="text-ink/70">{event.venue?.name}<br />{event.venue?.address}, {event.venue?.city}</dd></div>
            {event.venue?.facilities?.length > 0 && <div><dt className="font-bold">Venue facilities</dt><dd className="text-ink/70">{event.venue.facilities.join(', ')}</dd></div>}
            <div><dt className="font-bold">Seats</dt><dd className="text-ink/70">{left > 0 ? `${left} of ${event.capacity} left` : 'Sold out'}</dd></div>
          </dl>

          <div className="mt-5">
            <Notice>{error}</Notice>
            <Notice type="ok">{msg}</Notice>
            {user?.role === 'admin' ? (
              <p className="text-sm text-ink/60">Organizer accounts manage events from the dashboard.</p>
            ) : ended ? (
              <p className="text-sm text-ink/60">This event has ended.</p>
            ) : myReg ? (
              <div className="space-y-2">
                <p className="text-sm">You are registered. Ticket <b className="font-mono">{myReg.ticketCode}</b> <span className={`badge ${payBadge[myReg.paymentStatus]}`}>{myReg.paymentStatus}</span></p>
                {myReg.paymentStatus === 'pending' && <button className="btn-primary w-full" onClick={() => setPaying(true)}>Pay {money(event.price)}</button>}
                <Link to="/my-registrations" className="btn-ghost w-full">View registration</Link>
                {!started && <button className="btn-ghost w-full text-bad" onClick={cancel}>Cancel registration</button>}
              </div>
            ) : (
              <button className="btn-primary w-full" onClick={register} disabled={busy || left <= 0}>
                {left <= 0 ? 'Sold out' : busy ? 'Registering…' : user ? 'Register' : 'Log in to register'}
              </button>
            )}
            {myReg && started && (
              <button className="btn-ghost mt-2 w-full" onClick={() => setRating(true)}>{myFeedback ? 'Edit your feedback' : 'Give feedback'}</button>
            )}
          </div>
        </div>
      </aside>

      {paying && myReg && <PaymentModal registration={myReg} onClose={() => setPaying(false)} onPaid={load} />}
      {rating && <FeedbackModal event={event} existing={myFeedback} onClose={() => setRating(false)} onSaved={load} />}
    </div>
  );
}
