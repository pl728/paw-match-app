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
npm start
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
npm start
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

## API Docs
Swagger/OpenAPI docs are auto-generated on `npm start`.
```
http://localhost:4516/docs
http://localhost:4516/openapi.json
```
To regenerate without starting the server:
```
npm run swagger
```

---

## Backend Architecture

### Overview
The backend is built with Express.js and follows a layered architecture pattern for separation of concerns:
- **Routes** - Define HTTP endpoints and handle request/response logic
- **DAOs (Database Access Objects)** - Abstract database queries and contain all raw SQL
- **Middleware** - Handle cross-cutting concerns like authentication
- **Utils** - Provide helper functions for common tasks

### Database Access Objects (DAOs)

DAOs are located in `dao/` and export functions for querying the database. This is where all raw SQL lives.

**Purpose:**
- Centralize all database queries in one place
- Provide a clean interface for routes to interact with the database
- Make it easier to modify database logic without touching route handlers

**Example DAOs:**
- `dao/users.js` - User CRUD operations
- `dao/shelters.js` - Shelter CRUD operations
- `dao/pets.js` - Pet CRUD operations
- `dao/favorites.js` - Favorite pets functionality
- `dao/shelter_follows.js` - Shelter following functionality
- `dao/shelter_posts.js` - Shelter posts and announcements
- `dao/feed_events.js` - Feed events for the home page
- `dao/email_notifications.js` - Email notification preferences

**Example:**
```javascript
// In dao/pets.js
export async function getPetById(petId) {
    const result = await db.query(
        'SELECT * FROM pets WHERE id = ?',
        [petId]
    );
    return result.rows[0] || null;
}

// In routes/pets.js
import { getPetById } from '../dao/pets.js';
router.get('/:id', asyncHandler(async function (req, res) {
    const pet = await getPetById(req.params.id);
    if (!pet) {
        return res.status(404).json({ error: 'Pet not found' });
    }
    res.json(pet);
}));
```

### Routes and Express.js

Routes are located in `routes/` and use Express.js routers with REST conventions.

**Available Routes:**
- `/auth` - Registration and login (public)
- `/users` - User management (mixed: some public, some protected)
- `/shelters` - Shelter CRUD (mixed: GET public, POST/DELETE protected)
- `/pets` - Pet listings and management (mixed: GET public, CUD protected)
- `/api/favorites` - User favorites (protected)
- `/api/shelter-follows` - Shelter following (protected)
- `/api/shelter-posts` - Shelter posts/announcements (protected)
- `/api/feed` - Activity feed (protected)
- `/api/email-notifications` - Email notification settings (protected)

**REST Conventions:**
- `GET /resource` - List all
- `GET /resource/:id` - Get one by ID
- `POST /resource` - Create new
- `PUT /resource/:id` - Update existing
- `DELETE /resource/:id` - Delete

Routes use DAOs to maintain better separation of concerns - routes handle HTTP logic, DAOs handle database logic.

### Authorization & Authentication

**JWT-based Authentication:**
We use JWT (JSON Web Tokens) for stateless session management. Tokens are issued on registration/login and must be included in subsequent requests.

**Middleware:**
- `middleware/auth.js` exports `requireAuth(req, res, next)`
- Extracts and verifies the JWT from the `Authorization: Bearer <token>` header
- Attaches `req.userId` and `req.userRole` to the request object
- Returns 401 if token is missing or invalid

**Environment Variables:**
- `JWT_SECRET` - Secret key for signing/verifying tokens (required)
- `JWT_EXPIRES_IN` - Token expiration time (default: `7d`)

**Protected vs Public Endpoints:**

**Public Endpoints (no auth required):**
- `POST /auth/register` - Create account
- `POST /auth/login` - Login
- `GET /pets` - Browse pets
- `GET /pets/:id` - View pet details
- `GET /shelters` - Browse shelters
- `GET /shelters/:id` - View shelter details

