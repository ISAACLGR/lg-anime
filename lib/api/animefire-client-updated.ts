/**
 * AnimeFire API Client
 * Cliente TypeScript para integração com AnimeFire API
 * Baseado nos arquivos JavaScript existentes em lib/api/animeFire/
 */

export interface AnimeFireVideo {
  src: string;
  label: string;
  size?: string;
}

export interface AnimeFireEpisode {
  href: string;
  text: string;
}

export interface AnimeFireDetails {
  anime_slug: string;
  anime_title: string;
  anime_title1?: string;
  anime_image: string;
  anime_info: string;
  anime_synopsis: string;
  anime_score: string;
  anime_votes: string;
  youtube_trailer?: string;
  episodes: AnimeFireEpisode[];
}

export interface AnimeFireListItem {
  title: string;
  image: string;
  classification?: string;
  score?: string;
  link: string;
}

export interface AnimeFireResponse {
  success: boolean;
  url: string;
  results: AnimeFireListItem[];
  total: number;
  pagination?: {
    currentPage: number;
    totalPages: number;
  };
}

export interface VideoExtractionResult {
  success: boolean;
  episodeUrl: string;
  timestamp: string;
  method: string | null;
  videoUrl: string | null;
  iframeSrc: string | null;
  allQualities?: AnimeFireVideo[];
  metadata: Record<string, any>;
  errors?: string[];
}

export interface AnimeFireApiConfig {
  baseUrl?: string;
  apiKey?: string;
  timeout?: number;
}

class AnimeFireClient {
  private baseUrl: string;
  private apiKey: string;
  private timeout: number;

  constructor(config: AnimeFireApiConfig = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost:3003'; // ATUALIZADO: porta 3003
    this.apiKey = config.apiKey || 'anfire123';
    this.timeout = config.timeout || 10000;
  }

  /**
   * Buscar animes em lançamento
   */
  async getAiringAnimes(page: number = 1): Promise<AnimeFireResponse> {
    const url = page === 1 ? '/em-lancamento' : `/em-lancamento/${page}`;
    return this.makeRequest<AnimeFireResponse>(url);
  }

  /**
   * Buscar animes atualizados
   */
  async getUpdatedAnimes(page: number = 1): Promise<AnimeFireResponse> {
    const url = page === 1 ? '/animes-atualizados' : `/animes-atualizados/${page}`;
    return this.makeRequest<AnimeFireResponse>(url);
  }

  /**
   * Buscar top animes
   */
  async getTopAnimes(page: number = 1): Promise<AnimeFireResponse> {
    const url = page === 1 ? '/top-animes' : `/top-animes/${page}`;
    return this.makeRequest<AnimeFireResponse>(url);
  }

  /**
   * Buscar animes legendados
   */
  async getSubbedAnimes(page: number = 1): Promise<AnimeFireResponse> {
    const url = page === 1 ? '/lista-de-animes-legendados' : `/lista-de-animes-legendados/${page}`;
    return this.makeRequest<AnimeFireResponse>(url);
  }

  /**
   * Buscar animes dublados
   */
  async getDubbedAnimes(page: number = 1): Promise<AnimeFireResponse> {
    const url = page === 1 ? '/lista-de-animes-dublados' : `/lista-de-animes-dublados/${page}`;
    return this.makeRequest<AnimeFireResponse>(url);
  }

  /**
   * Pesquisar animes
   */
  async searchAnimes(query: string, page: number = 1): Promise<AnimeFireResponse> {
    const sanitizedQuery = query.toLowerCase().replace(/\s+/g, '-');
    const url = page === 1 ? `/pesquisar/${sanitizedQuery}` : `/pesquisar/${sanitizedQuery}/${page}`;
    return this.makeRequest<AnimeFireResponse>(url);
  }

  /**
   * Obter detalhes de um anime específico
   */
  async getAnimeDetails(animeSlug: string): Promise<AnimeFireDetails> {
    const animeUrl = `https://animefire.io/animes/${animeSlug}`;
    return this.makeApiRequest<AnimeFireDetails>('/api', { anime_link: animeUrl });
  }

  /**
   * Extrair URL de vídeo de um episódio
   */
  async extractVideoUrl(episodeUrl: string): Promise<VideoExtractionResult> {
    return this.makeRequest<VideoExtractionResult>('/extract-video', 'POST', { episodeUrl });
  }

  /**
   * Extrair URL de vídeo (método GET)
   */
  async extractVideoUrlGet(episodeUrl: string): Promise<VideoExtractionResult> {
    return this.makeRequest<VideoExtractionResult>(`/extract-video?url=${encodeURIComponent(episodeUrl)}`);
  }

  /**
   * Converter slug Jikan para slug AnimeFire
   */
  convertJikanToAnimeFireSlug(jikanSlug: string): string {
    // Regras de conversão baseadas em padrões observados
    return jikanSlug
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiais
      .replace(/\s+/g, '-') // Espaços para hífens
      .replace(/-+/g, '-') // Múltiplos hífens para um
      .replace(/^-|-$/g, ''); // Remover hífens do início/fim
  }

  /**
   * Construir URL do episódio
   */
  buildEpisodeUrl(animeSlug: string, episodeNumber: number): string {
    return `https://animefire.io/animes/${animeSlug}/episode-${episodeNumber}`;
  }

  /**
   * Fazer requisição genérica para endpoints públicos
   */
  private async makeRequest<T>(endpoint: string, method: 'GET' | 'POST' = 'GET', body?: any): Promise<T> {
    try {
      const config: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'AnimeFire-Client/1.0',
        },
        signal: AbortSignal.timeout(this.timeout),
      };

      if (body && method === 'POST') {
        config.body = JSON.stringify(body);
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, config);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`AnimeFire API Error (${endpoint}):`, error);
      throw error;
    }
  }

  /**
   * Fazer requisição para API com autenticação
   */
  private async makeApiRequest<T>(endpoint: string, params: Record<string, any>): Promise<T> {
    try {
      const url = new URL(`${this.baseUrl}${endpoint}`);
      
      // Adicionar API key
      url.searchParams.append('api_key', this.apiKey);
      
      // Adicionar outros parâmetros
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'AnimeFire-Client/1.0',
        },
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`AnimeFire API Error (${endpoint}):`, error);
      throw error;
    }
  }

  /**
   * Verificar se API está online
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.makeRequest('/filter-service/stats');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Limpar cache do serviço
   */
  async clearCache(): Promise<boolean> {
    try {
      await this.makeRequest('/filter-service/clear-cache', 'POST');
      return true;
    } catch {
      return false;
    }
  }
}

// Instância padrão do cliente com porta atualizada
export const animeFireClient = new AnimeFireClient({ baseUrl: 'http://localhost:3003' });

export default AnimeFireClient;
