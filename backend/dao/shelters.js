import crypto from 'node:crypto';
import db from '../db/index.js';

export async function createShelter(options) {
    var userId = options.userId;
    var name = options.name;
    var description = options.description || null;
    var phone = options.phone || null;
    var email = options.email || null;
    var addressLine1 = options.addressLine1 || null;
    var addressLine2 = options.addressLine2 || null;
    var city = options.city || null;
    var state = options.state || null;
    var postalCode = options.postalCode || null;

    var shelterId = crypto.randomUUID();
    await db.query(
        'INSERT INTO shelters (id, user_id, name, description, phone, email, address_line1, address_line2, city, state, postal_code) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
        [shelterId, userId, name, description, phone, email, addressLine1, addressLine2, city, state, postalCode]
    );

    var result = await db.query('SELECT * FROM shelters WHERE id = ?', [shelterId]);
    return result.rows[0];
}

export async function getShelterById(shelterId) {
    var result = await db.query('SELECT * FROM shelters WHERE id = ?', [shelterId]);
    if (result.rows.length === 0) {
        return null;
    }
    return result.rows[0];
}

export async function updateShelter(shelterId, fields) {
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

    values.push(shelterId);

    var query = 'UPDATE shelters SET ' + setClauses.join(', ') + ', updated_at = CURRENT_TIMESTAMP WHERE id = ?';
    await db.query(query, values);

    return getShelterById(shelterId);
}
