# Backend Setup (MySQL)

Quick local setup for the Express API + MySQL.

## Option A: Docker (recommended)
1) From repo root:
```
docker compose up -d db
```
2) In `backend/`, set env vars (or edit `.env`):
```
DATABASE_URL=mysql://root:pawmatch_root@127.0.0.1:3306/paw_match
TEST_DATABASE_URL=mysql://root:pawmatch_root@127.0.0.1:3306/paw_match_test
PORT=4516
```
3) Install deps and reset DB:
```
npm install
node scripts/reset_db.js
```
4) Start the API:
```
node main.js
```

## Option B: Local MySQL (no Docker)
1) Install MySQL Server and start it.
2) Ensure a user with privileges to create/drop databases (or use root).
3) Set env vars in `backend/.env`:
```
DATABASE_URL=mysql://root:your_password@127.0.0.1:3306/paw_match
TEST_DATABASE_URL=mysql://root:your_password@127.0.0.1:3306/paw_match_test
PORT=4516
```
4) Run:
```
npm install
node scripts/reset_db.js
node main.js
```

## Tests
Tests always reset the test DB, then run Jest:
```
npm test
```

Notes:
- The reset scripts drop and recreate the target database (destructive).
- Use `127.0.0.1` instead of `localhost` to force TCP.
