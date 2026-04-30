import { ScrollView, Text, View, TouchableOpacity, FlatList, Image, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback } from "react";

interface Anime {
  id: string;
  title: string;
  slug: string;
  cover: string;
  rating: number;
  year: number;
  episodes: number;
  status: "Em Exibição" | "Finalizado";
  genres: string[];
}

export default function FavoritesScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<Anime[]>([]);

  useFocusEffect(
    useCallback(() => {
      // TODO: Load favorites from AsyncStorage
      const mockFavorites: Anime[] = [
        {
          id: "1",
          title: "Bleach: Thousand-Year Blood War",
          slug: "bleach-thousand-year-blood-war",
          cover: "https://via.placeholder.com/300x400?text=Bleach",
          rating: 9.0,
          year: 2022,
          episodes: 13,
          status: "Finalizado",
          genres: ["Ação", "Sobrenatural"],
        },
        {
          id: "2",
          title: "Frieren: Beyond Journey's End Season 2",
          slug: "frieren-beyond-journeys-end-season-2",
          cover: "https://via.placeholder.com/300x400?text=Frieren",
          rating: 9.3,
          year: 2026,
          episodes: 10,
          status: "Em Exibição",
          genres: ["Aventura", "Fantasia"],
        },
      ];

      setFavorites(mockFavorites);
      setLoading(false);
    }, [])
  );

  const handleAnimePress = (slug: string) => {
    router.push({
      pathname: "/anime/[slug]",
      params: { slug },
    });
  };

  const handleRemoveFavorite = (id: string) => {
    setFavorites(favorites.filter((anime) => anime.id !== id));
    // TODO: Remove from AsyncStorage
  };

  const AnimeCard = ({ anime }: { anime: Anime }) => (
    <TouchableOpacity
      onPress={() => handleAnimePress(anime.slug)}
      className="flex-row bg-surface rounded-lg overflow-hidden mb-3 border border-border"
    >
      <Image
        source={{ uri: anime.cover }}
        className="w-24 h-32 bg-muted"
        resizeMode="cover"
      />
      <View className="flex-1 p-3 justify-between">
        <View>
          <Text className="text-base font-bold text-foreground line-clamp-2">
            {anime.title}
          </Text>
          <View className="flex-row items-center gap-2 mt-1">
            <Text className="text-xs text-primary font-bold">⭐ {anime.rating}</Text>
            <Text className="text-xs text-muted">{anime.episodes} eps</Text>
            <Text className="text-xs text-muted">{anime.year}</Text>
          </View>
        </View>
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => handleRemoveFavorite(anime.id)}
            className="flex-1 bg-error/20 py-2 rounded items-center"
          >
            <Text className="text-error text-xs font-semibold">Remover</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleAnimePress(anime.slug)}
            className="flex-1 bg-primary py-2 rounded items-center"
          >
            <Text className="text-white text-xs font-semibold">Assistir</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color="#7C3AED" />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-0">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-4 py-4 bg-gradient-to-r from-primary to-pink-500">
          <Text className="text-2xl font-bold text-white">Favoritos</Text>
          <Text className="text-sm text-white/80 mt-1">
            {favorites.length} anime{favorites.length !== 1 ? "s" : ""} salvo{favorites.length !== 1 ? "s" : ""}
          </Text>
        </View>

        {/* Favorites List */}
        <View className="px-4 py-4">
          {favorites.length === 0 ? (
            <View className="items-center justify-center py-12">
              <Text className="text-2xl mb-2">♥</Text>
              <Text className="text-lg font-bold text-foreground mb-1">Sem favoritos</Text>
              <Text className="text-muted text-center">
                Adicione animes aos seus favoritos para vê-los aqui
              </Text>
            </View>
          ) : (
            <View>
              {favorites.map((anime) => (
                <AnimeCard key={anime.id} anime={anime} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
