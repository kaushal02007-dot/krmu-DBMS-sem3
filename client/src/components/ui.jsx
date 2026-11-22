import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Modal({ title, onClose, children, wide }) {
  useEffect(() => {
    const h = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-ink/50 p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className={`my-8 w-full ${wide ? 'max-w-2xl' : 'max-w-md'} rounded-xl bg-white p-6 shadow-xl`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-extrabold">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="rounded-lg px-2 py-1 text-xl leading-none text-ink/50 hover:bg-mist">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Stars({ value = 0, onChange, size = 'text-xl' }) {
  return (
    <span className={`inline-flex ${size}`} role={onChange ? 'radiogroup' : 'img'} aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) =>
        onChange ? (
          <button type="button" key={n} onClick={() => onChange(n)} aria-label={`${n} star${n > 1 ? 's' : ''}`}
            className={n <= value ? 'text-sun' : 'text-ink/20 hover:text-sun/60'}>★</button>
        ) : (
          <span key={n} className={n <= Math.round(value) ? 'text-sun' : 'text-ink/20'}>★</span>
        )
      )}
    </span>
  );
}

export function Notice({ type = 'error', children }) {
  if (!children) return null;
  const c = type === 'error' ? 'bg-rose-50 text-rose-800 border-rose-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200';
  return <div role="alert" className={`mb-4 rounded-lg border px-3 py-2 text-sm ${c}`}>{children}</div>;
}

export const Loading = ({ text = 'Loading…' }) => <p className="py-16 text-center text-ink/60">{text}</p>;

export const Empty = ({ title, hint, children }) => (
  <div className="panel px-6 py-14 text-center">
    <p className="font-display text-lg font-bold">{title}</p>
    {hint && <p className="mx-auto mt-1 max-w-sm text-sm text-ink/60">{hint}</p>}
    {children && <div className="mt-4">{children}</div>}
  </div>
);

export function Protected({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}
