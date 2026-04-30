/**
 * Google AdMob Configuration
 * Configure seus IDs do AdMob aqui
 */

export const ADMOB_CONFIG = {
  // IDs fornecidos pelo usuário
  publisherId: "pub-7213751684524160",
  clientId: "277794",

  // Ad Unit IDs (você precisa criar estes no console do AdMob)
  // Formato: ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx
  adUnitIds: {
    // Interstitial ads (tela cheia) - para episódios
    interstitial: {
      android: "ca-app-pub-3940256099942544/1033173712", // Test ad unit
      ios: "ca-app-pub-3940256099942544/4411468910", // Test ad unit
    },
    // Banner ads (rodapé)
    banner: {
      android: "ca-app-pub-3940256099942544/6300978111", // Test ad unit
      ios: "ca-app-pub-3940256099942544/2934735716", // Test ad unit
    },
    // Rewarded ads (com recompensa)
    rewarded: {
      android: "ca-app-pub-3940256099942544/5224354917", // Test ad unit
      ios: "ca-app-pub-3940256099942544/1712485313", // Test ad unit
    },
  },

  // Configurações de frequência de anúncios
  frequency: {
    // Mostrar anúncio a cada X episódios
    episodeInterval: 3,
    // Mínimo de tempo que o anúncio deve ser exibido (ms)
    minDisplayTime: 3000,
    // Máximo de tentativas de carregamento
    maxLoadAttempts: 3,
  },

  // Configurações de teste
  testing: {
    // Usar ad units de teste (não gera receita)
    useTestAds: true,
    // Log detalhado
    enableDebugLogging: true,
  },
};

/**
 * Obter o Ad Unit ID apropriado para a plataforma
 */
export function getAdUnitId(
  adType: "interstitial" | "banner" | "rewarded",
  platform: "android" | "ios"
): string {
  return ADMOB_CONFIG.adUnitIds[adType][platform];
}

/**
 * Validar se os IDs do AdMob estão configurados
 */
export function validateAdMobConfig(): boolean {
  const { publisherId, clientId } = ADMOB_CONFIG;

  if (!publisherId || !clientId) {
    console.warn("AdMob configuration incomplete. Please set publisherId and clientId.");
    return false;
  }

  return true;
}

/**
 * Obter informações de configuração para logging
 */
export function getAdMobConfigInfo(): string {
  return `
AdMob Configuration:
- Publisher ID: ${ADMOB_CONFIG.publisherId}
- Client ID: ${ADMOB_CONFIG.clientId}
- Episode Interval: Every ${ADMOB_CONFIG.frequency.episodeInterval} episodes
- Min Display Time: ${ADMOB_CONFIG.frequency.minDisplayTime}ms
- Use Test Ads: ${ADMOB_CONFIG.testing.useTestAds}
  `;
}
