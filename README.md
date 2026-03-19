# Street Surfers — Passengers App

> Your daily commute, handled.

The Street Surfers Passengers App is the commuter-facing side of the Street Surfers transport platform, built for staff and scholar passengers in Johannesburg, Gauteng. Passengers track their allocated transport, monitor their driver in real time, and stay informed at every step of the journey.

---

## Platform Overview

Street Surfers is a multi-app transport management platform:

| App | Audience |
|---|---|
| **Passengers App** ← *this repo* | Staff & scholar commuters |
| Driver's App | Allocated drivers |
| Dispatcher Dashboard *(coming soon)* | Admin & dispatch team |

All three apps share a single Supabase backend.

---

## What Passengers Can Do

- View allocated trips, assigned driver, and scheduled times
- Track the driver's live location on a map when en route
- See real-time ETA and pick-up status updates
- Get notified when the driver is on the way, has arrived, or has confirmed pickup
- Submit weekly schedule / availability for dispatch approval
- Manage profile, home address, and emergency contact details

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite + TypeScript |
| UI | Shadcn UI + Tailwind CSS |
| Routing | React Router v6 |
| Data fetching | TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Backend | Supabase (Auth + Postgres + Realtime) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Setup

```sh
# Clone the repo
git clone https://github.com/aBandicootCalledSmashes/Street-Surfers-Passengers-App.git
cd Street-Surfers-Passengers-App

# Install dependencies
npm install

# Create your environment file
# Fill in VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in a .env file

# Start the dev server
npm run dev
```

The app runs at `http://localhost:8080`.

---

## App Flow

```
Passenger registers
       ↓
Completes onboarding (home address, company, shift)
       ↓
Submits weekly availability → Dispatch approves
       ↓
Dispatch creates trip + assigns driver
       ↓
Passenger sees trip on dashboard
       ↓
Day of trip: driver goes online → passenger gets notified
       ↓
Passenger tracks live driver location + ETA
       ↓
Driver confirms pickup → status updates for passenger + dispatch
       ↓
Trip completed → dropoff confirmed
```

---

## Project Structure

```
src/
  integrations/supabase/   ← Supabase client & generated types
  hooks/                   ← useAuth, useTrips, useTripDetails, useDriverLocation
  pages/                   ← Auth, Onboarding, Index (dashboard), MyTrips,
                              TripDetails, LiveMap, Schedule, Profile
  components/              ← Shared UI components
supabase/
  migrations/              ← SQL migration history
```

---

## License

Private — Street Surfers. All rights reserved.
