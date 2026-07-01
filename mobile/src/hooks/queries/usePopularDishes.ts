import { useQuery } from '@tanstack/react-query';
import { getPopularDishes } from '../../api/popularDishes.api';

export function usePopularDishes() {
  return useQuery({
    queryKey: ['popular-dishes'],
    queryFn: getPopularDishes,
    staleTime: 5 * 60 * 1000,
  });
}
