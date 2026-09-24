import 'dotenv/config';

// The only module in src/ that reads process.env (apart from SEED_ADMIN_* in the seed script).
// Everything is validated once, when this module is first imported. If anything is missing or
// invalid, every problem is printed and the process exits. dotenv never overrides variables that
// are already set, so a test can set process.env before importing app.js to use its own values.

const problems = [];

function requiredString(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    problems.push(`${name} is required`);
  }
  return value;
}

// Unset or empty uses the default; anything else must be a whole number greater than zero.
function positiveInteger(name, defaultValue) {
  const raw = process.env[name]?.trim();
  if (!raw) {
    return defaultValue;
  }
  if (!/^\d+$/.test(raw) || Number(raw) <= 0) {
    problems.push(`${name} must be a positive integer (got "${raw}")`);
    return defaultValue;
  }
  return Number(raw);
}

const nodeEnv = process.env.NODE_ENV?.trim() || null;

const values = {
  port: positiveInteger('PORT', 5000),
  nodeEnv,
  // Strict: an unset or unknown NODE_ENV is treated as not-development (no stack traces).
  isDevelopment: nodeEnv === 'development',
  isProduction: nodeEnv === 'production',
  mongoUri: requiredString('MONGODB_URI'),
  // Without an explicit origin the cors package falls back to "*", which breaks cookie auth.
  clientOrigin: requiredString('CLIENT_ORIGIN'),
  jwt: {
    accessSecret: requiredString('JWT_ACCESS_SECRET'),
    accessTokenExpiresMinutes: positiveInteger('ACCESS_TOKEN_EXPIRES_MINUTES', 15),
  },
  refreshToken: {
    expiresDays: positiveInteger('REFRESH_TOKEN_EXPIRES_DAYS', 7),
  },
};

if (problems.length > 0) {
  console.error(
    `Invalid environment configuration (see backend/.env.example):\n  - ${problems.join('\n  - ')}`,
  );
  process.exit(1);
}

function deepFreeze(object) {
  for (const value of Object.values(object)) {
    if (value && typeof value === 'object') {
      deepFreeze(value);
    }
  }
  return Object.freeze(object);
}

export const config = deepFreeze(values);
