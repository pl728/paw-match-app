import request from 'supertest';
import app from '../main.js';
import db from '../db/index.js';
import { registerVerifiedUser } from './helpers/auth.js';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

afterAll(async function () {
    await db.end();
});

describe('users endpoints', function () {
    async function createAdminToken() {
        const registered = await registerVerifiedUser(app, 'shelter_admin', 'admin');
        return registered.token;
    }

    it('creates a user', async function () {
        const token = await createAdminToken();
        const unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        const res = await request(app)
            .post('/users')
            .set('Authorization', 'Bearer ' + token)
            .send({ username: 'user1_' + unique, email: 'user1_' + unique + '@example.test', password_hash: 'hash', role: 'adopter' })
            .expect(201);

        expect(res.body).toHaveProperty('id');
        expect(res.body.username).toBe('user1_' + unique);
        expect(res.body.role).toBe('adopter');
    });

    it('gets a user by id', async function () {
        const token = await createAdminToken();
        const unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        const created = await request(app)
            .post('/users')
            .set('Authorization', 'Bearer ' + token)
            .send({ username: 'user2_' + unique, email: 'user2_' + unique + '@example.test', password_hash: 'hash', role: 'adopter' })
            .expect(201);

        const res = await request(app)
            .get('/users/' + created.body.id)
            .set('Authorization', 'Bearer ' + token)
            .expect(200);

        expect(res.body.id).toBe(created.body.id);
        expect(res.body.username).toBe('user2_' + unique);
    });

    it('returns 404 for missing user', async function () {
        const token = await createAdminToken();
        await request(app)
            .get('/users/00000000-0000-0000-0000-000000000000')
            .set('Authorization', 'Bearer ' + token)
            .expect(404);
    });
});
