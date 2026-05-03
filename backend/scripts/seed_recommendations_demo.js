#!/usr/bin/env node
'use strict';

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import db from '../db/index.js';

const PETS_PER_SHELTER = Number(process.env.RECOMMENDATION_PETS_PER_SHELTER || 25);
const PASSWORD = process.env.RECOMMENDATION_SEED_PASSWORD || 'password123';

const STATES = [
    ['AL', 'Birmingham', '35203'], ['AK', 'Anchorage', '99501'], ['AZ', 'Phoenix', '85001'],
    ['AR', 'Little Rock', '72201'], ['CA', 'Sacramento', '95814'], ['CO', 'Denver', '80202'],
    ['CT', 'Hartford', '06103'], ['DE', 'Wilmington', '19801'], ['FL', 'Orlando', '32801'],
    ['GA', 'Atlanta', '30303'], ['HI', 'Honolulu', '96813'], ['ID', 'Boise', '83702'],
    ['IL', 'Chicago', '60601'], ['IN', 'Indianapolis', '46204'], ['IA', 'Des Moines', '50309'],
    ['KS', 'Wichita', '67202'], ['KY', 'Louisville', '40202'], ['LA', 'New Orleans', '70112'],
    ['ME', 'Portland', '04101'], ['MD', 'Baltimore', '21201'], ['MA', 'Boston', '02108'],
    ['MI', 'Detroit', '48226'], ['MN', 'Minneapolis', '55401'], ['MS', 'Jackson', '39201'],
    ['MO', 'Kansas City', '64106'], ['MT', 'Billings', '59101'], ['NE', 'Omaha', '68102'],
    ['NV', 'Reno', '89501'], ['NH', 'Manchester', '03101'], ['NJ', 'Newark', '07102'],
    ['NM', 'Albuquerque', '87102'], ['NY', 'Albany', '12207'], ['NC', 'Charlotte', '28202'],
    ['ND', 'Fargo', '58102'], ['OH', 'Columbus', '43215'], ['OK', 'Oklahoma City', '73102'],
    ['OR', 'Corvallis', '97330'], ['PA', 'Philadelphia', '19103'], ['RI', 'Providence', '02903'],
    ['SC', 'Charleston', '29401'], ['SD', 'Sioux Falls', '57104'], ['TN', 'Nashville', '37203'],
    ['TX', 'Austin', '78701'], ['UT', 'Salt Lake City', '84101'], ['VT', 'Burlington', '05401'],
    ['VA', 'Richmond', '23219'], ['WA', 'Seattle', '98101'], ['WV', 'Charleston', '25301'],
    ['WI', 'Madison', '53703'], ['WY', 'Cheyenne', '82001']
];

const DOG_BREEDS = ['Labrador Mix', 'Golden Retriever', 'German Shepherd', 'Beagle', 'Poodle Mix', 'Husky'];
const CAT_BREEDS = ['Domestic Shorthair', 'Tabby', 'Calico', 'Siamese Mix', 'Maine Coon Mix', 'Tuxedo'];
const OTHER_PETS = [
    ['Rabbit', 'Holland Lop'],
    ['Rabbit', 'Mini Rex'],
    ['Bird', 'Cockatiel'],
    ['Bird', 'Parakeet']
];
const NAMES = [
    'Milo', 'Luna', 'Charlie', 'Bella', 'Cooper', 'Daisy', 'Finn', 'Ruby', 'Scout', 'Willow',
    'Jasper', 'Nala', 'Murphy', 'Penny', 'Atlas', 'Olive', 'Theo', 'Cleo', 'Winston', 'Hazel',
    'Remi', 'Poppy', 'Moose', 'Ivy', 'Archie'
];
const SIZES = ['Small', 'Medium', 'Large', 'XL'];

function uuid() {
    return crypto.randomUUID();
}

function pickByIndex(values, index) {
    return values[index % values.length];
}

async function findUserByUsername(username) {
    const result = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    return result.rows[0] || null;
}

async function ensureUser({ username, role }) {
    const existing = await findUserByUsername(username);
    if (existing) return existing;

    const id = uuid();
    const passwordHash = await bcrypt.hash(PASSWORD, 10);

    await db.query(
        'INSERT INTO users (id, username, password_hash, role) VALUES (?, ?, ?, ?)',
        [id, username, passwordHash, role]
    );
    await db.query('INSERT IGNORE INTO email_notifications (user_id) VALUES (?)', [id]);

    const result = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    return result.rows[0];
}

