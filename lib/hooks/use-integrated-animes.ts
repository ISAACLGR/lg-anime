/**
 * Hook Integrado Jikan + AnimeFire
 * Combina metadados da Jikan API com vídeos da AnimeFire API
 */

import { useCallback, useEffect, useState } from 'react';
import { AnimeData } from '@/lib/api/jikan-client';
import { animeFireClient, AnimeFireListItem, VideoExtractionResult } from '@/lib/api/animefire-client';

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
    // Converter slug Jikan para AnimeFire
    const animeFireSlug = animeFireClient.convertJikanToAnimeFireSlug(jikan.title);
    
    let videoSources: VideoExtractionResult | undefined;
    let hasVideo = false;
    
    // Verificar disponibilidade de vídeo se habilitado
    if (enableVideoCheck) {
      try {
        // Tentar buscar detalhes do anime na AnimeFire
        const details = await animeFireClient.getAnimeDetails(animeFireSlug);
        hasVideo = details.episodes.length > 0;
        
        // Se tiver episódios, tentar extrair vídeo do primeiro
        if (hasVideo && details.episodes.length > 0) {
          const firstEpisodeUrl = details.episodes[0].href;
          videoSources = await animeFireClient.extractVideoUrl(firstEpisodeUrl);
        }
      } catch (error) {
        // Anime não encontrado na AnimeFire ou erro na extração
        console.warn(`Anime não encontrado na AnimeFire: ${animeFireSlug}`, error);
      }
    }
    
    return {
      jikanData: jikanAnime,
      malId: jikanAnime.mal_id,
      title: jikanAnime.title,
      titleEnglish: jikanAnime.title_english,
      titleJapanese: jikanAnime.title_japanese,
      synopsis: jikanAnime.synopsis || '',
      score: jikanAnime.score,
      year: jikanAnime.year,
      episodes: jikanAnime.episodes,
      genres: jikanAnime.genres,
      type: jikanAnime.type,
      status: jikanAnime.status,
      rating: jikanAnime.rating,
      studios: jikanAnime.studios,
      animeFireSlug,
      animeFireUrl: `https://animefire.io/animes/${animeFireSlug}`,
      hasVideo,
      videoSources,
    };
  }, [enableVideoCheck]);

  /**
   * Buscar animes em exibição (integrado)
   */
  const fetchAiringAnimes = useCallback(async (page: number = 1) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      // Import dinâmico para evitar circular dependency
      const jikanResponse = await getAiringAnimes(page);
      
      // Converter cada anime para formato integrado
      const integratedAnimes = await Promise.all(
        jikanResponse.data.map(anime => convertToIntegrated(anime))
      );
      
      setState(prev => ({
        ...prev,
        animes: page === 1 ? integratedAnimes : [...prev.animes, ...integratedAnimes],
        hasMore: jikanResponse.pagination.has_next_page,
        currentPage: page,
        loading: false,
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
      const { getPopularAnimes } = await import('@/lib/api/jikan-client');
      const jikanResponse = await getPopularAnimes(page);
      
      const integratedAnimes = await Promise.all(
        jikanResponse.data.map(anime => convertToIntegrated(anime))
      );
      
      setState(prev => ({
        ...prev,
        animes: page === 1 ? integratedAnimes : [...prev.animes, ...integratedAnimes],
        hasMore: jikanResponse.pagination.has_next_page,
        currentPage: page,
        loading: false,
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
      const { searchAnimes: jikanSearch } = await import('@/lib/api/jikan-client');
      const jikanResponse = await jikanSearch(query, page);
      
      const integratedAnimes = await Promise.all(
        jikanResponse.data.map(anime => convertToIntegrated(anime))
      );
      
      setState(prev => ({
        ...prev,
        animes: page === 1 ? integratedAnimes : [...prev.animes, ...integratedAnimes],
        hasMore: jikanResponse.pagination.has_next_page,
        currentPage: page,
        loading: false,
      }));
      
      return integratedAnimes;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar animes';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
      throw error;
    }
  }, [convertToIntegrated]);

  /**
   * Buscar vídeo de um episódio específico
   */
  const fetchEpisodeVideo = useCallback(async (animeSlug: string, episodeNumber: number): Promise<VideoExtractionResult | null> => {
    try {
      const episodeUrl = animeFireClient.buildEpisodeUrl(animeSlug, episodeNumber);
      const videoResult = await animeFireClient.extractVideoUrl(episodeUrl);
      
      if (videoResult.success) {
        return videoResult;
      } else {
        throw new Error(videoResult.errors?.join(', ') || 'Falha na extração de vídeo');
      }
    } catch (error) {
      console.error(`Erro ao buscar vídeo ${animeSlug} episódio ${episodeNumber}:`, error);
      return null;
    }
  }, []);

  /**
   * Verificar se anime está disponível na AnimeFire
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
   * Atualizar informações de vídeo de um anime específico
   */
  const updateAnimeVideoInfo = useCallback(async (malId: number, animeSlug: string) => {
    setState(prev => ({
      ...prev,
      animes: prev.animes.map(anime => {
        if (anime.malId === malId) {
          // Buscar informações atualizadas de vídeo
          fetchEpisodeVideo(animeSlug, 1).then(videoSources => {
            setState(prevState => ({
              ...prevState,
              animes: prevState.animes.map(a => 
                a.malId === malId 
                  ? { ...a, hasVideo: !!videoSources, videoSources }
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
    
    // Métodos
    fetchAiringAnimes,
    fetchPopularAnimes,
    searchAnimes,
    fetchEpisodeVideo,
    checkAnimeAvailability,
    updateAnimeVideoInfo,
    resetState,
    
    // Utilitários
    convertToIntegrated,
  };
}

/**
 * Hook simplificado para buscar vídeo de episódio
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
        setError(result.errors?.join(', ') || 'Vídeo não encontrado');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar vídeo');
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
