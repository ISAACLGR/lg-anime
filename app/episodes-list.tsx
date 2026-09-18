import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Image, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import axios from 'axios';

import { useFavorites } from '@/lib/hooks/use-favorites';
import { getStoredApiBaseUrl } from '@/lib/runtime-settings';

const DEFAULT_API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const getApiCandidates = async () => {
  const storedUrl = await getStoredApiBaseUrl().catch(() => '');
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  const candidates = [
    storedUrl,
    envUrl,
    DEFAULT_API_BASE_URL,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    candidates.unshift(
      `${protocol}//${hostname}:3000`,
      `${protocol}//127.0.0.1:3000`
    );
  }

  return Array.from(new Set(candidates.filter(Boolean) as string[]));
};

const resolveApiBaseUrl = async () => {
  const candidates = await getApiCandidates();

  for (const baseUrl of candidates) {
    try {
      const response = await fetch(`${baseUrl}/api/health`, { method: 'GET', cache: 'no-store' });
      if (response.ok) {
        return baseUrl;
      }
    } catch {
      // continue to next candidate
    }
  }

  return (await getStoredApiBaseUrl().catch(() => '')) || candidates[0] || DEFAULT_API_BASE_URL;
};

interface Episode {
  href: string;
  text: string;
}

interface AnimeData {
  anime_slug: string;
  anime_title: string;
  anime_title1: string;
  anime_image: string;
  anime_info: string;
  anime_synopsis: string;
  anime_score: string;
  anime_votes: string;
  episodes: Episode[];
  response?: {
    status: string;
    text: string;
  };
}

