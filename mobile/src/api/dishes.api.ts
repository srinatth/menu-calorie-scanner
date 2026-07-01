import { DishDetail } from '@menu-scanner/shared';
import { apiClient } from './client';

export function getDish(idOrSlug: string): Promise<DishDetail> {
  return apiClient.get<DishDetail>(`/dishes/${encodeURIComponent(idOrSlug)}`);
}
