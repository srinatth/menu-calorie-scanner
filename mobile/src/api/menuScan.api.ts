import { File, UploadType } from 'expo-file-system';
import { ApiErrorBody, CreateMenuScanJobResponse, MenuScanJob, MenuScanSourceType } from '@menu-scanner/shared';
import { apiClient, ApiError, BASE_URL } from './client';

export interface UploadMenuScanInput {
  sourceType: MenuScanSourceType;
  fileUri: string;
  fileName: string;
  mimeType: string;
}

export async function uploadMenuScan(input: UploadMenuScanInput): Promise<CreateMenuScanJobResponse> {
  // Uploads via expo-file-system's native multipart task rather than fetch+FormData:
  // RN's New Architecture networking layer rejects a plain { uri, name, type } object
  // standing in for a Blob ("Unsupported FormDataPart implementation").
  const file = new File(input.fileUri);
  const result = await file.upload(`${BASE_URL}/api/v1/menu-scans`, {
    uploadType: UploadType.MULTIPART,
    fieldName: 'file',
    mimeType: input.mimeType,
    parameters: { sourceType: input.sourceType },
  });

  if (result.status < 200 || result.status >= 300) {
    let body: ApiErrorBody | null = null;
    try {
      body = JSON.parse(result.body);
    } catch {
      // response had no JSON body
    }
    throw new ApiError(
      result.status,
      body?.error.code ?? 'unknown_error',
      body?.error.message ?? `Upload failed with status ${result.status}`
    );
  }

  return JSON.parse(result.body) as CreateMenuScanJobResponse;
}

export function getMenuScanJob(jobId: string): Promise<MenuScanJob> {
  return apiClient.get<MenuScanJob>(`/menu-scans/${encodeURIComponent(jobId)}`);
}
