import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/async-handler.js';
import { createUser, getUserAuthByUsername } from '../dao/users.js';
import { createShelter } from '../dao/shelters.js';

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
        role: user.role
    };
}

router.post('/register', asyncHandler(async function (req, res) {
    const username = req.body.username;
    const password = req.body.password;
    const role = req.body.role || 'adopter';
    const shelterName = req.body.shelter_name;

    if (!username || !password) {
        return res.status(400).json({ error: 'username and password are required' });
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
        created = await createUser({ username: username, passwordHash: passwordHash, role: role });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'username already exists' });
        }
        throw err;
    }

    if (role === 'shelter_admin') {
        const name = shelterName || `${username} Shelter`;
        await createShelter({
            userId: created.id,
            name: name
        });
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

export default router;
