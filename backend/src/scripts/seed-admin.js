import mongoose from 'mongoose';

import { connectDatabase } from '../config/database.js';
import User from '../models/user.model.js';
import { hashPassword } from '../services/auth.service.js';
import { validateRegister } from '../validators/auth.validator.js';

// Creates the first ADMIN account. Public registration only ever creates USER accounts,
// so this script is the only way to get an admin. Safe to run repeatedly.
async function seedAdmin() {
  // The seed variables are only used here, so they are read here rather than in config/env.js.
  // backend/.env has already been loaded by config/env.js (imported via database.js).
  const { SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD } = process.env;
  const missing = Object.entries({ SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD })
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing ${missing.join(', ')}. Add them to backend/.env (see .env.example).`);
  }

  // Same rules as public registration (name length, email format, 8-72 character password).
  const { name, email, password } = validateRegister({
    name: SEED_ADMIN_NAME,
    email: SEED_ADMIN_EMAIL,
    password: SEED_ADMIN_PASSWORD,
  });

  await connectDatabase();

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`A user with email ${email} already exists (role: ${existing.role}). Nothing to do.`);
    return;
  }

  await User.create({ name, email, passwordHash: await hashPassword(password), role: 'ADMIN' });
  console.log(`Admin user created: ${email}`);
}

try {
  await seedAdmin();
} catch (error) {
  console.error('Admin seed failed:', error.message);
  if (error.errors) {
    console.error(error.errors);
  }
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
