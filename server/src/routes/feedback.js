const router = require('express').Router();
const Feedback = require('../models/Feedback');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const { protect, adminOnly } = require('../middleware/auth');
const { asyncH, httpError } = require('../utils/helpers');

// Participant: create or update feedback (must be registered, event must have started)
router.post('/', protect, asyncH(async (req, res) => {
  const { eventId, rating, comment } = req.body;
  const r = Number(rating);
  if (!(r >= 1 && r <= 5)) throw httpError(400, 'Choose a rating from 1 to 5');
  const event = await Event.findById(eventId);
  if (!event) throw httpError(404, 'Event not found');
  const reg = await Registration.findOne({ user: req.user._id, event: eventId, status: 'registered' });
  if (!reg) throw httpError(403, 'Only registered participants can leave feedback');
  if (event.startDate > new Date()) throw httpError(400, 'Feedback opens once the event has started');
  const fb = await Feedback.findOneAndUpdate(
    { user: req.user._id, event: eventId },
    { rating: r, comment },
    { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
  );
  res.status(201).json(fb);
}));

router.get('/mine', protect, asyncH(async (req, res) => {
  res.json(await Feedback.find({ user: req.user._id }));
}));

router.get('/', protect, adminOnly, asyncH(async (req, res) => {
  const q = req.query.eventId ? { event: req.query.eventId } : {};
  res.json(await Feedback.find(q).populate('user', 'name email').populate('event', 'title').sort('-createdAt'));
}));

module.exports = router;
