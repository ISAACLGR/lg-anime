import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

export type FavoriteRow = {
  slug: string;
  title: string;
  cover: string;
  rating: number;
  addedAt: number;
};

export type WatchHistoryRow = {
  animeSlug: string;
  animeTitle: string;
  cover?: string;
  episode: number;
  season: number;
  progress: number;
  lastWatchedAt: number;
  totalDuration: number;
};

const databaseName = "animfire-local.db";
const FAVORITES_KEY = "@animfire:favorites";
const WATCH_HISTORY_KEY = "@animfire:watch_history";
const SETTINGS_KEY = "@animfire:app-settings";

const getNativeSqlite = () => {
  if (Platform.OS === "web") return null;

  try {
    return Function("return require('expo-sqlite')")() as {
      openDatabaseSync: (name: string) => any;
    };
  } catch (error) {
    console.warn("[sqlite-db] expo-sqlite unavailable on this platform", error);
    return null;
  }
};

const nativeSqlite = getNativeSqlite();
const db = nativeSqlite?.openDatabaseSync(databaseName) as SqliteDatabase | null;

type SqliteDatabase = {
  execSync: (query: string) => void;
  getAllSync: <T>(query: string, params?: unknown[]) => T[];
  getFirstSync: <T>(query: string, params?: unknown[]) => T | null;
  runSync: (query: string, params?: unknown[]) => void;
};

const readJson = <T>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const readLocalValue = <T>(key: string, fallback: T): T => {
  if (typeof window !== "undefined" && window.localStorage) {
    return readJson<T>(window.localStorage.getItem(key), fallback);
  }
  return fallback;
};

const writeLocalValue = (key: string, value: unknown) => {
  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.setItem(key, JSON.stringify(value));
  }
};

const ensureSchema = () => {
  if (!db) return;

  db.execSync(`
    CREATE TABLE IF NOT EXISTS favorites (
      slug TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      cover TEXT,
      rating REAL NOT NULL DEFAULT 0,
      addedAt INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS watch_history (
      animeSlug TEXT NOT NULL,
      animeTitle TEXT NOT NULL,
      cover TEXT DEFAULT '',
      episode INTEGER NOT NULL,
      season INTEGER NOT NULL DEFAULT 1,
      progress REAL NOT NULL DEFAULT 0,
      lastWatchedAt INTEGER NOT NULL DEFAULT 0,
      totalDuration INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (animeSlug, season, episode)
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
};

export const initializeSqlite = async () => {
  if (!db) return;

  ensureSchema();

  try {
    const savedFavorites = await AsyncStorage.getItem(FAVORITES_KEY);
    if (savedFavorites) {
      const parsed = JSON.parse(savedFavorites) as FavoriteRow[];
      for (const item of parsed) {
        upsertFavorite(item);
      }
    }

    const savedHistory = await AsyncStorage.getItem(WATCH_HISTORY_KEY);
    if (savedHistory) {
      const parsed = JSON.parse(savedHistory) as WatchHistoryRow[];
      for (const item of parsed) {
        upsertWatchHistory(item);
      }
    }

    const savedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings) as Record<string, unknown>;
      Object.entries(parsed).forEach(([key, value]) => {
        setSettingsValue(key, value);
      });
    }
  } catch (error) {
    console.warn("[sqlite-db] Legacy migration failed", error);
  }
};

export const listFavorites = (): FavoriteRow[] => {
  if (!db) {
    return readLocalValue<FavoriteRow[]>(FAVORITES_KEY, []);
  }

  ensureSchema();
  return db.getAllSync<FavoriteRow>(`SELECT slug, title, cover, rating, addedAt FROM favorites ORDER BY addedAt DESC`);
};

export const upsertFavorite = (anime: FavoriteRow) => {
  if (!db) {
    const existing = readLocalValue<FavoriteRow[]>(FAVORITES_KEY, []);
    const next = [anime, ...existing.filter((item) => item.slug !== anime.slug)].sort(
      (a, b) => (b.addedAt || 0) - (a.addedAt || 0),
    );
    writeLocalValue(FAVORITES_KEY, next);
    return;
  }

  ensureSchema();
  db.runSync(
    `INSERT OR REPLACE INTO favorites (slug, title, cover, rating, addedAt)
     VALUES (?, ?, ?, ?, ?)`,
    [anime.slug, anime.title, anime.cover, anime.rating, anime.addedAt],
  );
};

export const removeFavoriteBySlug = (slug: string) => {
  if (!db) {
    const existing = readLocalValue<FavoriteRow[]>(FAVORITES_KEY, []);
    writeLocalValue(FAVORITES_KEY, existing.filter((item) => item.slug !== slug));
    return;
  }

  ensureSchema();
  db.runSync(`DELETE FROM favorites WHERE slug = ?`, [slug]);
};

export const clearFavorites = () => {
  if (!db) {
    writeLocalValue(FAVORITES_KEY, []);
    return;
  }

  ensureSchema();
  db.runSync(`DELETE FROM favorites`);
};

export const listWatchHistory = (): WatchHistoryRow[] => {
  if (!db) {
    return readLocalValue<WatchHistoryRow[]>(WATCH_HISTORY_KEY, []);
  }

  ensureSchema();
  return db.getAllSync<WatchHistoryRow>(`SELECT animeSlug, animeTitle, cover, episode, season, progress, lastWatchedAt, totalDuration FROM watch_history ORDER BY lastWatchedAt DESC`);
};

export const upsertWatchHistory = (item: WatchHistoryRow) => {
  if (!db) {
    const existing = readLocalValue<WatchHistoryRow[]>(WATCH_HISTORY_KEY, []);
    const next = [item, ...existing.filter((entry) => !(entry.animeSlug === item.animeSlug && entry.season === item.season && entry.episode === item.episode))].slice(0, 100);
    writeLocalValue(WATCH_HISTORY_KEY, next);
    return;
  }

  ensureSchema();
  db.runSync(
    `INSERT OR REPLACE INTO watch_history (animeSlug, animeTitle, cover, episode, season, progress, lastWatchedAt, totalDuration)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [item.animeSlug, item.animeTitle, item.cover || '', item.episode, item.season, item.progress, item.lastWatchedAt, item.totalDuration],
  );
};

