import express from 'express';
import asyncHandler from '../utils/async-handler.js';
import { createUser, getUserById } from '../dao/users.js';
import { getShelterByUserId } from '../dao/shelters.js';
import { getPetsByShelterId } from '../dao/pets.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { getEffectivePetPhotoStorageUrl } from '../services/pet_photos.js';

const router = express.Router();

function getBaseUrl(req) {
    return req.protocol + '://' + req.get('host');
}

function withProxyPhotoUrls(req, pet) {
    if (!pet) {
        return pet;
    }

    const mapped = { ...pet };

    if (getEffectivePetPhotoStorageUrl(mapped.species, mapped.primary_photo_url)) {
        mapped.primary_photo_url = getBaseUrl(req) + '/pets/' + mapped.id + '/primary-photo';
    }

    return mapped;
}

router.post('/', requireAuth, requireRole('shelter_admin'), asyncHandler(async function (req, res) {
    const username = req.body.username;
    const passwordHash = req.body.password_hash;
    const role = req.body.role || 'adopter';
    const email = req.body.email;

    if (!username || !email || !passwordHash) {
        return res.status(400).json({ error: 'username, email, and password_hash are required' });
    }

    let created;
    try {
        created = await createUser({ username: username, passwordHash: passwordHash, role: role, email: email });
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
        email: user.email || null,
        role: user.role,
        created_at: user.created_at
    };

    if (user.role === 'shelter_admin') {
        const shelter = await getShelterByUserId(user.id);
        if (shelter) {
            profile.shelter = shelter;
            const pets = await getPetsByShelterId(shelter.id);
            profile.pets = pets.map(function (pet) {
                return withProxyPhotoUrls(req, pet);
            });
        }
    }

    res.json(profile);
}));

router.get('/:id', requireAuth, asyncHandler(async function (req, res) {
    const user = await getUserById(req.params.id);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
}));

export default router;
