import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dish } from '@menu-scanner/shared';

const STORAGE_KEY = 'recent_searches_v1';
const MAX_ITEMS = 20;

export interface RecentSearchItem {
  query: string;
  dish: Dish | null;
  searchedAt: string;
}

export async function getRecentSearches(): Promise<RecentSearchItem[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as RecentSearchItem[];
  } catch {
    return [];
  }
}

export async function addRecentSearch(item: Omit<RecentSearchItem, 'searchedAt'>): Promise<RecentSearchItem[]> {
  const existing = await getRecentSearches();
  const dedupeKey = item.dish?.id ?? item.query.trim().toLowerCase();

  const withoutDuplicate = existing.filter((entry) => (entry.dish?.id ?? entry.query.trim().toLowerCase()) !== dedupeKey);

  const updated: RecentSearchItem[] = [{ ...item, searchedAt: new Date().toISOString() }, ...withoutDuplicate].slice(0, MAX_ITEMS);

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export async function clearRecentSearches(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
