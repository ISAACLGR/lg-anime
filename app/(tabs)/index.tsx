import { ScrollView, Text, View, TouchableOpacity, FlatList, Image, ActivityIndicator, TextInput } from "react-native";
import { useEffect, useRef, useState } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import { animeFireClient } from "@/lib/api/animeFire/anime-fire-client";

interface AnimeDisplay {
  title: string;
  image: string;
  classification?: string;
  score?: string;
  link: string;
}

const FALLBACK_ANIME_IMAGE = 'https://placehold.co/600x900/1f2937/ffffff?text=Anime';
const inFlightHomeLoads = new Set<string>();

const normalizeAnimeImage = (image?: string) => {
  if (!image || typeof image !== 'string') return FALLBACK_ANIME_IMAGE;

  const trimmed = image.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return FALLBACK_ANIME_IMAGE;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (/^(https?:|data:|blob:)/i.test(trimmed)) return trimmed;

  return trimmed.startsWith('/') ? `https://animefire.one${trimmed}` : trimmed;
};

export default function HomeScreen() {
  const router = useRouter();
  const mountedRef = useRef(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [featured, setFeatured] = useState<AnimeDisplay | null>(null);
  const [airing, setAiring] = useState<AnimeDisplay[]>([]);
  const [popular, setPopular] = useState<AnimeDisplay[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    mountedRef.current = true;
    loadData();

    return () => {
      mountedRef.current = false;
    };
  }, []);

  const loadData = async () => {
    const key = 'home-load';
    if (inFlightHomeLoads.has(key)) {
      console.log('[home] Requisição de home já em andamento, ignorando duplicata');
      return;
    }

    inFlightHomeLoads.add(key);

    try {
      setLoading(true);
      setError(null);

      // Fetch airing animes from AnimeFire
      const airingResponse = await animeFireClient.emLancamento(1);
      const airingFormatted = airingResponse.results.slice(0, 5);
      if (mountedRef.current) setAiring(airingFormatted);

      // Set featured as first airing anime
      if (airingFormatted.length > 0 && mountedRef.current) {
        setFeatured(airingFormatted[0]);
      }

      // Fetch popular animes from AnimeFire
      const popularResponse = await animeFireClient.topAnimes(1);
      const popularFormatted = popularResponse.results.slice(0, 5);
      if (mountedRef.current) setPopular(popularFormatted);
    } catch (err) {
      console.error("Error loading home data:", err);
      if (mountedRef.current) setError("Erro ao carregar animes");
    } finally {
      inFlightHomeLoads.delete(key);
      if (mountedRef.current) setLoading(false);
    }
  };

  const handleAnimePress = (animeLink: string) => {
    // Extrair slug do link para navegar
    const slugMatch = animeLink.match(/\/(?:anime|animes)\/([^/?#]+)/i);
    const slug = slugMatch ? slugMatch[1] : String(animeLink).split('/').filter(Boolean).pop() || animeLink;
    router.push(`/episodes-list?slug=${encodeURIComponent(slug)}`);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/explore?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const AnimeCard = ({ anime }: { anime: AnimeDisplay }) => (
    <TouchableOpacity
      onPress={() => handleAnimePress(anime.link)}
      className="mr-3 rounded-lg overflow-hidden bg-surface"
      style={{ width: 150 }}
    >
      <Image
        source={{ uri: normalizeAnimeImage(anime.image) }}
        className="w-full h-48 bg-muted"
        resizeMode="cover"
      />
      <View className="p-2">
        <Text className="text-sm font-semibold text-foreground line-clamp-2">
          {anime.title}
        </Text>
        <View className="flex-row items-center gap-1 mt-1">
          <Text className="text-xs text-primary font-bold">⭐ {anime.score || "N/A"}</Text>
          {anime.classification && (
            <Text className="text-xs text-muted">{anime.classification}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && airing.length === 0) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color="#7C3AED" />
      </ScreenContainer>
    );
  }

  if (error && airing.length === 0) {
    return (
      <ScreenContainer className="items-center justify-center p-4">
        <Text className="text-foreground text-center mb-4">Erro ao carregar animes</Text>
        <TouchableOpacity
          onPress={loadData}
          className="bg-primary px-6 py-3 rounded-lg"
        >
          <Text className="text-white font-semibold">Tentar Novamente</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-0">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-4 py-4 bg-gradient-to-r from-primary to-pink-500">
          <Text className="text-3xl font-bold text-white">AnimeFire</Text>
          <Text className="text-sm text-white/80 mt-1">Assista animes sem anúncios</Text>
          
          {/* Search Bar */}
          <View className="mt-4 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 flex-row items-center">
            <TextInput
              className="flex-1 text-white placeholder-white/70 text-sm"
              placeholder="Buscar animes..."
              placeholderTextColor="rgba(255, 255, 255, 0.7)"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <TouchableOpacity onPress={handleSearch} className="ml-2">
              <Text className="text-white font-semibold text-sm">🔍</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Featured Banner */}
        {featured && (
          <TouchableOpacity
            onPress={() => handleAnimePress(featured.link)}
            className="mx-4 mt-4 rounded-xl overflow-hidden bg-surface"
          >
            <Image
              source={{ uri: normalizeAnimeImage(featured.image) }}
              className="w-full h-64 bg-muted"
              resizeMode="cover"
            />
            <View className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
              <Text className="text-xl font-bold text-white" numberOfLines={2}>
                {featured.title}
              </Text>
              <View className="flex-row items-center gap-2 mt-2">
                <Text className="text-yellow-400 font-bold">⭐ {featured.score || "N/A"}</Text>
                {featured.classification && (
                  <Text className="text-white text-sm">{featured.classification}</Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Em Exibição Section */}
        {airing.length > 0 && (
          <View className="mt-6">
            <View className="px-4 mb-3">
              <View className="flex-row items-center gap-2">
                <View className="w-1 h-6 bg-primary rounded-full" />
                <Text className="text-xl font-bold text-foreground">Em Exibição</Text>
              </View>
            </View>
            <FlatList
              data={airing}
              renderItem={({ item }) => <AnimeCard anime={item} />}
              keyExtractor={(item) => item.link}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              scrollEventThrottle={16}
            />
          </View>
        )}

        {/* Populares Section */}
        {popular.length > 0 && (
          <View className="mt-6 mb-6">
            <View className="px-4 mb-3">
              <View className="flex-row items-center gap-2">
                <View className="w-1 h-6 bg-primary rounded-full" />
                <Text className="text-xl font-bold text-foreground">Populares</Text>
              </View>
            </View>
            <FlatList
              data={popular}
              renderItem={({ item }) => <AnimeCard anime={item} />}
              keyExtractor={(item) => item.link}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              scrollEventThrottle={16}
            />
          </View>
        )}

        {/* Loading indicator for pagination */}
        {loading && airing.length > 0 && (
          <View className="py-4 items-center">
            <ActivityIndicator size="small" color="#7C3AED" />
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
