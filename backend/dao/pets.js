import crypto from 'node:crypto';
import db from '../db/index.js';

export async function createPet(options) {
    var shelterId = options.shelterId;
    var name = options.name;
    var species = options.species || null;
    var breed = options.breed || null;
    var ageYears = options.ageYears || null;
    var sex = options.sex || null;
    var size = options.size || null;
    var description = options.description || null;
    var status = options.status || 'available';

    var petId = crypto.randomUUID();
    await db.query(
        'INSERT INTO pets (id, shelter_id, name, species, breed, age_years, sex, size, description, status) VALUES (?,?,?,?,?,?,?,?,?,?)',
        [petId, shelterId, name, species, breed, ageYears, sex, size, description, status]
    );

    var result = await db.query('SELECT * FROM pets WHERE id = ?', [petId]);
    return result.rows[0];
}

export async function listPets() {
    var result = await db.query(
        'SELECT id, shelter_id, name, species, breed, age_years, sex, size, status FROM pets ORDER BY created_at DESC'
    );
    return result.rows;
}

export async function getPetById(petId) {
    var result = await db.query(
        'SELECT id, shelter_id, name, species, breed, age_years, sex, size, description, status FROM pets WHERE id = ?',
        [petId]
    );
    if (result.rows.length === 0) {
        return null;
    }
    return result.rows[0];
}

export async function getPetId(petId) {
    var result = await db.query('SELECT id FROM pets WHERE id = ?', [petId]);
    if (result.rows.length === 0) {
        return null;
    }
    return result.rows[0].id;
}

export async function updatePet(petId, fields) {
    var setClauses = [];
    var values = [];

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

    var query = 'UPDATE pets SET ' + setClauses.join(', ') + ', updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    await db.query(query, values);

    var result = await db.query('SELECT * FROM pets WHERE id = ?', [petId]);
    if (result.rows.length === 0) {
        return null;
    }
    return result.rows[0];
}

export async function deletePet(petId) {
    await db.query('DELETE FROM pets WHERE id = ?', [petId]);
}
