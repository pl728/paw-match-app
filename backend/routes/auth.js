import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/async-handler.js';
import {
    createUser,
    getUserAuthByUsername,
    getUserByUsernameOrEmail,
    getUserRegistrationConflicts,
    markUserEmailVerified
} from '../dao/users.js';
import { getActiveEmailVerificationToken, markEmailVerificationTokenUsed } from '../dao/email_verification_tokens.js';
import { updateRecommendationPreferences } from '../services/recommendations.js';
import { reverseGeocodeLocation } from '../services/geocoding.js';
import { sendVerificationEmail } from '../services/email_verification.js';

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
        role: user.role,
        email_verified: Boolean(user.email_verified_at)
    };
}

function sendRegistrationConflict(res, conflicts) {
    const fields = [];
    if (conflicts.username) fields.push('username');
    if (conflicts.email) fields.push('email');

    if (fields.length === 0) {
        return false;
    }

    let error = 'Username and email already exist';
    let code = 'USERNAME_EMAIL_EXISTS';
    if (conflicts.username && !conflicts.email) {
        error = 'Username already exists';
        code = 'USERNAME_EXISTS';
    } else if (conflicts.email && !conflicts.username) {
        error = 'Email address already exists';
        code = 'EMAIL_EXISTS';
    }

    res.status(409).json({ error, code, fields });
    return true;
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

    const conflicts = await getUserRegistrationConflicts({ username, email });
    if (sendRegistrationConflict(res, conflicts)) {
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
        await sendVerificationEmail(created);
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            const currentConflicts = await getUserRegistrationConflicts({ username, email });
            if (sendRegistrationConflict(res, currentConflicts)) {
                return;
            }
            return res.status(409).json({ error: 'Account already exists', code: 'ACCOUNT_EXISTS', fields: [] });
        }
        if (err.status) {
            return res.status(err.status).json({ error: err.message });
        }
        throw err;
    }

    res.status(201).json({
        message: 'Account created. Check your email to verify your account before logging in.',
        user: buildUserResponse(created)
    });
}));

router.post('/send-verification-email', asyncHandler(async function (req, res) {
    const identifier = req.body.username || req.body.email;
    const neutralMessage = 'If an unverified account exists for that username or email, a verification email has been sent.';

    if (!identifier) {
        return res.status(400).json({ error: 'username or email is required' });
    }

    const user = await getUserByUsernameOrEmail(identifier);
    if (user && !user.email_verified_at) {
        try {
            await sendVerificationEmail(user);
        } catch (err) {
            console.error('Failed to resend verification email:', err);
        }
    }

    res.json({ message: neutralMessage });
}));

router.get('/verify-email', asyncHandler(async function (req, res) {
    const token = req.query.token;

    if (!token) {
        return res.status(400).json({ error: 'Verification token is required' });
    }

    const verificationToken = await getActiveEmailVerificationToken(token);
    if (!verificationToken) {
        return res.status(400).json({ error: 'Verification link is invalid or expired' });
    }

    const user = await markUserEmailVerified(verificationToken.user_id);
    await markEmailVerificationTokenUsed(verificationToken.id);

    res.json({
        message: 'Email verified. You can now log in.',
        user: buildUserResponse(user)
    });
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

    if (!user.email_verified_at) {
        return res.status(403).json({
            error: 'Email address has not been verified',
            code: 'EMAIL_NOT_VERIFIED'
        });
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
