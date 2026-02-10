import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/async-handler.js';
import { createUser, getUserAuthByEmail } from '../dao/users.js';

var router = express.Router();

function requireJwtSecret(res) {
    var jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        res.status(500).json({ error: 'JWT_SECRET is not set' });
        return null;
    }
    return jwtSecret;
}

function buildUserResponse(user) {
    return {
        id: user.id,
        email: user.email,
        role: user.role
    };
}

router.post('/register', asyncHandler(async function (req, res) {
    var email = req.body.email;
    var password = req.body.password;
    var role = req.body.role || 'adopter';

    if (!email || !password) {
        return res.status(400).json({ error: 'email and password are required' });
    }

    if (role !== 'adopter' && role !== 'shelter_admin') {
        return res.status(400).json({ error: 'role must be adopter or shelter_admin' });
    }

    var jwtSecret = requireJwtSecret(res);
    if (!jwtSecret) {
        return;
    }

    var passwordHash = await bcrypt.hash(password, 10);

    try {
        var created = await createUser({ email: email, passwordHash: passwordHash, role: role });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'email already exists' });
        }
        throw err;
    }

    var token = jwt.sign(
        { sub: created.id, role: created.role },
        jwtSecret,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({ user: buildUserResponse(created), token: token });
}));

router.post('/login', asyncHandler(async function (req, res) {
    var email = req.body.email;
    var password = req.body.password;

    if (!email || !password) {
        return res.status(400).json({ error: 'email and password are required' });
    }

    var jwtSecret = requireJwtSecret(res);
    if (!jwtSecret) {
        return;
    }

    var user = await getUserAuthByEmail(email);
    if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    var matches = await bcrypt.compare(password, user.password_hash);
    if (!matches) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    var token = jwt.sign(
        { sub: user.id, role: user.role },
        jwtSecret,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({ user: buildUserResponse(user), token: token });
}));

export default router;
