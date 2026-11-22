export const CATEGORIES = ['Technology', 'Music', 'Business', 'Sports', 'Arts', 'Education', 'Other'];

export const money = (n) => (n > 0 ? '₹' + Number(n).toLocaleString('en-IN') : 'Free');
export const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
export const fmtTime = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
export const fmtDateTime = (d) => `${fmtDate(d)}, ${fmtTime(d)}`;
export const day = (d) => new Date(d).getDate();
export const mon = (d) => new Date(d).toLocaleDateString('en-IN', { month: 'short' });

// value for <input type="datetime-local">
export const toInputDT = (d) => {
  if (!d) return '';
  const x = new Date(d);
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
  return x.toISOString().slice(0, 16);
};

export const categoryColor = {
  Technology: 'bg-brand text-white',
  Music: 'bg-bad text-white',
  Business: 'bg-ink text-white',
  Sports: 'bg-ok text-white',
  Arts: 'bg-sun text-ink',
  Education: 'bg-sky-600 text-white',
  Other: 'bg-slate-500 text-white',
};

export const payBadge = {
  free: 'bg-slate-100 text-slate-700',
  pending: 'bg-amber-100 text-amber-800',
  paid: 'bg-emerald-100 text-emerald-800',
  refunded: 'bg-slate-200 text-slate-700',
  success: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-rose-100 text-rose-800',
};
