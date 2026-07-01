import { useQuery } from '@tanstack/react-query';
import { getDish } from '../../api/dishes.api';

export function useDishDetail(idOrSlug: string) {
  return useQuery({
    queryKey: ['dish', idOrSlug],
    queryFn: () => getDish(idOrSlug),
    enabled: idOrSlug.length > 0,
  });
}
