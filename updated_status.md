# Travel Wire — Feature Updates

_Last updated: 2026-04-19_

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
