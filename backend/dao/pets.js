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

export async function listPets({ page = 1, limit = 25 } = {}) {
    const safeLimit = Math.min(Math.max(Number(limit) || 25, 1), 100);
    const safePage = Math.max(Number(page) || 1, 1);
    const offset = (safePage - 1) * safeLimit;

    const countResult = await db.query('SELECT COUNT(*) AS total FROM pets');
    const total = Number(countResult.rows[0].total);

    const result = await db.query(
        `SELECT p.id, p.shelter_id, p.name, p.species, p.breed, p.age_years, p.sex, p.size, p.status,
                (SELECT url FROM pet_photos WHERE pet_id = p.id ORDER BY created_at DESC LIMIT 1) AS primary_photo_url
         FROM pets p
         ORDER BY p.created_at DESC
         LIMIT ? OFFSET ?`,
        [safeLimit, offset]
    );

    return { data: result.rows, total, page: safePage, limit: safeLimit };
}

export async function getPetById(petId) {
  const petResult = await db.query(
    `SELECT id, shelter_id, name, species, breed, age_years, sex, size, description, status
     FROM pets
     WHERE id = ?`,
    [petId]
  );

  if (petResult.rows.length === 0) return null;

  const pet = petResult.rows[0];

  const photosResult = await db.query(
    `SELECT id, url
     FROM pet_photos
     WHERE pet_id = ?
     ORDER BY created_at DESC`,
    [petId]
  );

  pet.photos = photosResult.rows;
  return pet;
}


export async function getPetsByShelterId(shelterId) {
    const result = await db.query(
        'SELECT id, shelter_id, name, species, breed, age_years, sex, size, status, created_at FROM pets WHERE shelter_id = ? ORDER BY created_at DESC',
        [shelterId]
    );
    return result.rows;
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
