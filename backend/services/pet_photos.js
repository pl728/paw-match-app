import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { Storage } from "@google-cloud/storage";

const storage = new Storage();

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "pets");

const MIME_EXTENSION = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

function useLocalUploads() {
  return process.env.NODE_ENV !== "production" && !process.env.GCS_BUCKET_NAME;
}

function getBucketName() {
  return process.env.GCS_BUCKET_NAME || null;
}

function buildGsUrl(bucketName, objectName) {
  return "gs://" + bucketName + "/" + objectName;
}

function parseGsUrl(url) {
  if (!url || !url.startsWith("gs://")) return null;

  const withoutScheme = url.slice(5);
  const slashIndex = withoutScheme.indexOf("/");

  if (slashIndex === -1) return null;

  return {
    bucketName: withoutScheme.slice(0, slashIndex),
    objectName: withoutScheme.slice(slashIndex + 1),
  };
}

function getDefaultPetPhotoUrl(species) {
  if (species === "Cat") return "/cat.png";
  if (species === "Dog") return "/dog.png";
  return "/animal.png";
}

export function getDefaultPetPhotoStorageUrl(species) {
  const bucketName = getBucketName();

  if (useLocalUploads()) {
    return getDefaultPetPhotoUrl(species);
  }

  if (!bucketName) return null;

  if (species === "Cat") return buildGsUrl(bucketName, "placeholders/cat.png");
  if (species === "Dog") return buildGsUrl(bucketName, "placeholders/dog.png");

  return buildGsUrl(bucketName, "placeholders/animal.png");
}

export function getEffectivePetPhotoStorageUrl(species, storedUrl) {
  return storedUrl || getDefaultPetPhotoStorageUrl(species);
}

export async function uploadPetPhoto({ petId, shelterId, file }) {
  const extension = MIME_EXTENSION[file.mimetype];

  if (!extension) {
    throw new Error("Only JPG, PNG, and WEBP pet images are supported");
  }

  if (useLocalUploads()) {
    const petUploadDir = path.join(UPLOAD_DIR, shelterId, petId);
    fs.mkdirSync(petUploadDir, { recursive: true });

    const filename = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const filePath = path.join(petUploadDir, filename);

    fs.writeFileSync(filePath, file.buffer);

    return `/uploads/pets/${shelterId}/${petId}/${filename}`;
  }

  const bucketName = getBucketName();

  if (!bucketName) {
    throw new Error("GCS_BUCKET_NAME is not configured");
  }

  const objectName =
    "pets/" +
    shelterId +
    "/" +
    petId +
    "/" +
    Date.now() +
    "-" +
    crypto.randomUUID() +
    "." +
    extension;

  const gcsFile = storage.bucket(bucketName).file(objectName);

  await gcsFile.save(file.buffer, {
    resumable: false,
    metadata: {
      contentType: file.mimetype,
    },
  });

  return buildGsUrl(bucketName, objectName);
}

export async function sendStoredPhoto(res, storedUrl) {
  if (!storedUrl) {
    res.status(404).json({ error: "Photo not found" });
    return;
  }

  if (storedUrl.startsWith("/uploads/")) {
    const filePath = path.join(process.cwd(), storedUrl);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: "Photo not found" });
      return;
    }

    res.sendFile(filePath);
    return;
  }

  if (storedUrl.startsWith("http://") || storedUrl.startsWith("https://")) {
    res.redirect(storedUrl);
    return;
  }

  const parsed = parseGsUrl(storedUrl);

  if (!parsed) {
    res.status(404).json({ error: "Photo not found" });
    return;
  }

  const file = storage.bucket(parsed.bucketName).file(parsed.objectName);
  const [exists] = await file.exists();

  if (!exists) {
    res.status(404).json({ error: "Photo not found" });
    return;
  }

  const [metadata] = await file.getMetadata();

  if (metadata.contentType) {
    res.type(metadata.contentType);
  }

  await new Promise((resolve, reject) => {
    const stream = file.createReadStream();
    stream.on("error", reject);
    stream.on("end", resolve);
    stream.pipe(res);
  });
}