import crypto from 'node:crypto';
import { Storage } from '@google-cloud/storage';

const storage = new Storage();

const DEFAULT_CAT_OBJECT = process.env.GCS_DEFAULT_CAT_OBJECT || 'placeholders/cat.png';
const DEFAULT_DOG_OBJECT = process.env.GCS_DEFAULT_DOG_OBJECT || 'placeholders/dog.png';
const DEFAULT_ANIMAL_OBJECT = process.env.GCS_DEFAULT_ANIMAL_OBJECT || 'placeholders/animal.png';

const MIME_EXTENSION = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp'
};

function getBucketName() {
    return process.env.GCS_BUCKET_NAME || null;
}

function buildGsUrl(bucketName, objectName) {
    return 'gs://' + bucketName + '/' + objectName;
}

function parseGsUrl(url) {
    if (!url || !url.startsWith('gs://')) {
        return null;
    }

    const withoutScheme = url.slice(5);
    const slashIndex = withoutScheme.indexOf('/');
    if (slashIndex === -1) {
        return null;
    }

    return {
        bucketName: withoutScheme.slice(0, slashIndex),
        objectName: withoutScheme.slice(slashIndex + 1)
    };
}

function isLegacyPlaceholderUrl(url) {
    if (!url) {
        return false;
    }

    return url.includes('placekitten.com') || url.includes('placedog.net') || url.includes('placehold.co');
}

function getDefaultObjectName(species) {
    if (species === 'Cat') {
        return DEFAULT_CAT_OBJECT || DEFAULT_ANIMAL_OBJECT || DEFAULT_DOG_OBJECT || null;
    }

    if (species === 'Dog') {
        return DEFAULT_DOG_OBJECT || DEFAULT_ANIMAL_OBJECT || DEFAULT_CAT_OBJECT || null;
    }

    return DEFAULT_ANIMAL_OBJECT || DEFAULT_DOG_OBJECT || DEFAULT_CAT_OBJECT || null;
}

export function getDefaultPetPhotoStorageUrl(species) {
    const bucketName = getBucketName();
    const objectName = getDefaultObjectName(species);

    if (!bucketName || !objectName) {
        return null;
    }

    return buildGsUrl(bucketName, objectName);
}

export function getEffectivePetPhotoStorageUrl(species, storedUrl) {
    if (storedUrl && !isLegacyPlaceholderUrl(storedUrl)) {
        return storedUrl;
    }

    return getDefaultPetPhotoStorageUrl(species) || storedUrl || null;
}

export async function uploadPetPhoto({ petId, shelterId, file }) {
    const bucketName = getBucketName();
    if (!bucketName) {
        throw new Error('GCS_BUCKET_NAME is not configured');
    }

    const extension = MIME_EXTENSION[file.mimetype];
    if (!extension) {
        throw new Error('Only JPG, PNG, and WEBP pet images are supported');
    }

    const objectName = 'pets/' + shelterId + '/' + petId + '/' + Date.now() + '-' + crypto.randomUUID() + '.' + extension;
    const gcsFile = storage.bucket(bucketName).file(objectName);

    await gcsFile.save(file.buffer, {
        resumable: false,
        metadata: {
            contentType: file.mimetype
        }
    });

    return buildGsUrl(bucketName, objectName);
}

export async function sendStoredPhoto(res, storedUrl) {
    if (!storedUrl) {
        res.status(404).json({ error: 'Photo not found' });
        return;
    }

    if (storedUrl.startsWith('http://') || storedUrl.startsWith('https://')) {
        res.redirect(storedUrl);
        return;
    }

    const parsed = parseGsUrl(storedUrl);
    if (!parsed) {
        res.status(404).json({ error: 'Photo not found' });
        return;
    }

    const file = storage.bucket(parsed.bucketName).file(parsed.objectName);
    const [exists] = await file.exists();
    if (!exists) {
        res.status(404).json({ error: 'Photo not found' });
        return;
    }

    const [metadata] = await file.getMetadata();
    if (metadata.contentType) {
        res.type(metadata.contentType);
    }

    await new Promise(function (resolve, reject) {
        const stream = file.createReadStream();
        stream.on('error', reject);
        stream.on('end', resolve);
        stream.pipe(res);
    });
}
