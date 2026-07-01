import { env } from '../../config/env';
import { StorageAdapter } from './storage.interface';
import { LocalDiskStorageAdapter } from './localDiskStorage.adapter';
import { S3StorageAdapter } from './s3Storage.adapter';

let instance: StorageAdapter | null = null;

export function getStorageAdapter(): StorageAdapter {
  if (!instance) {
    instance = env.STORAGE_PROVIDER === 's3' ? new S3StorageAdapter() : new LocalDiskStorageAdapter();
  }
  return instance;
}

export type { StorageAdapter, StoredFileRef } from './storage.interface';
