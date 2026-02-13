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
   - WSL/Ubuntu:
     ```
     sudo apt update
     sudo apt install -y mysql-server
     sudo service mysql start
     ```
   - macOS (Homebrew):
     ```
     brew install mysql
     brew services start mysql
     ```
2) Create a DB user that can create/drop databases (recommended).
   - WSL/Ubuntu:
     ```
     sudo mysql -e "CREATE USER IF NOT EXISTS 'pawmatch'@'localhost' IDENTIFIED BY 'pawmatch'; GRANT CREATE, DROP ON *.* TO 'pawmatch'@'localhost'; GRANT ALL PRIVILEGES ON paw_match.* TO 'pawmatch'@'localhost'; GRANT ALL PRIVILEGES ON paw_match_test.* TO 'pawmatch'@'localhost'; FLUSH PRIVILEGES;"
     ```
   - macOS:
     ```
     mysql -u root -e "CREATE USER IF NOT EXISTS 'pawmatch'@'localhost' IDENTIFIED BY 'pawmatch'; GRANT CREATE, DROP ON *.* TO 'pawmatch'@'localhost'; GRANT ALL PRIVILEGES ON paw_match.* TO 'pawmatch'@'localhost'; GRANT ALL PRIVILEGES ON paw_match_test.* TO 'pawmatch'@'localhost'; FLUSH PRIVILEGES;"
     ```
     (If that fails, try `mysql -u root -p -e "..."`.)
3) Set env vars in `backend/.env` (recommended: copy from `.env.example`):
```
cp .env.example .env
```
Then edit `backend/.env` to:
```
DATABASE_URL=mysql://pawmatch:pawmatch@127.0.0.1:3306/paw_match
TEST_DATABASE_URL=mysql://pawmatch:pawmatch@127.0.0.1:3306/paw_match_test
PORT=4516
```
4) Run:
```
npm install
node scripts/reset_db.js
node main.js
```

### Verifying MySQL is running on port 3306
In MySQL:
```sql
SHOW VARIABLES LIKE 'port';
```
Or from the shell (Linux/WSL):
```
sudo ss -lntp | rg ':(3306)\\b|mysqld'
```

## Tests
Tests always reset the test DB, then run Jest:
```
npm test
```

Notes:
- The reset scripts drop and recreate the target database (destructive).
- Use `127.0.0.1` instead of `localhost` to force TCP.
