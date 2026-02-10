import express from 'express';
import asyncHandler from '../utils/async-handler.js';
import { createUser, getUserById } from '../dao/users.js';
import { getShelterByUserId } from '../dao/shelters.js';
import { getPetsByShelterId } from '../dao/pets.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.post('/', asyncHandler(async function (req, res) {
    const username = req.body.username;
    const passwordHash = req.body.password_hash;
    const role = req.body.role || 'adopter';

    if (!username || !passwordHash) {
        return res.status(400).json({ error: 'username and password_hash are required' });
    }

    let created;
    try {
        created = await createUser({ username: username, passwordHash: passwordHash, role: role });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'username already exists' });
        }
        throw err;
    }
    res.status(201).json(created);
}));

router.get('/me', requireAuth, asyncHandler(async function (req, res) {
    const user = await getUserById(req.userId);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    const profile = {
        id: user.id,
        username: user.username,
        role: user.role,
        created_at: user.created_at
    };

    if (user.role === 'shelter_admin') {
        const shelter = await getShelterByUserId(user.id);
        if (shelter) {
            profile.shelter = shelter;
            const pets = await getPetsByShelterId(shelter.id);
            profile.pets = pets;
        }
    }

    res.json(profile);
}));

router.get('/:id', asyncHandler(async function (req, res) {
    const user = await getUserById(req.params.id);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
}));

export default router;
