/**
 * Google AdMob Configuration
 * Configure seus IDs do AdMob aqui
 */

export const ADMOB_CONFIG = {
  // IDs fornecidos pelo usuário
  publisherId: "pub-7213751684524160",
  clientId: "277794",

  // AdSense IDs para web
  adSense: {
    client: "ca-pub-7213751684524160",
    slot: "8919461756",
  },

  // Ad Unit IDs (IDs reais do console do AdMob)
  // Formato: ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx
  adUnitIds: {
    // Interstitial ads (tela cheia) - para episódios
    interstitial: {
      android: "ca-app-pub-7213751684524160/8919461756", // ID real fornecido
      ios: "ca-app-pub-7213751684524160/8919461756",     // ID real fornecido
    },
    // Banner ads (rodapé) - crie no console AdMob se necessário
    banner: {
      android: "ca-app-pub-7213751684524160/8919461756", // Usar mesmo ID temporariamente
      ios: "ca-app-pub-7213751684524160/8919461756",     // Usar mesmo ID temporariamente
    },
    // Rewarded ads (com recompensa) - crie no console AdMob se necessário
    rewarded: {
      android: "ca-app-pub-7213751684524160/8919461756", // Usar mesmo ID temporariamente
      ios: "ca-app-pub-7213751684524160/8919461756",     // Usar mesmo ID temporariamente
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
    useTestAds: false,
    // Log detalhado
    enableDebugLogging: false,
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
