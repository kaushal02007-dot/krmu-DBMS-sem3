const mongoose = require('mongoose');

module.exports = mongoose.model(
  'Payment',
  new mongoose.Schema(
    {
      registration: { type: mongoose.Schema.Types.ObjectId, ref: 'Registration', required: true },
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
      amount: { type: Number, required: true },
      method: { type: String, enum: ['card', 'upi', 'netbanking'], required: true },
      reference: { type: String },
      status: { type: String, enum: ['success', 'failed', 'refunded'], required: true },
      transactionId: { type: String, required: true },
    },
    { timestamps: true }
  )
);
