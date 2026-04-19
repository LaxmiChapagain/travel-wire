# Travel Guide

A Travel Guide web app with a React frontend, Node/Express backend, and MySQL database (via MAMP).

## Prerequisites

- **MAMP** running with MySQL on port `8889` (default MAMP port)
- **Node.js** and **npm** installed
- The `travel_guide` database created in phpMyAdmin with schema + seed data imported from [db/schema.sql](db/schema.sql) and [db/seed_countries.sql](db/seed_countries.sql)

## Project structure

- [server/](server/) — Node/Express API (port **5000**)
- [client/](client/) — React frontend (port **3000** in dev)
- [db/](db/) — SQL schema and seed files

## First-time setup

### 1. Start MAMP
Open MAMP and click **Start Servers**. Make sure MySQL is running on port `8889`.

### 2. Import the database
Open phpMyAdmin (http://localhost:8888/phpMyAdmin5/), create a database named `travel_guide`, then import:
1. `db/schema.sql`
2. `db/seed_countries.sql`

### 3. Configure server env
The file [server/.env](server/.env) already has MAMP defaults. Adjust only if your MySQL credentials differ.

### 4. Install dependencies (run once)

```bash
cd server
npm install

cd ../client
npm install
```

## Running the app (two terminals)

You need **both** the API server and the React client running at the same time. They run in separate terminals.

### Terminal 1 — API server (port 5000)

```bash
cd /Applications/MAMP/htdocs/Travel_Guide/server
npm run start
```

You should see: `Server listening on port 5000`

Verify the database is connected by visiting **http://localhost:5000/api/db-test** — you should see:
```json
{"ok":true,"message":"Database connected successfully!","places_count":18,"reviews_count":17}
```

### Terminal 2 — React client (port 3000)

```bash
cd /Applications/MAMP/htdocs/Travel_Guide/client
npm start
```

Wait ~30–60 seconds for the first compile. When you see `Compiled successfully!`, it will auto-open **http://localhost:3000** in your browser.

**This is your full website.** The client proxies `/api/*` requests to the server on port 5000 (configured in [client/package.json](client/package.json) via the `proxy` field).

## Alternative: single-port production mode

If you don't want to run two terminals, build the client once and serve everything from port 5000:

```bash
cd /Applications/MAMP/htdocs/Travel_Guide/client
npm run build

cd ../server
NODE_ENV=production npm run start
```

Then open **http://localhost:5000** — the server serves both the built React app and the API from the same port (see [server/index.js:56-61](server/index.js#L56-L61)).

## Common issues

### `localhost:3000` says "refused to connect"
The React dev server isn't running. Open a second terminal and run `npm start` in the `client/` folder. Port 5000 is only the API — it does not serve the website pages in dev mode.

### `/api/db-test` returns an error
- MAMP MySQL isn't running → start MAMP
- The `travel_guide` database doesn't exist → create it and import the SQL files
- Credentials in [server/.env](server/.env) don't match MAMP → fix them

### Port 5000 or 3000 already in use
Find and kill the process:
```bash
lsof -iTCP:5000 -sTCP:LISTEN -n -P
kill <PID>
```

## API endpoints

- `GET /api/health` — health check
- `GET /api/db-test` — database connectivity check
- `GET /api/places` — list places
- `GET /api/reviews` — list reviews
- `GET /api/categories` — list categories
- `GET /api/countries` — list countries
