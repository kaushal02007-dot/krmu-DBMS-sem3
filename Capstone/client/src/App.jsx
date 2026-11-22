import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import { Protected } from './components/ui';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import Auth from './pages/Auth';
import MyRegistrations from './pages/MyRegistrations';
import AdminLayout from './pages/admin/AdminLayout';
import AdminReports from './pages/admin/AdminReports';
import AdminEvents from './pages/admin/AdminEvents';
import AdminVenues from './pages/admin/AdminVenues';
import AdminParticipants from './pages/admin/AdminParticipants';
import AdminPayments from './pages/admin/AdminPayments';
import AdminFeedback from './pages/admin/AdminFeedback';

export default function App() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Routes>
          <Route path="/" element={<Events />} />
          <Route path="/events/:id" element={<EventDetail />} />
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/register" element={<Auth mode="register" />} />
          <Route path="/my-registrations" element={<Protected role="participant"><MyRegistrations /></Protected>} />
          <Route path="/admin" element={<Protected role="admin"><AdminLayout /></Protected>}>
            <Route index element={<AdminReports />} />
            <Route path="events" element={<AdminEvents />} />
            <Route path="venues" element={<AdminVenues />} />
            <Route path="participants" element={<AdminParticipants />} />
            <Route path="payments" element={<AdminPayments />} />
            <Route path="feedback" element={<AdminFeedback />} />
          </Route>
          <Route path="*" element={<p className="py-16 text-center">Page not found.</p>} />
        </Routes>
      </main>
    </>
  );
}
