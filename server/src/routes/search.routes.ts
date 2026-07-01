import { Router } from 'express';
import { search } from '../controllers/search.controller';

export const searchRoutes = Router();
searchRoutes.get('/search', search);
