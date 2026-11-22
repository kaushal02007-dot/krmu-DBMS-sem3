const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncH, httpError } = require('../utils/helpers');

exports.protect = asyncH(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw httpError(401, 'Please log in to continue');
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw httpError(401, 'Session expired. Please log in again');
  }
  const user = await User.findById(payload.id).select('-password');
  if (!user) throw httpError(401, 'Account no longer exists');
  req.user = user;
  next();
});

exports.adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') return next(httpError(403, 'Organizer access only'));
  next();
};
