import { Router } from 'express';
import { getDish, getDishAlternatives } from '../controllers/dishes.controller';

export const dishesRoutes = Router();
dishesRoutes.get('/dishes/:idOrSlug', getDish);
dishesRoutes.get('/dishes/:idOrSlug/alternatives', getDishAlternatives);
