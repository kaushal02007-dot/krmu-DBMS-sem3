# Eventide - Event Management System (MERN)

A full-stack event management app.

- Frontend: React 18 + Vite + Tailwind CSS
- Backend: Node.js + Express
- Database: MongoDB (Mongoose)

- ## DEPLOY LINK:
- https://event-site-weld.vercel.app

## Features

**Participant**
- View upcoming events, search and filter (keyword, category, price, date range, upcoming/past)
- View event details (venue, seats left, ratings, feedback)
- Register for an event, with capacity checks
- Simulated payment (card, UPI, net banking)
- View and cancel registrations, with ticket code and payment history
- Give or edit feedback (1 to 5 stars and a comment)

**Organizer / Admin**
- Create, edit and delete events (venue clash and capacity checks)
- Manage venues (add, edit, delete)
- View registered participants and track attendance (tick a checkbox)
- View payments (filter by status, totals)
- View feedback (filter by event)
- Reports: totals, per-event table, category breakdown, CSV export

## Prerequisites

- Node.js 18 or newer
- MongoDB running locally (`mongodb://127.0.0.1:27017`) or a free MongoDB Atlas connection string

## Run it

Open two terminals.

### 1. Backend

```bash
cd server
npm install
# edit .env if your MongoDB is not on localhost (see below)
npm run seed     # loads demo data (run once; running again resets the data)
npm run dev      # API at http://localhost:5000
```

### 2. Frontend

```bash
cd client
npm install
npm run dev      # App at http://localhost:5173
```

Open http://localhost:5173.

## Demo logins (created by `npm run seed`)

| Role        | Email             | Password |
|-------------|-------------------|----------|
| Organizer   | admin@event.com   | admin123 |
| Participant | user@event.com    | user123  |

New sign-ups are always participants. Organizer accounts are created by the seed script.

## Configuration (`server/.env`)

```
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/event_management
JWT_SECRET=change_this_secret_in_production
CLIENT_URL=http://localhost:5173
```

Using MongoDB Atlas: set `MONGO_URI` to your `mongodb+srv://...` string.

The frontend proxies `/api` to `http://localhost:5000` (see `client/vite.config.js`).
To point at another API URL, create `client/.env` with `VITE_API_URL=https://your-api/api`.

## Simulated payment

No real gateway is used. Any card number (12+ digits) succeeds, except numbers ending in `0000`, which are declined so you can test the failure path. UPI needs the form `name@bank`.

## Business rules worth knowing

- A venue cannot host two overlapping events, and event capacity cannot exceed venue capacity.
- Paid events start as "payment due" after registering. Free events are confirmed instantly.
- Cancelling a paid registration marks the payment as refunded (simulated). You cannot cancel after the event starts.
- Feedback opens once an event has started, and only registered participants can leave it.
- Deleting an event also deletes its registrations, payments and feedback.

## Project structure

```
event-management/
├── server/
│   └── src/
│       ├── server.js          # Express app + MongoDB connection
│       ├── seed.js            # demo data
│       ├── models/            # User, Venue, Event, Registration, Payment, Feedback
│       ├── routes/            # auth, events, venues, registrations, payments, feedback, reports
│       ├── middleware/auth.js # JWT + admin guard
│       └── utils/helpers.js
└── client/
    └── src/
        ├── pages/             # Events, EventDetail, MyRegistrations, Auth
        ├── pages/admin/       # Reports, Events, Venues, Participants, Payments, Feedback
        ├── components/        # Navbar, EventCard, PaymentModal, FeedbackModal, ui
        └── context/AuthContext.jsx
```

## API summary

| Method | Endpoint | Access |
|---|---|---|
| POST | /api/auth/register, /api/auth/login | public |
| GET | /api/auth/me | logged in |
| GET | /api/events, /api/events/:id, /api/events/:id/feedback | public |
| POST/PUT/DELETE | /api/events, /api/events/:id | admin |
| GET | /api/events/:id/participants(.csv) | admin |
| GET | /api/venues | public |
| POST/PUT/DELETE | /api/venues, /api/venues/:id | admin |
| POST | /api/registrations | participant |
| GET | /api/registrations/mine, /api/registrations/:id | participant |
| DELETE | /api/registrations/:id | participant (cancel) |
| PATCH | /api/registrations/:id/attendance | admin |
| POST | /api/payments | participant (simulated) |
| GET | /api/payments/mine | participant |
| GET | /api/payments | admin |
| POST | /api/feedback | participant |
| GET | /api/feedback/mine | participant |
| GET | /api/feedback | admin |
| GET | /api/reports/summary, /api/reports/events.csv | admin |

## Troubleshooting

- **"MongoDB connection failed"**: start MongoDB (`mongod`, or the MongoDB service), or use an Atlas URI.
- **Frontend shows network errors**: make sure the backend is running on port 5000.
- **Port already in use**: change `PORT` in `server/.env` and the proxy target in `client/vite.config.js`.


