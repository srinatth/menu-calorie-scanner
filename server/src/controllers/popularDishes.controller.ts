import { RequestHandler } from 'express';
import { getPopularDishes } from '../services/popularDishes.service';

export const listPopularDishes: RequestHandler = async (_req, res, next) => {
  try {
    const dishes = await getPopularDishes();
    res.json(dishes);
  } catch (err) {
    next(err);
  }
};
