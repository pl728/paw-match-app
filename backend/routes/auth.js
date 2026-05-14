import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/async-handler.js';
import { createUser, getUserAuthByUsername } from '../dao/users.js';
import { updateRecommendationPreferences } from '../services/recommendations.js';
import { reverseGeocodeLocation } from '../services/geocoding.js';

const router = express.Router();

function requireJwtSecret(res) {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        res.status(500).json({ error: 'JWT_SECRET is not set' });
        return null;
    }
    return jwtSecret;
}

function buildUserResponse(user) {
    return {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
    };
}

router.post('/register', asyncHandler(async function (req, res) {
    const username = req.body.username;
    const password = req.body.password;
    const role = req.body.role || 'adopter';
    const email = req.body.email || null;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'username, email, and password are required' });
    }

    if (role !== 'adopter' && role !== 'shelter_admin') {
        return res.status(400).json({ error: 'role must be adopter or shelter_admin' });
    }

    const jwtSecret = requireJwtSecret(res);
    if (!jwtSecret) {
        return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    let created;
    try {
        created = await createUser({ username: username, passwordHash: passwordHash, role: role, email: email });
        if (role === 'adopter') {
            const preferenceFields = {
                city: req.body.city,
                state: req.body.state,
                postal_code: req.body.postal_code,
                latitude: req.body.latitude,
                longitude: req.body.longitude,
                radius_miles: req.body.radius_miles
            };
            const hasPreferenceFields = Object.values(preferenceFields).some(function (value) {
                return value !== undefined && value !== null && value !== '';
            });
            if (hasPreferenceFields) {
                await updateRecommendationPreferences(created.id, preferenceFields);
            }
        }
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'username or email already exists' });
        }
        if (err.status) {
            return res.status(err.status).json({ error: err.message });
        }
        throw err;
    }

    const token = jwt.sign(
        { sub: created.id, role: created.role },
        jwtSecret,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({ user: buildUserResponse(created), token: token });
}));

router.post('/login', asyncHandler(async function (req, res) {
    const username = req.body.username;
    const password = req.body.password;

    if (!username || !password) {
        return res.status(400).json({ error: 'username and password are required' });
    }

    const jwtSecret = requireJwtSecret(res);
    if (!jwtSecret) {
        return;
    }

    const user = await getUserAuthByUsername(username);
    if (!user) {
        return res.status(401).json({ error: 'Invalid username or password' });
    }

    const matches = await bcrypt.compare(password, user.password_hash);
    if (!matches) {
        return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign(
        { sub: user.id, role: user.role },
        jwtSecret,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({ user: buildUserResponse(user), token: token });
}));

router.get('/reverse-geocode', asyncHandler(async function (req, res) {
    try {
        const result = await reverseGeocodeLocation({
            latitude: req.query.latitude,
            longitude: req.query.longitude
        });
        res.json(result);
    } catch (err) {
        if (err.status) {
            return res.status(err.status).json({ error: err.message });
        }
        throw err;
    }
}));

export default router;
