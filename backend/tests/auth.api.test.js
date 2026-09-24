import jwt from 'jsonwebtoken';
import request from 'supertest';

import app from '../src/app.js';
import User from '../src/models/user.model.js';
import {
  PASSWORD,
  clearDatabase,
  cookiesFrom,
  createAdminAndLogin,
  registerAndLogin,
  startDatabase,
  stopDatabase,
} from './helpers.js';

const NEW_USER = { name: 'Alice', email: 'alice@test.dev', password: PASSWORD };

// Starting MongoDB can be slow the first time, hence the longer hook timeout.
beforeAll(startDatabase, 60000);
afterAll(stopDatabase);
beforeEach(clearDatabase);

function register(body) {
  return request(app).post('/api/auth/register').send(body);
}

function me(cookie) {
  const req = request(app).get('/api/auth/me');
  return cookie ? req.set('Cookie', cookie) : req;
}

describe('POST /api/auth/register', () => {
  test('creates a USER and sets no cookies', async () => {
    const res = await register(NEW_USER).expect(201);

    expect(res.body.data.user).toMatchObject({ name: 'Alice', email: 'alice@test.dev', role: 'USER' });
    expect(res.body.data.user).not.toHaveProperty('passwordHash');
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  test('ignores a role sent by the client', async () => {
    const res = await register({ ...NEW_USER, role: 'ADMIN' }).expect(201);
    expect(res.body.data.user.role).toBe('USER');
  });

  test('stores a bcrypt hash, never the plain password', async () => {
    await register(NEW_USER).expect(201);

    const saved = await User.findOne({ email: NEW_USER.email }).select('+passwordHash');
    expect(saved.passwordHash).not.toBe(PASSWORD);
    expect(saved.passwordHash).toMatch(/^\$2[aby]\$12\$/);
  });

  test('returns 400 with field errors for invalid input', async () => {
    const res = await register({ name: 'A', email: 'not-an-email', password: 'short' }).expect(400);

    expect(res.body.message).toBe('Validation failed');
    expect(Object.keys(res.body.errors).sort()).toEqual(['email', 'name', 'password']);
  });

  test('returns 409 for an email that is already registered, ignoring case', async () => {
    await register(NEW_USER).expect(201);

    const res = await register({ ...NEW_USER, email: 'ALICE@test.dev' }).expect(409);
    expect(res.body.message).toBe('Email is already registered');
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(() => register(NEW_USER).expect(201));

  test('sets HttpOnly access and refresh cookies and returns no tokens in the body', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: NEW_USER.email, password: PASSWORD })
      .expect(200);

    const cookies = cookiesFrom(res);
    expect(cookies.accessToken).toBeTruthy();
    expect(cookies.refreshToken).toBeTruthy();
    expect(res.headers['set-cookie'].every((header) => header.includes('HttpOnly'))).toBe(true);
    expect(JSON.stringify(res.body)).not.toContain(cookies.accessToken);
    expect(JSON.stringify(res.body)).not.toContain(cookies.refreshToken);
  });

  test('returns the same 401 for a wrong password and an unknown email', async () => {
    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: NEW_USER.email, password: 'wrong-password' })
      .expect(401);
    const unknownEmail = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.dev', password: PASSWORD })
      .expect(401);

    expect(wrongPassword.body.message).toBe('Invalid email or password');
    expect(unknownEmail.body).toEqual(wrongPassword.body);
  });

  test('returns 400 when email or password is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({}).expect(400);
    expect(Object.keys(res.body.errors).sort()).toEqual(['email', 'password']);
  });
});

describe('GET /api/auth/me', () => {
  test('returns the logged-in user', async () => {
    const alice = await registerAndLogin('Alice', 'alice@test.dev');

    const res = await me(alice.cookie).expect(200);
    expect(res.body.data.user).toMatchObject({ id: alice.user.id, email: 'alice@test.dev', role: 'USER' });
  });

  test('returns 401 without a cookie', async () => {
    const res = await me().expect(401);
    expect(res.body.message).toBe('Authentication required');
  });

  test('returns 401 for a token signed with a different secret', async () => {
    const alice = await registerAndLogin('Alice', 'alice@test.dev');
    const forged = jwt.sign({ sub: alice.user.id, sid: alice.user.id }, 'not-the-server-secret');

    const res = await me(`accessToken=${forged}`).expect(401);
    expect(res.body.message).toBe('Invalid or expired access token');
  });
});

describe('POST /api/auth/refresh', () => {
  test('issues new cookies and the old refresh token stops working', async () => {
    await register(NEW_USER).expect(201);
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: NEW_USER.email, password: PASSWORD })
      .expect(200);
    const oldRefreshToken = cookiesFrom(loginRes).refreshToken;

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', `refreshToken=${oldRefreshToken}`)
      .expect(200);
    const newCookies = cookiesFrom(res);
    expect(newCookies.accessToken).toBeTruthy();
    expect(newCookies.refreshToken).not.toBe(oldRefreshToken);

    // Rotation: each refresh token works only once.
    await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', `refreshToken=${oldRefreshToken}`)
      .expect(401);
  });

  test('returns 401 without a refresh cookie', async () => {
    const res = await request(app).post('/api/auth/refresh').expect(401);
    expect(res.body.message).toBe('Refresh token required');
  });
});

describe('POST /api/auth/logout', () => {
  test('clears the cookies and invalidates the session immediately', async () => {
    const alice = await registerAndLogin('Alice', 'alice@test.dev');

    const res = await request(app).post('/api/auth/logout').set('Cookie', alice.cookie).expect(200);
    expect(res.body).toEqual({ success: true, message: 'Logged out' });
    expect(cookiesFrom(res)).toEqual({ accessToken: '', refreshToken: '' });

    // The old access token is rejected at once, not only after it expires.
    await me(alice.cookie).expect(401);
    await request(app).post('/api/auth/refresh').set('Cookie', alice.cookie).expect(401);
  });

  test('succeeds even without cookies', async () => {
    await request(app).post('/api/auth/logout').expect(200);
  });
});

describe('GET /api/users (ADMIN only)', () => {
  test('lets an admin list users without password hashes', async () => {
    await registerAndLogin('Alice', 'alice@test.dev');
    const admin = await createAdminAndLogin();

    const res = await request(app).get('/api/users').set('Cookie', admin.cookie).expect(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data.every((user) => !('passwordHash' in user))).toBe(true);
  });

  test('returns 403 for a USER', async () => {
    const alice = await registerAndLogin('Alice', 'alice@test.dev');
    await request(app).get('/api/users').set('Cookie', alice.cookie).expect(403);
  });

  test('returns 401 without a cookie', async () => {
    await request(app).get('/api/users').expect(401);
  });

  test('reads the role from the database on every request, not from the token', async () => {
    const alice = await registerAndLogin('Alice', 'alice@test.dev');
    await request(app).get('/api/users').set('Cookie', alice.cookie).expect(403);

    await User.updateOne({ email: 'alice@test.dev' }, { role: 'ADMIN' });

    // Same cookie, new role: the change applies on the next request.
    await request(app).get('/api/users').set('Cookie', alice.cookie).expect(200);
  });
});
