/**
 * Configuração centralizada do AnimeFire
 * Facilita mudanças de domínio no futuro
 */

export const ANIMEFIRE_CONFIG = {
  // Domínio principal do AnimeFire
  domain: 'animefire.one',
  
  // Domínios alternativos aceitos (para compatibilidade)
  alternativeDomains: ['animefire.io', 'animefire.plus'],
  
  // URL base do site
  get baseUrl(): string {
    return `https://${this.domain}`;
  },
  
  // URL base para animes
  get animeBaseUrl(): string {
    return `${this.baseUrl}/animes`;
  },
  
  // URL base para anime (singular)
  get animeSingularBaseUrl(): string {
    return `${this.baseUrl}/anime`;
  },
  
  // Regex para validar URLs do AnimeFire
  get urlPattern(): RegExp {
    const domains = [this.domain, ...this.alternativeDomains].join('|');
    return new RegExp(`^https://(${domains})/(?:anime|animes)/.+$`);
  },
  
  // Regex para extrair URLs de vídeo
  get videoUrlPattern(): RegExp {
    const domains = [this.domain, ...this.alternativeDomains].join('|');
    return new RegExp(`https://(${domains})/video/[^'"\\s]+`, 'gi');
  }
};

export default ANIMEFIRE_CONFIG;
