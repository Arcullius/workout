import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const memoryStorage = new Map<string, string>();
let warnedStorageFallback = false;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Missing Supabase env vars. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY (or EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY).',
  );
}

const safeStorage = {
  async getItem(key: string) {
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      if (!warnedStorageFallback) {
        warnedStorageFallback = true;
        console.warn('AsyncStorage unavailable. Supabase auth session is using in-memory fallback.');
      }
      return memoryStorage.get(key) ?? null;
    }
  },
  async setItem(key: string, value: string) {
    try {
      await AsyncStorage.setItem(key, value);
    } catch {
      memoryStorage.set(key, value);
    }
  },
  async removeItem(key: string) {
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      memoryStorage.delete(key);
    }
  },
};

export const supabase = createClient(supabaseUrl ?? 'https://example.supabase.co', supabaseAnonKey ?? 'public-anon-key', {
  auth: {
    storage: safeStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
