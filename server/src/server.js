require('dotenv').config();
process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev_only_secret_change_me';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/event_management';
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const allowed = (process.env.CLIENT_URL || '').split(',').map((o) => o.trim().replace(/\/$/, '')).filter(Boolean);
app.use(cors({ origin: allowed.length ? allowed : '*' }));
app.use(express.json());

// Reuse one MongoDB connection across requests (needed on Vercel serverless)
let connecting = null;
const connectDB = () => {
  if (mongoose.connection.readyState === 1) return Promise.resolve();
  if (!connecting) connecting = mongoose.connect(process.env.MONGO_URI).catch((e) => { connecting = null; throw e; });
  return connecting;
};
app.use(async (req, res, next) => {
  try { await connectDB(); next(); } catch (e) { console.error('MongoDB connection failed:', e.message); res.status(500).json({ message: 'Database connection failed' }); }
});

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/venues', require('./routes/venues'));
app.use('/api/registrations', require('./routes/registrations'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/feedback', require('./routes/feedback'));
app.use('/api/reports', require('./routes/reports'));

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((err, req, res, next) => {
  if (err.name === 'ValidationError') err.status = 400;
  if (err.name === 'CastError') { err.status = 400; err.message = 'Invalid id'; }
  if (err.code === 11000) { err.status = 409; err.message = 'Duplicate value: that record already exists'; }
  if (!err.status) console.error(err);
  res.status(err.status || 500).json({ message: err.message || 'Server error' });
});

// Local development: start the server. On Vercel the app is exported instead.
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  connectDB()
    .then(() => {
      console.log('MongoDB connected');
      app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
    })
    .catch((err) => {
      console.error('MongoDB connection failed:', err.message);
      process.exit(1);
    });
}

module.exports = app;