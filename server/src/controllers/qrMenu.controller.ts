import { RequestHandler } from 'express';
import { CreateMenuScanJobResponse } from '@menu-scanner/shared';
import { resolveQrMenu } from '../services/qrResolver.service';
import { ApiError } from '../middleware/errorHandler';

export const resolveQrMenuHandler: RequestHandler = async (req, res, next) => {
  try {
    const qrPayload = req.body?.qrPayload;
    if (!qrPayload || typeof qrPayload !== 'string') {
      throw new ApiError(400, 'missing_qr_payload', 'Body field "qrPayload" is required');
    }

    const jobId = await resolveQrMenu(qrPayload);
    const body: CreateMenuScanJobResponse = { jobId, status: 'pending' };
    res.status(201).json(body);
  } catch (err) {
    next(err);
  }
};
