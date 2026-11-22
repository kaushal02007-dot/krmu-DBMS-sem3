const router = require('express').Router();
const Payment = require('../models/Payment');
const Registration = require('../models/Registration');
const { protect, adminOnly } = require('../middleware/auth');
const { asyncH, httpError, txnId } = require('../utils/helpers');

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * SIMULATED payment - no real money or gateway is involved.
 * Test rule: a card number ending in 0000 is declined; everything else succeeds.
 */
router.post('/', protect, asyncH(async (req, res) => {
  const { registrationId, method, cardNumber, upiId, bank } = req.body;
  const reg = await Registration.findById(registrationId).populate('event');
  if (!reg) throw httpError(404, 'Registration not found');
  if (String(reg.user) !== String(req.user._id)) throw httpError(403, 'Not your registration');
  if (reg.status !== 'registered') throw httpError(400, 'This registration is cancelled');
  if (reg.paymentStatus === 'free') throw httpError(400, 'This event is free');
  if (reg.paymentStatus === 'paid') throw httpError(400, 'Already paid');
  if (!['card', 'upi', 'netbanking'].includes(method)) throw httpError(400, 'Choose a payment method');

  let reference = '';
  let declined = false;
  if (method === 'card') {
    const digits = String(cardNumber || '').replace(/\D/g, '');
    if (digits.length < 12) throw httpError(400, 'Enter a valid card number');
    reference = '**** ' + digits.slice(-4);
    declined = digits.endsWith('0000');
  } else if (method === 'upi') {
    if (!/^[\w.\-]+@[\w]+$/.test(upiId || '')) throw httpError(400, 'Enter a valid UPI id, like name@bank');
    reference = upiId;
  } else {
    if (!bank) throw httpError(400, 'Choose a bank');
    reference = bank;
  }

  await wait(900); // pretend to talk to a gateway
  const payment = await Payment.create({
    registration: reg._id,
    user: req.user._id,
    event: reg.event._id,
    amount: reg.event.price,
    method,
    reference,
    status: declined ? 'failed' : 'success',
    transactionId: txnId(),
  });
  if (declined) return res.status(402).json({ message: 'Payment declined by the bank (simulated). Try a different card', payment });

  reg.paymentStatus = 'paid';
  await reg.save();
  res.status(201).json({ message: 'Payment successful', payment });
}));

router.get('/mine', protect, asyncH(async (req, res) => {
  res.json(await Payment.find({ user: req.user._id }).populate('event', 'title startDate').sort('-createdAt'));
}));

router.get('/', protect, adminOnly, asyncH(async (req, res) => {
  const q = {};
  if (req.query.status) q.status = req.query.status;
  if (req.query.eventId) q.event = req.query.eventId;
  const list = await Payment.find(q).populate('user', 'name email').populate('event', 'title').sort('-createdAt').lean();
  const collected = list.filter((p) => p.status === 'success').reduce((s, p) => s + p.amount, 0);
  const refunded = list.filter((p) => p.status === 'refunded').reduce((s, p) => s + p.amount, 0);
  res.json({ payments: list, totals: { collected, refunded, count: list.length } });
}));

module.exports = router;
