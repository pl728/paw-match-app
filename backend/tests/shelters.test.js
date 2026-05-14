import request from 'supertest';
import app from '../main.js';
import db from '../db/index.js';
import { registerVerifiedUser } from './helpers/auth.js';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

afterAll(async function () {
    await db.end();
});

describe('shelters endpoints', function () {
    it('creates and retrieves a shelter', async function () {
        const unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        const user = await registerVerifiedUser(app, 'shelter_admin', 'shelteruser_' + unique);

        const shelter = await request(app)
            .post('/shelters')
            .set('Authorization', 'Bearer ' + user.token)
            .send({ name: 'Happy Tails', city: 'Corvallis', state: 'OR' })
            .expect(201);

        const res = await request(app)
            .get('/shelters/' + shelter.body.id)
            .expect(200);

        expect(res.body.id).toBe(shelter.body.id);
        expect(res.body.name).toBe('Happy Tails');
    });

    it('updates a shelter', async function () {
        const unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        const user = await registerVerifiedUser(app, 'shelter_admin', 'shelteruser2_' + unique);

        const shelter = await request(app)
            .post('/shelters')
            .set('Authorization', 'Bearer ' + user.token)
            .send({ name: 'Before Update' })
            .expect(201);

        const res = await request(app)
            .put('/shelters/' + shelter.body.id)
            .set('Authorization', 'Bearer ' + user.token)
            .send({ phone: '555-1010', description: 'Updated' })
            .expect(200);

        expect(res.body.phone).toBe('555-1010');
        expect(res.body.description).toBe('Updated');
    });

    it('returns 404 for missing shelter', async function () {
        await request(app)
            .get('/shelters/00000000-0000-0000-0000-000000000000')
            .expect(404);
    });

    it('rejects creating a shelter without a token', async function () {
    await request(app)
        .post('/shelters')
        .send({ name: 'Unauthorized Shelter' })
        .expect(401);
    });

    it('rejects creating a shelter with adopter role', async function () {
        const unique = Date.now().toString(36);

        const user = await registerVerifiedUser(app, 'adopter', 'adopter_' + unique);

        await request(app)
            .post('/shelters')
            .set('Authorization', 'Bearer ' + user.token)
            .send({ name: 'Adopter Shelter' })
            .expect(403);
    });

    it('lists shelters', async function () {
        const res = await request(app)
            .get('/shelters')
            .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
    });

    it('deletes a shelter owned by the user', async function () {
        const unique = Date.now().toString(36);

        const user = await registerVerifiedUser(app, 'shelter_admin', 'deleteuser_' + unique);

        const shelter = await request(app)
            .post('/shelters')
            .set('Authorization', 'Bearer ' + user.token)
            .send({ name: 'Delete Shelter' })
            .expect(201);

        await request(app)
            .delete('/shelters/' + shelter.body.id)
            .set('Authorization', 'Bearer ' + user.token)
            .expect(200);
    });
});
