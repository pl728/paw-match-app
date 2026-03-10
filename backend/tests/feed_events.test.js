import request from 'supertest';
import app from '../main.js';
import db from '../db/index.js';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

afterAll(async function () {
  await db.end();
});

describe('feed_events endpoints', function () {
  async function createShelter() {
    const unique = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

    const register = await request(app)
      .post('/auth/register')
      .send({ username: 'feedadmin_' + unique, password: 'password123', role: 'shelter_admin' })
      .expect(201);

    const shelter = await request(app)
      .post('/shelters')
      .set('Authorization', 'Bearer ' + register.body.token)
      .send({ name: 'Feed Shelter' })
      .expect(201);

    return { shelterId: shelter.body.id, token: register.body.token };
  }

  it('lists feed events (200) and returns an array', async function () {
    const res = await request(app)
      .get('/feed_events?limit=25')
      .expect(200);

    expect(Array.isArray(res.body) || Array.isArray(res.body.items)).toBe(true);
  });

  it('creating a pet emits a new_pet feed event', async function () {
    const { shelterId, token } = await createShelter();

    const pet = await request(app)
      .post('/pets')
      .set('Authorization', 'Bearer ' + token)
      .send({ name: 'Biscuit', species: 'Dog' })
      .expect(201);

    const feed = await request(app).get('/feed_events?limit=100').expect(200);
    const events = Array.isArray(feed.body) ? feed.body : feed.body.items;
    const match = events.find(function (e) {
      return e.event_type === 'new_pet' && e.pet_id === pet.body.id;
    });

    expect(match).toBeDefined();
  });

  it('updating a pet status to adopted emits an adoption_event', async function () {
    const { shelterId, token } = await createShelter();

    const pet = await request(app)
      .post('/pets')
      .set('Authorization', 'Bearer ' + token)
      .send({ name: 'Noodle', species: 'Cat' })
      .expect(201);

    await request(app)
      .put('/pets/' + pet.body.id)
      .set('Authorization', 'Bearer ' + token)
      .send({ status: 'adopted' })
      .expect(200);

    const feed = await request(app).get('/feed_events?limit=100').expect(200);
    const events = Array.isArray(feed.body) ? feed.body : feed.body.items;
    const match = events.find(function (e) {
      return e.event_type === 'adoption_event' && e.pet_id === pet.body.id;
    });

    expect(match).toBeDefined();
  });

  it('updating a pet status to available emits a status_change event', async function () {
    const { shelterId, token } = await createShelter();

    const pet = await request(app)
      .post('/pets')
      .set('Authorization', 'Bearer ' + token)
      .send({ name: 'Pickles', species: 'Dog', status: 'pending' })
      .expect(201);

    await request(app)
      .put('/pets/' + pet.body.id)
      .set('Authorization', 'Bearer ' + token)
      .send({ status: 'available' })
      .expect(200);

    const feed = await request(app).get('/feed_events?limit=100').expect(200);
    const events = Array.isArray(feed.body) ? feed.body : feed.body.items;
    const match = events.find(function (e) {
      return e.event_type === 'status_change' && e.pet_id === pet.body.id;
    });

    expect(match).toBeDefined();
  });

  it('publishing a shelter post via POST emits a shelter_post event', async function () {
    const { shelterId, token } = await createShelter();

    const post = await request(app)
      .post('/shelter-posts')
      .set('Authorization', 'Bearer ' + token)
      .send({ shelter_id: shelterId, type: 'update', title: 'Big news', body: 'We have news.', publish: true })
      .expect(201);

    const feed = await request(app).get('/feed_events?limit=100').expect(200);
    const events = Array.isArray(feed.body) ? feed.body : feed.body.items;
    const match = events.find(function (e) {
      return e.event_type === 'shelter_post' && e.shelter_id === shelterId;
    });

    expect(match).toBeDefined();
  });

  it('publishing a draft shelter post via PATCH emits a shelter_post event', async function () {
    const { shelterId, token } = await createShelter();

    const post = await request(app)
      .post('/shelter-posts')
      .set('Authorization', 'Bearer ' + token)
      .send({ shelter_id: shelterId, type: 'update', title: 'Draft title', body: 'Draft body.' })
      .expect(201);

    await request(app)
      .patch('/shelter-posts/' + post.body.id + '/publish')
      .set('Authorization', 'Bearer ' + token)
      .expect(200);

    const feed = await request(app).get('/feed_events?limit=100').expect(200);
    const events = Array.isArray(feed.body) ? feed.body : feed.body.items;
    const match = events.find(function (e) {
      return e.event_type === 'shelter_post' && e.shelter_id === shelterId;
    });

    expect(match).toBeDefined();
  });
});
