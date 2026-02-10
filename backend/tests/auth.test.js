import request from 'supertest';
import app from '../main.js';
import db from '../db/index.js';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

afterAll(async function () {
    await db.end();
});

describe('auth endpoints', function () {
    it('registers a user and returns a token', async function () {
        const unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        const username = 'auth1_' + unique;

        const res = await request(app)
            .post('/auth/register')
            .send({ username: username, password: 'password123' })
            .expect(201);

        expect(res.body).toHaveProperty('token');
        expect(res.body).toHaveProperty('user');
        expect(res.body.user.username).toBe(username);
        expect(res.body.user.role).toBe('adopter');
    });

    it('logs in an existing user and returns a token', async function () {
        const unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        const username = 'auth2_' + unique;

        await request(app)
            .post('/auth/register')
            .send({ username: username, password: 'password123' })
            .expect(201);

        const res = await request(app)
            .post('/auth/login')
            .send({ username: username, password: 'password123' })
            .expect(200);

        expect(res.body).toHaveProperty('token');
        expect(res.body).toHaveProperty('user');
        expect(res.body.user.username).toBe(username);
    });

    it('rejects duplicate registrations', async function () {
        const unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        const username = 'auth3_' + unique;

        await request(app)
            .post('/auth/register')
            .send({ username: username, password: 'password123' })
            .expect(201);

        await request(app)
            .post('/auth/register')
            .send({ username: username, password: 'password123' })
            .expect(409);
    });

    it('rejects invalid login', async function () {
        const unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        const username = 'auth4_' + unique;

        await request(app)
            .post('/auth/register')
            .send({ username: username, password: 'password123' })
            .expect(201);

        await request(app)
            .post('/auth/login')
            .send({ username: username, password: 'wrongpassword' })
            .expect(401);
    });
});
