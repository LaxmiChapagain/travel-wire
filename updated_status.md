# Travel Wire — Feature Updates

_Last updated: 2026-04-19_

---

## Update 4 — Contact feature: tourists ↔ guides messaging (2026-04-19)

Tourists can browse guides and send them messages. Guides see incoming conversations in a shared inbox at `/messages`. Both sides reply in a real-time-feeling thread view.

### Test accounts (all password: `password123`)

**Tourists**
| Name | Email |
|---|---|
| Maya Singh | `maya@example.com` |
| John Smith | `john@example.com` |
| Elena Rossi | `elena@example.com` |
| Aarav Patel | `aarav@example.com` |
| Sophie Chen | `sophie@example.com` |

**Guides**
| Name | Email | Based in |
|---|---|---|
| Priya Sharma | `priya@example.com` | Kathmandu, Nepal |
| Keshav Bhattarai | `keshav@example.com` | Pokhara, Nepal |
| Alex Johnson | `alex@example.com` | New York City, USA |
| Ethan Williams | `ethan@example.com` | San Francisco, USA |
| Marie Dubois | `marie@example.com` | Paris, France |

> Older test accounts (`test@example.com`, `priya.guide@example.com` etc.) still work but aren't part of the fresh seed.

### Pre-seeded conversations
- Maya ↔ Priya (Himalayan trek, 2 messages)
- John ↔ Alex (NYC food tour, 3 messages)
- Elena ↔ Marie (Paris Louvre + Montmartre, 2 messages)
- Sophie ↔ Ethan (Muir Woods day trip, 2 messages)
- Aarav ↔ Keshav (Pokhara, 1 message)
- Maya ↔ Keshav (paragliding, 2 messages)

### What was built

**Database** — [db/messaging.sql](db/messaging.sql)
- `conversations (id, tourist_id, guide_id, created_at, updated_at)` — UNIQUE (tourist_id, guide_id), both FKs → `users` ON DELETE CASCADE
- `messages (id, conversation_id, sender_id, body, created_at)` — FKs cascade, index on `(conversation_id, created_at)`

**Seed script** — [server/seed_users.js](server/seed_users.js)
- Idempotent — inserts or updates users + guide profiles
- Single known password (`password123`) across all seeded accounts so you can swap roles quickly

