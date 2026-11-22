require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Venue = require('./models/Venue');
const Event = require('./models/Event');
const Registration = require('./models/Registration');
const Payment = require('./models/Payment');
const Feedback = require('./models/Feedback');
const { ticketCode, txnId } = require('./utils/helpers');

const day = 86400000;
const at = (offsetDays, hour, hours = 3) => {
  const d = new Date(Date.now() + offsetDays * day);
  d.setHours(hour, 0, 0, 0);
  return [d, new Date(d.getTime() + hours * 3600000)];
};

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await Promise.all([User, Venue, Event, Registration, Payment, Feedback].map((m) => m.deleteMany({})));

  const admin = await User.create({ name: 'Event Organizer', email: 'admin@event.com', password: 'admin123', role: 'admin', phone: '9000000001' });
  const users = [];
  for (const [name, email] of [['Aarav Sharma', 'user@event.com'], ['Diya Verma', 'diya@event.com'], ['Kabir Singh', 'kabir@event.com'], ['Meera Nair', 'meera@event.com']])
    users.push(await User.create({ name, email, password: 'user123', phone: '98' + Math.floor(10000000 + Math.random() * 89999999) }));

  const [hall, arena, studio] = await Venue.create([
    { name: 'Grand Convention Hall', address: 'Sector 14, Main Road', city: 'Gurugram', capacity: 300, facilities: ['Wi-Fi', 'Projector', 'Parking', 'AC'] },
    { name: 'Riverside Open Arena', address: 'Yamuna Expressway', city: 'Noida', capacity: 800, facilities: ['Stage', 'Sound system', 'Food court'] },
    { name: 'Creative Studio', address: 'Hauz Khas Village', city: 'New Delhi', capacity: 60, facilities: ['Wi-Fi', 'Whiteboards', 'Coffee bar'] },
  ]);

  const mk = (title, category, venue, when, capacity, price, description) =>
    ({ title, category, venue: venue._id, startDate: when[0], endDate: when[1], capacity, price, description, organizer: admin._id });

  const [past1, past2, up1, up2, up3, up4] = await Event.create([
    mk('React Day 2026', 'Technology', hall, at(-20, 10, 6), 200, 499, 'A full day of talks and live demos on React, performance and the modern JavaScript toolchain.'),
    mk('Startup Pitch Night', 'Business', studio, at(-7, 17, 3), 50, 0, 'Ten early-stage founders pitch to a panel of investors. Networking over snacks after the session.'),
    mk('Winter Music Fest', 'Music', arena, at(9, 16, 7), 600, 799, 'Live bands, an open-air stage and street food. Gates open at 4 PM.'),
    mk('Intro to UI Design Workshop', 'Education', studio, at(5, 11, 4), 40, 299, 'Hands-on beginner workshop: layout, colour, type and building your first Figma prototype.'),
    mk('City Marathon 5K', 'Sports', arena, at(14, 6, 4), 500, 0, 'A friendly 5K run for all levels. T-shirt and medal for every finisher.'),
    mk('Node.js & MongoDB Bootcamp', 'Technology', hall, at(21, 10, 6), 150, 999, 'Build and deploy a REST API from scratch with Express and MongoDB Atlas.'),
  ]);

  const reg = async (user, event, { attended = false, paid = null } = {}) => {
    const paymentStatus = event.price === 0 ? 'free' : paid ? 'paid' : 'pending';
    const r = await Registration.create({ user: user._id, event: event._id, paymentStatus, attended, ticketCode: ticketCode() });
    if (paymentStatus === 'paid')
      await Payment.create({ registration: r._id, user: user._id, event: event._id, amount: event.price, method: paid, reference: paid === 'upi' ? 'user@upi' : '**** 4242', status: 'success', transactionId: txnId() });
    return r;
  };

  await reg(users[0], past1, { attended: true, paid: 'card' });
  await reg(users[1], past1, { attended: true, paid: 'upi' });
  await reg(users[2], past1, { attended: false, paid: 'card' });
  await reg(users[0], past2, { attended: true });
  await reg(users[3], past2, { attended: true });
  await reg(users[1], up1, { paid: 'upi' });
  await reg(users[0], up2, {}); // pending payment, handy for testing the payment flow
  await reg(users[2], up3, {});

  await Feedback.create([
    { user: users[0]._id, event: past1._id, rating: 5, comment: 'Brilliant speakers and well organised. Worth every rupee.' },
    { user: users[1]._id, event: past1._id, rating: 4, comment: 'Great content, lunch queue was long.' },
    { user: users[3]._id, event: past2._id, rating: 4, comment: 'Loved the pitches. Would like a longer Q&A.' },
  ]);

  console.log('\nSeed complete.\n  Organizer: admin@event.com / admin123\n  Participant: user@event.com / user123\n');
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
