export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = "Please login (10001)";
export const NOT_ADMIN_ERR_MSG = "You do not have required permission (10002)";

// ScraperAPI Configuration
export const SCRAPERAPI_CONFIG = {
  URL: process.env.SCRAPERAPI_URL || 'https://api.scraperapi.com',
  DEVICE_TYPE: process.env.SCRAPERAPI_DEVICE_TYPE || 'desktop',
  COUNTRY_CODE: process.env.SCRAPERAPI_COUNTRY_CODE || 'br',
  KEY: process.env.SCRAPERAPI_KEY || '08d973cbf0af4a48f4f5dbb373475b9d', // Apenas do .env
};

// Cache Configuration
export const CACHE_CONFIG = {
  TTL_MS: parseInt(process.env.CACHE_TTL_MS) || 7200000, // 2 horas
};

// Development Configuration
export const DEV_CONFIG = {
  IS_LOCAL: process.env.IS_LOCAL === 'true',
  EXPO_PORT: parseInt(process.env.EXPO_PORT) || 8082,
};
