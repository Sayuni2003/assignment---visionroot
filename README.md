# Service Request Management System

## Project Overview

A full-stack web application for managing service requests. Users with the **USER** role will be able to submit and track their own service requests, and users with the **ADMIN** role will be able to review them and move them through a status workflow.

The project is being built incrementally. The current state is the **project foundation only**: a React frontend and an Express REST API connected to MongoDB, with a health-check endpoint. Authentication, roles, and service request features have not been implemented yet.

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

The API runs at `http://localhost:5000`. If `MONGODB_URI` or `CLIENT_ORIGIN` is missing, or MongoDB is unreachable, the server logs the reason and exits.

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
