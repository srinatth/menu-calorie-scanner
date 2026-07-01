import { RequestHandler } from 'express';
import { getDishByIdOrSlug } from '../services/dish.service';
import { ApiError } from '../middleware/errorHandler';

export const getDish: RequestHandler = async (req, res, next) => {
  try {
    const dish = await getDishByIdOrSlug(req.params.idOrSlug);
    if (!dish) {
      throw new ApiError(404, 'dish_not_found', 'No dish found for the given id/slug');
    }
    res.json(dish);
  } catch (err) {
    next(err);
  }
};

export const getDishAlternatives: RequestHandler = async (req, res, next) => {
  try {
    const dish = await getDishByIdOrSlug(req.params.idOrSlug);
    if (!dish) {
      throw new ApiError(404, 'dish_not_found', 'No dish found for the given id/slug');
    }
    res.json(dish.alternatives);
  } catch (err) {
    next(err);
  }
};
