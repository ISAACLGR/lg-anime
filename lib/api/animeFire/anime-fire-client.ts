import axios from 'axios';

// Detectar se está rodando no servidor (backend) ou no cliente (browser/app)
const isServer = typeof window === 'undefined';
const API_BASE_URL = isServer ? 'http://localhost:3000' : (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000');

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

class AnimeFireClient {
  private async fetchFromServer(endpoint: string, page?: number): Promise<AnimeFireResponse> {
    try {
      const url = page 
        ? `${API_BASE_URL}/api/animefire/${endpoint}?page=${page}`
        : `${API_BASE_URL}/api/animefire/${endpoint}`;
      
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error(`[AnimeFireClient] Error fetching ${endpoint}:`, error);
      return {
        success: false,
        url: '',
        results: [],
        total: 0,
        pagination: { currentPage: 1, totalPages: 1 }
      };
    }
  }

  async emLancamento(page: number = 1): Promise<AnimeFireResponse> {
    return await this.fetchFromServer('em-lancamento', page);
  }

  async animesAtualizados(page: number = 1): Promise<AnimeFireResponse> {
    return await this.fetchFromServer('animes-atualizados', page);
  }

  async topAnimes(page: number = 1): Promise<AnimeFireResponse> {
    return await this.fetchFromServer('top-animes', page);
  }

  async listaDeAnimesLegendados(page: number = 1): Promise<AnimeFireResponse> {
    return await this.fetchFromServer('lista-de-animes-legendados', page);
  }

  async listaDeAnimesDublados(page: number = 1): Promise<AnimeFireResponse> {
    return await this.fetchFromServer('lista-de-animes-dublados', page);
  }

  async pesquisar(busca: string, page: number = 1): Promise<AnimeFireResponse> {
    try {
      const url = `${API_BASE_URL}/api/animefire/pesquisar?q=${encodeURIComponent(busca)}&page=${page}`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error(`[AnimeFireClient] Error fetching pesquisar:`, error);
      return {
        success: false,
        url: '',
        results: [],
        total: 0,
        pagination: { currentPage: 1, totalPages: 1 }
      };
    }
  }

  async getAnimeDetails(slug: string): Promise<any> {
    const animeLink = `https://animefire.io/animes/${slug}`;
    const url = `${API_BASE_URL}/api/animefire/getEpisodio?link=${encodeURIComponent(animeLink)}`;
    const response = await axios.get(url);
    return response.data;
  }
}

export const animeFireClient = new AnimeFireClient();
export default AnimeFireClient;
