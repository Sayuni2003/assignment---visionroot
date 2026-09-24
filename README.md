# Service Request Management System

## Project Overview

A full-stack web application for managing service requests. Users with the **USER** role submit and track their own service requests, and users with the **ADMIN** role review them and move them through a status workflow.

The project is being built incrementally. The current state is the **project foundation, backend authentication and authorization, the backend service request API, and the frontend screens**: an Express REST API connected to MongoDB, with a health-check endpoint, registration and login, cookie-based JWT sessions, USER/ADMIN roles, and service requests with a status workflow (see [Service Requests](#service-requests)), and a React single-page application in which USERs create, edit and cancel their requests and ADMINs review every request, change its status and list users (see [Frontend](#frontend)).

## Current Technology Stack

```text
Frontend: React + Vite, React Router, Tailwind CSS
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

- **`frontend/`**: the React client (see [Frontend](#frontend)).
  - `src/api/` holds every call to the API: `client.js` plus one file per resource.
  - `src/context/` holds `AuthContext` (who is logged in) and `ToastContext` (success and error notifications).
  - `src/pages/` holds one component per route; `src/components/` holds the shared components and the route guards.
  - `src/constants.js` mirrors the backend's request categories, priorities, statuses and transition table, plus display labels.
  - `src/hooks/useDocumentTitle.js` sets the browser tab title for each page.
  - `src/index.css` loads Tailwind CSS and defines the colour palette and the shared button and form classes.
- **`backend/`**: the Express API.
  - `src/app.js` sets up Express: middleware, routes, and error handling. It does not connect to the database or listen on a port, so tests can import it directly.
  - `src/server.js` connects to MongoDB and starts the HTTP server.
  - `src/config/env.js` loads `backend/.env` and validates every environment variable (see [Configuration](#configuration)).
  - `src/config/database.js` holds the MongoDB connection logic.
  - `src/middleware/error.middleware.js` contains the 404 handler and the central error handler.
  - `src/middleware/auth.middleware.js` contains `authenticate` (who is calling) and `authorize` (which roles may call).
  - `src/models/` holds the Mongoose models: `User`, `RefreshToken` (one document per login session) and `ServiceRequest`.
  - `src/constants/request.constants.js` holds the request categories, priorities, statuses and the status transition table.
  - `src/validators/` holds plain request-validation functions.
  - `src/services/auth.service.js` holds the registration, login, refresh and logout logic.
  - `src/services/request.service.js` holds every service request business rule (ownership, editing, cancelling, status changes).
  - `src/controllers/` and `src/routes/` hold thin HTTP handlers and route definitions.
  - `src/utils/` holds `AppError`, token helpers (`tokens.js`) and auth cookie helpers (`cookies.js`).
  - `src/scripts/seed-admin.js` creates the first ADMIN account.
  - `tests/` holds the automated tests (see [How to Run the Tests](#how-to-run-the-tests)).

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

| Variable | Description | Default | Example |
| -------- | ----------- | ------- | ------- |
| `PORT` | Port the API listens on | `5000` | `5000` |
| `NODE_ENV` | `development` enables stack traces in error responses; `production` makes cookies `Secure`. Anything else, including unset, gets neither. | unset | `development` |
| `MONGODB_URI` | MongoDB connection string | **required** | `mongodb://localhost:27017/visionroot_service_management` |
| `CLIENT_ORIGIN` | Frontend origin allowed by CORS | **required** | `http://localhost:5173` |
| `JWT_ACCESS_SECRET` | Secret used to sign access tokens; use a long random string | **required** | `replace-with-a-long-random-string` |
| `ACCESS_TOKEN_EXPIRES_MINUTES` | Access token lifetime in minutes (used for both the JWT and its cookie) | `15` | `15` |
| `REFRESH_TOKEN_EXPIRES_DAYS` | Refresh token and session lifetime in days | `7` | `7` |
| `SEED_ADMIN_NAME` | Name of the admin created by `npm run seed:admin` | seed only | `System Admin` |
| `SEED_ADMIN_EMAIL` | Email of that admin | seed only | `admin@example.com` |
| `SEED_ADMIN_PASSWORD` | Password of that admin (8–72 characters) | seed only | `replace-with-a-strong-password` |

Numeric variables must be whole numbers greater than zero; leaving one unset or empty uses its default.

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

The API runs at `http://localhost:5000`. If any environment variable is missing or invalid, the server lists every problem in one message and exits; it also exits if MongoDB is unreachable.

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

The frontend needs `frontend/.env` with `VITE_API_URL` (step 4) and the backend running (step 6). Vite reads `.env` only when it starts, so restart `npm run dev` after changing it.

Open **`http://localhost:5173`**, not `http://127.0.0.1:5173`. The auth cookies are only sent when the page and the API are on the same site, and CORS only allows `CLIENT_ORIGIN` (see [Frontend and API on the same site](#frontend-and-api-on-the-same-site)). The port is fixed (`strictPort` in `vite.config.js`): if 5173 is already in use, Vite exits instead of picking another port that `CLIENT_ORIGIN` would not allow.

Log in with the admin account from step 6a, or create a USER account on the **Create an account** page.

## How to Run the Tests

The backend tests use **Jest**, **Supertest** and **mongodb-memory-server**. Each run starts its own temporary in-memory MongoDB and throws it away afterwards, so you do not need a running MongoDB or a `backend/.env` file.

```bash
cd backend
npm test
```

The first run downloads a MongoDB binary for mongodb-memory-server, so it is slower; later runs use the cached copy.

Useful variations (everything after `--` is passed to Jest):

```bash
npm test -- tests/requests.api.test.js    # one file
npm test -- -t "cancelling"               # only tests whose name matches
npm test -- --watch                       # re-run on every file change
```

| File | What it covers |
| ---- | -------------- |
| `tests/setup-env.js` | Sets test environment variables before `src/config/env.js` loads (Jest `setupFiles`) |
| `tests/helpers.js` | Shared helpers: start, clear and stop the in-memory database; register and log in users; create an admin |
| `tests/auth.api.test.js` | API tests for `/api/auth` and `/api/users`: register, login, `me`, refresh rotation, logout, admin-only user listing, and the role being read from the database |
| `tests/request.constants.test.js` | Unit tests for `canTransition`: every allowed and forbidden transition, and unknown statuses |
| `tests/requests.api.test.js` | API tests for `/api/requests`: authentication and roles, validation, ownership, editing, cancelling, admin status changes, pagination, filtering and search |

The backend uses ES modules, so the `test` script runs Jest with Node's `--experimental-vm-modules` flag. The `ExperimentalWarning: VM Modules` line printed on each run is expected.

## Configuration

All environment variables are read in one place, `backend/src/config/env.js`, which exports a frozen `config` object (for example `config.jwt.accessSecret`, `config.refreshToken.expiresDays`, `config.isDevelopment`). No other module reads `process.env`; the only exception is the seed script, which reads the `SEED_ADMIN_*` variables it alone uses.

- `env.js` loads `backend/.env` (via `dotenv`, which never overrides variables that are already set) and validates everything **when it is first imported**. Required strings must be non-empty and numbers must be positive integers. If anything is wrong it prints every problem and exits with code 1, for example:

  ```text
  Invalid environment configuration (see backend/.env.example):
    - CLIENT_ORIGIN is required
    - JWT_ACCESS_SECRET is required
  ```

- `config.isDevelopment` is strictly `NODE_ENV === 'development'`, and `config.isProduction` is strictly `NODE_ENV === 'production'`.
- `app.js` never connects to the database or starts a server. Tests can import it directly, but must provide valid environment variables (at least `MONGODB_URI`, `CLIENT_ORIGIN` and `JWT_ACCESS_SECRET`) **before** the first import, for example in the test runner's setup file; otherwise `env.js` exits the test process.

## Frontend and API on the same site

In development the frontend (`http://localhost:5173`) calls the API directly at `http://localhost:5000/api`. These are different origins but the **same site** (ports do not count for cookies), so the `SameSite=Lax` auth cookies are sent, and CORS allows `CLIENT_ORIGIN` with credentials. Two rules follow from this:

- Every API request must include credentials (`fetch(url, { credentials: 'include' })` or axios `withCredentials: true`); otherwise the browser neither stores nor sends the auth cookies.
- Open the app at `http://localhost:5173`, not `http://127.0.0.1:5173`. `127.0.0.1` and `localhost` are different sites, so the cookies would not be sent and CORS would reject the request.

**Production must keep the frontend and the API same-site too**, for example by serving the API under `/api` on the frontend's domain through a rewrite or reverse proxy. If they must live on different sites, the cookies need `SameSite=None` together with `Secure` (see `backend/src/utils/cookies.js`), and CSRF protection has to be revisited (see [CSRF](#csrf)).

## Current API

Base URL: `http://localhost:5000/api`

### Response shapes

Every endpoint follows one convention:

| Kind | Shape |
| ---- | ----- |
| Single resource | `{ "success": true, "data": { "<name>": { ... } } }`, e.g. `data: { user }` |
| List | `{ "success": true, "data": [ ... ], "pagination"?: { ... } }` (only `GET /api/requests` paginates) |
| Action with no resource | `{ "success": true, "message": "..." }`, e.g. health check, logout |
| Error | `{ "success": false, "message": "...", "errors"?: { "<field>": "..." } }` |

A success response may also carry a human-readable `message` (for example register's `"Registration successful"`). Stack traces are added to error responses only when `NODE_ENV=development`.

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
| `401`  | `Refresh token required` (no cookie) or `Invalid or expired refresh token` (unknown, expired, logged out, or already used). Cookies are left unchanged; the client should send the user to log in. |

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
| `200`  | Body: `{ "success": true, "data": [ { "id", "name", "email", "role", "createdAt", "updatedAt" }, ... ] }` |
| `401`  | Not logged in |
| `403`  | Logged in, but not an ADMIN |

## Authentication & Authorization

### Access and refresh tokens

Logging in creates a **session** and issues two tokens:

- **Access token**: a JWT signed with `JWT_ACCESS_SECRET`, valid for **15 minutes** (`ACCESS_TOKEN_EXPIRES_MINUTES`, which sets both the JWT expiry and the cookie's `Max-Age`). It is sent with every request and proves who the caller is. It contains only the user id (`sub`) and the session id (`sid`), not the role.
- **Refresh token**: a random 80-character hex string (40 random bytes from Node's `crypto`), valid for **7 days** (`REFRESH_TOKEN_EXPIRES_DAYS`). It is only used to get a new access token from `POST /api/auth/refresh`.

The split keeps the token that travels on every request short-lived, while the user still stays logged in for a week. When an access token expires the client calls `/refresh` and retries.

### Why HttpOnly cookies

Both tokens are stored in `HttpOnly` cookies, never in `localStorage` or response bodies. JavaScript on the page cannot read HttpOnly cookies, so an XSS bug cannot steal the tokens. The cookies are `SameSite=Lax`, and `Secure` when `NODE_ENV=production` so they are only sent over HTTPS.

The access token cookie has `Path=/`. The refresh token cookie has `Path=/api/auth`, so the browser only sends it to the auth endpoints (refresh and logout) and not with every API call. This limits where the long-lived token is exposed.

If the frontend and API are deployed on different sites (different registrable domains), browsers will not send `SameSite=Lax` cookies with cross-site API calls. Keep them same-site (see [Frontend and API on the same site](#frontend-and-api-on-the-same-site)), or switch to `SameSite=None` together with `Secure` (see `src/utils/cookies.js`).

### CSRF

Cookie authentication is exposed to cross-site request forgery: a malicious page makes the victim's browser send a request that automatically carries their cookies. Two layers prevent this without a separate CSRF token:

- **`SameSite=Lax`**: browsers do not attach the cookies to cross-site `POST`, `PUT`, `PATCH` or `DELETE` requests, or to cross-site `fetch`/XHR calls. They are only sent on top-level `GET` navigations, and no `GET` endpoint changes state.
- **Strict CORS**: only `CLIENT_ORIGIN` may make credentialed cross-origin calls, and every body is JSON (`application/json` is not a "simple" content type, so a cross-origin page cannot send one without a CORS preflight, which is refused). An HTML form cannot produce a JSON body the API accepts.

Both rely on the frontend and API being **same-site**. With `SameSite=None` the first layer disappears, and a CSRF token or an `Origin` header check should be added.

### Refresh tokens are stored only as SHA-256 hashes

Each session is a document in the `refreshtokens` collection whose `_id` is the session id. The raw refresh token is never stored; only its SHA-256 hash is. Anyone who reads the database therefore cannot use the stored values to log in.

SHA-256 is used instead of bcrypt because the two protect different things. bcrypt is deliberately slow to protect **low-entropy** secrets such as passwords from guessing. A refresh token is 320 bits of randomness, so there is nothing to guess, and a fast, **deterministic** hash lets the server find the session with a single indexed lookup (`tokenHash` has a unique index). bcrypt's random salt would make that lookup impossible.

### Rotation and revocation

- Every successful `/refresh` **rotates** the session: the old session is marked revoked (`revokedAt`) and a new session with a new random refresh token is created. Each refresh token therefore works only once.
- The old session is revoked with a single conditional update (it must still be active), so if two requests refresh with the same token at the same moment, only one succeeds and the other gets `401`.
- `POST /api/auth/logout` revokes the session, so its refresh token stops working.
- A failed `/refresh` does not clear cookies, because another tab may already have stored newer ones.

### Immediate logout via the session id

The access token carries the session id (`sid`). On every authenticated request `authenticate` loads that session and rejects the request if it is missing, revoked or expired. Logging out and rotation therefore take effect **immediately**, without waiting up to 15 minutes for the access token to expire.

The trade-off is one extra database lookup (by `_id`) per authenticated request, in exchange for real server-side revocation.

### Cleanup of expired sessions

`expiresAt` has a MongoDB **TTL index** (`expireAfterSeconds: 0`), so MongoDB deletes each session document automatically once it expires. Its background job runs about once a minute, which is why the code also checks `expiresAt` itself. Revoked sessions stay in the collection until they expire.

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

### Known limitations

- Refresh-token theft is not detected (no reuse detection); planned as a future improvement.

### Future improvements

- **Log out of all devices**: revoke every active session of the user.
- **Rate limiting** on `/login` and `/refresh` to slow down password guessing and token abuse.

## Service Requests

A service request is a problem a USER reports (for example "Laptop will not boot"). The owner can edit it while it is still pending and cancel it while it is open; an ADMIN reviews every request and moves it through the status workflow. All rules are enforced in the backend (`src/services/request.service.js`), not only in the frontend.

### Request fields

| Field | Type | Rules |
| ----- | ---- | ----- |
| `title` | string | Required. Trimmed, 3–100 characters. |
| `description` | string | Required. Trimmed, 10–2000 characters. |
| `category` | string | Required. One of `TECHNICAL`, `BILLING`, `ACCOUNT`, `OTHER`. |
| `priority` | string | Optional. One of `LOW`, `MEDIUM`, `HIGH`. Defaults to `MEDIUM`. |
| `status` | string | One of `PENDING`, `IN_PROGRESS`, `RESOLVED`, `CANCELLED`. Always starts as `PENDING`. Cannot be set on create or edit; it only changes through cancel or the admin status endpoint. |
| `createdBy` | ObjectId (ref `User`) | Set from the logged-in user. A `createdBy` sent in the body is ignored. |
| `createdAt`, `updatedAt` | Date | Set automatically by Mongoose (`timestamps: true`). |

Create and edit bodies only read `title`, `description`, `category` and `priority`; any other field (`status`, `createdBy`, `_id`, ...) is silently ignored. Responses include MongoDB's `_id` and `__v`.

### Status transitions

| From | Allowed next statuses |
| ---- | --------------------- |
| `PENDING` | `IN_PROGRESS`, `CANCELLED` |
| `IN_PROGRESS` | `RESOLVED`, `CANCELLED` |
| `RESOLVED` | none (final) |
| `CANCELLED` | none (final) |

This table lives in one place, `ALLOWED_TRANSITIONS` in `src/constants/request.constants.js`. The backend enforces it through `canTransition(from, to)`, which both cancel and the admin status endpoint call before saving. Moving to the same status (for example `PENDING` to `PENDING`) is not a transition and is rejected. A rejected change returns `409` with the message `Cannot change status from X to Y`.

### Business rules

| Action | USER | ADMIN |
| ------ | ---- | ----- |
| Create a request | Yes; the USER becomes its owner | No (`403`) |
| List requests | Only their own | All requests |
| View one request | Only their own; anyone else's returns `404` | Any request |
| Edit `title`, `description`, `category`, `priority` | Only their own, and only while `PENDING` (otherwise `409`) | No (`403`) |
| Cancel (`DELETE`) | Only their own, while `PENDING` or `IN_PROGRESS` (otherwise `409`) | No (`403`) |
| Change status | No (`403`) | Any request, following the transition table |

- **404 instead of 403 for other users' requests.** When a USER asks for a request that belongs to someone else, the API answers exactly as if the request did not exist (`404 Request not found`). A `403` would confirm that the id is real, so request ids could be probed.
- **Cancel is a status change, not a deletion.** `DELETE /api/requests/:id` sets the status to `CANCELLED` and saves the request; the document is never removed, so the history stays complete.
- **Roles are checked in the routes, ownership in the service.** `authorize(...)` decides which role may call an endpoint (`403`); `request.service.js` decides which requests a USER may touch (`404`) and whether the status allows the action (`409`).

### Service request endpoints (`/api/requests`)

Every endpoint requires a logged-in user (the `accessToken` cookie). Bodies are JSON.

| Method | Path | Role | Success |
| ------ | ---- | ---- | ------- |
| `GET` | `/api/requests` | USER (own) or ADMIN (all) | `200` |
| `POST` | `/api/requests` | USER | `201` |
| `GET` | `/api/requests/:id` | USER (own) or ADMIN | `200` |
| `PATCH` | `/api/requests/:id` | USER (own, `PENDING` only) | `200` |
| `DELETE` | `/api/requests/:id` | USER (own) | `200` |
| `PATCH` | `/api/requests/:id/status` | ADMIN | `200` |

#### `POST /api/requests`

```json
{ "title": "Laptop will not boot", "description": "Black screen after the logo since this morning.", "category": "TECHNICAL", "priority": "HIGH" }
```

Returns `201` with `{ "success": true, "message": "Request created", "data": { "request": { ... } } }`.

#### `PATCH /api/requests/:id`

Send any of `title`, `description`, `category` and `priority` (same rules as create). At least one of them is required. Returns `{ "success": true, "message": "Request updated", "data": { "request": { ... } } }`.

#### `DELETE /api/requests/:id`

No body. Cancels the request. Returns `{ "success": true, "message": "Request cancelled", "data": { "request": { ... } } }` with `status: "CANCELLED"`.

#### `PATCH /api/requests/:id/status`

```json
{ "status": "IN_PROGRESS" }
```

Returns `{ "success": true, "message": "Status updated", "data": { "request": { ... } } }`.

`GET /api/requests` and `GET /api/requests/:id` return `createdBy` populated as `{ "name", "email", "id" }`. The create, edit, cancel and status endpoints return `createdBy` as the owner's id only.

### List query parameters

`GET /api/requests` accepts these query parameters. A USER's results are always limited to their own requests, whatever the filters say.

| Parameter | Default | Rules |
| --------- | ------- | ----- |
| `page` | `1` | Whole number, at least 1 |
| `limit` | `10` | Whole number, 1–50 |
| `search` | none | Case-insensitive match anywhere in `title` or `description`. Special characters such as `.` or `(` are matched literally. Empty or whitespace-only means no search. |
| `status` | none | One of the statuses |
| `category` | none | One of the categories |
| `priority` | none | One of the priorities |
| `sortBy` | `createdAt` | `createdAt` or `updatedAt` |
| `order` | `desc` | `asc` or `desc` |

An invalid value returns `400` listing every bad parameter; it is never silently replaced by the default (for example `page=abc`, `limit=51`, or an empty `status=`). Unknown parameters are ignored.

Example:

```text
GET /api/requests?page=1&limit=2&category=TECHNICAL&search=laptop
```

```json
{
  "success": true,
  "data": [
    {
      "_id": "6ab519a1642e3a8cbf38bf96",
      "title": "Laptop will not boot",
      "description": "Black screen after the logo since this morning.",
      "category": "TECHNICAL",
      "priority": "HIGH",
      "status": "PENDING",
      "createdBy": {
        "name": "Jane Doe",
        "email": "jane@example.com",
        "id": "6ab519a1642e3a8cbf38bf93"
      },
      "createdAt": "2026-09-24T12:37:53.358Z",
      "updatedAt": "2026-09-24T12:37:53.358Z",
      "__v": 0
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 2,
    "total": 1,
    "totalPages": 1
  }
}
```

`total` is the number of matching requests across all pages, and `totalPages` is `total / limit` rounded up (`0` when nothing matches). A `page` past the end returns an empty `data` array.

### Service request errors

| Status | When | Message |
| ------ | ---- | ------- |
| `400` | Invalid body or query parameters (`errors` lists each field) | `Validation failed` |
| `400` | Edit body contains none of `title`, `description`, `category`, `priority` | `At least one field is required` |
| `400` | `:id` is not a valid MongoDB id | `Invalid ID` |
| `400` | Body is not valid JSON | `Malformed JSON` |
| `401` | Not logged in, or the access token or session is no longer valid | depends on the reason |
| `403` | Role not allowed: an ADMIN creating, editing or cancelling, or a USER changing status | `You do not have permission to perform this action` |
| `404` | The request does not exist, or it belongs to another user (for a USER) | `Request not found` |
| `409` | Editing a request that is not `PENDING` | `Only pending requests can be edited` |
| `409` | Status change not allowed by the transition table, including same-status changes and cancelling a `RESOLVED` or `CANCELLED` request | `Cannot change status from X to Y` |

Checks run in this order: logged in (`401`), role (`403`), body or query validation (`400`), id format and ownership (`400`/`404`), then status rules (`409`).

## Frontend

A React single-page application built with Vite, React Router and Tailwind CSS, in plain JavaScript. For how to run it, see [Local Setup](#local-setup) steps 2, 4 and 7.

### API layer (`src/api/`)

Pages and components never call `fetch` themselves. They call the functions in `src/api/*.api.js`, which all go through one function, `request(path, { method, body, params })` in `src/api/client.js`:

- Every call sends `credentials: 'include'`, so the browser stores and sends the HttpOnly auth cookies. A `body` is sent as JSON; `params` become the query string, skipping `undefined`, `null` and empty values (so an "All" filter is simply left out).
- A success returns the parsed response body. A failure throws an `Error` whose `message` is the backend's `message` (or `Something went wrong`), with `status` set to the HTTP status and `errors` set to the backend's per-field errors, if any. If the server cannot be reached, the message is `Cannot reach the server. Please try again.`
- **One-time refresh.** When a call returns `401` (except `/auth/login`, `/auth/refresh` and `/auth/logout`, where a `401` is a real answer), the client calls `POST /auth/refresh` once and retries the original call once. If the refresh fails, the call throws a `401` (`Your session has expired. Please log in again.`) and the client tells `AuthContext` that the session is over.
- **Shared in-flight refresh.** A refresh token works only once (see [Rotation and revocation](#rotation-and-revocation)). If several calls get a `401` at the same time, they all wait for the same refresh (a module-level `refreshPromise`) instead of each starting their own; otherwise the second refresh would use an already-rotated token and log the user out.

There is one file per resource:

| File | Functions |
| ---- | --------- |
| `auth.api.js` | `register`, `login`, `logout`, `getMe` |
| `requests.api.js` | `getRequests`, `getRequest`, `createRequest`, `updateRequest`, `cancelRequest`, `updateRequestStatus` |
| `users.api.js` | `getUsers` |

### Who is logged in (`AuthContext`)

JavaScript cannot read the HttpOnly cookies, so the frontend asks the backend. When the app loads, `AuthProvider` (`src/context/AuthContext.jsx`) calls `GET /api/auth/me`: on success it stores the user (`id`, `name`, `email`, `role`), on failure the user stays `null`. `loading` is `true` until that answer arrives. If the access token has already expired, the client refreshes it first, so reloading the page keeps the user logged in.

`useAuth()` exposes `user`, `loading`, `login(email, password)` (logs in, then calls `/auth/me`), `register(data)` (creates the account only; registering does not log in), `logout()` (forgets the user even if the logout call fails) and `clearUser()`.

`AuthContext` registers `clearUser` with the API client, which calls it when a refresh fails. The route guards then see no user and redirect to `/login`, so no page has to handle an expired session itself.

### Route guards

Both guards live in `src/components/` and wrap groups of routes in `src/App.jsx`. Both show a loader while `loading` is `true`.

- **`ProtectedRoute`**, with an optional `role`: without a user it redirects to `/login`; with a user of the wrong role it redirects to that user's home page (`/requests` for a USER, `/admin/requests` for an ADMIN, from `HOME_PATHS` in `src/constants.js`).
- **`PublicRoute`**, for `/login` and `/register`: a logged-in user is redirected to their home page.

The guards only decide what the frontend shows. The backend still checks every call (`401`, `403`, `404`).

### Shared components

| Component | Purpose |
| --------- | ------- |
| `Layout`, `Navbar` | Frame for every logged-in page: role-aware links, the user's name and **Log out**. Below the `md` breakpoint the links collapse behind a **Menu** button (`aria-expanded`). |
| `RequestList` | Requests as stacked cards on small screens and a table from `md` upwards; each links to its details page. Shows an owner column when `showOwner` is set (admin list). |
| `RequestForm` | Create and edit form. Checks the same limits as the backend before sending, and shows the backend's field errors (or its message) if the API rejects the data. |
| `RequestActions` | The USER's **Edit** and **Cancel request** buttons on the details page. |
| `StatusUpdateForm` | The ADMIN's status `<select>` and **Update** button on the details page. |
| `StatusBadge`, `PriorityBadge`, `RoleBadge` | Coloured pills that always show a text label, never colour alone. |
| `Pagination` | **Previous** / **Next** and "Page X of Y"; hidden when there is only one page. |
| `FilterSelect` | A labelled `<select>` with an "All" option, used by the admin filters. |
| `Loader`, `EmptyState`, `ErrorMessage` | Loading, empty and error states; `ErrorMessage` can show a **Retry** button. |
| `AuthCard` | Centred card used by the login and register pages. |
| `ToastList` | Success and error notifications, shown by `ToastProvider` (`src/context/ToastContext.jsx`, used through `useToast()`). Each disappears after about 3 seconds and can be dismissed. |

Colours come only from the palette tokens defined in the `@theme` block of `src/index.css` (Tailwind CSS v4 through the `@tailwindcss/vite` plugin, so there is no `tailwind.config.js`). The same file defines the shared `.btn`, `.btn-primary`, `.btn-secondary`, `.form-label`, `.form-input` and `.form-error` classes and a visible `:focus-visible` outline for keyboard users.

### Pages

| Route | Role | Page | Purpose |
| ----- | ---- | ---- | ------- |
| `/login` | Logged out | `LoginPage` | Log in, then go to the user's home page |
| `/register` | Logged out | `RegisterPage` | Create a USER account, then go to `/login` |
| `/` | Any logged-in user | – | Redirects to the user's home page |
| `/requests` | USER | `MyRequestsPage` | The user's own requests, 10 per page, with a **New request** button |
| `/requests/new` | USER | `NewRequestPage` | Create a request |
| `/requests/:id` | USER (own) or ADMIN | `RequestDetailsPage` | All details of one request. A USER can edit or cancel it; an ADMIN also sees the owner and can change the status |
| `/requests/:id/edit` | USER | `EditRequestPage` | Edit a `PENDING` request; any other status shows "This request can no longer be edited" |
| `/admin/requests` | ADMIN | `AdminRequestsPage` | Every request with an owner column, search, status/category/priority filters, sorting and pagination |
| `/admin/users` | ADMIN | `AdminUsersPage` | Every user with name, email, role and joined date |
| any other path | Anyone | `NotFoundPage` | "Page not found" with a link home |

All logged-in pages share the `Layout`. Each page sets the browser tab title through `useDocumentTitle`, for example `My Requests | Service Requests`.

### Status rules in the frontend

`src/constants.js` mirrors the backend's `CATEGORIES`, `PRIORITIES`, `STATUSES`, `ALLOWED_TRANSITIONS` and `canTransition` (see [Status transitions](#status-transitions)). The frontend uses them **only to decide which actions to show**:

- **Edit** appears only while a request is `PENDING`.
- **Cancel request** appears only when `canTransition(status, 'CANCELLED')` is true.
- The ADMIN's status `<select>` lists only `ALLOWED_TRANSITIONS[status]`. For `RESOLVED` and `CANCELLED` it shows "This request is closed." instead.

**The backend is the authority.** It checks every rule again, whatever the frontend shows. If the screen is out of date (for example, an admin changed the status in another tab), the action is rejected with `409` and the backend's message is shown in the form or as an error notification. The form validation in `RequestForm` and on the register page mirrors the backend validators in the same way. When a rule changes, update `backend/src/constants/request.constants.js` and `frontend/src/constants.js` together.
