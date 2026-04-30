import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState, useCallback } from "react";

const HISTORY_KEY = "@animfire:watch_history";

export interface WatchHistoryItem {
  animeSlug: string;
  animeTitle: string;
  episode: number;
  season: number;
  progress: number; // 0-1 (percentage)
  lastWatchedAt: number;
  totalDuration: number;
}

/**
 * Hook para gerenciar histórico de assistência
 * Persiste os dados em AsyncStorage
 */
export function useWatchHistory() {
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load history from AsyncStorage on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      const data = await AsyncStorage.getItem(HISTORY_KEY);
      if (data) {
        setHistory(JSON.parse(data));
      }
      setError(null);
    } catch (err) {
      console.error("Error loading watch history:", err);
      setError("Erro ao carregar histórico");
    } finally {
      setLoading(false);
    }
  }, []);

  const addOrUpdateHistoryItem = useCallback(
    async (item: WatchHistoryItem) => {
      try {
        const existingIndex = history.findIndex(
          (h) =>
            h.animeSlug === item.animeSlug &&
            h.season === item.season &&
            h.episode === item.episode
        );

        let updated: WatchHistoryItem[];
        if (existingIndex >= 0) {
          // Update existing
          updated = [...history];
          updated[existingIndex] = item;
        } else {
          // Add new
          updated = [item, ...history];
        }

        // Keep only last 100 items
        if (updated.length > 100) {
          updated = updated.slice(0, 100);
        }

        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
        setHistory(updated);
        return true;
      } catch (err) {
        console.error("Error updating watch history:", err);
        setError("Erro ao atualizar histórico");
        return false;
      }
    },
    [history]
  );

  const removeHistoryItem = useCallback(
    async (animeSlug: string, season: number, episode: number) => {
      try {
        const updated = history.filter(
          (h) =>
            !(h.animeSlug === animeSlug && h.season === season && h.episode === episode)
        );
        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
        setHistory(updated);
        return true;
      } catch (err) {
        console.error("Error removing history item:", err);
        setError("Erro ao remover do histórico");
        return false;
      }
    },
    [history]
  );

  const getAnimeHistory = useCallback(
    (animeSlug: string) => {
      return history.filter((h) => h.animeSlug === animeSlug);
    },
    [history]
  );

  const clearHistory = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(HISTORY_KEY);
      setHistory([]);
      return true;
    } catch (err) {
      console.error("Error clearing history:", err);
      setError("Erro ao limpar histórico");
      return false;
    }
  }, []);

  return {
    history,
    loading,
    error,
    addOrUpdateHistoryItem,
    removeHistoryItem,
    getAnimeHistory,
    clearHistory,
    reload: loadHistory,
  };
}
