import { useState } from 'react';
import api, { errMsg } from '../api';
import { money } from '../utils';
import { Modal, Notice } from './ui';

const BANKS = ['State Bank of India', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Punjab National Bank'];

export default function PaymentModal({ registration, onClose, onPaid }) {
  const ev = registration.event;
  const [method, setMethod] = useState('card');
  const [f, setF] = useState({ cardNumber: '', expiry: '', cvv: '', upiId: '', bank: BANKS[0] });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const pay = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { data } = await api.post('/payments', { registrationId: registration._id, method, ...f });
      setDone(data.payment);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  if (done)
    return (
      <Modal title="Payment received" onClose={() => { onPaid(); onClose(); }}>
        <p className="text-sm text-ink/70">You are all set for <b>{ev.title}</b>.</p>
        <dl className="mt-4 space-y-1 rounded-lg bg-mist p-3 text-sm">
          <div className="flex justify-between"><dt>Amount</dt><dd className="font-bold">{money(done.amount)}</dd></div>
          <div className="flex justify-between"><dt>Transaction id</dt><dd className="font-mono">{done.transactionId}</dd></div>
          <div className="flex justify-between"><dt>Ticket</dt><dd className="font-mono">{registration.ticketCode}</dd></div>
        </dl>
        <button className="btn-primary mt-5 w-full" onClick={() => { onPaid(); onClose(); }}>Done</button>
      </Modal>
    );

  return (
    <Modal title={`Pay ${money(ev.price)}`} onClose={onClose}>
      <p className="mb-3 text-sm text-ink/70">{ev.title}</p>
      <p className="mb-4 rounded-lg bg-sun/30 px-3 py-2 text-xs">
        This is a simulated payment. No real money moves. Any card works, except numbers ending in 0000, which are declined.
      </p>
      <Notice>{error}</Notice>
      <div className="mb-4 grid grid-cols-3 gap-2" role="tablist">
        {[['card', 'Card'], ['upi', 'UPI'], ['netbanking', 'Net banking']].map(([k, label]) => (
          <button key={k} type="button" onClick={() => setMethod(k)}
            className={`rounded-lg border px-2 py-2 text-sm font-bold ${method === k ? 'border-brand bg-brand-soft text-brand' : 'border-ink/15'}`}>{label}</button>
        ))}
      </div>
      <form onSubmit={pay} className="space-y-3">
        {method === 'card' && (
          <>
            <div><label className="label" htmlFor="cn">Card number</label>
              <input id="cn" className="input" inputMode="numeric" placeholder="4242 4242 4242 4242" value={f.cardNumber} onChange={set('cardNumber')} required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label" htmlFor="ex">Expiry</label><input id="ex" className="input" placeholder="MM/YY" value={f.expiry} onChange={set('expiry')} required /></div>
              <div><label className="label" htmlFor="cv">CVV</label><input id="cv" className="input" type="password" maxLength={4} value={f.cvv} onChange={set('cvv')} required /></div>
            </div>
          </>
        )}
        {method === 'upi' && (
          <div><label className="label" htmlFor="up">UPI id</label>
            <input id="up" className="input" placeholder="name@bank" value={f.upiId} onChange={set('upiId')} required /></div>
        )}
        {method === 'netbanking' && (
          <div><label className="label" htmlFor="bk">Bank</label>
            <select id="bk" className="input" value={f.bank} onChange={set('bank')}>{BANKS.map((b) => <option key={b}>{b}</option>)}</select></div>
        )}
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Processing…' : `Pay ${money(ev.price)}`}</button>
      </form>
    </Modal>
  );
}
