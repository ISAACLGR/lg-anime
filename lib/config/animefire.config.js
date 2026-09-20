/**
 * Configuração centralizada do AnimeFire
 * Facilita mudanças de domínio no futuro
 */

const DOMAIN = 'animefire.one';
const ALTERNATIVE_DOMAINS = ['animefire.io', 'animefire.plus'];
const BASE_URL = `https://${DOMAIN}`;
const ANIME_BASE_URL = `${BASE_URL}/animes`;
const ANIME_SINGULAR_BASE_URL = `${BASE_URL}/anime`;
const DOMAINS_PATTERN = [DOMAIN, ...ALTERNATIVE_DOMAINS].join('|');

const ANIMEFIRE_CONFIG = {
  // Domínio principal do AnimeFire
  domain: DOMAIN,
  
  // Domínios alternativos aceitos (para compatibilidade)
  alternativeDomains: ALTERNATIVE_DOMAINS,
  
  // URL base do site
  baseUrl: BASE_URL,
  
  // URL base para animes
  animeBaseUrl: ANIME_BASE_URL,
  
  // URL base para anime (singular)
  animeSingularBaseUrl: ANIME_SINGULAR_BASE_URL,
  
  // Regex para validar URLs do AnimeFire
  urlPattern: /^https:\/\/(animefire\.one|animefire\.io|animefire\.plus)\/(?:anime|animes)\/.+$/,
  
  // Regex para extrair URLs de vídeo
  videoUrlPattern: /https:\/\/(animefire\.one|animefire\.io|animefire\.plus)\/video\/[^'"\\s]+/gi
};

module.exports = ANIMEFIRE_CONFIG;
