import { Router } from 'express';
import { uploadHandler } from '../middleware/uploadHandler';
import { createMenuScan, getMenuScanJob, getMenuScanJobDishes } from '../controllers/menuScan.controller';

export const menuScanRoutes = Router();
menuScanRoutes.post('/menu-scans', uploadHandler.single('file'), createMenuScan);
menuScanRoutes.get('/menu-scans/:jobId', getMenuScanJob);
menuScanRoutes.get('/menu-scans/:jobId/dishes', getMenuScanJobDishes);