export default function EpisodesListScreen() {
  const { slug } = useLocalSearchParams();
  const router = useRouter();
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const [animeData, setAnimeData] = useState<AnimeData | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);

  const normalizeSlug = (rawSlug: string | string[] | undefined) => {
    const value = Array.isArray(rawSlug) ? rawSlug[0] : rawSlug;
    if (!value) return '';

    const decoded = decodeURIComponent(String(value));
    const match = decoded.match(/\/(?:anime|animes)\/([^/?#]+)/i);
    if (match) return match[1];

    try {
      const url = new URL(decoded);
      const urlMatch = url.pathname.match(/\/(?:anime|animes)\/([^/?#]+)/i);
      if (urlMatch) return urlMatch[1];
    } catch {
      // Ignora URL inválida; usa valor bruto abaixo.
    }

    return decoded.replace(/^https?:\/\/[^/]+\//i, '').replace(/\/+$/, '');
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const favoriteSlug = normalizeSlug(slug);

  const fetchEpisodes = useCallback(async (normalizedSlug?: string) => {
    try {
      const startedAt = Date.now();
      console.log('[episodes-list] Iniciando carregamento do anime:', { slug, normalizedSlug, startedAt });
      setLoading(true);
      setError(null);

      const finalSlug = normalizedSlug || normalizeSlug(slug);
      const animeLink = `https://animefire.one/anime/${finalSlug}`;
      console.log('[episodes-list] URL do AnimeFire:', animeLink);

      const effectiveApiBaseUrl = await resolveApiBaseUrl();
      console.log('[episodes-list] API base resolvida:', effectiveApiBaseUrl);

      const response = await axios.get(`${effectiveApiBaseUrl}/api/animefire/getEpisodio?link=${encodeURIComponent(animeLink)}`);
      console.log('[episodes-list] Resposta recebida em ms:', Date.now() - startedAt, response?.data ? Object.keys(response.data) : 'sem-data');

      setAnimeData(response.data);
    } catch (err) {
      console.error('[episodes-list] Erro ao buscar episódios:', err);
      setError('Erro ao carregar episódios');
    } finally {
      const finishedAt = Date.now();
      console.log('[episodes-list] Finalizado carregamento em ms:', finishedAt);
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (favoriteSlug) {
      void fetchEpisodes(favoriteSlug);
    } else {
      setError('Slug do anime inválido');
      setLoading(false);
    }
  }, [favoriteSlug, fetchEpisodes]);

  useEffect(() => {
    if (favoriteSlug) {
      setIsFavorited(isFavorite(favoriteSlug));
    } else {
      setIsFavorited(false);
    }
  }, [favoriteSlug, isFavorite]);

  const handleToggleFavorite = async () => {
    if (!animeData || !favoriteSlug) return;

    const favoriteAnime = {
      slug: favoriteSlug,
      title: animeData.anime_title || favoriteSlug,
      cover: animeData.anime_image || '',
      rating: Number.parseFloat(String(animeData.anime_score || '0')) || 0,
      addedAt: Date.now(),
    };

    if (isFavorited) {
      await removeFavorite(favoriteSlug);
      setIsFavorited(false);
      return;
    }

    await addFavorite(favoriteAnime);
    setIsFavorited(true);
  };

  const buildEpisodeUrl = (animeSlug: string | string[] | undefined, episodeNumber: number) => {
    const finalSlug = normalizeSlug(animeSlug);
    if (!finalSlug) return '#';
    return `https://animefire.one/anime/${finalSlug}/episode-${episodeNumber}`;
  };

  const handlePlayEpisode = (episodeUrl: string, episodeNumber: number) => {
    const resolvedUrl = (!episodeUrl || episodeUrl === '#') ? buildEpisodeUrl(slug, episodeNumber) : episodeUrl;
    const episodeMatch = resolvedUrl.match(/(?:\/|-)episode[-_]?([0-9]+)(?:\/|$)/i) || resolvedUrl.match(/\/(\d+)$/);
    const episodeNum = episodeMatch ? episodeMatch[1] : episodeNumber;
    const finalSlug = normalizeSlug(slug);

    router.push(`/player/${encodeURIComponent(finalSlug)}?episode=${episodeNum}&url=${encodeURIComponent(resolvedUrl)}`);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>Carregando episódios...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchEpisodes()}>
          <Text style={styles.retryButtonText}>Tentar Novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!animeData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Nenhum dado encontrado</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Back Button */}
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>← Voltar</Text>
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.animeTitle}>{animeData.anime_title}</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              accessibilityRole="button"
              onPress={() => void handleToggleFavorite()}
              style={[styles.favoriteButton, isFavorited && styles.favoriteButtonActive]}
            >
              <Text style={[styles.favoriteButtonText, isFavorited && styles.favoriteButtonTextActive]}>
                {isFavorited ? '♥' : '♡'}
              </Text>
            </TouchableOpacity>
            <View style={styles.scoreBadge}>
              <Text style={styles.score}>⭐ {animeData.anime_score}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.animeSubtitle}>{animeData.anime_title1}</Text>
        <View style={styles.infoRow}>
          <View style={styles.infoTag}>
            <Text style={styles.infoText}>{animeData.anime_info}</Text>
          </View>
          <View style={styles.votesTag}>
            <Text style={styles.votesText}>{animeData.anime_votes}</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Episódios</Text>
            <Text style={styles.statValue}>{animeData.episodes.length}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Status</Text>
            <Text style={styles.statValue}>Em Lançamento</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Áudio</Text>
            <Text style={styles.statValue}>Legendado</Text>
          </View>
        </View>
      </View>

      {/* Image and Synopsis Side by Side */}
      <View style={styles.contentRow}>
        {/* Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: animeData.anime_image }}
            style={styles.animeImage}
            resizeMode="cover"
          />
        </View>
        
        {/* Synopsis */}
        <View style={styles.synopsisContainer}>
          <Text style={styles.sectionTitle}>Sinopse</Text>
          <Text style={styles.synopsisText}>{animeData.anime_synopsis}</Text>
        </View>
      </View>

      {/* Episodes List */}
      <View style={styles.episodesContainer}>
        <Text style={styles.sectionTitle}>
          Episódios ({animeData.episodes.length})
        </Text>
        {animeData.episodes.map((episode, index) => (
          <TouchableOpacity 
            key={index}
            style={styles.episodeItem}
            onPress={() => handlePlayEpisode(episode.href || '#', index + 1)}
          >
            <View style={styles.episodeNumberContainer}>
              <Text style={styles.episodeNumber}>{index + 1}</Text>
            </View>
            <View style={styles.episodeContent}>
              <Text style={styles.episodeTitle}>{episode.text}</Text>
              <Text style={styles.episodeDuration}>Duração: ~24 min</Text>
            </View>
            <View style={styles.episodeActions}>
              <TouchableOpacity style={styles.playButton} onPress={() => handlePlayEpisode(episode.href || '#', index + 1)}>
                <Text style={styles.playButtonText}>▶</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 20,
  },
  contentRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 16,
  },
  imageContainer: {
    width: 150,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  animeImage: {
    width: '100%',
    height: '100%',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  animeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  favoriteButtonActive: {
    backgroundColor: '#ffe4e6',
    borderColor: '#f43f5e',
  },
  favoriteButtonText: {
    fontSize: 18,
    color: '#4b5563',
  },
  favoriteButtonTextActive: {
    color: '#e11d48',
  },
  scoreBadge: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  score: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  animeSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  infoTag: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  infoText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '500',
  },
  votesTag: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  votesText: {
    fontSize: 12,
    color: '#92400e',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
  },
  synopsisContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  synopsisText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  episodesContainer: {
    flex: 1,
  },
  episodesList: {
    flex: 1,
  },
  episodeItem: {
    flexDirection: 'row',
    backgroundColor: '#f8f8f8',
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  episodeNumberContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#7C3AED',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  episodeNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  episodeContent: {
    flex: 1,
  },
  episodeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  episodeDuration: {
    fontSize: 12,
    color: '#6b7280',
  },
  episodeActions: {
    marginLeft: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playButton: {
    width: 40,
    height: 40,
    backgroundColor: '#10b981',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#ff4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#7C3AED',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backButton: {
    backgroundColor: '#7C3AED',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
});