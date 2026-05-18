import request from 'supertest';

const PNG_BUFFER = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
  'base64'
);

export function postPetWithPhotos(app, token, fields, photoCount = 3) {
  process.env.GCS_BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'test-pet-photos';

  let req = request(app)
    .post('/pets')
    .set('Authorization', 'Bearer ' + token);

  Object.entries(fields || {}).forEach(function ([key, value]) {
    if (value !== undefined && value !== null) {
      req = req.field(key, String(value));
    }
  });

  for (let index = 0; index < photoCount; index += 1) {
    req = req.attach('photos', PNG_BUFFER, {
      filename: `pet-photo-${index + 1}.png`,
      contentType: 'image/png',
    });
  }

  return req;
}
