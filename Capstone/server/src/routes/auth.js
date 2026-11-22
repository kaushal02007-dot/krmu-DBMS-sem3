const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const { asyncH, httpError } = require('../utils/helpers');

const sign = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const pub = (u) => ({ id: u._id, name: u.name, email: u.email, phone: u.phone, role: u.role });

router.post('/register', asyncH(async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) throw httpError(400, 'Name, email and password are required');
  if (password.length < 6) throw httpError(400, 'Password must be at least 6 characters');
  if (await User.findOne({ email: email.toLowerCase() })) throw httpError(409, 'An account with this email already exists');
  const user = await User.create({ name, email, password, phone, role: 'participant' });
  res.status(201).json({ token: sign(user), user: pub(user) });
}));

router.post('/login', asyncH(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email: (email || '').toLowerCase() });
  if (!user || !(await user.matches(password || ''))) throw httpError(401, 'Incorrect email or password');
  res.json({ token: sign(user), user: pub(user) });
}));

router.get('/me', protect, (req, res) => res.json({ user: pub(req.user) }));

module.exports = router;
