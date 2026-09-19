import axios from 'axios';

import { getStoredApiBaseUrl } from '@/lib/runtime-settings';

// Detectar se está rodando no servidor (backend) ou no cliente (browser/app)
const isServer = typeof window === 'undefined';
const DEFAULT_API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const DEFAULT_API_BASE_URLS = ['http://localhost:3000', 'http://127.0.0.1:3000'];

const getApiCandidates = async () => {
  const storedUrl = await getStoredApiBaseUrl().catch(() => '');
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  const candidates = [storedUrl, envUrl, DEFAULT_API_BASE_URL, ...DEFAULT_API_BASE_URLS];

  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    candidates.unshift(
      `${protocol}//${hostname}:3000`,
      `${protocol}//127.0.0.1:3000`
    );
  }

  return Array.from(new Set(candidates.filter(Boolean) as string[]));
};

const resolveApiBaseUrl = async () => {
  const candidates = await getApiCandidates();

  for (const baseUrl of candidates) {
    try {
      const response = await axios.get(`${baseUrl}/api/health`, { timeout: 2000 });
      if (response.status >= 200 && response.status < 300) {
        return baseUrl;
      }
    } catch {
      // Tenta a próxima URL disponível.
    }
  }

  return (await getStoredApiBaseUrl().catch(() => '')) || candidates[0] || 'http://localhost:3000';
};

const API_BASE_URL = isServer ? DEFAULT_API_BASE_URL : (process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_BASE_URL);

interface AnimeDisplay {
  title: string;
  image: string;
  classification?: string;
  score?: string;
  link: string;
}

interface AnimeFireResponse {
  success: boolean;
  url: string;
  results: AnimeDisplay[];
  total: number;
  pagination: {
    currentPage: number;
    totalPages: number;
  };
}

interface FilterParams {
  letra?: string;
  ano?: string;
  score?: string;
  classificacao?: string;
}

class AnimeFireClient {
  private async fetchFromServer(endpoint: string, page?: number, filters?: FilterParams): Promise<AnimeFireResponse> {
    const params = new URLSearchParams();
    if (page) params.append('page', page.toString());
    if (filters?.letra) params.append('letra', filters.letra);
    if (filters?.ano) params.append('ano', filters.ano);
    if (filters?.score) params.append('score', filters.score);
    if (filters?.classificacao) params.append('classificacao', filters.classificacao);

    const queryString = params.toString();
    const candidates = await getApiCandidates();
    let lastError: unknown;

    for (const baseUrl of candidates) {
      try {
        const url = queryString
          ? `${baseUrl}/api/animefire/${endpoint}?${queryString}`
          : `${baseUrl}/api/animefire/${endpoint}`;

        const response = await axios.get(url, { timeout: 15000 });
        return response.data;
      } catch (error) {
        lastError = error;
      }
    }

    console.error(`[AnimeFireClient] Error fetching ${endpoint}:`, lastError);
    return {
      success: false,
      url: '',
      results: [],
      total: 0,
      pagination: { currentPage: 1, totalPages: 1 }
    };
  }

  async emLancamento(page: number = 1, filters?: FilterParams): Promise<AnimeFireResponse> {
    return await this.fetchFromServer('em-lancamento', page, filters);
  }

  async animesAtualizados(page: number = 1, filters?: FilterParams): Promise<AnimeFireResponse> {
    // A rota antiga /animes/atualizados não existe mais; usamos o endpoint
    // de lançamento como fallback para evitar quebra na listagem.
    return await this.fetchFromServer('em-lancamento', page, filters);
  }

  async topAnimes(page: number = 1, filters?: FilterParams): Promise<AnimeFireResponse> {
    return await this.fetchFromServer('top-animes', page, filters);
  }

  async listaDeAnimesLegendados(page: number = 1, filters?: FilterParams): Promise<AnimeFireResponse> {
    return await this.fetchFromServer('lista-de-animes-legendados', page, filters);
  }

  async listaDeAnimesDublados(page: number = 1, filters?: FilterParams): Promise<AnimeFireResponse> {
    return await this.fetchFromServer('lista-de-animes-dublados', page, filters);
  }

  async pesquisar(busca: string, page: number = 1): Promise<AnimeFireResponse> {
    const candidates = await getApiCandidates();
    let lastError: unknown;

    for (const baseUrl of candidates) {
      try {
        const url = `${baseUrl}/api/animefire/pesquisar?q=${encodeURIComponent(busca)}&page=${page}`;
        const response = await axios.get(url, { timeout: 15000 });
        return response.data;
      } catch (error) {
        lastError = error;
      }
    }

    console.error(`[AnimeFireClient] Error fetching pesquisar:`, lastError);
    return {
      success: false,
      url: '',
      results: [],
      total: 0,
      pagination: { currentPage: 1, totalPages: 1 }
    };
  }

  async getAnimeDetails(slug: string): Promise<any> {
    const animeLink = `https://animefire.io/animes/${slug}`;
    const candidates = await getApiCandidates();
    let lastError: unknown;

    for (const baseUrl of candidates) {
      try {
        const url = `${baseUrl}/api/animefire/getEpisodio?link=${encodeURIComponent(animeLink)}`;
        const response = await axios.get(url, { timeout: 15000 });
        return response.data;
      } catch (error) {
        lastError = error;
      }
    }

    console.error(`[AnimeFireClient] Error fetching getAnimeDetails:`, lastError);
    throw lastError instanceof Error ? lastError : new Error('Failed to fetch anime details');
  }
}

export const animeFireClient = new AnimeFireClient();
export default AnimeFireClient;
