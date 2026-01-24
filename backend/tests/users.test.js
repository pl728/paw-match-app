var request = require('supertest');
var app = require('../main');
var db = require('../db');

afterAll(async function () {
    await db.end();
});

describe('users endpoints', function () {
    it('creates a user', async function () {
        var unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        var res = await request(app)
            .post('/users')
            .send({ email: 'user1+' + unique + '@test.com', password_hash: 'hash', role: 'adopter' })
            .expect(201);

        expect(res.body).toHaveProperty('id');
        expect(res.body.email).toBe('user1+' + unique + '@test.com');
        expect(res.body.role).toBe('adopter');
    });

    it('gets a user by id', async function () {
        var unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
        var created = await request(app)
            .post('/users')
            .send({ email: 'user2+' + unique + '@test.com', password_hash: 'hash', role: 'adopter' })
            .expect(201);

        var res = await request(app)
            .get('/users/' + created.body.id)
            .expect(200);

        expect(res.body.id).toBe(created.body.id);
        expect(res.body.email).toBe('user2+' + unique + '@test.com');
    });

    it('returns 404 for missing user', async function () {
        await request(app)
            .get('/users/00000000-0000-0000-0000-000000000000')
            .expect(404);
    });
});
