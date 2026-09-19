export interface JikanStudio {
  name: string;
}

export interface AnimeData {
  mal_id: number;
  title: string;
  title_english?: string;
  title_japanese?: string;
  synopsis?: string;
  score?: number | null;
  year?: number | null;
  episodes?: number | null;
  genres: { name: string }[];
  type?: string;
  status?: string;
  rating?: string;
  studios: JikanStudio[];
  images?: {
    jpg?: {
      image_url?: string;
    };
  };
}

export interface JikanPagination {
  has_next_page?: boolean;
  current_page?: number;
  last_visible_page?: number;
}

export interface JikanResponse<T> {
  data: T[];
  pagination: JikanPagination;
}

export async function getAiringAnimes(page = 1): Promise<JikanResponse<AnimeData>> {
  return {
    data: [],
    pagination: { has_next_page: false, current_page: page },
  };
}

export async function getPopularAnimes(page = 1): Promise<JikanResponse<AnimeData>> {
  return {
    data: [],
    pagination: { has_next_page: false, current_page: page },
  };
}

export async function searchAnimes(query: string, page = 1): Promise<JikanResponse<AnimeData>> {
  void query;
  return {
    data: [],
    pagination: { has_next_page: false, current_page: page },
  };
}

export default {
  getAiringAnimes,
  getPopularAnimes,
  searchAnimes,
};

