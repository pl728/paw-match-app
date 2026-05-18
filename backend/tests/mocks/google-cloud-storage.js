import { Readable } from 'node:stream';

export class Storage {
  bucket() {
    return {
      file() {
        return {
          async save() {},
          async exists() {
            return [true];
          },
          async getMetadata() {
            return [{ contentType: 'image/png' }];
          },
          createReadStream() {
            return Readable.from(Buffer.from('pet-photo'));
          },
        };
      },
    };
  }
}
