import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { StorageAdapter, StoredFileRef } from './storage.interface';

const UPLOADS_DIR = path.join(__dirname, '..', '..', '..', 'uploads');

export class LocalDiskStorageAdapter implements StorageAdapter {
  constructor() {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  async put(input: { buffer: Buffer; originalName: string; mimeType: string }): Promise<StoredFileRef> {
    const ext = path.extname(input.originalName) || '';
    const key = `${crypto.randomUUID()}${ext}`;
    fs.writeFileSync(path.join(UPLOADS_DIR, key), input.buffer);
    return { key, url: `/uploads/${key}` };
  }

  getPath(key: string): string {
    return path.join(UPLOADS_DIR, key);
  }
}
