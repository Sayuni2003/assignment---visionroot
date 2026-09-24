import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../src/app.js';
import User from '../src/models/user.model.js';
import { hashPassword } from '../src/services/auth.service.js';

// Shared by all API tests: an in-memory MongoDB plus helpers that return logged-in users.

export const PASSWORD = 'password123';

let mongoServer;

export async function startDatabase() {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
}

// Empties every collection but keeps the indexes, so each test starts from a clean state.
export async function clearDatabase() {
  const collections = Object.values(mongoose.connection.collections);
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
}

export async function stopDatabase() {
  await mongoose.disconnect();
  await mongoServer.stop();
}

// Reads a response's Set-Cookie headers into { name: value }, e.g. { accessToken: '...' }.
export function cookiesFrom(res) {
  const headers = res.headers['set-cookie'] ?? [];
  return Object.fromEntries(
    headers.map((header) => {
      const pair = header.split(';')[0];
      const separator = pair.indexOf('=');
      return [pair.slice(0, separator), pair.slice(separator + 1)];
    }),
  );
}

// Logs in and returns { user, cookie }. `cookie` holds every cookie the login set, ready for
// .set('Cookie', cookie) on later requests.
export async function login(email, password = PASSWORD) {
  const res = await request(app).post('/api/auth/login').send({ email, password }).expect(200);
  const cookie = res.headers['set-cookie'].map((header) => header.split(';')[0]).join('; ');

  return { user: res.body.data.user, cookie };
}

export async function registerAndLogin(name, email) {
  await request(app).post('/api/auth/register').send({ name, email, password: PASSWORD }).expect(201);
  return login(email);
}

// Public registration only creates USERs, so the admin is inserted directly (as seed-admin.js does).
export async function createAdminAndLogin(email = 'admin@test.dev') {
  await User.create({ name: 'Admin', email, passwordHash: await hashPassword(PASSWORD), role: 'ADMIN' });
  return login(email);
}
