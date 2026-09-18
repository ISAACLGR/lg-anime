import { useCallback, useEffect, useState } from "react";

import {
  clearWatchHistory,
  initializeSqlite,
  listWatchHistory,
  removeWatchHistoryItem,
  upsertWatchHistory,
} from "@/lib/sqlite-db";

export interface WatchHistoryItem {
  animeSlug: string;
  animeTitle: string;
  cover?: string;
  episode: number;
  season: number;
  progress: number;
  lastWatchedAt: number;
  totalDuration: number;
}

export function useWatchHistory() {
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void initializeSqlite();
    void loadHistory();
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      setHistory(listWatchHistory());
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
            h.episode === item.episode,
        );

        let updated: WatchHistoryItem[];
        if (existingIndex >= 0) {
          updated = [...history];
          updated[existingIndex] = item;
        } else {
          updated = [item, ...history];
        }

        if (updated.length > 100) {
          updated = updated.slice(0, 100);
        }

        upsertWatchHistory({
          animeSlug: item.animeSlug,
          animeTitle: item.animeTitle,
          cover: item.cover || "",
          episode: item.episode,
          season: item.season,
          progress: item.progress,
          lastWatchedAt: item.lastWatchedAt || Date.now(),
          totalDuration: item.totalDuration,
        });

        setHistory(updated);
        return true;
      } catch (err) {
        console.error("Error updating watch history:", err);
        setError("Erro ao atualizar histórico");
        return false;
      }
    },
    [history],
  );

  const removeHistoryItem = useCallback(
    async (animeSlug: string, season: number, episode: number) => {
      try {
        removeWatchHistoryItem(animeSlug, season, episode);
        const updated = history.filter(
          (h) =>
            !(h.animeSlug === animeSlug && h.season === season && h.episode === episode),
        );

        setHistory(updated);
        return true;
      } catch (err) {
        console.error("Error removing history item:", err);
        setError("Erro ao remover do histórico");
        return false;
      }
    },
    [history],
  );

  const getAnimeHistory = useCallback(
    (animeSlug: string) => history.filter((h) => h.animeSlug === animeSlug),
    [history],
  );

  const clearHistory = useCallback(async () => {
    try {
      clearWatchHistory();
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
