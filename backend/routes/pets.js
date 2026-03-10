import express from 'express';
import multer from 'multer';
import asyncHandler from '../utils/async-handler.js';
import {
    createPet,
    listPets,
    getPetById,
    addPetPhoto,
    updatePet,
    deletePet
} from '../dao/pets.js';
import { getShelterByUserId } from '../dao/shelters.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { createFeedEvent } from '../dao/feed_events.js';
import { getDefaultPetPhotoStorageUrl, getEffectivePetPhotoStorageUrl, sendStoredPhoto, uploadPetPhoto } from '../services/pet_photos.js';

const router = express.Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

function getBaseUrl(req) {
    return req.protocol + '://' + req.get('host');
}

function withProxyPhotoUrls(req, pet) {
    if (!pet) {
        return pet;
    }

    const baseUrl = getBaseUrl(req);
    const mapped = { ...pet };

    if (getEffectivePetPhotoStorageUrl(mapped.species, mapped.primary_photo_url)) {
        mapped.primary_photo_url = baseUrl + '/pets/' + mapped.id + '/primary-photo';
    }

    if (Array.isArray(mapped.photos)) {
        mapped.photos = mapped.photos.map(function (photo) {
            return {
                ...photo,
                url: baseUrl + '/pets/' + mapped.id + '/photos/' + photo.id
            };
        });
    }

    return mapped;
}

router.post('/', requireAuth, requireRole('shelter_admin'), upload.single('photo'), asyncHandler(async function (req, res) {

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

    const shelter = await getShelterByUserId(req.userId);
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

    let photoUrl = null;
    if (req.file) {
        photoUrl = await uploadPetPhoto({
            petId: created.id,
            shelterId: shelter.id,
            file: req.file
        });
    } else {
        photoUrl = getDefaultPetPhotoStorageUrl(species);
    }

    if (photoUrl) {
        await addPetPhoto(created.id, photoUrl);
    }

    try {
        await createFeedEvent('new_pet', {
            shelter_id: shelter.id,
            pet_id: created.id,
            payload: {
                title: `New pet: ${name}`,
                body: description || `${name} is now available at ${shelter.name}.`,
                primaryPhotoUrl: photoUrl ? getBaseUrl(req) + '/pets/' + created.id + '/primary-photo' : null,
            },
        });
    } catch (e) {
        console.error('Failed to create feed event for new pet:', e);
    }

    res.status(201).json(withProxyPhotoUrls(req, {
        ...created,
        primary_photo_url: photoUrl
    }));
}));

router.get('/', asyncHandler(async function (req, res) {
    const result = await listPets({ page: req.query.page, limit: req.query.limit });
    res.json({
        ...result,
        data: result.data.map(function (pet) {
            return withProxyPhotoUrls(req, pet);
        })
    });
}));

router.get('/:id/primary-photo', asyncHandler(async function (req, res) {
    const pet = await getPetById(req.params.id);
    if (!pet) {
        return res.status(404).json({ error: 'Pet not found' });
    }

    const storedUrl = pet.photos?.[0]?.url || null;
    const effectiveUrl = getEffectivePetPhotoStorageUrl(pet.species, storedUrl);
    await sendStoredPhoto(res, effectiveUrl);
}));

router.get('/:id/photos/:photoId', asyncHandler(async function (req, res) {
    const pet = await getPetById(req.params.id);
    if (!pet) {
        return res.status(404).json({ error: 'Pet not found' });
    }

    const photo = pet.photos.find(function (item) {
        return item.id === req.params.photoId;
    });
    if (!photo) {
        return res.status(404).json({ error: 'Photo not found' });
    }

    const effectiveUrl = getEffectivePetPhotoStorageUrl(pet.species, photo.url);
    await sendStoredPhoto(res, effectiveUrl);
}));

router.get('/:id', asyncHandler(async function (req, res) {
    const pet = await getPetById(req.params.id);
    if (!pet) {
        return res.status(404).json({ error: 'Pet not found' });
    }

    res.json(withProxyPhotoUrls(req, pet));
}));

router.put('/:id', requireAuth, requireRole('shelter_admin'), asyncHandler(async function (req, res) {
    const shelter = await getShelterByUserId(req.userId);
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

    if (fields.status === 'adopted' || fields.status === 'available') {
        const eventType = fields.status === 'adopted' ? 'adoption_event' : 'status_change';
        const title = fields.status === 'adopted'
            ? `${pet.name} has been adopted!`
            : `${pet.name} is available for adoption`;
        try {
            await createFeedEvent(eventType, {
                shelter_id: shelter.id,
                pet_id: pet.id,
                payload: { title, body: null, primaryPhotoUrl: null },
            });
        } catch (e) {
            console.error('Failed to create feed event for pet status change:', e);
        }
    }

    const refreshed = await getPetById(req.params.id);
    res.json(withProxyPhotoUrls(req, refreshed || updated));
}));

router.delete('/:id', requireAuth, requireRole('shelter_admin'), asyncHandler(async function (req, res) {
    const shelter = await getShelterByUserId(req.userId);
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
