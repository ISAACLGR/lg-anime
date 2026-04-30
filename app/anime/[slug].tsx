import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, Image, FlatList } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { animeFireClient } from "@/lib/api/animefire-client";
import { useFavorites } from "@/lib/hooks/use-favorites";

export default function AnimeDetailScreen() {
  const router = useRouter();
  const { slug } = useLocalSearchParams();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  
  const [anime, setAnime] = useState<any>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    loadAnimeData();
  }, [slug]);

  const loadAnimeData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch anime details from AnimeFire
      const animeData = await animeFireClient.getAnimeDetails(slug as string);
      setAnime(animeData);
      setFavorite(isFavorite(slug as string));

      // Set episodes from AnimeFire
      setEpisodes(animeData.episodes || []);

      setLoading(false);
    } catch (err) {
      console.error("Error loading anime data:", err);
      setError("Erro ao carregar detalhes do anime");
      setLoading(false);
    }
  };

  
  const handleToggleFavorite = async () => {
    if (!anime) return;

    const favoriteData = {
      slug: slug as string,
      title: anime.anime_title,
      cover: anime.anime_image,
      rating: anime.anime_score,
      addedAt: Date.now(),
    };

    if (favorite) {
      await removeFavorite(slug as string);
      setFavorite(false);
    } else {
      await addFavorite(favoriteData);
      setFavorite(true);
    }
  };

  const handlePlayEpisode = (episodeNumber: number) => {
    if (!anime) return;
    router.push(`/player/${slug}?episode=${episodeNumber}`);
  };

  const handlePlayNow = () => {
    handlePlayEpisode(1);
  };

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color="#7C3AED" />
      </ScreenContainer>
    );
  }

  if (error || !anime) {
    return (
      <ScreenContainer className="items-center justify-center p-4">
        <Text className="text-foreground text-center mb-4">{error || "Anime não encontrado"}</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="bg-primary px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-semibold">Voltar</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-0">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="absolute top-4 left-4 z-10 bg-black/50 rounded-full p-2"
        >
          <Text className="text-white text-xl">←</Text>
        </TouchableOpacity>

        {/* Cover Image */}
        <Image
          source={{ uri: anime.anime_image }}
          className="w-full h-80 bg-muted"
          resizeMode="cover"
        />

        {/* Content */}
        <View className="p-4">
          {/* Title and Info */}
          <View className="mb-4">
            <Text className="text-2xl font-bold text-foreground mb-2">{anime.anime_title}</Text>
            <View className="flex-row items-center gap-3 mb-2">
              <Text className="text-lg text-primary font-bold">⭐ {anime.anime_score}</Text>
              <Text className="text-muted">{anime.anime_info}</Text>
              <Text className="text-muted">{episodes.length || "?"} episódios</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row gap-3 mb-4">
            <TouchableOpacity
              onPress={handlePlayNow}
              className="flex-1 bg-primary py-3 rounded-lg items-center"
            >
              <Text className="text-white font-bold text-lg">▶ Assistir Agora</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleToggleFavorite}
              className="bg-surface border border-border p-3 rounded-lg items-center justify-center"
              style={{ width: 50 }}
            >
              <Text className="text-2xl">{favorite ? "♥" : "♡"}</Text>
            </TouchableOpacity>
          </View>


          {/* Synopsis */}
          <View className="mb-6">
            <Text className="text-lg font-bold text-foreground mb-2">Sinopse</Text>
            <Text className="text-muted leading-relaxed">{anime.anime_synopsis}</Text>
          </View>

          {/* Episodes */}
          {episodes.length > 0 && (
            <View className="mb-6">
              <Text className="text-lg font-bold text-foreground mb-3">Episódios</Text>
              <FlatList
                data={episodes}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    onPress={() => handlePlayEpisode(index + 1)}
                    className="bg-surface border border-border rounded-lg p-3 mb-2 flex-row items-center justify-between"
                  >
                    <View className="flex-1">
                      <Text className="text-foreground font-semibold">
                        {item.text}
                      </Text>
                    </View>
                    <Text className="text-primary text-xl">›</Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item, index) => index.toString()}
                scrollEnabled={false}
              />
            </View>
          )}

        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
