import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, Image, FlatList } from "react-native";
import { useState, useEffect } from "react";
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

export default function ExploreScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [animes, setAnimes] = useState<AnimeDisplay[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("em-lancamento");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAnimes, setTotalAnimes] = useState(0);

  useEffect(() => {
    loadAnimes(1);
  }, []);

  const loadAnimes = async (pageNum: number) => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      
      switch (selectedCategory) {
        case "em-lancamento":
          response = await animeFireClient.emLancamento(pageNum);
          break;
        case "animes-atualizados":
          response = await animeFireClient.animesAtualizados(pageNum);
          break;
        case "top-animes":
          response = await animeFireClient.topAnimes(pageNum);
          break;
        case "legendados":
          response = await animeFireClient.listaDeAnimesLegendados(pageNum);
          break;
        case "dublados":
          response = await animeFireClient.listaDeAnimesDublados(pageNum);
          break;
        default:
          response = await animeFireClient.emLancamento(pageNum);
      }
      
      const formatted = response.results;
      setAnimes(formatted);
      setCurrentPage(response.pagination?.currentPage || pageNum);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalAnimes(response.total || 0);
    } catch (err) {
      console.error("Error loading animes:", err);
      setError("Erro ao carregar animes");
    } finally {
      setLoading(false);
    }
  };

  const handleAnimePress = (animeLink: string) => {
    const slugMatch = animeLink.match(/\/animes\/([^\/]+)/);
    const slug = slugMatch ? slugMatch[1] : animeLink;
    router.push(`/episodes-list?slug=${slug}`);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
    setAnimes([]); // Limpa a lista ao trocar categoria
    setLoading(true); // Mostra indicador imediatamente
    loadAnimes(1);
  };

  const handlePageChange = (pageNum: number) => {
    if (pageNum >= 1 && pageNum <= totalPages && pageNum !== currentPage) {
      loadAnimes(pageNum);
    }
  };

  const getCategoryLabel = (category: string): string => {
    const labels = {
      "em-lancamento": "Em Lancamento",
      "animes-atualizados": "Animes Atualizados",
      "top-animes": "Top Animes",
      "legendados": "Legendados",
      "dublados": "Dublados"
    };
    return labels[category as keyof typeof labels] || "Explorar";
  };

  const getPageNumbers = (): number[] => {
    const maxVisible = 5;
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const renderAnimeCard = ({ item }: { item: AnimeDisplay }) => (
    <TouchableOpacity
      onPress={() => handleAnimePress(item.link)}
      className="mx-1 mb-2 rounded-lg overflow-hidden bg-surface"
      style={{ width: 150 }}
    >
      <Image
        source={{ uri: item.image }}
        className="w-full h-32 bg-muted"
        resizeMode="cover"
      />
      <View className="p-1">
        <Text className="text-xs font-semibold text-foreground line-clamp-1">
          {item.title}
        </Text>
        <View className="flex-row items-center gap-1 mt-1">
          <Text className="text-xs text-primary font-bold">? {item.score || "N/A"}</Text>
          {item.classification && (
            <Text className="text-xs text-muted text-xs">{item.classification}</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && animes.length === 0) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text className="text-foreground mt-4">Carregando animes...</Text>
      </ScreenContainer>
    );
  }

  if (error && animes.length === 0) {
    return (
      <ScreenContainer className="items-center justify-center p-4">
        <Text className="text-foreground text-center mb-4">{error}</Text>
        <TouchableOpacity
          onPress={() => loadAnimes(1)}
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
        <View className="px-4 py-4 bg-gradient-to-r from-primary to-pink-500">
          <Text className="text-3xl font-bold text-white">Explorar</Text>
          <Text className="text-sm text-white/80 mt-1">Explore todos os animes disponíveis na API</Text>
        </View>

        <View className="px-4 py-4 bg-surface border-b border-border">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row gap-2"
          >
            {[
              { key: "em-lancamento", label: "Em Lancamento" },
              { key: "animes-atualizados", label: "Animes Atualizados" },
              { key: "top-animes", label: "Top Animes" },
              { key: "legendados", label: "Legendados" },
              { key: "dublados", label: "Dublados" }
            ].map((category) => (
              <TouchableOpacity
                key={category.key}
                onPress={() => handleCategoryChange(category.key)}
                className={`px-4 py-2 rounded-lg ${
                  selectedCategory === category.key
                    ? "bg-primary"
                    : "bg-muted border border-border"
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    selectedCategory === category.key ? "text-white" : "text-foreground"
                  }`}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View className="mt-4 px-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-bold text-foreground">
              {getCategoryLabel(selectedCategory)}
            </Text>
            <Text className="text-sm text-muted">
              Total: {totalAnimes} animes
            </Text>
          </View>
          <Text className="text-sm text-muted mb-3">
            Página {currentPage} de {totalPages}
          </Text>
        </View>
        
        <View className="px-4">
          {loading ? (
            <View className="py-12 items-center">
              <ActivityIndicator size="large" color="#7C3AED" />
              <Text className="text-foreground mt-4 text-center">
                Procurando animes em{'\n'}
                <Text className="font-bold text-primary">{getCategoryLabel(selectedCategory)}</Text>...
              </Text>
            </View>
          ) : animes.length > 0 ? (
            <FlatList
              data={animes}
              renderItem={renderAnimeCard}
              keyExtractor={(item) => item.link}
              horizontal={false}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              scrollEventThrottle={16}
              numColumns={4}
              columnWrapperStyle={{ gap: 8 }}
            />
          ) : (
            <View className="py-8 items-center">
              <Text className="text-muted text-center">Nenhum anime encontrado</Text>
            </View>
          )}
        </View>

        {totalPages > 1 && (
          <View className="px-4 py-6">
            <View className="bg-surface rounded-lg p-4 border border-border">
              <View className="flex-row justify-between items-center mb-4">
                <TouchableOpacity
                  onPress={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-2 rounded ${
                    currentPage === 1
                      ? "bg-muted opacity-50"
                      : "bg-primary"
                  }`}
                >
                  <Text className={`text-sm font-semibold ${
                    currentPage === 1 ? "text-muted" : "text-white"
                  }`}>
                    Primeira
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-2 rounded ${
                    currentPage === 1
                      ? "bg-muted opacity-50"
                      : "bg-primary"
                  }`}
                >
                  <Text className={`text-sm font-semibold ${
                    currentPage === 1 ? "text-muted" : "text-white"
                  }`}>
                    Anterior
                  </Text>
                </TouchableOpacity>
                
                <View className="flex-row gap-2">
                  {getPageNumbers().map((pageNum) => (
                    <TouchableOpacity
                      key={pageNum}
                      onPress={() => handlePageChange(pageNum)}
                      className={`px-3 py-2 rounded ${
                        currentPage === pageNum
                          ? "bg-primary"
                          : "bg-muted border border-border"
                      }`}
                    >
                      <Text
                        className={`text-sm font-semibold ${
                          currentPage === pageNum ? "text-white" : "text-foreground"
                        }`}
                      >
                        {pageNum}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                <TouchableOpacity
                  onPress={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-2 rounded ${
                    currentPage === totalPages
                      ? "bg-muted opacity-50"
                      : "bg-primary"
                  }`}
                >
                  <Text className={`text-sm font-semibold ${
                    currentPage === totalPages ? "text-muted" : "text-white"
                  }`}>
                    Proxima
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-2 rounded ${
                    currentPage === totalPages
                      ? "bg-muted opacity-50"
                      : "bg-primary"
                  }`}
                >
                  <Text className={`text-sm font-semibold ${
                    currentPage === totalPages ? "text-muted" : "text-white"
                  }`}>
                    Ultima
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
