import request from 'supertest';
import app from '../main.js';
import db from '../db/index.js';
import { registerVerifiedUser } from './helpers/auth.js';
import { postPetWithPhotos } from './helpers/pet_photos.js';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

afterAll(async function () {
    await db.end();
});

describe('pets endpoints', function () {
    async function createShelter() {
        const register = await registerVerifiedUser(app, 'shelter_admin', 'petadmin');

        const shelter = await request(app)
            .post('/shelters')
            .set('Authorization', 'Bearer ' + register.token)
            .send({ name: 'Pet Shelter' })
            .expect(201);

        return { shelterId: shelter.body.id, token: register.token };
    }

    it('creates and retrieves a pet', async function () {
        const { token } = await createShelter();

        const created = await postPetWithPhotos(app, token, { name: 'Milo', species: 'Dog', age_years: 3 })
            .expect(201);

        const res = await request(app)
            .get('/pets/' + created.body.id)
            .expect(200);

        expect(res.body.id).toBe(created.body.id);
        expect(res.body.name).toBe('Milo');
    });

    it('lists pets', async function () {
        const { token } = await createShelter();

        await postPetWithPhotos(app, token, { name: 'Luna', species: 'Cat' })
            .expect(201);

        const res = await request(app)
            .get('/pets')
            .expect(200);

        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);
        expect(typeof res.body.total).toBe('number');
    });

    it('updates a pet', async function () {
        const { token } = await createShelter();

        const created = await postPetWithPhotos(app, token, { name: 'Otis', species: 'Dog' })
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

        const created = await postPetWithPhotos(app, token, { name: 'Zoe', species: 'Cat' })
            .expect(201);

        await request(app)
            .delete('/pets/' + created.body.id)
            .set('Authorization', 'Bearer ' + token)
            .expect(200);

        await request(app)
            .get('/pets/' + created.body.id)
            .expect(404);
    });

    it('rejects creating a pet without authentication', async function () {
        await request(app)
            .post('/pets')
            .send({ name: 'Unauthorized Pet', species: 'Dog' })
            .expect(401);
    });

    it('rejects creating a pet with fewer than three photos', async function () {
        const { token } = await createShelter();

        const res = await postPetWithPhotos(app, token, { name: 'Sparse Pet', species: 'Dog' }, 2)
            .expect(400);

        expect(res.body.error).toContain('At least 3 pet photos');
    });

    it('rejects creating a pet with adopter role', async function () {
        const unique = Date.now().toString(36);

        const user = await registerVerifiedUser(app, 'adopter', 'adopterpet_' + unique);

        await request(app)
            .post('/pets')
            .set('Authorization', 'Bearer ' + user.token)
            .send({ name: 'Adopter Pet', species: 'Dog' })
            .expect(403);
    });
});
