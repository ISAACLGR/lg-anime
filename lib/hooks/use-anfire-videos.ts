import { useCallback, useState } from "react";
import {
  extractEpisodeVideoLinks,
  convertJikanSlugToAnFireSlug,
  EpisodeVideo,
  VideoSource,
} from "@/lib/api/anfire-api-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface UseAnFireVideosState {
  videoUrl: string | null;
  videoSources: VideoSource[];
  loading: boolean;
  error: string | null;
  episodeNumber: number | null;
}

const VIDEO_CACHE_KEY = "anfire_video_cache";

/**
 * Hook para gerenciar extração de vídeos do AnFireAPI
 */
export function useAnFireVideos() {
  const [state, setState] = useState<UseAnFireVideosState>({
    videoUrl: null,
    videoSources: [],
    loading: false,
    error: null,
    episodeNumber: null,
  });

  /**
   * Buscar vídeo de um episódio específico
   */
  const fetchEpisodeVideo = useCallback(
    async (jikanSlug: string | number, episodeNumber: number) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        // Converter slug Jikan para slug AnimeFire
        const animeSlug =
          typeof jikanSlug === "number"
            ? convertJikanSlugToAnFireSlug(`anime-${jikanSlug}`)
            : convertJikanSlugToAnFireSlug(jikanSlug as string);

        // Verificar cache primeiro
        const cached = await getCachedVideo(animeSlug, episodeNumber);
        if (cached) {
          setState((prev) => ({
            ...prev,
            videoUrl: cached.sources[0]?.url || null,
            videoSources: cached.sources,
            episodeNumber,
            loading: false,
          }));
          return cached;
        }

        // Buscar vídeo do AnFireAPI
        const video = await extractEpisodeVideoLinks(animeSlug, episodeNumber);

        if (video && video.sources.length > 0) {
          // Cachear resultado
          await cacheVideo(animeSlug, video);

          setState((prev) => ({
            ...prev,
            videoUrl: video.sources[0].url,
            videoSources: video.sources,
            episodeNumber,
            loading: false,
          }));

          return video;
        } else {
          throw new Error("Nenhuma fonte de vídeo encontrada para este episódio");
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Erro ao buscar vídeo";
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          loading: false,
        }));
        throw error;
      }
    },
    []
  );

  /**
   * Selecionar uma fonte de vídeo específica
   */
  const selectVideoSource = useCallback((source: VideoSource) => {
    setState((prev) => ({
      ...prev,
      videoUrl: source.url,
    }));
  }, []);

  /**
   * Limpar cache de vídeos
   */
  const clearVideoCache = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(VIDEO_CACHE_KEY);
      setState((prev) => ({
        ...prev,
        videoUrl: null,
        videoSources: [],
        error: null,
      }));
    } catch (error) {
      console.error("Error clearing video cache:", error);
    }
  }, []);

  /**
   * Resetar estado
   */
  const resetState = useCallback(() => {
    setState({
      videoUrl: null,
      videoSources: [],
      loading: false,
      error: null,
      episodeNumber: null,
    });
  }, []);

  return {
    ...state,
    fetchEpisodeVideo,
    selectVideoSource,
    clearVideoCache,
    resetState,
  };
}

/**
 * Obter vídeo do cache
 */
async function getCachedVideo(
  animeSlug: string,
  episodeNumber: number
): Promise<EpisodeVideo | null> {
  try {
    const cached = await AsyncStorage.getItem(VIDEO_CACHE_KEY);
    if (!cached) return null;

    const cacheData = JSON.parse(cached);
    const key = `${animeSlug}_${episodeNumber}`;

    return cacheData[key] || null;
  } catch (error) {
    console.error("Error reading video cache:", error);
    return null;
  }
}

/**
 * Cachear vídeo
 */
async function cacheVideo(animeSlug: string, video: EpisodeVideo): Promise<void> {
  try {
    const cached = await AsyncStorage.getItem(VIDEO_CACHE_KEY);
    let cacheData = cached ? JSON.parse(cached) : {};

    const key = `${animeSlug}_${video.episode}`;
    cacheData[key] = video;

    // Manter apenas os últimos 50 vídeos em cache
    const keys = Object.keys(cacheData);
    if (keys.length > 50) {
      const keysToDelete = keys.slice(0, keys.length - 50);
      keysToDelete.forEach((k) => delete cacheData[k]);
    }

    await AsyncStorage.setItem(VIDEO_CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.error("Error caching video:", error);
  }
}
