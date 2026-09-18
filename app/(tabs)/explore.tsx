import { ScrollView, Text, View, TouchableOpacity, ActivityIndicator, Image, FlatList, Dimensions } from "react-native";
import { useState, useEffect } from "react";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter, useLocalSearchParams } from "expo-router";
import { animeFireClient } from "@/lib/api/animeFire/anime-fire-client";
import { Platform } from "react-native";

interface AnimeDisplay {
  title: string;
  image: string;
  classification?: string;
  score?: string;
  link: string;
}

const FALLBACK_ANIME_IMAGE = 'https://placehold.co/600x900/1f2937/ffffff?text=Anime';

const normalizeAnimeImage = (image?: string) => {
  if (!image || typeof image !== 'string') return FALLBACK_ANIME_IMAGE;

  const trimmed = image.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return FALLBACK_ANIME_IMAGE;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (/^(https?:|data:|blob:)/i.test(trimmed)) return trimmed;

  return trimmed.startsWith('/') ? `https://animefire.one${trimmed}` : trimmed;
};

interface FilterState {
  letra: string;
  ano: string;
  score: string;
  classificacao: string;
}

const LETRAS = ['', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
const ANOS = ['', '2026', '2025', '2024', '2023', '2022', '2021', '2020', '2019', '2018', '2017', '2016', '2015', '2014', '2013', '2012', '2011', '2010', '2009', '2008', '2007', '2006', '2005', '2004', '2003', '2002', '2001', '2000', '1999', '1998', '1997', '1996', '1995', '1994', '1993', '1992', '1991', '1990', '1989', '1988', '1987', '1986', '1985', '1984', '1983', '1982', '1981', '1980', '1979', '1978', '1977', '1976', '1975', '1974', '1973', '1972', '1971', '1970', '1969'];
const SCORES = ['', '9', '8', '7', '6', '5', '4', '3', '2', '1'];
const CLASSIFICACOES = [
  { value: '', label: 'Classificação' },
  { value: 'L', label: 'L - Livre' },
  { value: 'A10', label: 'A10 - 10 anos' },
  { value: 'A12', label: 'A12 - 12 anos' },
  { value: 'A14', label: 'A14 - 14 anos' },
  { value: 'A16', label: 'A16 - 16 anos' },
  { value: 'A18', label: 'A18 - 18 anos' }
];

// Componente responsivo de listagem
function AnimeList({ animes, renderAnimeCard }: { animes: AnimeDisplay[], renderAnimeCard: ({ item }: { item: AnimeDisplay }) => JSX.Element }) {
  const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
  const isWeb = Platform.OS === 'web';
  
  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setScreenWidth(window.width);
    });
    return () => subscription?.remove();
  }, []);
  
  // Mobile: rolagem horizontal
  if (!isWeb || screenWidth < 768) {
    return (
      <FlatList
        data={animes}
        renderItem={renderAnimeCard}
        keyExtractor={(item) => item.link}
        horizontal={true}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 20, gap: 8 }}
      />
    );
  }
  
  // Web/Desktop: grid com rolagem vertical
  const numColumns = Math.floor(screenWidth / 170); // 150px card + gap
  
  return (
    <FlatList
      data={animes}
      renderItem={renderAnimeCard}
      keyExtractor={(item) => item.link}
      numColumns={numColumns}
      horizontal={false}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 20 }}
      columnWrapperStyle={{ gap: 8 }}
    />
  );
}