**Protected Endpoints (require Bearer token):**
- `GET /users/me` - Get current user info (any authenticated user)
- `POST /shelters` - Create shelter (requires `shelter_admin` role)
- `DELETE /shelters/:id` - Delete shelter (requires `shelter_admin` role, own shelter only)
- `POST /pets` - Add pet (requires `shelter_admin` role)
- `PUT /pets/:id` - Update pet (requires `shelter_admin` role, own shelter's pet only)
- `DELETE /pets/:id` - Delete pet (requires `shelter_admin` role, own shelter's pet only)
- All `/api/*` routes (favorites, follows, posts, feed, notifications)

**Password Hashing:**
Passwords are hashed using bcrypt (10 rounds) before storing in the database. Never store plain text passwords.

### Database Structure

**Database:** MySQL

**Key Files:**
- `db/schema.sql` - Database schema (table definitions)
- `db/seed.sql` - Seed data for development/testing
- `db/pool.js` - MySQL connection pool management
- `db/index.js` - Database query interface

**Why use a pool?**
A connection pool maintains multiple reusable database connections, which is more efficient than creating a new connection for each query. The pool automatically manages connection lifecycle, handles reconnections, and prevents connection exhaustion.

**Architecture:**
- `pool.js` creates and exports a singleton MySQL connection pool
- `index.js` imports the pool and provides a simple `query()` interface
- DAOs use `db.query()` to execute SQL

**Example:**
```javascript
// db/pool.js - creates the pool
export function getPool() {
    if (!pool) {
        pool = mysql.createPool(process.env.DATABASE_URL);
    }
    return pool;
}

// db/index.js - provides query interface
const db = {
    query: async function (text, params) {
        const connection = getPool();
        const result = await connection.query(text, params);
        return { rows: result[0] };
    }
};

// DAOs use db.query()
import db from '../db/index.js';
const result = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
```

### Scripts

**`scripts/reset_db.js`**
- Resets the main database (drops and recreates it)
- Runs `db/schema.sql` and `db/seed.sql`
- Usage: `node scripts/reset_db.js`
- **WARNING:** Destructive operation - deletes all data

**`scripts/reset_test_db.js`**
- Same as `reset_db.js` but for the test database
- Used automatically by the test runner

**`scripts/run_tests.js`**
- Resets the test database
- Runs Jest test suite
- Used by `npm test`
- Sets `DATABASE_URL` to `TEST_DATABASE_URL` to ensure tests run against test DB

**`scripts/generate_swagger.js`**
- Generates Swagger/OpenAPI documentation from route comments
- Outputs to `swagger-output.json`
- Run automatically on `npm start` (via `prestart` hook)
- Can also run manually: `npm run swagger`

### Testing

**Test Framework:** Jest (test runner) + Supertest (HTTP testing library)

**How it works:**
- Jest runs the test suite and provides test organization, assertions, and reporting
- Supertest allows testing HTTP endpoints without starting the server
- Tests always run against the test database (`TEST_DATABASE_URL`)
- The test database is reset before each test run

**Running tests:**
```bash
npm test
```

**Test organization:**
```
tests/
├── auth.test.js           # Authentication endpoints
├── users.test.js          # User management
├── shelters.test.js       # Shelter CRUD
└── pets.test.js           # Pet CRUD
```

**Example test:**
```javascript
import request from 'supertest';
import app from '../main.js';

test('GET /pets returns list of pets', async () => {
    const res = await request(app).get('/pets');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
});
```

### Utils

**`utils/async-handler.js`**

A utility wrapper that eliminates the need for try-catch blocks in async route handlers.

**Problem it solves:**
Without this wrapper, you'd need to wrap every async route handler in try-catch:
```javascript
router.get('/:id', async function (req, res) {
    try {
        const pet = await getPetById(req.params.id);
        res.json(pet);
    } catch (err) {
        next(err); // Pass to error handler
    }
});
```

**With asyncHandler:**
```javascript
import asyncHandler from '../utils/async-handler.js';

router.get('/:id', asyncHandler(async function (req, res) {
    const pet = await getPetById(req.params.id);
    res.json(pet);
}));
```

Any errors thrown inside the handler are automatically caught and passed to Express's error handling middleware.

### Environment Variables

**Setup:**
1. Copy the example file: `cp .env.example .env`
2. Edit `.env` with your configuration

**Required Variables:**

```bash
# Database connection for main/development database
DATABASE_URL=mysql://user:password@127.0.0.1:3306/paw_match

# Database connection for tests (separate database)
TEST_DATABASE_URL=mysql://user:password@127.0.0.1:3306/paw_match_test

# Server port (default: 4516)
PORT=4516

# JWT secret for signing tokens (REQUIRED for auth to work)
# In production, use a strong random string
JWT_SECRET=your-secret-key-here

# JWT token expiration (default: 7d)
JWT_EXPIRES_IN=7d
```

**Security Notes:**
- Never commit `.env` to version control (already in `.gitignore`)
- Use strong, random values for `JWT_SECRET` in production
- Different `JWT_SECRET` values in different environments will invalidate tokens
