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
      pathname: "/episodes-list",
      params: { slug },
    });
  };

  const getContinueEpisode = (item: (typeof history)[number]) =>
    item.progress >= 0.9 ? item.episode + 1 : item.episode;

  const getLatestHistoryByAnime = (items: typeof history) => {
    const map = new Map<string, (typeof history)[number]>();
    items.forEach((item) => {
      const current = map.get(item.animeSlug);
      if (!current || item.lastWatchedAt > current.lastWatchedAt) {
        map.set(item.animeSlug, item);
      }
    });
    return Array.from(map.values()).sort((a, b) => b.lastWatchedAt - a.lastWatchedAt);
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

  const getHistoryTitle = (item: (typeof history)[number]) => {
    const favoriteTitle = favorites.find((favorite) => favorite.slug === item.animeSlug)?.title;
    if (favoriteTitle) return favoriteTitle;
    if (item.animeTitle && item.animeTitle !== item.animeSlug) return item.animeTitle;

    return decodeURIComponent(String(item.animeSlug || "Anime"))
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase()) || "Anime";
  };

  const AnimeCard = ({
    anime,
    showRemove = true,
    subtitle,
    actionLabel = "Assistir",
    onAction,
  }: {
    anime: { slug: string; title: string; cover: string; rating: number; addedAt: number };
    showRemove?: boolean;
    subtitle?: string;
    actionLabel?: string;
    onAction?: (anime: { slug: string; title: string; cover: string; rating: number; addedAt: number }) => void;
  }) => (
    <TouchableOpacity
      onPress={() => (onAction ? onAction(anime) : handleAnimePress(anime.slug))}
      className="flex-row bg-surface rounded-lg overflow-hidden mb-3 border border-border"
    >
      <Image
        source={{
          uri:
            anime.cover ||
            "https://placehold.co/400x600/7C3AED/FFFFFF?text=Anime",
        }}
        className="w-24 h-32 bg-muted"
        resizeMode="cover"
      />
      <View className="flex-1 p-3 justify-between">
        <View>
          <Text className="text-base font-bold text-foreground line-clamp-2">
            {anime.title}
          </Text>
          {subtitle ? (
            <Text className="text-xs text-muted mt-1">{subtitle}</Text>
          ) : null}
          <View className="flex-row items-center gap-2 mt-1">
            <Text className="text-xs text-primary font-bold">⭐ {anime.rating || "-"}</Text>
            <Text className="text-xs text-muted">
              {new Date(anime.addedAt).toLocaleDateString("pt-BR")}
            </Text>
          </View>
        </View>
        <View className="flex-row gap-2">
          {showRemove ? (
            <TouchableOpacity
              onPress={() => handleRemoveFavorite(anime.slug)}
              className="flex-1 bg-error/20 py-2 rounded items-center"
            >
              <Text className="text-error text-xs font-semibold">Remover</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            onPress={() => (onAction ? onAction(anime) : handleAnimePress(anime.slug))}
            className={`${showRemove ? "flex-1" : "flex-1"} bg-primary py-2 rounded items-center`}
          >
            <Text className="text-white text-xs font-semibold">{actionLabel}</Text>
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
            {getLatestHistoryByAnime(history).slice(0, 4).map((item) => {
              const favoriteMatch = favorites.find((favorite) => favorite.slug === item.animeSlug);
              const continueEpisode = getContinueEpisode(item);
              const cardAnime = {
                slug: item.animeSlug,
                title: getHistoryTitle(item),
                cover:
                  favoriteMatch?.cover ||
                  item.cover ||
                  "https://placehold.co/400x600/7C3AED/FFFFFF?text=Anime",
                rating: favoriteMatch?.rating || 0,
                addedAt: favoriteMatch?.addedAt || item.lastWatchedAt,
              };

              return (
                <AnimeCard
                  key={`${item.animeSlug}-${item.episode}`}
                  anime={cardAnime}
                  showRemove={false}
                  subtitle={
                    item.progress >= 0.9
                      ? `Próximo episódio · ${continueEpisode} · ${Math.round(item.progress * 100)}% assistido`
                      : `Episódio ${continueEpisode} · ${Math.round(item.progress * 100)}% assistido`
                  }
                  actionLabel="Continuar"
                  onAction={() => handleContinueWatching(item.animeSlug, continueEpisode)}
                />
              );
            })}
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
