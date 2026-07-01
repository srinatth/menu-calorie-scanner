import { CreateMenuScanJobResponse, QrMenuResolveRequest } from '@menu-scanner/shared';
import { apiClient } from './client';

export function resolveQrMenu(qrPayload: string): Promise<CreateMenuScanJobResponse> {
  const body: QrMenuResolveRequest = { qrPayload };
  return apiClient.post<CreateMenuScanJobResponse>('/qr-menu/resolve', body);
}
