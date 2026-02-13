import crypto from 'node:crypto';
import db from '../db/index.js';

export async function createShelter(options) {
    const userId = options.userId;
    const name = options.name;
    const description = options.description || null;
    const phone = options.phone || null;
    const email = options.email || null;
    const addressLine1 = options.addressLine1 || null;
    const addressLine2 = options.addressLine2 || null;
    const city = options.city || null;
    const state = options.state || null;
    const postalCode = options.postalCode || null;

    const shelterId = crypto.randomUUID();
    await db.query(
        'INSERT INTO shelters (id, user_id, name, description, phone, email, address_line1, address_line2, city, state, postal_code) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
        [shelterId, userId, name, description, phone, email, addressLine1, addressLine2, city, state, postalCode]
    );

    const result = await db.query('SELECT * FROM shelters WHERE id = ?', [shelterId]);
    return result.rows[0];
}

export async function listShelters() {
    const result = await db.query(
        'SELECT id, name, description, phone, email, city, state, created_at FROM shelters ORDER BY name ASC'
    );
    return result.rows;
}

export async function getShelterById(shelterId) {
    const result = await db.query('SELECT * FROM shelters WHERE id = ?', [shelterId]);
    if (result.rows.length === 0) {
        return null;
    }
    return result.rows[0];
}

export async function getShelterByUserId(userId) {
    const result = await db.query('SELECT * FROM shelters WHERE user_id = ?', [userId]);
    if (result.rows.length === 0) {
        return null;
    }
    return result.rows[0];
}

export async function updateShelter(shelterId, fields) {
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

    values.push(shelterId);

    const query = 'UPDATE shelters SET ' + setClauses.join(', ') + ', updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    await db.query(query, values);

    return getShelterById(shelterId);
}

export async function deleteShelter(shelterId) {
    // Delete all pets associated with this shelter first
    await db.query('DELETE FROM pets WHERE shelter_id = ?', [shelterId]);
    // Then delete the shelter
    await db.query('DELETE FROM shelters WHERE id = ?', [shelterId]);
}
