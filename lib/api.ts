import { SearchResponse } from './types';

const API_BASE_URL = 'https://saavn-api.nandanvarma.com/api';

export async function searchMusic(query: string): Promise<SearchResponse> {
  const response = await fetch(
    `${API_BASE_URL}/search?query=${encodeURIComponent(query)}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch search results');
  }

  return response.json();
}
