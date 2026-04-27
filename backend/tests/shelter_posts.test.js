import request from 'supertest';
import app from '../main.js';
import db from '../db/index.js';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

afterAll(async function () {
    await db.end();
});

async function createShelterAdmin() {
    const unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const register = await request(app)
        .post('/auth/register')
        .send({ username: 'postadmin_' + unique, password: 'password123', role: 'shelter_admin' })
        .expect(201);

    const shelter = await request(app)
        .post('/shelters')
        .set('Authorization', 'Bearer ' + register.body.token)
        .send({ name: 'Test Shelter ' + unique })
        .expect(201);

    return { token: register.body.token, shelterId: shelter.body.id };
}

async function createPost(token, shelterId, overrides = {}) {
    const res = await request(app)
        .post('/shelter-posts')
        .set('Authorization', 'Bearer ' + token)
        .send({ shelter_id: shelterId, type: 'update', title: 'Test Post', body: 'Test body.', ...overrides })
        .expect(201);
    return res.body;
}

describe('shelter_posts DELETE', function () {
    it('deletes an owned post and returns 204', async function () {
        const { token, shelterId } = await createShelterAdmin();
        const post = await createPost(token, shelterId);

        await request(app)
            .delete('/shelter-posts/' + post.id)
            .set('Authorization', 'Bearer ' + token)
            .expect(204);

        await request(app)
            .get('/shelter-posts/' + post.id)
            .expect(404);
    });

    it('returns 403 when another shelter admin tries to delete', async function () {
        const { token, shelterId } = await createShelterAdmin();
        const { token: otherToken } = await createShelterAdmin();
        const post = await createPost(token, shelterId);

        await request(app)
            .delete('/shelter-posts/' + post.id)
            .set('Authorization', 'Bearer ' + otherToken)
            .expect(403);
    });

    it('returns 404 for a non-existent post', async function () {
        const { token } = await createShelterAdmin();

        await request(app)
            .delete('/shelter-posts/non-existent-id')
            .set('Authorization', 'Bearer ' + token)
            .expect(404);
    });
});

describe('shelter_posts PATCH (edit)', function () {
    it('updates title and body of an owned post', async function () {
        const { token, shelterId } = await createShelterAdmin();
        const post = await createPost(token, shelterId);

        const res = await request(app)
            .patch('/shelter-posts/' + post.id)
            .set('Authorization', 'Bearer ' + token)
            .send({ title: 'Updated Title', body: 'Updated body.' })
            .expect(200);

        expect(res.body.title).toBe('Updated Title');
        expect(res.body.body).toBe('Updated body.');
    });

    it('returns 403 when another shelter admin tries to edit', async function () {
        const { token, shelterId } = await createShelterAdmin();
        const { token: otherToken } = await createShelterAdmin();
        const post = await createPost(token, shelterId);

        await request(app)
            .patch('/shelter-posts/' + post.id)
            .set('Authorization', 'Bearer ' + otherToken)
            .send({ title: 'Hacked title' })
            .expect(403);
    });

    it('returns 400 when no valid fields are provided', async function () {
        const { token, shelterId } = await createShelterAdmin();
        const post = await createPost(token, shelterId);

        await request(app)
            .patch('/shelter-posts/' + post.id)
            .set('Authorization', 'Bearer ' + token)
            .send({})
            .expect(400);
    });

    it('returns 404 for a non-existent post', async function () {
        const { token } = await createShelterAdmin();

        await request(app)
            .patch('/shelter-posts/non-existent-id')
            .set('Authorization', 'Bearer ' + token)
            .send({ title: 'Whatever' })
            .expect(404);
    });
});
