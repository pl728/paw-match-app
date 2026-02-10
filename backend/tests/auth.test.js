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
        const email = 'auth1+' + unique + '@test.com';

        const res = await request(app)
            .post('/auth/register')
            .send({ email: email, password: 'password123' })
            .expect(201);

        expect(res.body).toHaveProperty('token');
        expect(res.body).toHaveProperty('user');
        expect(res.body.user.email).toBe(email);
        expect(res.body.user.role).toBe('adopter');
    });

    it('logs in an existing user and returns a token', async function () {
        const unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        const email = 'auth2+' + unique + '@test.com';

        await request(app)
            .post('/auth/register')
            .send({ email: email, password: 'password123' })
            .expect(201);

        const res = await request(app)
            .post('/auth/login')
            .send({ email: email, password: 'password123' })
            .expect(200);

        expect(res.body).toHaveProperty('token');
        expect(res.body).toHaveProperty('user');
        expect(res.body.user.email).toBe(email);
    });

    it('rejects duplicate registrations', async function () {
        const unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        const email = 'auth3+' + unique + '@test.com';

        await request(app)
            .post('/auth/register')
            .send({ email: email, password: 'password123' })
            .expect(201);

        await request(app)
            .post('/auth/register')
            .send({ email: email, password: 'password123' })
            .expect(409);
    });

    it('rejects invalid login', async function () {
        const unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        const email = 'auth4+' + unique + '@test.com';

        await request(app)
            .post('/auth/register')
            .send({ email: email, password: 'password123' })
            .expect(201);

        await request(app)
            .post('/auth/login')
            .send({ email: email, password: 'wrongpassword' })
            .expect(401);
    });
});
