import crypto from 'node:crypto';
import db from '../db/index.js';

export async function createPet(options) {
    const shelterId = options.shelterId;
    const name = options.name;
    const species = options.species || null;
    const breed = options.breed || null;
    const ageYears = options.ageYears || null;
    const sex = options.sex || null;
    const size = options.size || null;
    const description = options.description || null;
    const status = options.status || 'available';

    const petId = crypto.randomUUID();
    await db.query(
        'INSERT INTO pets (id, shelter_id, name, species, breed, age_years, sex, size, description, status) VALUES (?,?,?,?,?,?,?,?,?,?)',
        [petId, shelterId, name, species, breed, ageYears, sex, size, description, status]
    );

    const result = await db.query('SELECT * FROM pets WHERE id = ?', [petId]);
    return result.rows[0];
}

export async function listPets() {
    const result = await db.query(
        'SELECT id, shelter_id, name, species, breed, age_years, sex, size, status FROM pets ORDER BY created_at DESC'
    );
    return result.rows;
}

export async function getPetById(petId) {
    const result = await db.query(
        'SELECT id, shelter_id, name, species, breed, age_years, sex, size, description, status FROM pets WHERE id = ?',
        [petId]
    );
    if (result.rows.length === 0) {
        return null;
    }
    return result.rows[0];
}

export async function getPetId(petId) {
    const result = await db.query('SELECT id FROM pets WHERE id = ?', [petId]);
    if (result.rows.length === 0) {
        return null;
    }
    return result.rows[0].id;
}

export async function updatePet(petId, fields) {
    const setClauses = [];
    const values = [];

    Object.keys(fields).forEach(function (key) {
        if (fields[key] !== undefined) {
            setClauses.push(key + ' = ?');
            values.push(fields[key]);
        }
    });

    if (setClauses.length === 0) {
        return null;
    }

    values.push(petId);

    const query = 'UPDATE pets SET ' + setClauses.join(', ') + ', updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    await db.query(query, values);

    const result = await db.query('SELECT * FROM pets WHERE id = ?', [petId]);
    if (result.rows.length === 0) {
        return null;
    }
    return result.rows[0];
}

export async function deletePet(petId) {
    await db.query('DELETE FROM pets WHERE id = ?', [petId]);
}
