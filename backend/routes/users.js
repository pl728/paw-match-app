import express from 'express';
import asyncHandler from '../utils/async-handler.js';
import { createUser, getUserById } from '../dao/users.js';

const router = express.Router();

router.post('/', asyncHandler(async function (req, res) {
    const email = req.body.email;
    const passwordHash = req.body.password_hash;
    const role = req.body.role || 'adopter';

    if (!email || !passwordHash) {
        return res.status(400).json({ error: 'email and password_hash are required' });
    }

    let created;
    try {
        created = await createUser({ email: email, passwordHash: passwordHash, role: role });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'email already exists' });
        }
        throw err;
    }
    res.status(201).json(created);
}));

router.get('/:id', asyncHandler(async function (req, res) {
    const user = await getUserById(req.params.id);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
}));

export default router;
