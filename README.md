# Service Request Management System

## Project Overview

A full-stack web application for managing service requests. Users with the **USER** role will be able to submit and track their own service requests, and users with the **ADMIN** role will be able to review them and move them through a status workflow.

The project is being built incrementally. The current state is the **project foundation plus backend authentication and authorization**: a React frontend and an Express REST API connected to MongoDB, with a health-check endpoint, registration and login, cookie-based JWT sessions, and USER/ADMIN roles. Service request features and the frontend login screens have not been implemented yet.

## Current Technology Stack

```text
Frontend: React + Vite
Backend: Node.js + Express
Database: MongoDB + Mongoose
Language: JavaScript
```

## Project Structure

```text
.
├── frontend/   React + Vite single-page application
└── backend/    Node.js + Express REST API (MongoDB via Mongoose)
```

- **`frontend/`**: the React client. `src/services/` holds the code that calls the API. For now the page only shows the configured API URL and has a button that calls the health endpoint.
- **`backend/`**: the Express API.
  - `src/app.js` sets up Express: middleware, routes, and error handling.
  - `src/server.js` loads environment variables, connects to MongoDB, and starts the HTTP server.
  - `src/config/database.js` holds the MongoDB connection logic.
  - `src/middleware/error.middleware.js` contains the 404 handler and the central error handler.
  - `src/middleware/auth.middleware.js` contains `authenticate` (who is calling) and `authorize` (which roles may call).
  - `src/models/` holds the Mongoose models: `User` and `RefreshToken` (one document per login session).
  - `src/validators/` holds plain request-validation functions.
  - `src/services/auth.service.js` holds the registration, login, refresh and logout logic.
  - `src/controllers/` and `src/routes/` hold thin HTTP handlers and route definitions.
  - `src/utils/` holds `AppError`, token helpers (`tokens.js`) and auth cookie helpers (`cookies.js`).
  - `src/scripts/seed-admin.js` creates the first ADMIN account.

## Local Setup

### Prerequisites

- Node.js 20 or newer (includes npm)
- MongoDB running locally, or a MongoDB connection string (for example MongoDB Atlas)

### 1. Clone the repository

```bash
git clone <repository-url>
cd visionroot-software-engineering-assignment
```

### 2. Install frontend dependencies

```bash
cd frontend
npm install
```

### 3. Install backend dependencies

```bash
cd ../backend
npm install
```

### 4. Create `.env` files from the examples

```bash
# from the repository root
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

On Windows (PowerShell), use `Copy-Item` in place of `cp`.

Backend variables (`backend/.env`):

| Variable        | Description                                               | Example                                                   |
| --------------- | --------------------------------------------------------- | --------------------------------------------------------- |
| `PORT`          | Port the API listens on                                   | `5000`                                                    |
| `NODE_ENV`      | `development` or `production`                             | `development`                                             |
| `MONGODB_URI`   | MongoDB connection string (**required**)                  | `mongodb://localhost:27017/visionroot_service_management` |
| `CLIENT_ORIGIN` | Frontend origin allowed by CORS (**required**)            | `http://localhost:5173`                                   |
| `JWT_ACCESS_SECRET` | Secret used to sign access tokens (**required**; use a long random string) | `replace-with-a-long-random-string` |
| `ACCESS_TOKEN_EXPIRES_IN` | Access token lifetime (defaults to `15m`) | `15m` |
| `REFRESH_TOKEN_EXPIRES_DAYS` | Refresh token and session lifetime in days (defaults to `7`) | `7` |
| `SEED_ADMIN_NAME` | Name of the admin created by `npm run seed:admin` | `System Admin` |
| `SEED_ADMIN_EMAIL` | Email of that admin | `admin@example.com` |
| `SEED_ADMIN_PASSWORD` | Password of that admin (8–72 characters) | `replace-with-a-strong-password` |

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Frontend variables (`frontend/.env`):

| Variable       | Description          | Example                     |
| -------------- | -------------------- | --------------------------- |
| `VITE_API_URL` | Base URL of the API  | `http://localhost:5000/api` |

`.env` files are ignored by Git. Only the `.env.example` files are committed.

### 5. Start MongoDB

Start your local MongoDB server (for example, the `MongoDB` Windows service, `brew services start mongodb-community` on macOS, or `sudo systemctl start mongod` on Linux). If you use MongoDB Atlas, set `MONGODB_URI` to your Atlas connection string instead.

### 6. Start the backend

```bash
cd backend
npm run dev     # development, restarts automatically on changes (nodemon)
# or
npm start       # plain node
```

