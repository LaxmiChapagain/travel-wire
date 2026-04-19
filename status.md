# Travel Wire — Project Status

_Last updated: 2026-04-19_

A React + Node/Express + MySQL travel guide web app. Brand recently renamed from "Wanderlust" to **Travel Wire**.

---

## Summary

| Metric | Value |
|---|---|
| Backend | Node/Express on port **5000** |
| Frontend | React (CRA) on port **3000** (dev) |
| Database | MySQL via MAMP on port **8889** (DB: `travel_guide`) |
| Backend endpoints | 8 |
| Frontend routes | 3 (`/`, `/country/:code`, `/place/:id`) |
| React components | 7 (6 active, 1 unused) |
| Database tables | 3 (`countries`, `places`, `reviews`) |
| Seed data | 3 countries, 18 places, 17 reviews |

---

## 1. Backend (server/)

### Entry point — [server/index.js](server/index.js)
- Express app with `cors` and `body-parser`
- Static `/uploads` serving
- Mounts routers under `/api/places`, `/api/reviews`, `/api/categories`, `/api/countries`, `/api` (uploads)
- Health check: `GET /api/health`
- DB probe: `GET /api/db-test` — returns `{ok, places_count, reviews_count}`
- In `NODE_ENV=production`, serves `client/build/` + SPA fallback ([server/index.js:56-61](server/index.js#L56-L61))

### Database — [server/db.js](server/db.js)
- `mysql2` connection pool (max 10)
- Env: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- MAMP config in [server/.env](server/.env): `localhost:8889`, user/password `root`, db `travel_guide`

### Routes

| Method | Endpoint | File | Purpose |
|---|---|---|---|
| GET | `/api/places` | [routes/places.js](server/routes/places.js) | List places with optional `q` (search) and `category` filters; joins reviews for `avg_rating` + `review_count` (limit 200) |
| GET | `/api/places/:id` | [routes/places.js](server/routes/places.js) | Single place with aggregated rating |
| GET | `/api/reviews/place/:placeId` | [routes/reviews.js](server/routes/reviews.js) | List reviews for a place (newest first) |
| POST | `/api/reviews` | [routes/reviews.js](server/routes/reviews.js) | Submit review `{place_id, rating(1-5), author?, comment?}` |
| GET | `/api/countries` | [routes/countries.js](server/routes/countries.js) | List countries with `place_count` + `overall_rating` |
| GET | `/api/countries/:code` | [routes/countries.js](server/routes/countries.js) | Country detail with nested `places[]` sorted by rating |
| GET | `/api/categories` | [routes/categories.js](server/routes/categories.js) | Distinct place categories |
| POST | `/api/places/:id/image` | [routes/uploads.js](server/routes/uploads.js) | `multer` upload (5 MB max) → saves to `server/uploads/`, updates `places.image` |

### Backend dependencies
`express`, `cors`, `body-parser`, `dotenv`, `mysql2`, `multer`

### Backend notes
- No authentication, no rate limiting
- Reviews default to `Anonymous` author
- Image upload endpoint is unauthenticated (anyone can upload)
- All DB queries use parameterized statements

---

## 2. Frontend (client/src/)

### Routing — [client/src/App.js](client/src/App.js)
| Path | Component |
|---|---|
| `/` | [HomePage](client/src/components/HomePage.js) |
| `/country/:code` | [CountryPage](client/src/components/CountryPage.js) |
| `/place/:id` | [PlaceDetail](client/src/components/PlaceDetail.js) |

Wrapped by [Navbar](client/src/components/Navbar.js) + [Footer](client/src/components/Footer.js).

### Components

- **[Navbar.js](client/src/components/Navbar.js)** — Brand "🌍 Travel Wire", sticky-on-scroll, Destinations dropdown (NP/US/FR), active-link highlighting, click-outside-to-close
- **[HomePage.js](client/src/components/HomePage.js)** — Hero with animated orbs + search, live stats (countries/places/reviews), country cards grid, top 6 featured places (by rating), "How it works" section
- **[CountryPage.js](client/src/components/CountryPage.js)** — Country hero, info chips (currency/language/best season), category filter buttons, filterable places grid
- **[PlaceDetail.js](client/src/components/PlaceDetail.js)** — Place hero, breadcrumb, rating box, description, highlights (parsed from `highlights` by `" • "`), reviews list, sidebar with ReviewForm
- **[ReviewForm.js](client/src/components/ReviewForm.js)** — Name (optional), rating dropdown, comment textarea, success/error banners, loading state
- **[Footer.js](client/src/components/Footer.js)** — "🌍 Travel Wire", country quick links, copyright
- **[PlacesList.js](client/src/components/PlacesList.js)** — Not referenced in `App.js`, appears to be dead code from an earlier iteration

### Styling
- Single file [client/src/index.css](client/src/index.css) (~2000 lines) — custom dark theme (`#0a0e1a`)
- Google Fonts: Outfit (headings), Inter (body)
- Bootstrap is a dependency but only used in the unused `PlacesList.js`

### Client dependencies — [client/package.json](client/package.json)
`react`, `react-dom`, `react-router-dom`, `react-scripts`, `bootstrap` (unused)
- `proxy: http://localhost:5000` routes `/api/*` to the backend in dev

### Frontend notes
- React Router v6 with `useParams` / `useNavigate`
- State is local (`useState` / `useEffect`), no global store
- `fetch` API (no axios/react-query)
- Image fallback: 📍 emoji when no image

---

## 3. Database (db/)

### Schema

**`places`** — [db/schema.sql](db/schema.sql)
`id`, `name`, `description`, `city`, `country`, `lat`, `lng`, `category`, `image`, `created_at`
Extended by [db/seed_countries.sql](db/seed_countries.sql) with `country_code VARCHAR(2)` and `highlights TEXT`.

**`reviews`** — [db/schema.sql](db/schema.sql)
`id`, `place_id` (FK → places), `author` (default `Anonymous`), `rating` (TINYINT, CHECK 1–5), `comment`, `created_at`

**`countries`** — [db/seed_countries.sql](db/seed_countries.sql)
`code` (PK, 2 chars), `name`, `description`, `hero_tagline`, `flag_emoji`, `currency`, `language`, `best_season`, `created_at`

### Seed data (current counts via `/api/db-test`)

| Table | Rows |
|---|---|
| countries | 3 — Nepal 🇳🇵, USA 🇺🇸, France 🇫🇷 |
| places | 18 — 6 per country |
| reviews | 17 |

**Nepal places:** Mount Everest Base Camp, Pashupatinath Temple, Boudhanath Stupa, Chitwan National Park, Phewa Lake & Pokhara, Lumbini
**USA places:** Grand Canyon, Statue of Liberty, Golden Gate Bridge, Yellowstone, Times Square, Central Park
**France places:** Eiffel Tower, Louvre, Mont Saint-Michel, Versailles, French Riviera (Nice), Château de Chambord

**Categories in use:** `landmark`, `historic`, `nature`, `adventure`, `park`

---

## 4. End-to-end flows (working)

1. **Browse countries → places** — `/` shows country cards → `/country/:code` shows filterable places grid → `/place/:id` shows detail
2. **View reviews** — `PlaceDetail` fetches `/api/reviews/place/:id` and renders the list with star ratings
3. **Submit a review** — `ReviewForm` POSTs to `/api/reviews`, banner confirms, list + rating aggregate refresh
4. **Search countries** — Hero search on `HomePage` matches NP/US/FR and navigates to that country page
5. **Filter by category** — Category chips on `CountryPage` filter the places grid client-side
6. **Image upload** — Backend accepts via `POST /api/places/:id/image` (no frontend UI yet)

---

## 5. Brand rename status: "Wanderlust" → "Travel Wire"

### Done
- [client/src/components/Navbar.js:43](client/src/components/Navbar.js#L43) — brand text
- [client/src/components/Footer.js:10](client/src/components/Footer.js#L10) — footer brand
- [client/src/components/Footer.js:18](client/src/components/Footer.js#L18) — copyright
- [client/public/index.html:8](client/public/index.html#L8) — `<title>`

### Remaining
- [client/public/index.html:6](client/public/index.html#L6) — `<meta name="description">` still says "Wanderlust —…"
- [status.md:1](status.md#L1) — previously said "Travel Guide (Wanderlust)" (replaced by this file)
- [client/build/](client/build/) — stale production bundle still contains "Wanderlust"; will refresh on next `npm run build`

---

## 6. Gaps / not implemented

- No review editing or deletion
- No authentication, users, or admin panel
- No 404 page or error boundary for invalid routes
- No map rendering despite `lat`/`lng` being stored
- No frontend UI for image upload (API only)
- No `.env.example` in `server/`
- `PlacesList.js` and the `bootstrap` dependency are unused
- No loading or error states beyond success/empty

---

## 7. Current run state

- **API server** — running on [http://localhost:5000](http://localhost:5000); `/api/db-test` returns `ok:true, places:18, reviews:17`
- **React dev server** — running on [http://localhost:3000](http://localhost:3000); compiled successfully
- **MySQL** — MAMP, port 8889, `travel_guide` schema loaded

Setup and run instructions: [HOW_TO_RUN.md](HOW_TO_RUN.md)

---

## File tree (trimmed)

```
Travel_Guide/
├── HOW_TO_RUN.md
├── status.md
├── server/
│   ├── index.js
│   ├── db.js
│   ├── .env
│   └── routes/
│       ├── places.js
│       ├── reviews.js
│       ├── countries.js
│       ├── categories.js
│       └── uploads.js
├── client/
│   ├── public/index.html
│   └── src/
│       ├── index.js
│       ├── App.js
│       ├── index.css
│       └── components/
│           ├── Navbar.js
│           ├── HomePage.js
│           ├── CountryPage.js
│           ├── PlaceDetail.js
│           ├── ReviewForm.js
│           ├── Footer.js
│           └── PlacesList.js   (unused)
└── db/
    ├── schema.sql
    └── seed_countries.sql
```
