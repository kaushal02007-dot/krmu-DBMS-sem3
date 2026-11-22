const router = require('express').Router();
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Payment = require('../models/Payment');
const Feedback = require('../models/Feedback');
const { protect, adminOnly } = require('../middleware/auth');
const { asyncH, toCsv } = require('../utils/helpers');

async function build() {
  const [events, regs, pays, fbs] = await Promise.all([
    Event.find().populate('venue', 'name').sort('startDate').lean(),
    Registration.find({ status: 'registered' }).lean(),
    Payment.find({ status: 'success' }).lean(),
    Feedback.find().lean(),
  ]);
  const now = new Date();
  const perEvent = events.map((e) => {
    const id = String(e._id);
    const er = regs.filter((r) => String(r.event) === id);
    const attended = er.filter((r) => r.attended).length;
    const ef = fbs.filter((f) => String(f.event) === id);
    const revenue = pays.filter((p) => String(p.event) === id).reduce((s, p) => s + p.amount, 0);
    return {
      id,
      title: e.title,
      category: e.category,
      venue: e.venue?.name || '-',
      startDate: e.startDate,
      capacity: e.capacity,
      registered: er.length,
      attended,
      attendanceRate: er.length ? Math.round((attended / er.length) * 100) : 0,
      fillRate: Math.round((er.length / e.capacity) * 100),
      revenue,
      avgRating: ef.length ? Math.round((ef.reduce((s, f) => s + f.rating, 0) / ef.length) * 10) / 10 : null,
      feedbackCount: ef.length,
    };
  });
  const byCategory = {};
  perEvent.forEach((e) => {
    const c = (byCategory[e.category] ||= { category: e.category, events: 0, registered: 0, revenue: 0 });
    c.events += 1; c.registered += e.registered; c.revenue += e.revenue;
  });
  const totalReg = regs.length;
  const totalAttended = regs.filter((r) => r.attended).length;
  return {
    totals: {
      events: events.length,
      upcoming: events.filter((e) => e.endDate >= now).length,
      registrations: totalReg,
      attendanceRate: totalReg ? Math.round((totalAttended / totalReg) * 100) : 0,
      revenue: pays.reduce((s, p) => s + p.amount, 0),
      avgRating: fbs.length ? Math.round((fbs.reduce((s, f) => s + f.rating, 0) / fbs.length) * 10) / 10 : null,
      feedbackCount: fbs.length,
    },
    perEvent,
    byCategory: Object.values(byCategory),
  };
}

router.get('/summary', protect, adminOnly, asyncH(async (req, res) => res.json(await build())));

router.get('/events.csv', protect, adminOnly, asyncH(async (req, res) => {
  const { perEvent } = await build();
  const csv = toCsv(perEvent, [
    { label: 'Event', value: (e) => e.title },
    { label: 'Category', value: (e) => e.category },
    { label: 'Venue', value: (e) => e.venue },
    { label: 'Date', value: (e) => new Date(e.startDate).toISOString().slice(0, 10) },
    { label: 'Capacity', value: (e) => e.capacity },
    { label: 'Registered', value: (e) => e.registered },
    { label: 'Attended', value: (e) => e.attended },
    { label: 'Attendance %', value: (e) => e.attendanceRate },
    { label: 'Revenue (INR)', value: (e) => e.revenue },
    { label: 'Avg rating', value: (e) => e.avgRating ?? '' },
  ]);
  res.type('text/csv').send(csv);
}));

module.exports = router;
