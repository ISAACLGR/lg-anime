import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState, useCallback } from "react";

const FAVORITES_KEY = "@animfire:favorites";

export interface FavoriteAnime {
  slug: string;
  title: string;
  cover: string;
  rating: number;
  addedAt: number;
}

/**
 * Hook para gerenciar animes favoritos
 * Persiste os dados em AsyncStorage
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteAnime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load favorites from AsyncStorage on mount
  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = useCallback(async () => {
    try {
      setLoading(true);
      const data = await AsyncStorage.getItem(FAVORITES_KEY);
      if (data) {
        setFavorites(JSON.parse(data));
      }
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
        const updated = [...favorites, anime];
        await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
        setFavorites(updated);
        return true;
      } catch (err) {
        console.error("Error adding favorite:", err);
        setError("Erro ao adicionar favorito");
        return false;
      }
    },
    [favorites]
  );

  const removeFavorite = useCallback(
    async (slug: string) => {
      try {
        const updated = favorites.filter((fav) => fav.slug !== slug);
        await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
        setFavorites(updated);
        return true;
      } catch (err) {
        console.error("Error removing favorite:", err);
        setError("Erro ao remover favorito");
        return false;
      }
    },
    [favorites]
  );

  const isFavorite = useCallback(
    (slug: string) => {
      return favorites.some((fav) => fav.slug === slug);
    },
    [favorites]
  );

  const clearFavorites = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(FAVORITES_KEY);
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
    clearFavorites,
    reload: loadFavorites,
  };
}
