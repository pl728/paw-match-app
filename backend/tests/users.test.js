import request from 'supertest';
import app from '../main.js';
import db from '../db/index.js';

afterAll(async function () {
    await db.end();
});

describe('users endpoints', function () {
    it('creates a user', async function () {
        const unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        const res = await request(app)
            .post('/users')
            .send({ username: 'user1_' + unique, password_hash: 'hash', role: 'adopter' })
            .expect(201);

        expect(res.body).toHaveProperty('id');
        expect(res.body.username).toBe('user1_' + unique);
        expect(res.body.role).toBe('adopter');
    });

    it('gets a user by id', async function () {
        const unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        const created = await request(app)
            .post('/users')
            .send({ username: 'user2_' + unique, password_hash: 'hash', role: 'adopter' })
            .expect(201);

        const res = await request(app)
            .get('/users/' + created.body.id)
            .expect(200);

        expect(res.body.id).toBe(created.body.id);
        expect(res.body.username).toBe('user2_' + unique);
    });

    it('returns 404 for missing user', async function () {
        await request(app)
            .get('/users/00000000-0000-0000-0000-000000000000')
            .expect(404);
    });
});
