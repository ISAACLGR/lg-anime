import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Detectar se está na web
const isWeb = Platform.OS === "web" || typeof window !== "undefined";

// Interface para dados de frequência de anúncios
interface AdFrequencyData {
  lastAdShownAt: number;
  episodeCount: number;
}

// Chave para armazenamento local
const AD_FREQUENCY_KEY = "@animfire:ad_frequency";

/**
 * Hook unificado para gerenciar anúncios AdMob (mobile) e AdSense (web)
 * Detecta automaticamente a plataforma e usa o SDK apropriado
 */
export function useAdMobAds() {
  const [isAdReady, setIsAdReady] = useState(false);
  const [isAdLoading, setIsAdLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interstitial, setInterstitial] = useState<any>(null);
  const [frequencyData, setFrequencyData] = useState<AdFrequencyData>({
    lastAdShownAt: 0,
    episodeCount: 0,
  });

  // Carregar dados de frequência do AsyncStorage
  const loadFrequencyData = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(AD_FREQUENCY_KEY);
      if (stored) {
        setFrequencyData(JSON.parse(stored));
      }
    } catch (err) {
      console.error("Error loading frequency data:", err);
    }
  }, []);

  // Salvar dados de frequência no AsyncStorage
  const saveFrequencyData = useCallback(async (data: AdFrequencyData) => {
    try {
      await AsyncStorage.setItem(AD_FREQUENCY_KEY, JSON.stringify(data));
      setFrequencyData(data);
    } catch (err) {
      console.error("Error saving frequency data:", err);
    }
  }, []);

  // Carregar anúncio interstitial
  const loadInterstitialAd = useCallback(async () => {
    if (isWeb) {
      // Web: prepara anúncio AdSense (sem SDK nativo)
      try {
        setIsAdLoading(true);
        setError(null);

        console.log("Preparing web ad slot...");
        
        // Pequeno delay para simulação
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setIsAdReady(true);
        setIsAdLoading(false);
        console.log("Web ad ready (simulated)");
      } catch (err) {
        console.error("Error preparing web ad:", err);
        setError(err instanceof Error ? err.message : "Failed to prepare ad");
        setIsAdReady(false);
        setIsAdLoading(false);
      }
    } else {
      // Mobile: usa SDK AdMob (só executa em mobile)
      try {
        setIsAdLoading(true);
        setError(null);

        // Verificar se está em mobile antes de importar
        if (Platform.OS === "ios" || Platform.OS === "android") {
          // Importação dinâmica segura só em mobile
          const AdMob = eval('require')("react-native-google-mobile-ads");
          const MobileAds = AdMob.default;
          const InterstitialAd = AdMob.InterstitialAd;
          
          // Configurar AdMob
          await MobileAds().initialize();
          
          // Criar anúncio interstitial
          const adUnitId = __DEV__ 
            ? "ca-app-pub-3940256099942544/1033173712" // Test Ad Unit ID
            : "ca-app-pub-7213751684524160/8919461756"; // Production Ad Unit ID

          const ad = InterstitialAd.createForAdRequest(adUnitId, {
            requestNonPersonalizedAdsOnly: true,
          });

          ad.addAdEventListener("adLoaded", () => {
            setIsAdReady(true);
            setIsAdLoading(false);
            console.log("Mobile ad loaded successfully");
          });

          ad.addAdEventListener("adFailedToLoad", (error: any) => {
            setError(error.message);
            setIsAdReady(false);
            setIsAdLoading(false);
            console.error("Mobile ad failed to load:", error);
          });

          ad.addAdEventListener("adClosed", () => {
            setIsAdReady(false);
            loadInterstitialAd(); // Preparar próximo anúncio
          });

          await ad.load();
          setInterstitial(ad);
        } else {
          // Plataforma desconhecida, simula como web
          await new Promise(resolve => setTimeout(resolve, 500));
          setIsAdReady(true);
          setIsAdLoading(false);
        }
      } catch (err) {
        console.error("Error preparing mobile ad:", err);
        setError(err instanceof Error ? err.message : "Failed to prepare mobile ad");
        setIsAdReady(false);
        setIsAdLoading(false);
      }
    }
  }, [isWeb]);

  /**
   * Determina se um anúncio deve ser exibido
   * Agora mostra anúncio a cada episódio
   */
  const shouldShowAd = useCallback((): boolean => {
    // Incrementar contador de episódios
    const newEpisodeCount = frequencyData.episodeCount + 1;

    // Mostrar anúncio em TODOS os episódios
    const show = true;

    // Atualizar dados de frequência
    const newData: AdFrequencyData = {
      lastAdShownAt: show ? Date.now() : frequencyData.lastAdShownAt,
      episodeCount: newEpisodeCount,
    };

    saveFrequencyData(newData);

    return show;
  }, [frequencyData, saveFrequencyData]);

  // Mostrar anúncio interstitial
  const showInterstitialAd = useCallback(() => {
    if (isWeb) {
      // Web: o componente WebInterstitialAd cuida da exibição
      console.log("Web ad should be shown via WebInterstitialAd component");
      return true;
    } else {
      // Mobile: usa SDK AdMob
      if (interstitial && isAdReady) {
        interstitial.show();
        return true;
      }
      return false;
    }
  }, [isWeb, interstitial, isAdReady]);

  // Carregar dados iniciais quando o componente montar
  useEffect(() => {
    loadFrequencyData();
    // Carregar anúncio para ambas as plataformas
    loadInterstitialAd();
  }, [loadFrequencyData, loadInterstitialAd, isWeb]);

  return {
    isAdReady,
    isAdLoading,
    error,
    interstitial,
    isWeb,
    shouldShowAd,
    showInterstitialAd,
    frequencyData,
    loadInterstitialAd,
  };
}
