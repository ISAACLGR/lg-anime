import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useState } from "react";
import { Platform } from "react-native";

// AdMob IDs
const ADMOB_PUBLISHER_ID = "pub-7213751684524160";
const ADMOB_CLIENT_ID = "277794";

// Ad unit IDs (you'll need to create these in AdMob console)
// For testing, use test ad unit IDs
const TEST_INTERSTITIAL_AD_UNIT_ID = "ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx";

// Storage key for tracking ad frequency
const AD_FREQUENCY_KEY = "@animfire:ad_frequency";

export interface AdFrequencyData {
  lastAdShownAt: number;
  episodeCount: number;
}

/**
 * Hook para gerenciar anúncios do Google AdMob
 * Mostra anúncios interstitial a cada 3 episódios (1º, 4º, 7º, etc.)
 */
export function useAdMobAds() {
  const [isAdReady, setIsAdReady] = useState(false);
  const [isAdLoading, setIsAdLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [frequencyData, setFrequencyData] = useState<AdFrequencyData>({
    lastAdShownAt: 0,
    episodeCount: 0,
  });

  // Load frequency data from AsyncStorage on mount
  useEffect(() => {
    loadFrequencyData();
  }, []);

  const loadFrequencyData = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem(AD_FREQUENCY_KEY);
      if (data) {
        setFrequencyData(JSON.parse(data));
      }
    } catch (err) {
      console.error("Error loading ad frequency data:", err);
    }
  }, []);

  const saveFrequencyData = useCallback(async (data: AdFrequencyData) => {
    try {
      await AsyncStorage.setItem(AD_FREQUENCY_KEY, JSON.stringify(data));
      setFrequencyData(data);
    } catch (err) {
      console.error("Error saving ad frequency data:", err);
    }
  }, []);

  /**
   * Determina se um anúncio deve ser exibido
   * Retorna true a cada 3 episódios (1º, 4º, 7º, etc.)
   */
  const shouldShowAd = useCallback((): boolean => {
    // Incrementar contador de episódios
    const newEpisodeCount = frequencyData.episodeCount + 1;

    // Mostrar anúncio se episodeCount % 3 === 1 (1, 4, 7, 10, ...)
    const show = newEpisodeCount % 3 === 1;

    // Atualizar dados de frequência
    const newData: AdFrequencyData = {
      lastAdShownAt: show ? Date.now() : frequencyData.lastAdShownAt,
      episodeCount: newEpisodeCount,
    };

    saveFrequencyData(newData);

    return show;
  }, [frequencyData, saveFrequencyData]);

  /**
   * Carregar anúncio interstitial
   * Nota: Esta é uma implementação simplificada
   * Em produção, você precisará configurar os Ad Unit IDs no console do AdMob
   */
  const loadInterstitialAd = useCallback(async () => {
    if (!Platform.OS || Platform.OS === "web") {
      console.log("Ads not supported on web platform");
      return;
    }

    try {
      setIsAdLoading(true);
      setError(null);

      // Aqui você implementaria a lógica real de carregamento do AdMob
      // Por enquanto, simulamos um carregamento bem-sucedido
      console.log("Loading interstitial ad...");

      // Simular delay de carregamento
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setIsAdReady(true);
    } catch (err) {
      console.error("Error loading interstitial ad:", err);
      setError(err instanceof Error ? err.message : "Failed to load ad");
      setIsAdReady(false);
    } finally {
      setIsAdLoading(false);
    }
  }, []);

  /**
   * Exibir anúncio interstitial
   * Retorna uma Promise que resolve quando o anúncio é fechado
   */
  const showInterstitialAd = useCallback(async (): Promise<void> => {
    if (!shouldShowAd()) {
      console.log("Ad frequency not reached yet");
      return;
    }

    if (!isAdReady && !isAdLoading) {
      await loadInterstitialAd();
    }

    if (!isAdReady) {
      console.log("Ad not ready");
      return;
    }

    try {
      // Aqui você implementaria a exibição real do anúncio
      console.log("Showing interstitial ad...");

      // Simular exibição do anúncio
      await new Promise((resolve) => setTimeout(resolve, 3000));

      setIsAdReady(false);
    } catch (err) {
      console.error("Error showing interstitial ad:", err);
      setError(err instanceof Error ? err.message : "Failed to show ad");
    }
  }, [shouldShowAd, isAdReady, isAdLoading, loadInterstitialAd]);

  /**
   * Resetar contador de episódios (útil para testes)
   */
  const resetFrequency = useCallback(async () => {
    const newData: AdFrequencyData = {
      lastAdShownAt: 0,
      episodeCount: 0,
    };
    await saveFrequencyData(newData);
  }, [saveFrequencyData]);

  return {
    isAdReady,
    isAdLoading,
    error,
    frequencyData,
    shouldShowAd,
    loadInterstitialAd,
    showInterstitialAd,
    resetFrequency,
    publisherId: ADMOB_PUBLISHER_ID,
    clientId: ADMOB_CLIENT_ID,
  };
}