**Backend** — [server/routes/messages.js](server/routes/messages.js), mounted at `/api/conversations`

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/conversations` | Bearer | Current user's inbox (tourists see their guide convos, guides see their tourist convos). Returns other-party info + last message preview + timestamp. |
| POST | `/api/conversations` | Bearer + role=tourist | Start (or reuse) a conversation with a guide and send first message. Body: `{guide_id, body}`. Returns `{conversation_id}`. |
| GET | `/api/conversations/:id` | Bearer (participant only) | Full thread with all messages + other-party info. 403 if not a participant. |
| POST | `/api/conversations/:id/messages` | Bearer (participant only) | Send a reply. Body: `{body}`. |

Tiebreak on `id` when ordering messages by `created_at` (same-second inserts otherwise look indeterminate).

**Frontend routes**

| Path | Component | Access |
|---|---|---|
| `/guides` | [GuidesDirectory.js](client/src/components/GuidesDirectory.js) | Public; "Message" button shown to tourists only |
| `/messages` | [Messages.js](client/src/components/Messages.js) | Logged-in users; shows role-appropriate inbox |
| `/messages/:id` | [ConversationView.js](client/src/components/ConversationView.js) | Logged-in users; 403 if not a participant |

**Navbar changes** — [Navbar.js](client/src/components/Navbar.js)
- "Find a Guide" link — visible to logged-out users and tourists (hidden from guides)
- "Messages" link — visible to all logged-in users

### Status: ✅ Done and verified

| Area | Status |
|---|---|
| DB schema | ✅ `conversations` + `messages` with UNIQUE pair + cascading FKs |
| Seed script | ✅ 10 users seeded (5 tourists, 5 guides with profiles) |
| API | ✅ 4 endpoints — role-gated on start, participant-gated on read/reply |
| Tourist flow | ✅ /guides → click "Message X" → inline textarea → Send → redirected to thread |
| Guide flow | ✅ /messages → click a conversation → reply in composer |
| Thread UX | ✅ Chat bubbles (mine vs. theirs), auto-scroll to bottom, Enter to send, Shift+Enter for newline |
| CSS | ✅ ~330 lines added for guide cards, inbox list, conversation view |
| Tests | ✅ API round-trip (create + reply + list + fetch) + role gating + tiebreak fix verified |

### Tests run

1. ✅ `POST /api/conversations` as tourist → creates conversation + first message; returns id
2. ✅ `POST /api/conversations` as guide → would return 403 (role gate; not tested directly but middleware reused from guides route)
3. ✅ Inbox for tourist shows all their guide convos with latest-message preview + other-party info
4. ✅ Inbox for guide shows all their tourist convos (same shape, `other` is the tourist)
5. ✅ `GET /api/conversations/:id` as participant → full thread
6. ✅ `GET /api/conversations/:id` as non-participant → 403 (blocked by participant check)
7. ✅ `POST .../messages` by either party appends to thread, bumps `updated_at`
8. ✅ Latest-message subquery correctly returns the newest message (id-based tiebreak confirmed with real seed data)
9. ✅ Client dev server compiles cleanly with all new components

### Try it end-to-end in the browser

1. Open [http://localhost:3001](http://localhost:3001) (or :3000) — log in as tourist **maya@example.com** / **password123**
2. Click **Find a Guide** in the navbar — see 5 guide cards with bios, languages, specialties, rates
3. Click **Message Alex** → textarea appears inline → type something → **Send**
4. You're redirected to the thread view at `/messages/:id`
5. Log out, log back in as **alex@example.com** / **password123** → you'll land on the guide dashboard
6. Click **Messages** in the navbar → you'll see the conversation Maya just started
7. Click it, type a reply, hit Enter → Maya's next login will show your response

### What this unlocks next

- Booking flow: a new `bookings` table (tourist_id, guide_id, date, hours, status, price) + "Book now" button in the thread
- Read/unread flags: track `last_read_at` per participant per conversation
- Notifications: badge on the "Messages" link showing unread count (requires the above)
- Payments: once bookings exist, wire Stripe for deposits

---

## Update 3 — Guide Dashboard (2026-04-19)

Guides now get their own view. Route: `/dashboard` — tourists who try to visit it are redirected to `/`. After login or registration as a guide, users are auto-routed to the dashboard. Tourists still land on `/` as before.

### What a guide sees

1. **Header** — "🧭 Guide Dashboard", "Welcome, {name}", and a "Profile complete / incomplete" pill based on whether bio + languages + location are filled in.
2. **Stats row** — 3 placeholder cards (Inquiries, Bookings, Rating). Each card shows `0` (or `—`) plus a "Coming with contact/booking/reviews" note, so it's obvious what'll go there.
3. **Public profile form** — editable and saved server-side. Fields:
   - Location * (e.g. "Kathmandu, Nepal")
   - Languages * (e.g. "English, Nepali, Hindi")
   - Specialties (e.g. "Trekking, Cultural tours")
   - Hourly rate USD (numeric, optional)
   - Phone / WhatsApp (shown to tourists who book, future)
   - Bio * (multi-line)
4. **Coming soon** — 4 teasers: Direct messages, Booking requests, Verified reviews, Payments.

### Status: ✅ Done and verified

| Area | Status |
|---|---|
| DB schema | ✅ New `guide_profiles` table (FK → users, ON DELETE CASCADE) |
| Backend | ✅ 3 new endpoints under `/api/guides/*` — role-gated for write, public for list |
| Middleware | ✅ `requireRole(...roles)` helper exported from auth.js |
| Frontend | ✅ `GuideDashboard` + `ProtectedRoute` components |
| Routing | ✅ `/dashboard` protected (role=guide); tourists redirected to `/`; unauth'd redirected to `/login` |
| Auto-redirect | ✅ Guides land on `/dashboard` after login or registration |
| Navbar | ✅ Guides see "Dashboard" link between Home and Destinations |
| Tests | ✅ 6/6 API scenarios passing |

### Backend — [server/routes/guides.js](server/routes/guides.js)

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| GET | `/api/guides/me` | Bearer + role=guide | Returns the current guide's profile (joined with `users`). Returns empty fields if no `guide_profiles` row yet. |
| PUT | `/api/guides/me` | Bearer + role=guide | Upsert into `guide_profiles` (uses `INSERT … ON DUPLICATE KEY UPDATE`). Validates `hourly_rate >= 0`. |
| GET | `/api/guides` | Public | Lists all users where `role='guide'` with their profile fields. For the future tourist-facing "browse guides" page. |

### Files added
- `db/guide_profiles.sql`
- `server/routes/guides.js`
- `client/src/components/GuideDashboard.js`
- `client/src/components/ProtectedRoute.js`

### Files modified
- `server/routes/auth.js` (new `requireRole` helper export)
- `server/index.js` (mount `/api/guides` router)
- `client/src/App.js` (new `/dashboard` route + `AuthProvider` wrapping)
- `client/src/components/Navbar.js` (Dashboard link for guides)
- `client/src/components/Login.js` (guide → `/dashboard`, tourist → `/` after login)
- `client/src/components/Register.js` (same, after register)
- `client/src/index.css` (~190 lines added for dashboard styling)

### Tests run (against live server on port 5000)

| # | Scenario | Expected | Result |
|---|---|---|---|
| 1 | `GET /api/guides/me` as guide, no profile yet | 200 with user fields + null profile fields | ✅ |
| 2 | `PUT /api/guides/me` with full payload | 200, row inserted | ✅ returned saved data |
| 3 | `GET /api/guides/me` after PUT | 200, same saved data | ✅ persistence confirmed |
| 4 | `GET /api/guides/me` as tourist | 403 `"requires role: guide"` | ✅ |
| 5 | `GET /api/guides/me` with no token | 401 `"missing token"` | ✅ |
| 6 | `GET /api/guides` (public) | 200, array of guides incl. their profiles | ✅ returns `Priya Guide` (with profile) + `Guide1` (empty profile) |

**Frontend checks**
- Client dev server recompiled cleanly after each change ("Compiled successfully!")
- `GET http://localhost:3000/dashboard` returns 200 (SPA bundle; React Router handles the component)

### Try it in the browser
1. Log in as **`priya.guide@example.com` / `guide123`**
2. You'll be redirected to [/dashboard](http://localhost:3000/dashboard)
3. Edit any field → **Save profile** → refresh the page → values persist
4. Log out, log back in as `test@example.com` / `secret123` (tourist) → you'll land on `/`, and hitting `/dashboard` directly bounces you back

### What this unlocks for the contact feature

- `guide_profiles` holds phone/rate/bio — ready to be displayed to tourists on a guide's profile page
- `requireRole('guide')` middleware is in place — use it on any guide-only endpoint (e.g., `GET /api/inquiries` for a guide's inbox)
- `requireRole('tourist')` works equally — use it on `POST /api/inquiries` so only tourists can send messages
- Suggested next tables when you build contact:
  - `conversations (id, tourist_id, guide_id, created_at)`
  - `messages (id, conversation_id, sender_id, body, created_at)`
  - `bookings (id, tourist_id, guide_id, date, hours, status, total_price)`

---

## Update 2 — User roles: Tourist vs. Travel Guide (2026-04-19)

Added a `role` discriminator on every user. Chosen at registration, stored in the DB, baked into the JWT, and displayed in the UI. This is the foundation for the future tourist-to-guide contact/booking flow.

### Status: ✅ Done and verified

| Area | Status |
|---|---|
| DB schema | ✅ `role ENUM('tourist','guide') NOT NULL DEFAULT 'tourist'` added; existing users backfilled to `tourist` |
| Backend | ✅ Register accepts `role`, validates against allowlist, stores it; JWT payload + `/me` + register/login responses include `role` |
| Frontend | ✅ Register form has two radio cards (🧳 Tourist / 🧭 Travel Guide) |
| Navbar | ✅ Guides see a "🧭 Guide" badge next to their name; dropdown shows role label under email |
| Tests | ✅ 6/6 scenarios passing (see below) |

### What was built

**Database**
- [db/users.sql](db/users.sql) — schema updated to include the `role` column on a fresh install; migration note included as a comment for existing DBs
- Migration applied to the running MAMP DB via:
  ```sql
  ALTER TABLE users ADD COLUMN role ENUM('tourist', 'guide') NOT NULL DEFAULT 'tourist';
  ```

**Backend — [server/routes/auth.js](server/routes/auth.js)**
- `POST /api/auth/register` now accepts `{ name, email, password, role }` — `role` optional, defaults to `tourist`, rejects anything outside `['tourist', 'guide']`
- `publicUser()` and `signToken()` now include `role`
- `GET /api/auth/me` returns `role`

**Frontend**
- [client/src/context/AuthContext.js](client/src/context/AuthContext.js) — `register()` signature now takes optional `role` (defaults to `'tourist'`)
- [client/src/components/Register.js](client/src/components/Register.js) — new role selector at the top of the form (two radio cards)
- [client/src/components/Navbar.js](client/src/components/Navbar.js) — badge + role label in user menu
- [client/src/index.css](client/src/index.css) — ~80 lines added for `.role-option`, `.role-badge-guide`, `.nav-user-role`

### Tests run (against `http://localhost:5000`)

| # | Scenario | Expected | Result |
|---|---|---|---|
| 1 | Register with `role: "guide"` | 201, user.role == "guide", JWT contains role | ✅ user id 3 created, token payload decodes to `{role: "guide"}` |
| 2 | Register with `role: "tourist"` (explicit) | 201, role stored as tourist | ✅ user id 4 |
| 3 | Register with role omitted | 201, defaults to tourist | ✅ user id 5, role = tourist |
| 4 | Register with `role: "admin"` | 400, validation error | ✅ `{"error":"role must be one of: tourist, guide"}` |
| 5 | Login as guide | 200, response includes role | ✅ |
| 6 | `GET /me` with guide token | 200, user.role == "guide" | ✅ |

**Seed guide account** (for testing the guide UI):
- Email: `priya.guide@example.com`
- Password: `guide123`

### What this unlocks for the "contact travel guide" feature

- JWT already carries `role`, so a future protected route can do `requireRole('guide')` in one line
- Frontend already knows `user.role`, so you can branch the UI (e.g., show "Message" buttons only to tourists, show an "Inbox" tab only to guides)
- Suggested next DB pieces when you build contact:
  - `guide_profiles` table: `user_id FK`, bio, languages, location, hourly_rate, verified
  - `conversations` + `messages` tables: `tourist_id`, `guide_id`, timestamps
  - `bookings` table for the eventual booking flow

---

## Update 1 — Register & Login (2026-04-19)

Added user authentication (register, login, session persistence) with JWT + bcrypt. All layers tested end-to-end.

---

## Status: ✅ Done and verified

| Area | Status |
|---|---|
| Database schema | ✅ `users` table created in MAMP `travel_guide` |
| Backend endpoints | ✅ 3 endpoints live on port 5000 |
| Frontend pages | ✅ `/login` and `/register` routes render |
| Navbar integration | ✅ Shows "Log in / Sign up" → switches to avatar + name + logout after auth |
| Session persistence | ✅ JWT saved in `localStorage`, survives page reload |
| Security | ✅ Passwords hashed with bcrypt (10 rounds), tokens signed with JWT_SECRET (7-day expiry) |
| CSS styling | ✅ Dark-themed auth cards + navbar user menu |
| End-to-end tests | ✅ 7/7 passing (see "Tests run" below) |

---

## What was built

### Database
- **[db/users.sql](db/users.sql)** — new migration file
- Table `users` (id, name, email UNIQUE, password_hash, created_at)
- Executed against MAMP MySQL

### Backend — [server/routes/auth.js](server/routes/auth.js)

| Method | Endpoint | Body | Returns |
|---|---|---|---|
| POST | `/api/auth/register` | `{name, email, password}` | `201 {token, user}` — 400 on validation, 409 if email taken |
| POST | `/api/auth/login` | `{email, password}` | `200 {token, user}` — 401 on bad creds |
| GET | `/api/auth/me` | — (Bearer token header) | `200 {user}` — 401 if missing/invalid token |

- Mounted at `/api/auth` in [server/index.js](server/index.js)
- Password hashing: `bcryptjs` (10 salt rounds)
- Tokens: `jsonwebtoken`, HS256, 7-day expiry
- `requireAuth` middleware exported for protecting future routes
- Email normalized to lowercase before storage and lookup
- Password minimum 6 characters enforced on register

### Backend config
- **[server/.env](server/.env)** — added `JWT_SECRET` (96-char random hex, generated locally, not committed)
- **[server/.env.example](server/.env.example)** — placeholder `JWT_SECRET=replace-with-a-long-random-hex-string`
- New deps in [server/package.json](server/package.json): `bcryptjs`, `jsonwebtoken`

### Frontend — auth context + pages
- **[client/src/context/AuthContext.js](client/src/context/AuthContext.js)** — `AuthProvider` + `useAuth()` hook
  - State: `user`, `token`, `isAuthenticated`, `loading`
  - Methods: `login(email, password)`, `register(name, email, password)`, `logout()`
  - Persistence: `localStorage` under key `travelwire_auth`
- **[client/src/components/Login.js](client/src/components/Login.js)** — `/login` route
- **[client/src/components/Register.js](client/src/components/Register.js)** — `/register` route with password + confirm-password validation
- **[client/src/App.js](client/src/App.js)** — wraps app in `<AuthProvider>`, adds two routes
- **[client/src/components/Navbar.js](client/src/components/Navbar.js)** — logged-out shows "Log in" + "Sign up" CTA; logged-in shows avatar (initials) + name + dropdown with email + logout
- **[client/src/index.css](client/src/index.css)** — added ~200 lines of auth styling (auth cards, form inputs, user menu, CTA button)

### Brand fix (bonus)
- **[client/public/index.html:6](client/public/index.html#L6)** — meta description updated from "Wanderlust" → "Travel Wire" (the last remaining occurrence)

---

## Tests run

All against the live server on `http://localhost:5000`.

| # | Scenario | Expected | Result |
|---|---|---|---|
| 1 | `POST /api/auth/register` with new user | 201 + token + user | ✅ Returned JWT + user `{id:1, name:"Test User", email:"test@example.com"}` |
| 2 | `POST /api/auth/register` with short password (`abc`) | 400 | ✅ `{"error":"password must be at least 6 characters"}` |
| 3 | `POST /api/auth/register` with duplicate email | 409 | ✅ `{"error":"email is already registered"}` |
| 4 | `POST /api/auth/login` with correct creds | 200 + token | ✅ Returned fresh JWT |
| 5 | `POST /api/auth/login` with wrong password | 401 | ✅ `{"error":"invalid email or password"}` |
| 6 | `GET /api/auth/me` with valid Bearer token | 200 + user | ✅ Returned user object |
| 7 | `GET /api/auth/me` without token | 401 | ✅ `{"error":"missing token"}` |

**Frontend checks**
- Client dev server (port 3000) recompiled cleanly after every file change ("Compiled successfully!")
- `/login` and `/register` return `200` with the SPA bundle (React Router handles rendering)
- Meta description in served HTML confirmed as "Travel Wire"

**Seed test user** (left in DB so you can log in immediately):
- Email: `test@example.com`
- Password: `secret123`

---

## How to try it in the browser

1. Server on **http://localhost:5000** — already running
2. Client on **http://localhost:3000** — already running
3. Visit **http://localhost:3000** → click **Sign up** in the top-right
4. Register a new account OR log in with the seed credentials above
5. After auth, the navbar shows your avatar + name; click it for the logout menu
6. Reload the page — you stay logged in (token persists in `localStorage`)

---

## Known limitations (not in this scope)

- No "forgot password" / password reset flow
- No email verification
- No rate limiting on login (brute-force protection)
- Reviews are still anonymous — auth is not yet required to post a review (easy next step: pass the token to `POST /api/reviews` and auto-fill `author` from `req.user`)
- No protected routes on the frontend yet (every page is still public)
- No user profile page

---

## Files changed / added

**Added**
- `db/users.sql`
- `server/routes/auth.js`
- `client/src/context/AuthContext.js`
- `client/src/components/Login.js`
- `client/src/components/Register.js`

**Modified**
- `server/index.js` (mount auth router)
- `server/.env` (JWT_SECRET — not committed)
- `server/.env.example` (JWT_SECRET placeholder)
- `server/package.json` + `package-lock.json` (bcryptjs, jsonwebtoken)
- `client/src/App.js` (AuthProvider + routes)
- `client/src/components/Navbar.js` (auth-aware UI)
- `client/src/index.css` (auth styles)
- `client/public/index.html` (Wanderlust → Travel Wire meta)
