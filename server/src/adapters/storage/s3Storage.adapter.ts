import { StorageAdapter, StoredFileRef } from './storage.interface';

/**
 * Scaffolded for later use — not wired to real AWS S3 calls yet.
 * Fill in with @aws-sdk/client-s3 PutObjectCommand when STORAGE_PROVIDER=s3 is selected.
 */
export class S3StorageAdapter implements StorageAdapter {
  async put(): Promise<StoredFileRef> {
    throw new Error('S3StorageAdapter is not configured. Set AWS_* env vars and implement put().');
  }

  getPath(): string {
    throw new Error('S3StorageAdapter is not configured.');
  }
}
