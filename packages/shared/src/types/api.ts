export interface ApiErrorBody {
  error: {
    message: string;
    code: string;
  };
}

export interface CreateMenuScanJobResponse {
  jobId: string;
  status: 'pending';
}

export interface QrMenuResolveRequest {
  qrPayload: string;
}
