import { useQuery } from '@tanstack/react-query';
import { searchDishes } from '../../api/search.api';

export function useSearchDishes(query: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: ['search', trimmed],
    queryFn: () => searchDishes(trimmed),
    enabled: trimmed.length > 0,
  });
}
