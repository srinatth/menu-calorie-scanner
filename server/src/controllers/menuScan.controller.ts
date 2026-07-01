import { RequestHandler } from 'express';
import { CreateMenuScanJobResponse, MenuScanSourceType } from '@menu-scanner/shared';
import { createJob, getJob } from '../services/job.service';
import { processMenuScanFile } from '../services/menuParsing.service';
import { getStorageAdapter } from '../adapters/storage';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

const VALID_SOURCE_TYPES: MenuScanSourceType[] = ['camera', 'gallery_image', 'pdf'];

export const createMenuScan: RequestHandler = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      throw new ApiError(400, 'missing_file', 'A multipart "file" field is required');
    }

    const sourceType = VALID_SOURCE_TYPES.includes(req.body.sourceType) ? req.body.sourceType : 'gallery_image';

    const storage = getStorageAdapter();
    const stored = await storage.put({ buffer: file.buffer, originalName: file.originalname, mimeType: file.mimetype });

    const jobId = await createJob(sourceType, stored.key);

    void processMenuScanFile(jobId, file.buffer, file.mimetype).catch((err) => {
      logger.error('Menu scan processing failed', { jobId, error: (err as Error).message });
    });

    const body: CreateMenuScanJobResponse = { jobId, status: 'pending' };
    res.status(201).json(body);
  } catch (err) {
    next(err);
  }
};

export const getMenuScanJob: RequestHandler = async (req, res, next) => {
  try {
    const job = await getJob(req.params.jobId);
    if (!job) {
      throw new ApiError(404, 'job_not_found', 'No menu scan job found for the given id');
    }
    res.json(job);
  } catch (err) {
    next(err);
  }
};

export const getMenuScanJobDishes: RequestHandler = async (req, res, next) => {
  try {
    const job = await getJob(req.params.jobId);
    if (!job) {
      throw new ApiError(404, 'job_not_found', 'No menu scan job found for the given id');
    }
    res.json(job.detectedDishes);
  } catch (err) {
    next(err);
  }
};
