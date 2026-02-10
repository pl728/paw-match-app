import express from 'express';
import jwt from 'jsonwebtoken';
import asyncHandler from '../utils/async-handler.js';
import {
    createPet,
    listPets,
    getPetById,
    updatePet,
    deletePet
} from '../dao/pets.js';
import { getShelterByUserId } from '../dao/shelters.js';

const router = express.Router();

function requireJwtSecret(res) {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
        res.status(500).json({ error: 'JWT_SECRET is not set' });
        return null;
    }
    return jwtSecret;
}

function getAuthPayload(req, res) {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Missing auth token' });
        return null;
    }

    const jwtSecret = requireJwtSecret(res);
    if (!jwtSecret) {
        return null;
    }

    const token = authHeader.slice('Bearer '.length).trim();
    try {
        return jwt.verify(token, jwtSecret);
    } catch (err) {
        res.status(401).json({ error: 'Invalid or expired token' });
        return null;
    }
}

async function requireShelterAdmin(req, res) {
    const payload = getAuthPayload(req, res);
    if (!payload) {
        return null;
    }

    if (payload.role !== 'shelter_admin') {
        res.status(403).json({ error: 'Shelter admin access required' });
        return null;
    }

    return payload;
}

router.post('/', asyncHandler(async function (req, res) {
    const payload = await requireShelterAdmin(req, res);
    if (!payload) {
        return;
    }

    const name = req.body.name;
    const species = req.body.species || null;
    const breed = req.body.breed || null;
    const ageYears = req.body.age_years || null;
    const sex = req.body.sex || null;
    const size = req.body.size || null;
    const description = req.body.description || null;
    const status = req.body.status || 'available';

    if (!name) {
        return res.status(400).json({ error: 'name is required' });
    }

    const shelter = await getShelterByUserId(payload.sub);
    if (!shelter) {
        return res.status(404).json({ error: 'Shelter not found for user' });
    }

    const created = await createPet({
        shelterId: shelter.id,
        name: name,
        species: species,
        breed: breed,
        ageYears: ageYears,
        sex: sex,
        size: size,
        description: description,
        status: status
    });
    res.status(201).json(created);
}));

router.get('/', asyncHandler(async function (req, res) {
    const pets = await listPets();
    res.json(pets);
}));

router.get('/:id', asyncHandler(async function (req, res) {
    const pet = await getPetById(req.params.id);
    if (!pet) {
        return res.status(404).json({ error: 'Pet not found' });
    }

    res.json(pet);
}));

router.put('/:id', asyncHandler(async function (req, res) {
    const payload = await requireShelterAdmin(req, res);
    if (!payload) {
        return;
    }

    const shelter = await getShelterByUserId(payload.sub);
    if (!shelter) {
        return res.status(404).json({ error: 'Shelter not found for user' });
    }

    const pet = await getPetById(req.params.id);
    if (!pet) {
        return res.status(404).json({ error: 'Pet not found' });
    }

    if (pet.shelter_id !== shelter.id) {
        return res.status(403).json({ error: 'Not allowed to update this pet' });
    }

    const fields = {
        name: req.body.name,
        species: req.body.species,
        breed: req.body.breed,
        age_years: req.body.age_years,
        sex: req.body.sex,
        size: req.body.size,
        description: req.body.description,
        status: req.body.status
    };

    const hasUpdates = Object.keys(fields).some(function (key) {
        return fields[key] !== undefined;
    });

    if (!hasUpdates) {
        return res.status(400).json({ error: 'No valid fields provided' });
    }

    const updated = await updatePet(req.params.id, fields);
    if (!updated) {
        return res.status(404).json({ error: 'Pet not found' });
    }

    res.json(updated);
}));

router.delete('/:id', asyncHandler(async function (req, res) {
    const payload = await requireShelterAdmin(req, res);
    if (!payload) {
        return;
    }

    const shelter = await getShelterByUserId(payload.sub);
    if (!shelter) {
        return res.status(404).json({ error: 'Shelter not found for user' });
    }

    const pet = await getPetById(req.params.id);
    if (!pet) {
        return res.status(404).json({ error: 'Pet not found' });
    }

    if (pet.shelter_id !== shelter.id) {
        return res.status(403).json({ error: 'Not allowed to delete this pet' });
    }

    await deletePet(req.params.id);
    res.json({ deleted: true, id: pet.id });
}));

export default router;
