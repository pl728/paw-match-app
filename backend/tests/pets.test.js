import request from 'supertest';
import app from '../main.js';
import db from '../db/index.js';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

afterAll(async function () {
    await db.end();
});

describe('pets endpoints', function () {
    async function createShelter() {
        const unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        const register = await request(app)
            .post('/auth/register')
            .send({ username: 'petadmin_' + unique, password: 'password123', role: 'shelter_admin' })
            .expect(201);

        const shelter = await request(app)
            .post('/shelters')
            .set('Authorization', 'Bearer ' + register.body.token)
            .send({ name: 'Pet Shelter' })
            .expect(201);

        return { shelterId: shelter.body.id, token: register.body.token };
    }

    it('creates and retrieves a pet', async function () {
        const { token } = await createShelter();

        const created = await request(app)
            .post('/pets')
            .set('Authorization', 'Bearer ' + token)
            .send({ name: 'Milo', species: 'Dog', age_years: 3 })
            .expect(201);

        const res = await request(app)
            .get('/pets/' + created.body.id)
            .expect(200);

        expect(res.body.id).toBe(created.body.id);
        expect(res.body.name).toBe('Milo');
    });

    it('lists pets', async function () {
        const { token } = await createShelter();

        await request(app)
            .post('/pets')
            .set('Authorization', 'Bearer ' + token)
            .send({ name: 'Luna', species: 'Cat' })
            .expect(201);

        const res = await request(app)
            .get('/pets')
            .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
    });

    it('updates a pet', async function () {
        const { token } = await createShelter();

        const created = await request(app)
            .post('/pets')
            .set('Authorization', 'Bearer ' + token)
            .send({ name: 'Otis', species: 'Dog' })
            .expect(201);

        const res = await request(app)
            .put('/pets/' + created.body.id)
            .set('Authorization', 'Bearer ' + token)
            .send({ status: 'pending', description: 'In foster' })
            .expect(200);

        expect(res.body.status).toBe('pending');
        expect(res.body.description).toBe('In foster');
    });

    it('deletes a pet', async function () {
        const { token } = await createShelter();

        const created = await request(app)
            .post('/pets')
            .set('Authorization', 'Bearer ' + token)
            .send({ name: 'Zoe', species: 'Cat' })
            .expect(201);

        await request(app)
            .delete('/pets/' + created.body.id)
            .set('Authorization', 'Bearer ' + token)
            .expect(200);

        await request(app)
            .get('/pets/' + created.body.id)
            .expect(404);
    });
});
