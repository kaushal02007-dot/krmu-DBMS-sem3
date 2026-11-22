import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const link = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-bold transition ${isActive ? 'bg-brand-soft text-brand' : 'text-ink/70 hover:text-ink'}`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 py-3">
        <Link to="/" className="mr-4 font-display text-2xl font-extrabold tracking-tight">
          Event<span className="text-brand">tide</span>
        </Link>
        <nav className="flex flex-1 flex-wrap items-center gap-1">
          <NavLink to="/" end className={link}>Events</NavLink>
          {user?.role === 'participant' && <NavLink to="/my-registrations" className={link}>My registrations</NavLink>}
          {user?.role === 'admin' && <NavLink to="/admin" className={link}>Organizer dashboard</NavLink>}
        </nav>
        {user ? (
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-ink/70 sm:inline">{user.name}</span>
            <button className="btn-ghost" onClick={() => { logout(); nav('/'); }}>Log out</button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link to="/login" className="btn-ghost">Log in</Link>
            <Link to="/register" className="btn-primary">Create account</Link>
          </div>
        )}
      </div>
    </header>
  );
}
