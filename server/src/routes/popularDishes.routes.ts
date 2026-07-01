import { Router } from 'express';
import { listPopularDishes } from '../controllers/popularDishes.controller';

export const popularDishesRoutes = Router();
popularDishesRoutes.get('/popular-dishes', listPopularDishes);
