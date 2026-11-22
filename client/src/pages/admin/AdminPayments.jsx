import { useEffect, useState } from 'react';
import api, { errMsg } from '../../api';
import { Empty, Loading, Notice } from '../../components/ui';
import { fmtDateTime, payBadge } from '../../utils';

export default function AdminPayments() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setData(null);
    api.get('/payments', { params: status ? { status } : {} }).then((r) => setData(r.data)).catch((e) => setError(errMsg(e)));
  }, [status]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div><label className="label" htmlFor="st">Status</label>
          <select id="st" className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All</option><option value="success">Successful</option><option value="failed">Failed</option><option value="refunded">Refunded</option>
          </select></div>
        {data && (
          <p className="text-sm text-ink/70">Collected <b>₹{data.totals.collected.toLocaleString('en-IN')}</b> · Refunded <b>₹{data.totals.refunded.toLocaleString('en-IN')}</b> · {data.totals.count} transactions</p>
        )}
      </div>
      <p className="mb-3 text-xs text-ink/50">All payments are simulated.</p>
      <Notice>{error}</Notice>
      {!data ? <Loading /> : data.payments.length === 0 ? <Empty title="No payments found" /> : (
        <div className="panel overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-ink/10"><tr>{['Date', 'Participant', 'Event', 'Method', 'Amount', 'Status', 'Transaction'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-ink/5">
              {data.payments.map((p) => (
                <tr key={p._id}>
                  <td className="td whitespace-nowrap">{fmtDateTime(p.createdAt)}</td>
                  <td className="td">{p.user?.name}<br /><span className="text-xs text-ink/50">{p.user?.email}</span></td>
                  <td className="td">{p.event?.title}</td>
                  <td className="td">{p.method}<br /><span className="text-xs text-ink/50">{p.reference}</span></td>
                  <td className="td font-bold">₹{p.amount.toLocaleString('en-IN')}</td>
                  <td className="td"><span className={`badge ${payBadge[p.status]}`}>{p.status}</span></td>
                  <td className="td font-mono text-xs">{p.transactionId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