The API runs at `http://localhost:5000`. If `MONGODB_URI`, `CLIENT_ORIGIN` or `JWT_ACCESS_SECRET` is missing, `REFRESH_TOKEN_EXPIRES_DAYS` is not a positive number, or MongoDB is unreachable, the server logs the reason and exits.

### 6a. Create the admin account (once)

```bash
cd backend
npm run seed:admin
```

This creates an ADMIN user from the `SEED_ADMIN_*` variables. Running it again is safe: if the email already exists, it logs that and exits without changes.

### 7. Start the frontend

```bash
cd frontend
npm run dev
```

Open `http://localhost:5173` and click **Check API health** to confirm the frontend can reach the backend.

## Current API

Base URL: `http://localhost:5000/api`

### `GET /api/health`

Checks that the API is running.

**Response `200 OK`**

```json
{
  "success": true,
  "message": "API is running"
}
```

Example:

```bash
curl http://localhost:5000/api/health
```

Unknown routes return `404 Not Found`:

```json
{
  "success": false,
  "message": "Route not found: GET /api/does-not-exist"
}
```

### Error responses

Every error uses the same shape. `errors` is only present when there are per-field details:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": { "email": "A valid email is required" }
}
```

| Situation                          | Status | Message                    |
| ---------------------------------- | ------ | -------------------------- |
| Validation failed                  | 400    | `Validation failed`        |
| Malformed JSON body                | 400    | `Malformed JSON`           |
| Invalid MongoDB id                 | 400    | `Invalid ID`               |
| Not authenticated                  | 401    | depends on the reason      |
| Authenticated but role not allowed | 403    | `You do not have permission to perform this action` |
| Unknown route                      | 404    | `Route not found: ...`     |
| Duplicate value (e.g. email)       | 409    | depends on the field       |
| Request body larger than 10 kB     | 413    | `Request body too large`   |
| Anything unexpected                | 500    | `Internal server error`    |

Unexpected errors are logged on the server. Stack traces are only included in responses when `NODE_ENV=development`.

### Auth endpoints (`/api/auth`)

All request bodies are JSON. Tokens are **never** returned in response bodies; they are only set as HttpOnly cookies, so a browser client must send requests with credentials (`fetch(..., { credentials: 'include' })` or `axios` with `withCredentials: true`).

#### `POST /api/auth/register`

Creates a **USER** account. Does not log in and sets no cookies. Any `role` field in the body is ignored.

```json
{ "name": "Jane Doe", "email": "jane@example.com", "password": "at-least-8-chars" }
```

| Status | When |
| ------ | ---- |
| `201`  | Created. Body: `{ "success": true, "message": "Registration successful", "data": { "user": { "id", "name", "email", "role", "createdAt", "updatedAt" } } }` |
| `400`  | Validation failed (name 2–50 characters after trimming, valid email, password 8–72 characters) |
| `409`  | `Email is already registered` (emails are case-insensitive) |

#### `POST /api/auth/login`

```json
{ "email": "jane@example.com", "password": "at-least-8-chars" }
```

| Status | When |
| ------ | ---- |
| `200`  | Sets the `accessToken` and `refreshToken` cookies. Body: `{ "success": true, "data": { "user": { ... } } }` |
| `400`  | Email or password missing |
| `401`  | `Invalid email or password` (the same for an unknown email and a wrong password) |

#### `POST /api/auth/refresh`

No body. Reads the `refreshToken` cookie, rotates the session, and sets new `accessToken` and `refreshToken` cookies.

| Status | When |
| ------ | ---- |
| `200`  | New cookies set. Body: `{ "success": true, "data": { "user": { ... } } }` |
| `401`  | Cookie missing, unknown, expired, or already used. Both cookies are cleared; the client must log in again. |

#### `POST /api/auth/logout`

No body and no valid access token needed (it may already have expired). Revokes the session behind the `refreshToken` cookie, if any, and clears both cookies.

| Status | When |
| ------ | ---- |
| `200`  | Always. Body: `{ "success": true, "message": "Logged out" }` |

#### `GET /api/auth/me`

Returns the logged-in user.

| Status | When |
| ------ | ---- |
| `200`  | Body: `{ "success": true, "data": { "user": { "id", "name", "email", "role" } } }` |
| `401`  | Not logged in, access token invalid or expired, or session revoked |

### User endpoints (`/api/users`)

#### `GET /api/users` (ADMIN only)

Lists all users, newest first. No pagination yet.

| Status | When |
| ------ | ---- |
| `200`  | Body: `{ "success": true, "data": { "users": [ { ... } ] } }` |
| `401`  | Not logged in |
| `403`  | Logged in, but not an ADMIN |

## Authentication & Authorization

### Access and refresh tokens

Logging in creates a **session** and issues two tokens:

- **Access token**: a JWT signed with `JWT_ACCESS_SECRET`, valid for **15 minutes** (`ACCESS_TOKEN_EXPIRES_IN`). It is sent with every request and proves who the caller is. It contains only the user id (`sub`) and the session id (`sid`), not the role.
- **Refresh token**: a random 80-character hex string (40 random bytes from Node's `crypto`), valid for **7 days** (`REFRESH_TOKEN_EXPIRES_DAYS`). It is only used to get a new access token from `POST /api/auth/refresh`.

The split keeps the token that travels on every request short-lived, while the user still stays logged in for a week. When an access token expires the client calls `/refresh` and retries.

### Why HttpOnly cookies

Both tokens are stored in `HttpOnly` cookies, never in `localStorage` or response bodies. JavaScript on the page cannot read HttpOnly cookies, so an XSS bug cannot steal the tokens. The cookies are `SameSite=Lax`, which stops browsers from sending them on cross-site POST requests (basic CSRF protection), and `Secure` in production so they are only sent over HTTPS.

The access token cookie has `Path=/`. The refresh token cookie has `Path=/api/auth`, so the browser only sends it to the auth endpoints (refresh and logout) and not with every API call. This limits where the long-lived token is exposed.

If the frontend and API are deployed on different sites (different registrable domains), browsers will not send `SameSite=Lax` cookies with cross-site API calls. That setup needs `SameSite=None` together with `Secure` (see `src/utils/cookies.js`).

### Refresh tokens are stored only as SHA-256 hashes

Each session is a document in the `refreshtokens` collection whose `_id` is the session id. The raw refresh token is never stored; only its SHA-256 hash is. Anyone who reads the database therefore cannot use the stored values to log in.

SHA-256 is used instead of bcrypt because the two protect different things. bcrypt is deliberately slow to protect **low-entropy** secrets such as passwords from guessing. A refresh token is 320 bits of randomness, so there is nothing to guess, and a fast, **deterministic** hash lets the server find the session with a single indexed lookup (`tokenHash` has a unique index). bcrypt's random salt would make that lookup impossible.

### Rotation and reuse detection

Every successful `/refresh` **rotates** the session: the old session is marked revoked (`revokedAt`), linked to its successor (`replacedBy`), and a new session with a new refresh token is created. Each refresh token therefore works exactly once.

If a refresh token that was already used or revoked is presented again, it has most likely been copied by someone else. The server treats this as **reuse**: it revokes **all** of that user's active sessions, logs a warning, and returns `401`. Both the attacker and the real user must log in again, and the attacker's copy is useless.

The old session is revoked with a conditional update before the new one is created, so if two requests race with the same token only one succeeds and the other is handled as reuse. Clients should therefore send only one `/refresh` at a time.

### Immediate logout via the session id

The access token carries the session id (`sid`). On every authenticated request `authenticate` loads that session and rejects the request if it is missing, revoked or expired. Logging out, rotation, and reuse detection therefore take effect **immediately**, without waiting up to 15 minutes for the access token to expire.

The trade-off is one extra database lookup (by `_id`) per authenticated request, in exchange for real server-side revocation.

### Cleanup of expired sessions

`expiresAt` has a MongoDB **TTL index** (`expireAfterSeconds: 0`), so MongoDB deletes each session document automatically once it expires. Its background job runs about once a minute, which is why the code also checks `expiresAt` itself. Revoked sessions are kept until they expire so that reuse can still be detected.

### Logout is per device

Each login is its own session. `POST /api/auth/logout` revokes only the session of the device that calls it; other logged-in devices stay logged in.

### Roles

- Roles are `USER` and `ADMIN`. The role is **always read from the database** on each request, never from the token, so a role change applies on the next request.
- `authenticate` answers "who are you?" and returns **401** when the caller is not logged in. `authorize(...roles)` answers "may you do this?" and returns **403** when a logged-in user's role is not allowed.
- Public registration **always** creates a `USER`; a `role` sent in the request body is ignored.
- The only way to create an `ADMIN` is `npm run seed:admin` (see Local Setup).

### Login and password rules

- Login returns the **same** `401 Invalid email or password` for an unknown email and for a wrong password, and takes about as long in both cases, so the endpoint cannot be used to find out which emails are registered.
- Passwords must be **8–72 characters**. The upper limit exists because bcrypt only uses the first 72 bytes of a password; anything longer would be silently ignored. Passwords are hashed with bcrypt at cost 12.

### Future improvements

- **Log out of all devices**: revoke every active session of the user (the service already does this internally for reuse detection).
- **Rate limiting** on `/login` and `/refresh` to slow down password guessing and token abuse.
