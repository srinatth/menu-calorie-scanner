import { Dish } from '@menu-scanner/shared';
import { apiClient } from './client';

export function getPopularDishes(): Promise<Dish[]> {
  return apiClient.get<Dish[]>('/popular-dishes');
}
