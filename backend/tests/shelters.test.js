import request from 'supertest';
import app from '../main.js';
import db from '../db/index.js';

afterAll(async function () {
    await db.end();
});

describe('shelters endpoints', function () {
    it('creates and retrieves a shelter', async function () {
        var unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        var user = await request(app)
            .post('/users')
            .send({ email: 'shelteruser+' + unique + '@test.com', password_hash: 'hash', role: 'shelter_admin' })
            .expect(201);

        var shelter = await request(app)
            .post('/shelters')
            .send({ user_id: user.body.id, name: 'Happy Tails', city: 'Corvallis', state: 'OR' })
            .expect(201);

        var res = await request(app)
            .get('/shelters/' + shelter.body.id)
            .expect(200);

        expect(res.body.id).toBe(shelter.body.id);
        expect(res.body.name).toBe('Happy Tails');
    });

    it('updates a shelter', async function () {
        var unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        var user = await request(app)
            .post('/users')
            .send({ email: 'shelteruser2+' + unique + '@test.com', password_hash: 'hash', role: 'shelter_admin' })
            .expect(201);

        var shelter = await request(app)
            .post('/shelters')
            .send({ user_id: user.body.id, name: 'Before Update' })
            .expect(201);

        var res = await request(app)
            .put('/shelters/' + shelter.body.id)
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
});
