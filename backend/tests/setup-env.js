// Runs before every test file (see "setupFiles" in package.json), before src/config/env.js is
// loaded. dotenv never overrides variables that are already set, so these win over backend/.env.
// MONGODB_URI is only a placeholder to pass validation: tests connect to an in-memory database
// themselves (see tests/helpers.js).
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://placeholder-not-used/test';
process.env.CLIENT_ORIGIN = 'http://localhost:5173';
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
