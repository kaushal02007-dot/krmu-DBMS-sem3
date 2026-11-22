const router = require('express').Router();
const Event = require('../models/Event');
const Venue = require('../models/Venue');
const Registration = require('../models/Registration');
const Payment = require('../models/Payment');
const Feedback = require('../models/Feedback');
const { protect, adminOnly } = require('../middleware/auth');
const { asyncH, httpError, toCsv } = require('../utils/helpers');

async function withStats(events) {
  const ids = events.map((e) => e._id);
  const [regs, fb] = await Promise.all([
    Registration.aggregate([{ $match: { event: { $in: ids }, status: 'registered' } }, { $group: { _id: '$event', n: { $sum: 1 } } }]),
    Feedback.aggregate([{ $match: { event: { $in: ids } } }, { $group: { _id: '$event', avg: { $avg: '$rating' }, n: { $sum: 1 } } }]),
  ]);
  const r = Object.fromEntries(regs.map((x) => [String(x._id), x.n]));
  const f = Object.fromEntries(fb.map((x) => [String(x._id), x]));
  return events.map((e) => {
    const o = e.toObject ? e.toObject() : e;
    const k = String(o._id);
    return {
      ...o,
      registeredCount: r[k] || 0,
      avgRating: f[k] ? Math.round(f[k].avg * 10) / 10 : null,
      feedbackCount: f[k]?.n || 0,
    };
  });
}

async function validateEvent(b, excludeId) {
  const start = new Date(b.startDate);
  const end = new Date(b.endDate);
  if (isNaN(start) || isNaN(end)) throw httpError(400, 'Start and end date are required');
  if (end <= start) throw httpError(400, 'End time must be after the start time');
  const venue = await Venue.findById(b.venue);
  if (!venue) throw httpError(400, 'Please choose a venue');
  if (Number(b.capacity) > venue.capacity)
    throw httpError(400, `Capacity cannot exceed the venue limit of ${venue.capacity}`);
  const clash = await Event.findOne({
    _id: { $ne: excludeId },
    venue: venue._id,
    startDate: { $lt: end },
    endDate: { $gt: start },
  });
  if (clash) throw httpError(409, `${venue.name} is already booked for "${clash.title}" at that time`);
}

const pick = (b) => ({
  title: b.title,
  description: b.description,
  category: b.category,
  startDate: b.startDate,
  endDate: b.endDate,
  venue: b.venue,
  capacity: Number(b.capacity),
  price: Number(b.price) || 0,
});

// List + search/filter (public)
router.get('/', asyncH(async (req, res) => {
  const { search, category, when = 'upcoming', price, from, to, venue } = req.query;
  const q = {};
  const now = new Date();
  if (when === 'upcoming') q.endDate = { $gte: now };
  if (when === 'past') q.endDate = { $lt: now };
  if (search) {
    const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    q.$or = [{ title: rx }, { description: rx }];
  }
  if (category && category !== 'all') q.category = category;
  if (venue) q.venue = venue;
  if (price === 'free') q.price = 0;
  if (price === 'paid') q.price = { $gt: 0 };
  if (from || to) {
    q.startDate = {};
    if (from) q.startDate.$gte = new Date(from);
    if (to) q.startDate.$lte = new Date(to + 'T23:59:59');
  }
  const events = await Event.find(q).populate('venue', 'name city address capacity').sort(when === 'past' ? '-startDate' : 'startDate');
  res.json(await withStats(events));
}));

router.get('/:id', asyncH(async (req, res) => {
  const e = await Event.findById(req.params.id).populate('venue').populate('organizer', 'name');
  if (!e) throw httpError(404, 'Event not found');
  res.json((await withStats([e]))[0]);
}));

router.get('/:id/feedback', asyncH(async (req, res) => {
  const list = await Feedback.find({ event: req.params.id }).populate('user', 'name').sort('-createdAt');
  res.json(list);
}));

router.post('/', protect, adminOnly, asyncH(async (req, res) => {
  await validateEvent(req.body);
  const e = await Event.create({ ...pick(req.body), organizer: req.user._id });
  res.status(201).json(e);
}));

router.put('/:id', protect, adminOnly, asyncH(async (req, res) => {
  const existing = await Event.findById(req.params.id);
  if (!existing) throw httpError(404, 'Event not found');
  await validateEvent(req.body, existing._id);
  const active = await Registration.countDocuments({ event: existing._id, status: 'registered' });
  if (Number(req.body.capacity) < active)
    throw httpError(400, `${active} people are already registered. Capacity cannot go below that`);
  Object.assign(existing, pick(req.body));
  await existing.save();
  res.json(existing);
}));

router.delete('/:id', protect, adminOnly, asyncH(async (req, res) => {
  const e = await Event.findById(req.params.id);
  if (!e) throw httpError(404, 'Event not found');
  await Promise.all([
    Registration.deleteMany({ event: e._id }),
    Payment.deleteMany({ event: e._id }),
    Feedback.deleteMany({ event: e._id }),
  ]);
  await e.deleteOne();
  res.json({ message: 'Event and its registrations were deleted' });
}));

// Participants of one event (admin)
async function participants(eventId) {
  const regs = await Registration.find({ event: eventId }).populate('user', 'name email phone').sort('createdAt').lean();
  const pays = await Payment.find({ event: eventId, status: 'success' }).lean();
  const pm = Object.fromEntries(pays.map((p) => [String(p.registration), p]));
  return regs.map((r) => ({ ...r, payment: pm[String(r._id)] || null }));
}

router.get('/:id/participants', protect, adminOnly, asyncH(async (req, res) => {
  res.json(await participants(req.params.id));
}));

router.get('/:id/participants.csv', protect, adminOnly, asyncH(async (req, res) => {
  const e = await Event.findById(req.params.id);
  if (!e) throw httpError(404, 'Event not found');
  const rows = await participants(e._id);
  const csv = toCsv(rows, [
    { label: 'Name', value: (r) => r.user?.name },
    { label: 'Email', value: (r) => r.user?.email },
    { label: 'Phone', value: (r) => r.user?.phone },
    { label: 'Ticket', value: (r) => r.ticketCode },
    { label: 'Status', value: (r) => r.status },
    { label: 'Payment', value: (r) => r.paymentStatus },
    { label: 'Attended', value: (r) => (r.attended ? 'Yes' : 'No') },
  ]);
  res.type('text/csv').send(csv);
}));

module.exports = router;
