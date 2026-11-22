const mongoose = require('mongoose');

module.exports = mongoose.model(
  'Venue',
  new mongoose.Schema(
    {
      name: { type: String, required: true, trim: true },
      address: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      capacity: { type: Number, required: true, min: 1 },
      facilities: [{ type: String, trim: true }],
    },
    { timestamps: true }
  )
);
