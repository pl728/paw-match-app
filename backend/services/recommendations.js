import {
    createPetInteraction,
    getUserPetPreferences,
    listRecommendedPets,
    upsertUserPetPreferences
} from '../dao/recommendations.js';
import { addFavorite } from '../dao/favorites.js';
import { geocodeLocation, normalizeCoordinates } from './geocoding.js';

export const ALLOWED_INTERACTION_TYPES = ['shown', 'viewed', 'liked', 'passed'];

const DEFAULT_PREFERENCES = {
    species: [],
    breeds: [],
    sex: [],
    sizes: [],
    min_age_years: null,
    max_age_years: null,
    city: null,
    state: null,
    postal_code: null,
    latitude: null,
    longitude: null,
    geocoded_at: null,
    radius_miles: 50
};

function cleanString(value) {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
}

function cleanStringArray(value) {
    if (!Array.isArray(value)) return undefined;

    return Array.from(new Set(value
        .filter(function (item) {
            return typeof item === 'string' && item.trim();
        })
        .map(function (item) {
            return item.trim();
        })))
        .slice(0, 25);
}

function cleanInteger(value) {
    if (value === null) return null;
    if (value === undefined || value === '') return undefined;

    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0) return undefined;
    return parsed;
}

function cleanCoordinate(value, min, max) {
    if (value === null) return null;
    if (value === undefined || value === '') return undefined;

    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < min || parsed > max) return undefined;
    return parsed;
}

export function defaultRecommendationPreferences() {
    return { ...DEFAULT_PREFERENCES };
}

export async function getRecommendationPreferences(userId) {
    const existing = await getUserPetPreferences(userId);
    return { ...DEFAULT_PREFERENCES, ...(existing || {}) };
}

export async function updateRecommendationPreferences(userId, body) {
    const existing = await getRecommendationPreferences(userId);
    const next = { ...existing };
    let changed = false;

    ['species', 'breeds', 'sex', 'sizes'].forEach(function (field) {
        const cleaned = cleanStringArray(body[field]);
        if (cleaned !== undefined) {
            next[field] = cleaned;
            changed = true;
        }
    });

    ['city', 'state', 'postal_code'].forEach(function (field) {
        if (Object.prototype.hasOwnProperty.call(body, field)) {
            next[field] = cleanString(body[field]);
            changed = true;
        }
    });

    const latitude = cleanCoordinate(body.latitude, -90, 90);
    const longitude = cleanCoordinate(body.longitude, -180, 180);
    if (latitude !== undefined || longitude !== undefined) {
        const coordinates = normalizeCoordinates({ latitude, longitude });
        if (!coordinates) {
            const err = new Error('latitude and longitude must both be valid coordinates');
            err.status = 400;
            throw err;
        }
        next.latitude = coordinates.latitude;
        next.longitude = coordinates.longitude;
        changed = true;
    }

    ['min_age_years', 'max_age_years', 'radius_miles'].forEach(function (field) {
        const cleaned = cleanInteger(body[field]);
        if (cleaned !== undefined) {
            next[field] = cleaned;
            changed = true;
        }
    });

    if (next.min_age_years !== null && next.max_age_years !== null && next.min_age_years > next.max_age_years) {
        const err = new Error('min_age_years cannot be greater than max_age_years');
        err.status = 400;
        throw err;
    }

    if (!changed) {
        const err = new Error('No valid preference fields provided');
        err.status = 400;
        throw err;
    }

    const locationChanged = ['city', 'state', 'postal_code'].some(function (field) {
        return Object.prototype.hasOwnProperty.call(body, field);
    });
    const coordinatesProvided = latitude !== undefined || longitude !== undefined;
    const hasGeocodableLocation = Boolean(next.postal_code || (next.city && next.state));
    if (locationChanged && !coordinatesProvided && hasGeocodableLocation) {
        try {
            const coordinates = await geocodeLocation(next);
            next.latitude = coordinates?.latitude ?? null;
            next.longitude = coordinates?.longitude ?? null;
        } catch (err) {
            err.status = 400;
            throw err;
        }
    }

    return upsertUserPetPreferences(userId, next);
}

export async function getRecommendationQueue(userId, limit) {
    const preferences = await getRecommendationPreferences(userId);
    const items = await listRecommendedPets(userId, preferences, limit);
    return { preferences, items };
}

export async function recordRecommendationInteraction(userId, petId, interactionType) {
    if (!ALLOWED_INTERACTION_TYPES.includes(interactionType)) {
        const err = new Error('Invalid interaction_type');
        err.status = 400;
        throw err;
    }

    await createPetInteraction(userId, petId, interactionType);

    if (interactionType === 'liked') {
        await addFavorite(userId, petId);
    }
}
