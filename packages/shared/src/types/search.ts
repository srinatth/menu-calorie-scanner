import { Dish } from './dish';

export type SearchMatchType = 'exact_synonym' | 'fuzzy';

export interface SearchResult {
  dish: Dish;
  matchType: SearchMatchType;
  score: number;
}

export interface SearchResponse {
  query: string;
  results: SearchResult[];
}
