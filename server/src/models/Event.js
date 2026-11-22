const mongoose = require('mongoose');

const CATEGORIES = ['Technology', 'Music', 'Business', 'Sports', 'Arts', 'Education', 'Other'];

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: { type: String, enum: CATEGORIES, default: 'Other' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    venue: { type: mongoose.Schema.Types.ObjectId, ref: 'Venue', required: true },
    capacity: { type: Number, required: true, min: 1 },
    price: { type: Number, default: 0, min: 0 },
    organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

eventSchema.index({ startDate: 1 });
module.exports = mongoose.model('Event', eventSchema);
module.exports.CATEGORIES = CATEGORIES;
