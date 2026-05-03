import crypto from 'node:crypto';
import db from '../db/index.js';

const ARRAY_FIELDS = ['species', 'breeds', 'sex', 'sizes'];

function parseJsonArray(value) {
    if (value === null || value === undefined) return [];
    if (Array.isArray(value)) return value;
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function mapPreferenceRow(row) {
    if (!row) return null;

    const mapped = { ...row };
    ARRAY_FIELDS.forEach(function (field) {
        mapped[field] = parseJsonArray(mapped[field]);
    });
    return mapped;
}

export async function getUserPetPreferences(userId) {
    const result = await db.query(
        `SELECT user_id, species, breeds, sex, sizes, min_age_years, max_age_years,
                city, state, postal_code, radius_miles, created_at, updated_at
         FROM user_pet_preferences
         WHERE user_id = ?`,
        [userId]
    );

    return mapPreferenceRow(result.rows[0] || null);
}

export async function upsertUserPetPreferences(userId, preferences) {
    const species = preferences.species ? JSON.stringify(preferences.species) : null;
    const breeds = preferences.breeds ? JSON.stringify(preferences.breeds) : null;
    const sex = preferences.sex ? JSON.stringify(preferences.sex) : null;
    const sizes = preferences.sizes ? JSON.stringify(preferences.sizes) : null;

    await db.query(
        `INSERT INTO user_pet_preferences
            (user_id, species, breeds, sex, sizes, min_age_years, max_age_years, city, state, postal_code, radius_miles)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
            species = VALUES(species),
            breeds = VALUES(breeds),
            sex = VALUES(sex),
            sizes = VALUES(sizes),
            min_age_years = VALUES(min_age_years),
            max_age_years = VALUES(max_age_years),
            city = VALUES(city),
            state = VALUES(state),
            postal_code = VALUES(postal_code),
            radius_miles = VALUES(radius_miles),
            updated_at = CURRENT_TIMESTAMP`,
        [
            userId,
            species,
            breeds,
            sex,
            sizes,
            preferences.min_age_years ?? null,
            preferences.max_age_years ?? null,
            preferences.city || null,
            preferences.state || null,
            preferences.postal_code || null,
            preferences.radius_miles ?? 50
        ]
    );

    return getUserPetPreferences(userId);
}

export async function createPetInteraction(userId, petId, interactionType) {
    const id = crypto.randomUUID();
    await db.query(
        `INSERT IGNORE INTO pet_interactions (id, user_id, pet_id, interaction_type)
         VALUES (?, ?, ?, ?)`,
        [id, userId, petId, interactionType]
    );
}

export async function listRecommendedPets(userId, preferences = {}, limit = 20) {
    const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 50));
    const filters = [
        `p.status = 'available'`,
        `NOT EXISTS (
            SELECT 1
            FROM pet_interactions pi
            WHERE pi.user_id = ?
              AND pi.pet_id = p.id
              AND pi.interaction_type IN ('liked', 'passed')
        )`
    ];
    const params = [userId];

    function addInFilter(column, values) {
        if (!Array.isArray(values) || values.length === 0) return;
        const cleanValues = values.filter(function (value) {
            return typeof value === 'string' && value.trim();
        });
        if (cleanValues.length === 0) return;

        filters.push(`${column} IN (${cleanValues.map(() => '?').join(', ')})`);
        params.push(...cleanValues);
    }

    addInFilter('p.species', preferences.species);
    addInFilter('p.breed', preferences.breeds);
    addInFilter('p.sex', preferences.sex);
    addInFilter('p.size', preferences.sizes);

    if (preferences.min_age_years !== null && preferences.min_age_years !== undefined) {
        filters.push('p.age_years >= ?');
        params.push(Number(preferences.min_age_years));
    }

    if (preferences.max_age_years !== null && preferences.max_age_years !== undefined) {
        filters.push('p.age_years <= ?');
        params.push(Number(preferences.max_age_years));
    }

    if (preferences.postal_code) {
        filters.push('s.postal_code = ?');
        params.push(preferences.postal_code);
    } else {
        if (preferences.city) {
            filters.push('s.city = ?');
            params.push(preferences.city);
        }
        if (preferences.state) {
            filters.push('s.state = ?');
            params.push(preferences.state);
        }
    }

    params.push(safeLimit);

    const result = await db.query(
        `SELECT
            p.id,
            p.shelter_id,
            s.name AS shelter_name,
            s.city AS shelter_city,
            s.state AS shelter_state,
            s.postal_code AS shelter_postal_code,
            p.name,
            p.species,
            p.breed,
            p.age_years,
            p.sex,
            p.size,
            p.description,
            p.status,
            (SELECT url FROM pet_photos WHERE pet_id = p.id ORDER BY created_at DESC LIMIT 1) AS primary_photo_url,
            (SELECT COUNT(*) FROM pet_interactions WHERE pet_id = p.id AND interaction_type = 'liked') AS liked_count,
            (SELECT COUNT(*) FROM pet_interactions WHERE pet_id = p.id AND interaction_type = 'passed') AS passed_count,
            (SELECT COUNT(*) FROM pet_interactions WHERE pet_id = p.id AND interaction_type = 'shown') AS shown_count
         FROM pets p
         JOIN shelters s ON s.id = p.shelter_id
         WHERE ${filters.join(' AND ')}
         ORDER BY
            ((SELECT COUNT(*) FROM pet_interactions WHERE pet_id = p.id AND interaction_type = 'liked') * 2
             - (SELECT COUNT(*) FROM pet_interactions WHERE pet_id = p.id AND interaction_type = 'passed')) DESC,
            p.created_at DESC
         LIMIT ?`,
        params
    );

    return result.rows;
}
