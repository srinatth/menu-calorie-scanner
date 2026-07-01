import { RequestHandler } from 'express';
import { SearchResponse } from '@menu-scanner/shared';
import { searchDishes } from '../services/search.service';
import { ApiError } from '../middleware/errorHandler';

export const search: RequestHandler = async (req, res, next) => {
  try {
    const query = typeof req.query.q === 'string' ? req.query.q : '';
    if (!query.trim()) {
      throw new ApiError(400, 'missing_query', 'Query parameter "q" is required');
    }
    const limit = req.query.limit ? Number(req.query.limit) : 20;

    const results = await searchDishes(query, limit);
    const body: SearchResponse = { query, results };
    res.json(body);
  } catch (err) {
    next(err);
  }
};