async function ensureShelter({ userId, name, city, state, postalCode }) {
    const existing = await db.query('SELECT * FROM shelters WHERE user_id = ?', [userId]);
    if (existing.rows[0]) return existing.rows[0];

    const id = uuid();
    await db.query(
        `INSERT INTO shelters
            (id, user_id, name, description, phone, email, city, state, postal_code)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            id,
            userId,
            name,
            `Demo shelter for recommendation testing in ${city}, ${state}.`,
            `555-${state.charCodeAt(0)}${state.charCodeAt(1)}${String(city.length).padStart(2, '0')}`,
            `contact@${state.toLowerCase()}-pawmatch-demo.test`,
            city,
            state,
            postalCode
        ]
    );

    const result = await db.query('SELECT * FROM shelters WHERE id = ?', [id]);
    return result.rows[0];
}

function buildPet(state, city, index) {
    let species;
    let breed;

    if (index % 5 === 0) {
        const other = pickByIndex(OTHER_PETS, index);
        species = other[0];
        breed = other[1];
    } else if (index % 2 === 0) {
        species = 'Cat';
        breed = pickByIndex(CAT_BREEDS, index);
    } else {
        species = 'Dog';
        breed = pickByIndex(DOG_BREEDS, index);
    }

    const name = `${pickByIndex(NAMES, index)} ${state}`;
    const status = index % 17 === 0 ? 'pending' : 'available';

    return {
        name,
        species,
        breed,
        age_years: index % 14,
        sex: index % 2 === 0 ? 'F' : 'M',
        size: species === 'Dog' ? pickByIndex(SIZES, index) : pickByIndex(['Small', 'Medium'], index),
        status,
        description: `${name} is a ${breed} in ${city}, ${state}, seeded for recommendation queue demos.`
    };
}

async function ensurePet(shelterId, pet) {
    const existing = await db.query(
        'SELECT id FROM pets WHERE shelter_id = ? AND name = ?',
        [shelterId, pet.name]
    );
    if (existing.rows[0]) return existing.rows[0].id;

    const id = uuid();
    await db.query(
        `INSERT INTO pets (id, shelter_id, name, species, breed, age_years, sex, size, description, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, shelterId, pet.name, pet.species, pet.breed, pet.age_years, pet.sex, pet.size, pet.description, pet.status]
    );

    const text = encodeURIComponent(`${pet.species}: ${pet.name}`);
    await db.query(
        'INSERT INTO pet_photos (id, pet_id, url) VALUES (?, ?, ?)',
        [uuid(), id, `https://placehold.co/600x450/e8f3ef/2d3a36?text=${text}`]
    );

    return id;
}

async function seedAdopters() {
    const adopters = [
        {
            username: 'demo_adopter_or',
            preferences: { species: ['Dog'], sizes: ['Medium', 'Large'], state: 'OR', radius_miles: 50 }
        },
        {
            username: 'demo_adopter_tx',
            preferences: { species: ['Cat', 'Dog'], state: 'TX', radius_miles: 50 }
        },
        {
            username: 'demo_adopter_any',
            preferences: { species: [], state: null, radius_miles: 500 }
        }
    ];

    for (const adopter of adopters) {
        const user = await ensureUser({ username: adopter.username, role: 'adopter' });
        await db.query(
            `INSERT INTO user_pet_preferences
                (user_id, species, breeds, sex, sizes, min_age_years, max_age_years, city, state, postal_code, radius_miles)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
                species = VALUES(species),
                breeds = VALUES(breeds),
                sex = VALUES(sex),
                sizes = VALUES(sizes),
                city = VALUES(city),
                state = VALUES(state),
                postal_code = VALUES(postal_code),
                radius_miles = VALUES(radius_miles),
                updated_at = CURRENT_TIMESTAMP`,
            [
                user.id,
                JSON.stringify(adopter.preferences.species || []),
                JSON.stringify([]),
                JSON.stringify([]),
                JSON.stringify(adopter.preferences.sizes || []),
                null,
                null,
                null,
                adopter.preferences.state,
                null,
                adopter.preferences.radius_miles
            ]
        );
    }
}

async function main() {
    console.log(`Seeding recommendation demo data: ${STATES.length} shelters, ${PETS_PER_SHELTER} pets per shelter.`);
    console.log(`Demo account password: ${PASSWORD}`);

    for (const [state, city, postalCode] of STATES) {
        const username = `demo_shelter_${state.toLowerCase()}`;
        const user = await ensureUser({ username, role: 'shelter_admin' });
        const shelter = await ensureShelter({
            userId: user.id,
            name: `${state} PawMatch Demo Shelter`,
            city,
            state,
            postalCode
        });

        for (let i = 0; i < PETS_PER_SHELTER; i++) {
            await ensurePet(shelter.id, buildPet(state, city, i));
        }

        process.stdout.write('.');
    }

    await seedAdopters();
    console.log('\nRecommendation demo seed complete.');
    await db.end();
}

main().catch(function (err) {
    console.error(err);
    process.exit(1);
});
