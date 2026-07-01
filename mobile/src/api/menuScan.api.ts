import { CreateMenuScanJobResponse, MenuScanJob, MenuScanSourceType } from '@menu-scanner/shared';
import { apiClient } from './client';

export interface UploadMenuScanInput {
  sourceType: MenuScanSourceType;
  fileUri: string;
  fileName: string;
  mimeType: string;
}

export function uploadMenuScan(input: UploadMenuScanInput): Promise<CreateMenuScanJobResponse> {
  const form = new FormData();
  form.append('sourceType', input.sourceType);
  // React Native's FormData accepts { uri, name, type } file objects.
  form.append('file', { uri: input.fileUri, name: input.fileName, type: input.mimeType } as unknown as Blob);

  return apiClient.postForm<CreateMenuScanJobResponse>('/menu-scans', form);
}

export function getMenuScanJob(jobId: string): Promise<MenuScanJob> {
  return apiClient.get<MenuScanJob>(`/menu-scans/${encodeURIComponent(jobId)}`);
}