export default function ExploreScreen() {
  const router = useRouter();
  const searchParams = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [animes, setAnimes] = useState<AnimeDisplay[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("em-lancamento");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAnimes, setTotalAnimes] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    letra: '',
    ano: '',
    score: '',
    classificacao: ''
  });

  useEffect(() => {
    // Check if there's a search query in the URL
    const search = searchParams.search as string;
    if (search) {
      setSearchQuery(search);
      setIsSearchMode(true);
      loadSearchResults(1, search);
    } else {
      setIsSearchMode(false);
      loadAnimes(1);
    }
  }, [searchParams.search]);

  const loadSearchResults = async (pageNum: number, query: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await animeFireClient.pesquisar(query, pageNum);
      const formatted = response.results;
      setAnimes(formatted);
      setCurrentPage(pageNum);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalAnimes(response.total || 0);
    } catch (err) {
      console.error("Error loading search results:", err);
      setError("Erro ao carregar resultados da busca");
    } finally {
      setLoading(false);
    }
  };

  const loadAnimes = async (pageNum: number, category?: string, activeFilters?: FilterState) => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      const cat = category || selectedCategory;
      const currentFilters = activeFilters || filters;
      const filterParams = {
        letra: currentFilters.letra || undefined,
        ano: currentFilters.ano || undefined,
        score: currentFilters.score || undefined,
        classificacao: currentFilters.classificacao || undefined
      };
      
      switch (cat) {
        case "em-lancamento":
          response = await animeFireClient.emLancamento(pageNum, filterParams);
          break;
        case "legendados":
          response = await animeFireClient.listaDeAnimesLegendados(pageNum, filterParams);
          break;
        case "dublados":
          response = await animeFireClient.listaDeAnimesDublados(pageNum, filterParams);
          break;
        default:
          response = await animeFireClient.emLancamento(pageNum, filterParams);
      }
      
      const formatted = response.results;
      setAnimes(formatted);
      setCurrentPage(pageNum);
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
    const slugMatch = animeLink.match(/\/(?:anime|animes)\/([^/?#]+)/i);
    const slug = slugMatch ? slugMatch[1] : String(animeLink).split('/').filter(Boolean).pop() || animeLink;
    router.push(`/episodes-list?slug=${encodeURIComponent(slug)}`);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
    setAnimes([]);
    setLoading(true);
    loadAnimes(1, category);
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setCurrentPage(1);
    setAnimes([]);
    setLoading(true);
    loadAnimes(1, undefined, newFilters);
  };

  const clearFilters = () => {
    const emptyFilters = { letra: '', ano: '', score: '', classificacao: '' };
    setFilters(emptyFilters);
    setCurrentPage(1);
    setAnimes([]);
    setLoading(true);
    loadAnimes(1, undefined, emptyFilters);
  };

  const handlePageChange = (pageNum: number) => {
    if (pageNum >= 1 && pageNum <= totalPages && pageNum !== currentPage) {
      if (isSearchMode) {
        loadSearchResults(pageNum, searchQuery);
      } else {
        loadAnimes(pageNum);
      }
    }
  };

  const getCategoryLabel = (category: string): string => {
    const labels = {
      "em-lancamento": "Em Lancamento",
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
        source={{ uri: normalizeAnimeImage(item.image) }}
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
          <Text className="text-3xl font-bold text-white">
            {isSearchMode ? "Resultados da Busca" : "Explorar"}
          </Text>
          <Text className="text-sm text-white/80 mt-1">
            {isSearchMode 
              ? `Resultados para: "${searchQuery}"` 
              : "Explore todos os animes disponíveis na API"
            }
          </Text>
        </View>

        {!isSearchMode && (
          <View className="px-4 py-4 bg-surface border-b border-border">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-row gap-2"
            >
              {[
                { key: "em-lancamento", label: "Em Lancamento" },
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

            {/* Filtros */}
            <View className="mt-4 pt-4 border-t border-border">
              <View className="flex-row flex-wrap gap-2">
                {/* Letra */}
                <View className="bg-muted border border-border rounded-lg overflow-hidden" style={{ minWidth: 80 }}>
                  <select
                    value={filters.letra}
                    onChange={(e) => handleFilterChange('letra', e.target.value)}
                    className="bg-transparent text-foreground px-3 py-2 text-sm outline-none"
                    style={{ border: 'none', background: 'transparent' }}
                  >
                    <option value="">Letra</option>
                    {LETRAS.slice(1).map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </View>

                {/* Ano */}
                <View className="bg-muted border border-border rounded-lg overflow-hidden" style={{ minWidth: 90 }}>
                  <select
                    value={filters.ano}
                    onChange={(e) => handleFilterChange('ano', e.target.value)}
                    className="bg-transparent text-foreground px-3 py-2 text-sm outline-none"
                    style={{ border: 'none', background: 'transparent' }}
                  >
                    <option value="">Ano</option>
                    {ANOS.slice(1).map(a => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </View>

                {/* Score */}
                <View className="bg-muted border border-border rounded-lg overflow-hidden" style={{ minWidth: 85 }}>
                  <select
                    value={filters.score}
                    onChange={(e) => handleFilterChange('score', e.target.value)}
                    className="bg-transparent text-foreground px-3 py-2 text-sm outline-none"
                    style={{ border: 'none', background: 'transparent' }}
                  >
                    <option value="">Score</option>
                    {SCORES.slice(1).map(s => (
                      <option key={s} value={s}>{s}+</option>
                    ))}
                  </select>
                </View>

                {/* Classificação */}
                <View className="bg-muted border border-border rounded-lg overflow-hidden" style={{ minWidth: 130 }}>
                  <select
                    value={filters.classificacao}
                    onChange={(e) => handleFilterChange('classificacao', e.target.value)}
                    className="bg-transparent text-foreground px-3 py-2 text-sm outline-none"
                    style={{ border: 'none', background: 'transparent' }}
                  >
                    {CLASSIFICACOES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </View>

                {/* Limpar Filtros */}
                {(filters.letra || filters.ano || filters.score || filters.classificacao) && (
                  <TouchableOpacity
                    onPress={clearFilters}
                    className="bg-primary px-3 py-2 rounded-lg"
                  >
                    <Text className="text-white text-sm font-semibold">Limpar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}

        <View className="mt-4 px-4">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-bold text-foreground">
              {isSearchMode ? "Resultados da Busca" : getCategoryLabel(selectedCategory)}
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
                {isSearchMode
                  ? `Buscando por "${searchQuery}"...`
                  : `Procurando animes em ${getCategoryLabel(selectedCategory)}...`}
              </Text>
            </View>
          ) : animes.length > 0 ? (
            <AnimeList animes={animes} renderAnimeCard={renderAnimeCard} />
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
