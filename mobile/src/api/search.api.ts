import { SearchResponse } from '@menu-scanner/shared';
import { apiClient } from './client';

export function searchDishes(query: string): Promise<SearchResponse> {
  return apiClient.get<SearchResponse>(`/search?q=${encodeURIComponent(query)}`);
}
