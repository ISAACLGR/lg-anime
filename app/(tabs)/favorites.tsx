import {
  ScrollView,
  Text,
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { useCallback } from "react";

import { ScreenContainer } from "@/components/screen-container";
import { useFavorites } from "@/lib/hooks/use-favorites";
import { useWatchHistory } from "@/lib/hooks/use-watch-history";

export default function FavoritesScreen() {
  const router = useRouter();
  const { favorites, loading, removeFavorite, reload: reloadFavorites } = useFavorites();
  const { history, reload: reloadHistory } = useWatchHistory();

  useFocusEffect(
    useCallback(() => {
      reloadFavorites();
      reloadHistory();
    }, [reloadFavorites, reloadHistory]),
  );

  const handleAnimePress = (slug: string) => {
    router.push({
      pathname: "/anime/[slug]",
      params: { slug },
    });
  };

  const handleContinueWatching = (animeSlug: string, episode: number) => {
    router.push({
      pathname: "/player/[slug]",
      params: {
        slug: animeSlug,
        episode: String(episode),
      },
    });
  };

  const handleRemoveFavorite = async (slug: string) => {
    await removeFavorite(slug);
  };

  const AnimeCard = ({
    anime,
  }: {
    anime: { slug: string; title: string; cover: string; rating: number; addedAt: number };
  }) => (
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
            <Text className="text-xs text-primary font-bold">⭐ {anime.rating || "-"}</Text>
            <Text className="text-xs text-muted">
              {new Date(anime.addedAt).toLocaleDateString("pt-BR")}
            </Text>
          </View>
        </View>
        <View className="flex-row gap-2">
          <TouchableOpacity
            onPress={() => handleRemoveFavorite(anime.slug)}
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
        <View className="px-4 py-4 bg-gradient-to-r from-primary to-pink-500">
          <Text className="text-2xl font-bold text-white">Favoritos</Text>
          <Text className="text-sm text-white/80 mt-1">
            {favorites.length} anime{favorites.length !== 1 ? "s" : ""} salvo{favorites.length !== 1 ? "s" : ""}
          </Text>
        </View>

        {history.length > 0 && (
          <View className="px-4 py-4 border-b border-border">
            <Text className="text-sm font-bold text-primary mb-3">CONTINUAR ASSISTINDO</Text>
            {history.slice(0, 4).map((item) => (
              <TouchableOpacity
                key={`${item.animeSlug}-${item.episode}`}
                onPress={() => handleContinueWatching(item.animeSlug, item.episode)}
                className="bg-surface border border-border rounded-lg p-3 mb-2"
              >
                <Text className="text-foreground font-semibold">{item.animeTitle || item.animeSlug}</Text>
                <Text className="text-sm text-muted mt-1">
                  Episódio {item.episode} · {Math.round(item.progress * 100)}% assistido
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

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
                <AnimeCard key={anime.slug} anime={anime} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
