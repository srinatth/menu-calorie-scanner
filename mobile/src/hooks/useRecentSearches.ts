import { useCallback, useEffect, useState } from 'react';
import { Dish } from '@menu-scanner/shared';
import { addRecentSearch, clearRecentSearches, getRecentSearches, RecentSearchItem } from '../storage/recentSearches';

export function useRecentSearches() {
  const [items, setItems] = useState<RecentSearchItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getRecentSearches().then((loadedItems) => {
      setItems(loadedItems);
      setLoaded(true);
    });
  }, []);

  const addSearch = useCallback(async (query: string, dish: Dish | null) => {
    const updated = await addRecentSearch({ query, dish });
    setItems(updated);
  }, []);

  const clear = useCallback(async () => {
    await clearRecentSearches();
    setItems([]);
  }, []);

  return { items, loaded, addSearch, clear };
}
