/**
 * Hook Integrado Jikan + AnimeFire
 * Combina metadados da Jikan API com v�deos da AnimeFire API
 */

import { useCallback, useState } from 'react';
import { AnimeData, getAiringAnimes, getPopularAnimes, searchAnimes as jikanSearch } from '@/lib/api/jikan-client';
import { animeFireClient, VideoExtractionResult } from '@/lib/api/animefire-client';

export interface IntegratedAnime {
  // Dados da Jikan
  jikanData: AnimeData;
  malId: number;
  title: string;
  titleEnglish?: string;
  titleJapanese?: string;
  synopsis: string;
  score: number | null;
  year: number | null;
  episodes: number | null;
  genres: Array<{ name: string }>;
  type: string;
  status: string;
  rating: string;
  studios: Array<{ name: string }>;
  
  // Dados da AnimeFire
  animeFireSlug: string;
  animeFireUrl?: string;
  hasVideo: boolean;
  videoSources?: VideoExtractionResult;
}

export interface IntegratedAnimeList {
  animes: IntegratedAnime[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  currentPage: number;
}

export interface UseIntegratedAnimesOptions {
  enableVideoCheck?: boolean;
  videoCheckDelay?: number;
}

/**
 * Hook principal para gerenciar animes integrados
 */
export function useIntegratedAnimes(options: UseIntegratedAnimesOptions = {}) {
  const { enableVideoCheck = false, videoCheckDelay = 500 } = options;
  
  const [state, setState] = useState<IntegratedAnimeList>({
    animes: [],
    loading: false,
    error: null,
    hasMore: true,
    currentPage: 1,
  });

  /**
   * Converter dados Jikan para formato integrado
   */
  const convertToIntegrated = useCallback(async (jikanAnime: AnimeData): Promise<IntegratedAnime> => {
    const animeFireSlug = animeFireClient.convertJikanToAnimeFireSlug(jikanAnime.title);

    let videoSources: VideoExtractionResult | undefined;
    let hasVideo = false;

    if (enableVideoCheck) {
      try {
        const details = await animeFireClient.getAnimeDetails(animeFireSlug);
        hasVideo = details.episodes.length > 0;

        if (hasVideo && details.episodes.length > 0) {
          const firstEpisodeUrl = details.episodes[0].href;
          const extraction = await animeFireClient.extractVideoUrl(firstEpisodeUrl);
          videoSources = extraction.success ? extraction : undefined;
        }
      } catch (error) {
        console.warn(`Anime no encontrado na AnimeFire: ${animeFireSlug}`, error);
      }
    }

    return {
      jikanData: jikanAnime,
      malId: jikanAnime.mal_id,
      title: jikanAnime.title,
      titleEnglish: jikanAnime.title_english,
      titleJapanese: jikanAnime.title_japanese,
      synopsis: jikanAnime.synopsis || '',
      score: jikanAnime.score ?? null,
      year: jikanAnime.year ?? null,
      episodes: jikanAnime.episodes ?? null,
      genres: jikanAnime.genres ?? [],
      type: jikanAnime.type ?? '',
      status: jikanAnime.status ?? '',
      rating: jikanAnime.rating ?? '',
      studios: jikanAnime.studios ?? [],
      animeFireSlug,
      animeFireUrl: `https://animefire.io/animes/${animeFireSlug}`,
      hasVideo,
      videoSources,
    };
  }, [enableVideoCheck]);

  /**
   * Buscar animes em exibi��o (integrado)
   */
  const fetchAiringAnimes = useCallback(async (page: number = 1) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const jikanResponse = await getAiringAnimes(page);
      const integratedAnimes = await Promise.all(
        jikanResponse.data.map((anime: AnimeData) => convertToIntegrated(anime))
      );
      
      setState(prev => ({
        ...prev,
        animes: page === 1 ? integratedAnimes : [...prev.animes, ...integratedAnimes],
        hasMore: jikanResponse.pagination.has_next_page ?? false,
        currentPage: page,
        loading: false,
        error: null,
      }));
      
      return integratedAnimes;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar animes em exibição';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      throw error;
    }
  }, [convertToIntegrated]);

  /**
   * Buscar animes populares (integrado)
   */
  const fetchPopularAnimes = useCallback(async (page: number = 1) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const jikanResponse = await getPopularAnimes(page);
      const integratedAnimes = await Promise.all(
        jikanResponse.data.map((anime: AnimeData) => convertToIntegrated(anime))
      );
      
      setState(prev => ({
        ...prev,
        animes: page === 1 ? integratedAnimes : [...prev.animes, ...integratedAnimes],
        hasMore: jikanResponse.pagination.has_next_page ?? false,
        currentPage: page,
        loading: false,
        error: null,
      }));
      
      return integratedAnimes;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar animes populares';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      throw error;
    }
  }, [convertToIntegrated]);

  /**
   * Buscar animes por termo (integrado)
   */
  const searchAnimes = useCallback(async (query: string, page: number = 1) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const jikanResponse = await jikanSearch(query, page);
      const integratedAnimes = await Promise.all(
        jikanResponse.data.map((anime: AnimeData) => convertToIntegrated(anime))
      );
      
      setState(prev => ({
        ...prev,
        animes: page === 1 ? integratedAnimes : [...prev.animes, ...integratedAnimes],
        hasMore: jikanResponse.pagination.has_next_page ?? false,
        currentPage: page,
        loading: false,
        error: null,
      }));
      
      return integratedAnimes;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar animes';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      throw error;
    }
  }, [convertToIntegrated]);

  /**
   * Buscar v�deo de um epis�dio espec�fico
   */
  const fetchEpisodeVideo = useCallback(async (animeSlug: string, episodeNumber: number): Promise<VideoExtractionResult | null> => {
    try {
      const episodeUrl = animeFireClient.buildEpisodeUrl(animeSlug, episodeNumber);
      const videoResult = await animeFireClient.extractVideoUrl(episodeUrl);
      
      if (videoResult.success) {
        return videoResult;
      } else {
        throw new Error(videoResult.errors?.join(', ') || 'Falha na extra��o de v�deo');
      }
    } catch (error) {
      console.error(`Erro ao buscar v�deo ${animeSlug} epis�dio ${episodeNumber}:`, error);
      return null;
    }
  }, []);

  /**
   * Verificar se anime est� dispon�vel na AnimeFire
   */
  const checkAnimeAvailability = useCallback(async (animeSlug: string): Promise<boolean> => {
    try {
      const details = await animeFireClient.getAnimeDetails(animeSlug);
      return details.episodes.length > 0;
    } catch {
      return false;
    }
  }, []);

  /**
   * Resetar estado
   */
  const resetState = useCallback(() => {
    setState({
      animes: [],
      loading: false,
      error: null,
      hasMore: true,
      currentPage: 1,
    });
  }, []);

  /**
   * Atualizar informa��es de v�deo de um anime espec�fico
   */
  const updateAnimeVideoInfo = useCallback(async (malId: number, animeSlug: string) => {
    setState(prev => ({
      ...prev,
      animes: prev.animes.map((anime) => {
        if (anime.malId === malId) {
          fetchEpisodeVideo(animeSlug, 1).then((videoSources) => {
            setState(prevState => ({
              ...prevState,
              animes: prevState.animes.map((a) =>
                a.malId === malId
                  ? { ...a, hasVideo: !!videoSources, videoSources: videoSources ?? undefined }
                  : a
              )
            }));
          });
          
          return { ...anime, animeFireSlug: animeSlug };
        }
        return anime;
      })
    }));
  }, [fetchEpisodeVideo]);

  return {
    // Estado
    ...state,
    
    // M�todos
    fetchAiringAnimes,
    fetchPopularAnimes,
    searchAnimes,
    fetchEpisodeVideo,
    checkAnimeAvailability,
    updateAnimeVideoInfo,
    resetState,
    
    // Utilit�rios
    convertToIntegrated,
  };
}

/**
 * Hook simplificado para buscar v�deo de epis�dio
 */
export function useEpisodeVideo() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [videoResult, setVideoResult] = useState<VideoExtractionResult | null>(null);

  const fetchVideo = useCallback(async (animeSlug: string, episodeNumber: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await animeFireClient.extractVideoUrl(
        animeFireClient.buildEpisodeUrl(animeSlug, episodeNumber)
      );
      
      if (result.success) {
        setVideoResult(result);
      } else {
        setError(result.errors?.join(', ') || 'V�deo n�o encontrado');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar v�deo');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearVideo = useCallback(() => {
    setVideoResult(null);
    setError(null);
  }, []);

  return {
    loading,
    error,
    videoResult,
    fetchVideo,
    clearVideo,
  };
}

export default useIntegratedAnimes;
