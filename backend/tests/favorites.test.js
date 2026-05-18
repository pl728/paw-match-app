import request from 'supertest';
import app from '../main.js';
import db from '../db/index.js';
import { registerVerifiedUser } from './helpers/auth.js';
import { postPetWithPhotos } from './helpers/pet_photos.js';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

afterAll(async function () {
  await db.end();
});

describe('favorites engagement', function () {
  async function registerUser(role) {
    const registered = await registerVerifiedUser(app, role);
    return registered.token;
  }

  it('adopter can favorite a pet and retrieve favorites', async function () {
    // create shelter + pet
    const adminToken = await registerUser('shelter_admin');

    const shelterRes = await request(app)
      .post('/shelters')
      .set('Authorization', 'Bearer ' + adminToken)
      .send({ name: 'Engagement Shelter' })
      .expect(201);

    const petRes = await postPetWithPhotos(app, adminToken, {
      name: 'Engagement Pet',
      species: 'Dog',
      shelterId: shelterRes.body.id,
    })
      .expect(201);

    // adopter favorites pet
    const adopterToken = await registerUser('adopter');

    await request(app)
      .post('/favorites')
      .set('Authorization', 'Bearer ' + adopterToken)
      .send({ pet_id: petRes.body.id })
      .expect(204);

    // retrieve favorites
    const list = await request(app)
      .get('/favorites')
      .set('Authorization', 'Bearer ' + adopterToken)
      .expect(200);

    expect(Array.isArray(list.body)).toBe(true);
    expect(list.body.some((f) => f.pet_id === petRes.body.id || f.petId === petRes.body.id)).toBe(true);

    // delete favorite
    await request(app)
    .delete('/favorites')
    .set('Authorization', 'Bearer ' + adopterToken)
    .send({ pet_id: petRes.body.id })
    .expect(204);

    // retrieve again
    const afterDelete = await request(app)
    .get('/favorites')
    .set('Authorization', 'Bearer ' + adopterToken)
    .expect(200);

    expect(afterDelete.body.some((r) => r.pet_id === petRes.body.id)).toBe(false);

  });

  it('rejects favoriting without authentication', async function () {
    await request(app)
      .post('/favorites')
      .send({ pet_id: 'some-id' })
      .expect(401);
  });

  it('rejects shelter_admin from favoriting a pet', async function () {
    const adminToken = await registerUser('shelter_admin');

    await request(app)
      .post('/favorites')
      .set('Authorization', 'Bearer ' + adminToken)
      .send({ pet_id: 'some-id' })
      .expect(403);
  });

  it('rejects retrieving favorites without authentication', async function () {
    await request(app)
      .get('/favorites')
      .expect(401);
  });

  it('rejects deleting a favorite without authentication', async function () {
    await request(app)
      .delete('/favorites')
      .send({ pet_id: 'some-id' })
      .expect(401);
  });
});
