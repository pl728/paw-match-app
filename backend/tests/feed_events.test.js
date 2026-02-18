import request from 'supertest';
import app from '../main.js';
import db from '../db/index.js';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

afterAll(async function () {
  await db.end();
});

describe('feed_events endpoints', function () {
  async function createShelter() {
    const unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

    const register = await request(app)
      .post('/auth/register')
      .send({ username: 'feedadmin_' + unique, password: 'password123', role: 'shelter_admin' })
      .expect(201);

    const shelter = await request(app)
      .post('/shelters')
      .set('Authorization', 'Bearer ' + register.body.token)
      .send({ name: 'Feed Shelter' })
      .expect(201);

    return { shelterId: shelter.body.id, token: register.body.token };
  }

  it('lists feed events (200) and returns an array', async function () {
    const res = await request(app)
      .get('/feed_events?limit=25')
      .expect(200);

    expect(Array.isArray(res.body) || Array.isArray(res.body.items)).toBe(true);
  });
});
