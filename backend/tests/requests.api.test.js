import request from 'supertest';

import app from '../src/app.js';
import {
  clearDatabase,
  createAdminAndLogin,
  registerAndLogin,
  startDatabase,
  stopDatabase,
} from './helpers.js';

const VALID_REQUEST = {
  title: 'Laptop will not boot',
  description: 'My work laptop shows a black screen after the logo.',
  category: 'TECHNICAL',
};

let alice;
let bob;
let admin;

// Starting MongoDB can be slow the first time, hence the longer hook timeout.
beforeAll(startDatabase, 60000);
afterAll(stopDatabase);

beforeEach(async () => {
  await clearDatabase();
  [alice, bob, admin] = await Promise.all([
    registerAndLogin('Alice', 'alice@test.dev'),
    registerAndLogin('Bob', 'bob@test.dev'),
    createAdminAndLogin(),
  ]);
});

// Creates a request as `owner` and returns it.
async function createRequest(owner, overrides = {}) {
  const res = await request(app)
    .post('/api/requests')
    .set('Cookie', owner.cookie)
    .send({ ...VALID_REQUEST, ...overrides })
    .expect(201);
  return res.body.data.request;
}

// Moves a request to `status` as the admin and returns the response.
function changeStatus(id, status) {
  return request(app)
    .patch(`/api/requests/${id}/status`)
    .set('Cookie', admin.cookie)
    .send({ status });
}

describe('authentication and roles', () => {
  test('returns 401 without a cookie', async () => {
    const res = await request(app).get('/api/requests').expect(401);
    expect(res.body).toEqual({ success: false, message: 'Authentication required' });
  });

  test('returns 403 when an admin creates a request', async () => {
    await request(app).post('/api/requests').set('Cookie', admin.cookie).send(VALID_REQUEST).expect(403);
  });

  test('returns 403 when a user changes the status', async () => {
    const created = await createRequest(alice);

    await request(app)
      .patch(`/api/requests/${created._id}/status`)
      .set('Cookie', alice.cookie)
      .send({ status: 'IN_PROGRESS' })
      .expect(403);
  });
});

describe('validation', () => {
  test('returns 400 with field errors for invalid create input', async () => {
    const res = await request(app)
      .post('/api/requests')
      .set('Cookie', alice.cookie)
      .send({ title: 'ab', description: 'short', category: 'X', priority: 'URGENT' })
      .expect(400);

    expect(res.body.message).toBe('Validation failed');
    expect(Object.keys(res.body.errors).sort()).toEqual(['category', 'description', 'priority', 'title']);
  });

  test('returns 400 for an invalid ObjectId', async () => {
    const res = await request(app).get('/api/requests/not-an-id').set('Cookie', alice.cookie).expect(400);
    expect(res.body.message).toBe('Invalid ID');
  });
});

describe('ownership', () => {
  test('a user only lists their own requests', async () => {
    await createRequest(alice);
    await createRequest(alice);
    await createRequest(bob);

    const res = await request(app).get('/api/requests').set('Cookie', alice.cookie).expect(200);

    expect(res.body.data).toHaveLength(2);
    expect(res.body.data.every((item) => item.createdBy.id === alice.user.id)).toBe(true);
  });

  test("another user's request returns 404", async () => {
    const created = await createRequest(alice);

    const res = await request(app).get(`/api/requests/${created._id}`).set('Cookie', bob.cookie).expect(404);
    expect(res.body.message).toBe('Request not found');
  });
});

describe('editing', () => {
  test('returns 409 when the request is not PENDING', async () => {
    const created = await createRequest(alice);
    await changeStatus(created._id, 'IN_PROGRESS').expect(200);

    const res = await request(app)
      .patch(`/api/requests/${created._id}`)
      .set('Cookie', alice.cookie)
      .send({ title: 'A new title' })
      .expect(409);
    expect(res.body.message).toBe('Only pending requests can be edited');
  });
});

describe('cancelling', () => {
  function cancel(id) {
    return request(app).delete(`/api/requests/${id}`).set('Cookie', alice.cookie);
  }

  test('succeeds from PENDING', async () => {
    const created = await createRequest(alice);

    const res = await cancel(created._id).expect(200);
    expect(res.body.data.request.status).toBe('CANCELLED');
  });

  test('succeeds from IN_PROGRESS', async () => {
    const created = await createRequest(alice);
    await changeStatus(created._id, 'IN_PROGRESS').expect(200);

    const res = await cancel(created._id).expect(200);
    expect(res.body.data.request.status).toBe('CANCELLED');
  });

  test('returns 409 from RESOLVED', async () => {
    const created = await createRequest(alice);
    await changeStatus(created._id, 'IN_PROGRESS').expect(200);
    await changeStatus(created._id, 'RESOLVED').expect(200);

    const res = await cancel(created._id).expect(409);
    expect(res.body.message).toBe('Cannot change status from RESOLVED to CANCELLED');
  });
});

describe('admin status changes', () => {
  test('a valid transition returns 200', async () => {
    const created = await createRequest(alice);

    const res = await changeStatus(created._id, 'IN_PROGRESS').expect(200);
    expect(res.body.data.request.status).toBe('IN_PROGRESS');
  });

  test('an invalid transition returns 409', async () => {
    const created = await createRequest(alice);

    const res = await changeStatus(created._id, 'RESOLVED').expect(409);
    expect(res.body.message).toBe('Cannot change status from PENDING to RESOLVED');
  });
});

describe('listing', () => {
  test('returns pagination metadata', async () => {
    for (let i = 0; i < 3; i++) {
      await createRequest(alice);
    }

    const res = await request(app).get('/api/requests?page=2&limit=2').set('Cookie', alice.cookie).expect(200);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination).toEqual({ page: 2, limit: 2, total: 3, totalPages: 2 });
  });

  test('filters by category', async () => {
    await createRequest(alice, { category: 'TECHNICAL' });
    await createRequest(alice, { category: 'BILLING' });

    const res = await request(app).get('/api/requests?category=BILLING').set('Cookie', alice.cookie).expect(200);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].category).toBe('BILLING');
  });

  test('searches title and description, case-insensitively', async () => {
    await createRequest(alice, { title: 'Printer jammed' });
    await createRequest(alice, { description: 'The office printer prints blank pages.' });
    await createRequest(alice, { title: 'Wifi is down' });

    const res = await request(app).get('/api/requests?search=PRINTER').set('Cookie', alice.cookie).expect(200);

    expect(res.body.data).toHaveLength(2);
  });
});