export const removeWatchHistoryItem = (animeSlug: string, season: number, episode: number) => {
  if (!db) {
    const existing = readLocalValue<WatchHistoryRow[]>(WATCH_HISTORY_KEY, []);
    const next = existing.filter((entry) => !(entry.animeSlug === animeSlug && entry.season === season && entry.episode === episode));
    writeLocalValue(WATCH_HISTORY_KEY, next);
    return;
  }

  ensureSchema();
  db.runSync(
    `DELETE FROM watch_history WHERE animeSlug = ? AND season = ? AND episode = ?`,
    [animeSlug, season, episode],
  );
};

export const clearWatchHistory = () => {
  if (!db) {
    writeLocalValue(WATCH_HISTORY_KEY, []);
    return;
  }

  ensureSchema();
  db.runSync(`DELETE FROM watch_history`);
};

export const getSettingsValue = <T = unknown>(key: string, fallback: T): T => {
  if (!db) {
    const raw = readLocalValue<Record<string, unknown>>(SETTINGS_KEY, {});
    const value = raw[key];
    return value === undefined ? fallback : (value as T);
  }

  ensureSchema();
  const row = db.getFirstSync<{ value: string }>(`SELECT value FROM app_settings WHERE key = ?`, [key]);
  if (!row) return fallback;

  try {
    return JSON.parse(row.value) as T;
  } catch {
    return fallback;
  }
};

export const setSettingsValue = (key: string, value: unknown) => {
  if (!db) {
    const next = readLocalValue<Record<string, unknown>>(SETTINGS_KEY, {});
    next[key] = value;
    writeLocalValue(SETTINGS_KEY, next);
    return;
  }

  ensureSchema();
  db.runSync(`INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)`, [key, JSON.stringify(value)]);
};

export const getAllSettings = () => {
  if (!db) {
    return readLocalValue<Record<string, unknown>>(SETTINGS_KEY, {});
  }

  ensureSchema();
  const rows = db.getAllSync<{ key: string; value: string }>(`SELECT key, value FROM app_settings`);
  return rows.reduce<Record<string, unknown>>((acc, row) => {
    try {
      acc[row.key] = JSON.parse(row.value);
    } catch {
      acc[row.key] = row.value;
    }
    return acc;
  }, {});
};
