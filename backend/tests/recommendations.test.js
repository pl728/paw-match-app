import request from 'supertest';
import app from '../main.js';
import db from '../db/index.js';
import { registerVerifiedUser } from './helpers/auth.js';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

afterAll(async function () {
    await db.end();
});

async function registerUser(role) {
    const registered = await registerVerifiedUser(app, role, 'recommend_' + role);
    return registered.token;
}

async function createShelterWithPet({
    shelterName,
    city = 'Corvallis',
    state = 'OR',
    postalCode = '97330',
    latitude = 44.5646,
    longitude = -123.2620,
    pet
}) {
    const adminToken = await registerUser('shelter_admin');

    const shelterRes = await request(app)
        .post('/shelters')
        .set('Authorization', 'Bearer ' + adminToken)
        .send({ name: shelterName, city, state, postal_code: postalCode, latitude, longitude })
        .expect(201);

    const petRes = await request(app)
        .post('/pets')
        .set('Authorization', 'Bearer ' + adminToken)
        .send(pet)
        .expect(201);

    return { shelter: shelterRes.body, pet: petRes.body };
}

describe('recommendations', function () {
    it('returns default preferences for an adopter', async function () {
        const adopterToken = await registerUser('adopter');

        const res = await request(app)
            .get('/recommendations/preferences')
            .set('Authorization', 'Bearer ' + adopterToken)
            .expect(200);

        expect(res.body.species).toEqual([]);
        expect(res.body.radius_miles).toBe(50);
    });

    it('saves and returns adopter queue preferences', async function () {
        const adopterToken = await registerUser('adopter');

        const res = await request(app)
            .patch('/recommendations/preferences')
            .set('Authorization', 'Bearer ' + adopterToken)
            .send({
                species: ['Dog'],
                sizes: ['Medium'],
                min_age_years: 1,
                max_age_years: 6,
                state: 'OR',
                radius_miles: 25
            })
            .expect(200);

        expect(res.body.species).toEqual(['Dog']);
        expect(res.body.sizes).toEqual(['Medium']);
        expect(res.body.state).toBe('OR');
        expect(res.body.radius_miles).toBe(25);
    });

    it('returns matching available pets and excludes passed pets', async function () {
        const adopterToken = await registerUser('adopter');
        const matching = await createShelterWithPet({
            shelterName: 'Recommendation Oregon Shelter',
            city: 'Corvallis',
            state: 'OR',
            latitude: 44.5646,
            longitude: -123.2620,
            pet: { name: 'Queue Match', species: 'Dog', breed: 'Lab Mix', age_years: 3, sex: 'M', size: 'Medium' }
        });
        await createShelterWithPet({
            shelterName: 'Recommendation Washington Shelter',
            city: 'Seattle',
            state: 'WA',
            latitude: 47.6062,
            longitude: -122.3321,
            pet: { name: 'Queue Far Away', species: 'Dog', breed: 'Lab Mix', age_years: 3, sex: 'M', size: 'Medium' }
        });
        await createShelterWithPet({
            shelterName: 'Recommendation Cat Shelter',
            city: 'Corvallis',
            state: 'OR',
            latitude: 44.5646,
            longitude: -123.2620,
            pet: { name: 'Queue Cat', species: 'Cat', breed: 'Tabby', age_years: 3, sex: 'F', size: 'Small' }
        });

        await request(app)
            .patch('/recommendations/preferences')
            .set('Authorization', 'Bearer ' + adopterToken)
            .send({ species: ['Dog'], latitude: 44.5646, longitude: -123.2620, radius_miles: 75 })
            .expect(200);

        const firstQueue = await request(app)
            .get('/recommendations/queue?limit=10')
            .set('Authorization', 'Bearer ' + adopterToken)
            .expect(200);

        expect(firstQueue.body.items.some((pet) => pet.id === matching.pet.id)).toBe(true);
        expect(firstQueue.body.items.every((pet) => pet.species === 'Dog')).toBe(true);
        expect(firstQueue.body.items.every((pet) => Number(pet.distance_miles) <= 75)).toBe(true);
        expect(firstQueue.body.items.some((pet) => pet.name === 'Queue Far Away')).toBe(false);

        await request(app)
            .post('/recommendations/interactions')
            .set('Authorization', 'Bearer ' + adopterToken)
            .send({ pet_id: matching.pet.id, interaction_type: 'passed' })
            .expect(204);

        const secondQueue = await request(app)
            .get('/recommendations/queue?limit=10')
            .set('Authorization', 'Bearer ' + adopterToken)
            .expect(200);

        expect(secondQueue.body.items.some((pet) => pet.id === matching.pet.id)).toBe(false);
    });

    it('records liked interactions as favorites', async function () {
        const adopterToken = await registerUser('adopter');
        const created = await createShelterWithPet({
            shelterName: 'Recommendation Like Shelter',
            pet: { name: 'Queue Like', species: 'Dog', breed: 'Lab Mix', age_years: 2, sex: 'F', size: 'Small' }
        });

        await request(app)
            .post('/recommendations/interactions')
            .set('Authorization', 'Bearer ' + adopterToken)
            .send({ pet_id: created.pet.id, interaction_type: 'liked' })
            .expect(204);

        const favorites = await request(app)
            .get('/favorites')
            .set('Authorization', 'Bearer ' + adopterToken)
            .expect(200);

        expect(favorites.body.some((favorite) => favorite.pet_id === created.pet.id)).toBe(true);
    });

    it('rejects shelter admins from recommendation endpoints', async function () {
        const adminToken = await registerUser('shelter_admin');

        await request(app)
            .get('/recommendations/queue')
            .set('Authorization', 'Bearer ' + adminToken)
            .expect(403);
    });
});
