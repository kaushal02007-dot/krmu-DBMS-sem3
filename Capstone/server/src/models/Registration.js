const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
    status: { type: String, enum: ['registered', 'cancelled'], default: 'registered' },
    paymentStatus: { type: String, enum: ['free', 'pending', 'paid', 'refunded'], default: 'pending' },
    attended: { type: Boolean, default: false },
    ticketCode: { type: String, required: true },
  },
  { timestamps: true }
);

schema.index({ user: 1, event: 1 }, { unique: true });
module.exports = mongoose.model('Registration', schema);
