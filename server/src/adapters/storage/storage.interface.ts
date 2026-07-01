export interface StoredFileRef {
  key: string;
  url: string;
}

export interface StorageAdapter {
  put(input: { buffer: Buffer; originalName: string; mimeType: string }): Promise<StoredFileRef>;
  getPath(key: string): string;
}
