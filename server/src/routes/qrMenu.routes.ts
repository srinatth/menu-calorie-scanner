import { Router } from 'express';
import { resolveQrMenuHandler } from '../controllers/qrMenu.controller';

export const qrMenuRoutes = Router();
qrMenuRoutes.post('/qr-menu/resolve', resolveQrMenuHandler);
