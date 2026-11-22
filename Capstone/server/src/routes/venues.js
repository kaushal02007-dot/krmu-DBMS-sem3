const router = require('express').Router();
const Venue = require('../models/Venue');
const Event = require('../models/Event');
const { protect, adminOnly } = require('../middleware/auth');
const { asyncH, httpError } = require('../utils/helpers');

const clean = (b) => ({
  name: b.name,
  address: b.address,
  city: b.city,
  capacity: Number(b.capacity),
  facilities: Array.isArray(b.facilities)
    ? b.facilities
    : String(b.facilities || '').split(',').map((s) => s.trim()).filter(Boolean),
});

router.get('/', asyncH(async (req, res) => {
  const venues = await Venue.find().sort('name').lean();
  const counts = await Event.aggregate([{ $group: { _id: '$venue', n: { $sum: 1 } } }]);
  const map = Object.fromEntries(counts.map((c) => [String(c._id), c.n]));
  res.json(venues.map((v) => ({ ...v, eventCount: map[String(v._id)] || 0 })));
}));

router.post('/', protect, adminOnly, asyncH(async (req, res) => {
  res.status(201).json(await Venue.create(clean(req.body)));
}));

router.put('/:id', protect, adminOnly, asyncH(async (req, res) => {
  const v = await Venue.findByIdAndUpdate(req.params.id, clean(req.body), { new: true, runValidators: true });
  if (!v) throw httpError(404, 'Venue not found');
  res.json(v);
}));

router.delete('/:id', protect, adminOnly, asyncH(async (req, res) => {
  if (await Event.exists({ venue: req.params.id })) throw httpError(400, 'This venue is used by events. Move or delete those events first');
  await Venue.findByIdAndDelete(req.params.id);
  res.json({ message: 'Venue deleted' });
}));

module.exports = router;
