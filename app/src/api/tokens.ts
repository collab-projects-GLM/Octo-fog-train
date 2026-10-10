import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export type Tokens = { access: string; refresh: string };

const REFRESH_KEY = "octo.refresh-token";

/**
 * The access token only lives in memory (it expires in minutes). The refresh
 * token is what survives a restart: Keychain/Keystore on native, localStorage
 * on web, where SecureStore isn't available.
 */
let accessToken: string | null = null;

const expiredListeners = new Set<() => void>();

async function readPersisted(): Promise<string | null> {
  try {
    if (Platform.OS === "web") {
      return typeof localStorage === "undefined"
        ? null
        : localStorage.getItem(REFRESH_KEY);
    }
    return await SecureStore.getItemAsync(REFRESH_KEY);
  } catch {
    return null;
  }
}

async function writePersisted(value: string | null): Promise<void> {
  try {
    if (Platform.OS === "web") {
      if (typeof localStorage === "undefined") return;
      if (value === null) localStorage.removeItem(REFRESH_KEY);
      else localStorage.setItem(REFRESH_KEY, value);
      return;
    }
    if (value === null) await SecureStore.deleteItemAsync(REFRESH_KEY);
    else await SecureStore.setItemAsync(REFRESH_KEY, value);
  } catch {
    // Storage unavailable: the session just won't survive a restart.
  }
}

export const getAccessToken = () => accessToken;

export const getRefreshToken = readPersisted;

export async function saveTokens(tokens: Tokens): Promise<void> {
  accessToken = tokens.access;
  await writePersisted(tokens.refresh);
}

export async function clearTokens(): Promise<void> {
  accessToken = null;
  await writePersisted(null);
}

/** Called when the server definitively rejects the refresh token. */
export function onSessionExpired(listener: () => void): () => void {
  expiredListeners.add(listener);
  return () => expiredListeners.delete(listener);
}

export function notifySessionExpired(): void {
  expiredListeners.forEach((listener) => listener());
}
