import { useCallback, useEffect, useState } from "react";

import {
  clearFavorites,
  initializeSqlite,
  listFavorites,
  removeFavoriteBySlug,
  upsertFavorite,
} from "@/lib/sqlite-db";

export interface FavoriteAnime {
  slug: string;
  title: string;
  cover: string;
  rating: number;
  addedAt: number;
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteAnime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void initializeSqlite();
    void loadFavorites();
  }, []);

  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);
      const rows = listFavorites();
      setFavorites(rows);
      setError(null);
    } catch (err) {
      console.error("Error loading favorites:", err);
      setError("Erro ao carregar favoritos");
    } finally {
      setLoading(false);
    }
  }, []);

  const addFavorite = useCallback(
    async (anime: FavoriteAnime) => {
      try {
        const normalized = favorites.filter((fav) => fav.slug !== anime.slug);
        const updated = [anime, ...normalized].sort(
          (a, b) => (b.addedAt || 0) - (a.addedAt || 0),
        );

        upsertFavorite({ ...anime, addedAt: anime.addedAt || Date.now() });
        setFavorites(updated);
        return true;
      } catch (err) {
        console.error("Error adding favorite:", err);
        setError("Erro ao adicionar favorito");
        return false;
      }
    },
    [favorites],
  );

  const removeFavorite = useCallback(
    async (slug: string) => {
      try {
        removeFavoriteBySlug(slug);
        const updated = favorites.filter((fav) => fav.slug !== slug);
        setFavorites(updated);
        return true;
      } catch (err) {
        console.error("Error removing favorite:", err);
        setError("Erro ao remover favorito");
        return false;
      }
    },
    [favorites],
  );

  const isFavorite = useCallback(
    (slug: string) => favorites.some((fav) => fav.slug === slug),
    [favorites],
  );

  const clearFavoritesList = useCallback(async () => {
    try {
      clearFavorites();
      setFavorites([]);
      return true;
    } catch (err) {
      console.error("Error clearing favorites:", err);
      setError("Erro ao limpar favoritos");
      return false;
    }
  }, []);

  return {
    favorites,
    loading,
    error,
    addFavorite,
    removeFavorite,
    isFavorite,
    clearFavorites: clearFavoritesList,
    reload: loadFavorites,
  };
}
