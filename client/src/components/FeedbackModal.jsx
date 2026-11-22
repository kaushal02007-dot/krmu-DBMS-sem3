import { useState } from 'react';
import api, { errMsg } from '../api';
import { Modal, Notice, Stars } from './ui';

export default function FeedbackModal({ event, existing, onClose, onSaved }) {
  const [rating, setRating] = useState(existing?.rating || 0);
  const [comment, setComment] = useState(existing?.comment || '');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api.post('/feedback', { eventId: event._id, rating, comment });
      onSaved();
      onClose();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Rate this event" onClose={onClose}>
      <p className="mb-3 text-sm text-ink/70">{event.title}</p>
      <Notice>{error}</Notice>
      <form onSubmit={submit} className="space-y-4">
        <div><span className="label">Your rating</span><Stars value={rating} onChange={setRating} size="text-3xl" /></div>
        <div><label className="label" htmlFor="cm">Comments (optional)</label>
          <textarea id="cm" rows={4} className="input" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="What did you like? What could be better?" /></div>
        <button className="btn-primary w-full" disabled={busy || !rating}>{busy ? 'Saving…' : existing ? 'Update feedback' : 'Send feedback'}</button>
      </form>
    </Modal>
  );
}
