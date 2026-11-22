const router = require('express').Router();
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const Payment = require('../models/Payment');
const { protect, adminOnly } = require('../middleware/auth');
const { asyncH, httpError, ticketCode } = require('../utils/helpers');

const populateEvent = { path: 'event', populate: { path: 'venue', select: 'name city address' } };

// Participant: register for an event
router.post('/', protect, asyncH(async (req, res) => {
  const event = await Event.findById(req.body.eventId);
  if (!event) throw httpError(404, 'Event not found');
  if (event.endDate < new Date()) throw httpError(400, 'This event has already ended');

  const existing = await Registration.findOne({ user: req.user._id, event: event._id });
  if (existing && existing.status === 'registered') throw httpError(409, 'You are already registered for this event');

  const taken = await Registration.countDocuments({ event: event._id, status: 'registered' });
  if (taken >= event.capacity) throw httpError(400, 'This event is full');

  const paymentStatus = event.price > 0 ? 'pending' : 'free';
  let reg;
  if (existing) {
    Object.assign(existing, { status: 'registered', paymentStatus, attended: false });
    reg = await existing.save();
  } else {
    reg = await Registration.create({ user: req.user._id, event: event._id, paymentStatus, ticketCode: ticketCode() });
  }
  res.status(201).json(await reg.populate(populateEvent));
}));

// Participant: my registrations
router.get('/mine', protect, asyncH(async (req, res) => {
  const regs = await Registration.find({ user: req.user._id }).populate(populateEvent).sort('-createdAt').lean();
  const pays = await Payment.find({ user: req.user._id }).sort('-createdAt').lean();
  res.json(regs.filter((r) => r.event).map((r) => ({
    ...r,
    payments: pays.filter((p) => String(p.registration) === String(r._id)),
  })));
}));

// Admin: all registrations
router.get('/', protect, adminOnly, asyncH(async (req, res) => {
  const q = req.query.eventId ? { event: req.query.eventId } : {};
  res.json(await Registration.find(q).populate('user', 'name email').populate('event', 'title startDate').sort('-createdAt'));
}));

// Participant: view one registration (own) / admin any
router.get('/:id', protect, asyncH(async (req, res) => {
  const reg = await Registration.findById(req.params.id).populate(populateEvent).populate('user', 'name email phone').lean();
  if (!reg) throw httpError(404, 'Registration not found');
  if (req.user.role !== 'admin' && String(reg.user._id) !== String(req.user._id)) throw httpError(403, 'Not your registration');
  reg.payments = await Payment.find({ registration: reg._id }).sort('-createdAt');
  res.json(reg);
}));

// Participant: cancel registration (refund simulated)
router.delete('/:id', protect, asyncH(async (req, res) => {
  const reg = await Registration.findById(req.params.id).populate('event');
  if (!reg) throw httpError(404, 'Registration not found');
  if (String(reg.user) !== String(req.user._id)) throw httpError(403, 'Not your registration');
  if (reg.status === 'cancelled') throw httpError(400, 'Already cancelled');
  if (reg.event.startDate < new Date()) throw httpError(400, 'You cannot cancel after the event has started');
  if (reg.paymentStatus === 'paid') {
    await Payment.updateMany({ registration: reg._id, status: 'success' }, { status: 'refunded' });
    reg.paymentStatus = 'refunded';
  }
  reg.status = 'cancelled';
  await reg.save();
  res.json({ message: 'Registration cancelled' });
}));

// Admin: mark attendance
router.patch('/:id/attendance', protect, adminOnly, asyncH(async (req, res) => {
  const reg = await Registration.findById(req.params.id);
  if (!reg) throw httpError(404, 'Registration not found');
  if (reg.status !== 'registered') throw httpError(400, 'Cancelled registrations cannot be marked');
  reg.attended = !!req.body.attended;
  await reg.save();
  res.json(reg);
}));

module.exports = router;
