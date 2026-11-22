import { NavLink, Outlet } from 'react-router-dom';

const items = [
  ['/admin', 'Reports', true],
  ['/admin/events', 'Events'],
  ['/admin/venues', 'Venues'],
  ['/admin/participants', 'Participants'],
  ['/admin/payments', 'Payments'],
  ['/admin/feedback', 'Feedback'],
];

export default function AdminLayout() {
  return (
    <div>
      <h1 className="text-4xl font-extrabold tracking-tight">Organizer dashboard</h1>
      <nav className="mb-6 mt-4 flex flex-wrap gap-2 border-b border-ink/10 pb-3">
        {items.map(([to, label, end]) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) => `rounded-lg px-3 py-1.5 text-sm font-bold ${isActive ? 'bg-ink text-white' : 'bg-white hover:bg-brand-soft'}`}>
            {label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
