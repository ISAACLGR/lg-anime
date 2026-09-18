import { getSettingsValue, initializeSqlite, setSettingsValue } from "@/lib/sqlite-db";

const parseBooleanSetting = (value: string | undefined, fallback: boolean) => {
  if (value === undefined) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }
  return fallback;
};

const parseNumberSetting = (value: string | undefined, fallback: number) => {
  if (value === undefined) {
    return fallback;
  }

  const asNumber = Number(value);
  return Number.isFinite(asNumber) ? asNumber : fallback;
};

export type AppSettings = {
  apiBaseUrl: string;
  oauthServerUrl: string;
  darkMode: boolean;
  videoQuality: string;
  notifications: boolean;
  useScraperApi: boolean;
  cacheEnabled: boolean;
  cacheTtlMs: number;
};

export const APP_SETTINGS_KEY = "app_settings";

export const DEFAULT_APP_SETTINGS: AppSettings = {
  apiBaseUrl: process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000",
  oauthServerUrl:
    process.env.EXPO_PUBLIC_OAUTH_SERVER_URL || "http://localhost:3001",
  darkMode: false,
  videoQuality: "720p",
  notifications: true,
  useScraperApi: parseBooleanSetting(process.env.USE_SCRAPERAPI, false),
  cacheEnabled: parseBooleanSetting(process.env.CACHE_ENABLED, true),
  cacheTtlMs: parseNumberSetting(process.env.CACHE_TTL_MS, 7200000),
};

export async function getAppSettings(): Promise<AppSettings> {
  try {
    await initializeSqlite();
    const parsed = getSettingsValue<Partial<AppSettings>>(APP_SETTINGS_KEY, {}) as Partial<AppSettings>;

    return {
      ...DEFAULT_APP_SETTINGS,
      ...parsed,
      darkMode:
        typeof parsed.darkMode === "boolean" ? parsed.darkMode : DEFAULT_APP_SETTINGS.darkMode,
      notifications:
        typeof parsed.notifications === "boolean"
          ? parsed.notifications
          : DEFAULT_APP_SETTINGS.notifications,
      useScraperApi:
        typeof parsed.useScraperApi === "boolean"
          ? parsed.useScraperApi
          : DEFAULT_APP_SETTINGS.useScraperApi,
      cacheEnabled:
        typeof parsed.cacheEnabled === "boolean"
          ? parsed.cacheEnabled
          : DEFAULT_APP_SETTINGS.cacheEnabled,
      cacheTtlMs:
        typeof parsed.cacheTtlMs === "number"
          ? parsed.cacheTtlMs
          : DEFAULT_APP_SETTINGS.cacheTtlMs,
    };
  } catch (error) {
    console.warn("[runtime-settings] Failed to load settings", error);
    return DEFAULT_APP_SETTINGS;
  }
}

export async function saveAppSettings(
  partial: Partial<AppSettings>,
): Promise<AppSettings> {
  const current = await getAppSettings();
  const next = { ...current, ...partial };
  await initializeSqlite();
  setSettingsValue(APP_SETTINGS_KEY, next);
  return next;
}

export async function getStoredApiBaseUrl(): Promise<string> {
  const { apiBaseUrl } = await getAppSettings();
  return (apiBaseUrl || DEFAULT_APP_SETTINGS.apiBaseUrl).replace(/\/$/, "");
}

export async function getStoredOauthServerUrl(): Promise<string> {
  const { oauthServerUrl } = await getAppSettings();
  return (oauthServerUrl || DEFAULT_APP_SETTINGS.oauthServerUrl).replace(/\/$/, "");
}
