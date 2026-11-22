import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api';
import { Notice } from '../components/ui';

export default function Auth({ mode }) {
  const isLogin = mode === 'login';
  const { login, register } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const user = isLogin ? await login(f.email, f.password) : await register(f);
      nav(user.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="panel p-6">
        <h1 className="text-3xl font-extrabold">{isLogin ? 'Welcome back' : 'Create your account'}</h1>
        <p className="mb-5 mt-1 text-sm text-ink/60">{isLogin ? 'Log in to register for events and see your tickets.' : 'Join to register for events and share feedback.'}</p>
        <Notice>{error}</Notice>
        <form onSubmit={submit} className="space-y-4">
          {!isLogin && (
            <>
              <div><label className="label" htmlFor="name">Full name</label><input id="name" className="input" value={f.name} onChange={set('name')} required /></div>
              <div><label className="label" htmlFor="phone">Phone (optional)</label><input id="phone" className="input" value={f.phone} onChange={set('phone')} /></div>
            </>
          )}
          <div><label className="label" htmlFor="email">Email</label><input id="email" type="email" className="input" value={f.email} onChange={set('email')} required /></div>
          <div><label className="label" htmlFor="pw">Password</label><input id="pw" type="password" minLength={6} className="input" value={f.password} onChange={set('password')} required /></div>
          <button className="btn-primary w-full" disabled={busy}>{busy ? 'Please wait…' : isLogin ? 'Log in' : 'Create account'}</button>
        </form>
        <p className="mt-4 text-center text-sm text-ink/70">
          {isLogin ? <>New here? <Link className="font-bold text-brand" to="/register">Create an account</Link></> : <>Already have an account? <Link className="font-bold text-brand" to="/login">Log in</Link></>}
        </p>
      </div>
      {isLogin && (
        <div className="mt-4 rounded-lg bg-sun/30 p-3 text-xs">
          <p className="mb-1 font-bold">Demo accounts (after running the seed script)</p>
          <p>Organizer: admin@event.com / admin123</p>
          <p>Participant: user@event.com / user123</p>
        </div>
      )}
    </div>
  );
}
