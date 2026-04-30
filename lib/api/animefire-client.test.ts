/**
 * Testes para AnimeFire Client
 * 
 * Execute com: npx vitest run animefire-client.test.ts
 * Ou em modo watch: npx vitest animefire-client.test.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import AnimeFireClient from './animefire-client';

// Mock do fetch global
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('AnimeFireClient', () => {
  let client: AnimeFireClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new AnimeFireClient({
      baseUrl: 'http://localhost:3001',
      apiKey: 'test-key',
      timeout: 5000
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('deve usar valores padrão quando não fornecido config', () => {
      const defaultClient = new AnimeFireClient();
      expect(defaultClient['baseUrl']).toBe('http://localhost:3002');
      expect(defaultClient['apiKey']).toBe('anfire123');
      expect(defaultClient['timeout']).toBe(10000);
    });

    it('deve usar config personalizada quando fornecida', () => {
      const customClient = new AnimeFireClient({
        baseUrl: 'http://custom:8080',
        apiKey: 'custom-key',
        timeout: 15000
      });
      expect(customClient['baseUrl']).toBe('http://custom:8080');
      expect(customClient['apiKey']).toBe('custom-key');
      expect(customClient['timeout']).toBe(15000);
    });
  });

  describe('emLancamento', () => {
    it('deve buscar animes em lançamento (página 1)', async () => {
      const mockResponse = {
        success: true,
        results: [
          { title: 'Anime 1', image: 'url1', link: 'link1' },
          { title: 'Anime 2', image: 'url2', link: 'link2' }
        ],
        total: 2
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await client.emLancamento();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/em-lancamento',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'User-Agent': 'AnimeFire-Client/1.0'
          }),
          signal: expect.any(AbortSignal)
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('deve buscar animes em lançamento (página 2)', async () => {
      const mockResponse = { success: true, results: [], total: 0 };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await client.emLancamento(2);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/em-lancamento/2',
        expect.any(Object)
      );
    });

    it('deve lançar erro quando resposta não for ok', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      await expect(client.emLancamento()).rejects.toThrow('HTTP 500: Internal Server Error');
    });

    it('deve lançar erro quando houver falha de rede', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network Error'));

      await expect(client.emLancamento()).rejects.toThrow('Network Error');
    });
  });

  describe('animesAtualizados', () => {
    it('deve buscar animes atualizados', async () => {
      const mockResponse = { success: true, results: [], total: 0 };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await client.animesAtualizados(3);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/animes-atualizados/3',
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('topAnimes', () => {
    it('deve buscar top animes', async () => {
      const mockResponse = { success: true, results: [], total: 0 };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await client.topAnimes();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/top-animes',
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('listaDeAnimesLegendados', () => {
    it('deve buscar animes legendados', async () => {
      const mockResponse = { success: true, results: [], total: 0 };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await client.listaDeAnimesLegendados(5);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/lista-de-animes-legendados/5',
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('listaDeAnimesDublados', () => {
    it('deve buscar animes dublados', async () => {
      const mockResponse = { success: true, results: [], total: 0 };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await client.listaDeAnimesDublados();

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/lista-de-animes-dublados',
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('pesquisar', () => {
    it('deve pesquisar animes com query normalizada', async () => {
      const mockResponse = { success: true, results: [], total: 0 };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await client.pesquisar('One Piece', 2);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/pesquisar/one-piece/2',
        expect.any(Object)
      );
      expect(result).toEqual(mockResponse);
    });

    it('deve normalizar query com caracteres especiais', async () => {
      const mockResponse = { success: true, results: [], total: 0 };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      await client.pesquisar('Dragon Ball Super');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/pesquisar/dragon-ball-super',
        expect.any(Object)
      );
    });
  });

  describe('getAnimeDetails', () => {
    it('deve obter detalhes de anime com API key', async () => {
      const mockResponse = {
        anime_slug: 'test-anime',
        anime_title: 'Test Anime',
        anime_image: 'image.jpg',
        episodes: []
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await client.getAnimeDetails('test-anime');

      const expectedUrl = new URL('http://localhost:3001/api');
      expectedUrl.searchParams.append('api_key', 'test-key');
      expectedUrl.searchParams.append('anime_link', 'https://animefire.io/animes/test-anime');

      expect(mockFetch).toHaveBeenCalledWith(
        expectedUrl.toString(),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'User-Agent': 'AnimeFire-Client/1.0'
          })
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('extractVideoUrl', () => {
    it('deve extrair URL de vídeo via POST', async () => {
      const mockResponse = {
        success: true,
        videoUrl: 'https://video-url.mp4',
        method: 'api-direta'
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const episodeUrl = 'https://animefire.io/animes/test/episode-1';
      const result = await client.extractVideoUrl(episodeUrl);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/extract-video',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'User-Agent': 'AnimeFire-Client/1.0'
          }),
          body: JSON.stringify({ episodeUrl })
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('extractVideoUrlGet', () => {
    it('deve extrair URL de vídeo via GET', async () => {
      const mockResponse = {
        success: true,
        videoUrl: 'https://video-url.mp4',
        method: 'api-direta'
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const episodeUrl = 'https://animefire.io/animes/test/episode-1';
      const result = await client.extractVideoUrlGet(episodeUrl);

      expect(mockFetch).toHaveBeenCalledWith(
        `http://localhost:3001/extract-video?url=${encodeURIComponent(episodeUrl)}`,
        expect.objectContaining({
          method: 'GET'
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('convertJikanToAnimeFireSlug', () => {
    it('deve converter slug Jikan para AnimeFire', () => {
      const testCases = [
        { input: 'one-piece', expected: 'one-piece' },
        { input: 'One Piece', expected: 'one-piece' },
        { input: 'Dragon Ball Super', expected: 'dragon-ball-super' },
        { input: 'Attack on Titan!', expected: 'attack-on-titan' },
        { input: 'My Hero Academia', expected: 'my-hero-academia' },
        { input: 'Demon Slayer: Kimetsu no Yaiba', expected: 'demon-slayer-kimetsu-no-yaiba' },
        { input: '   spaced   out   ', expected: 'spaced-out' },
        { input: 'multiple---hyphens', expected: 'multiple-hyphens' },
        { input: '-start-and-end-', expected: 'start-and-end' }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(client.convertJikanToAnimeFireSlug(input)).toBe(expected);
      });
    });
  });

  describe('buildEpisodeUrl', () => {
    it('deve construir URL de episódio corretamente', () => {
      const testCases = [
        { slug: 'one-piece', episode: 1, expected: 'https://animefire.io/animes/one-piece/episode-1' },
        { slug: 'dragon-ball-super', episode: 100, expected: 'https://animefire.io/animes/dragon-ball-super/episode-100' }
      ];

      testCases.forEach(({ slug, episode, expected }) => {
        expect(client.buildEpisodeUrl(slug, episode)).toBe(expected);
      });
    });
  });

  describe('healthCheck', () => {
    it('deve retornar true quando API está online', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const result = await client.healthCheck();
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/filter-service/stats',
        expect.any(Object)
      );
    });

    it('deve retornar false quando API está offline', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await client.healthCheck();
      expect(result).toBe(false);
    });
  });

  describe('clearCache', () => {
    it('deve limpar cache com sucesso', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      const result = await client.clearCache();
      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/filter-service/clear-cache',
        expect.objectContaining({
          method: 'POST'
        })
      );
    });

    it('deve retornar false quando falhar ao limpar cache', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Failed to clear cache'));

      const result = await client.clearCache();
      expect(result).toBe(false);
    });
  });

  describe('Timeout', () => {
    it('deve respeitar timeout configurado', async () => {
      mockFetch.mockImplementationOnce(() => 
        new Promise((_, reject) => {
          setTimeout(() => reject(new DOMException('Timeout', 'AbortError')), 100);
        })
      );

      await expect(client.emLancamento()).rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('deve logar erros com informações do endpoint', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mockFetch.mockRejectedValueOnce(new Error('Test Error'));

      await expect(client.emLancamento()).rejects.toThrow('Test Error');
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'AnimeFire API Error (/em-lancamento):',
        expect.any(Error)
      );
      
      consoleSpy.mockRestore();
    });
  });
});

// Testes de integração (requer servidor rodando)
describe('AnimeFireClient Integration Tests', () => {
  let client: AnimeFireClient;

  beforeEach(() => {
    client = new AnimeFireClient({
      baseUrl: 'http://localhost:3001',
      timeout: 10000
    });
  });

  // Estes testes só rodam se o servidor estiver ativo
  it.skip('deve conectar ao servidor real', async () => {
    const isOnline = await client.healthCheck();
    expect(isOnline).toBe(true);
  });

  it.skip('deve buscar animes em lançamento do servidor real', async () => {
    const result = await client.emLancamento();
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('results');
    expect(Array.isArray(result.results)).toBe(true);
  });

  it.skip('deve pesquisar animes no servidor real', async () => {
    const result = await client.pesquisar('one-piece');
    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('results');
  });
});
