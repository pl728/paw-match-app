var request = require('supertest');
var app = require('../main');
var db = require('../db');

afterAll(async function () {
    await db.end();
});

describe('pets endpoints', function () {
    async function createShelter() {
        var unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        var user = await request(app)
            .post('/users')
            .send({ email: 'petadmin+' + unique + '@test.com', password_hash: 'hash', role: 'shelter_admin' })
            .expect(201);

        var shelter = await request(app)
            .post('/shelters')
            .send({ user_id: user.body.id, name: 'Pet Shelter' })
            .expect(201);

        return shelter.body.id;
    }

    it('creates and retrieves a pet', async function () {
        var shelterId = await createShelter();

        var created = await request(app)
            .post('/pets')
            .send({ shelter_id: shelterId, name: 'Milo', species: 'Dog', age_years: 3 })
            .expect(201);

        var res = await request(app)
            .get('/pets/' + created.body.id)
            .expect(200);

        expect(res.body.id).toBe(created.body.id);
        expect(res.body.name).toBe('Milo');
    });

    it('lists pets', async function () {
        var shelterId = await createShelter();

        await request(app)
            .post('/pets')
            .send({ shelter_id: shelterId, name: 'Luna', species: 'Cat' })
            .expect(201);

        var res = await request(app)
            .get('/pets')
            .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBeGreaterThan(0);
    });

    it('updates a pet', async function () {
        var shelterId = await createShelter();

        var created = await request(app)
            .post('/pets')
            .send({ shelter_id: shelterId, name: 'Otis', species: 'Dog' })
            .expect(201);

        var res = await request(app)
            .put('/pets/' + created.body.id)
            .send({ status: 'pending', description: 'In foster' })
            .expect(200);

        expect(res.body.status).toBe('pending');
        expect(res.body.description).toBe('In foster');
    });

    it('deletes a pet', async function () {
        var shelterId = await createShelter();

        var created = await request(app)
            .post('/pets')
            .send({ shelter_id: shelterId, name: 'Zoe', species: 'Cat' })
            .expect(201);

        await request(app)
            .delete('/pets/' + created.body.id)
            .expect(200);

        await request(app)
            .get('/pets/' + created.body.id)
            .expect(404);
    });
});
