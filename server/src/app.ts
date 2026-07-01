import express from 'express';
import cors from 'cors';
import { requestLogger } from './middleware/requestLogger';
import { errorHandler } from './middleware/errorHandler';
import { searchRoutes } from './routes/search.routes';
import { dishesRoutes } from './routes/dishes.routes';
import { popularDishesRoutes } from './routes/popularDishes.routes';
import { menuScanRoutes } from './routes/menuScan.routes';
import { qrMenuRoutes } from './routes/qrMenu.routes';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(requestLogger);

  app.get('/api/v1/health', (_req, res) => res.json({ status: 'ok' }));

  app.use('/api/v1', searchRoutes);
  app.use('/api/v1', dishesRoutes);
  app.use('/api/v1', popularDishesRoutes);
  app.use('/api/v1', menuScanRoutes);
  app.use('/api/v1', qrMenuRoutes);

  app.use(errorHandler);

  return app;
}
