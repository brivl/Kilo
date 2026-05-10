import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

// expo-secure-store has a 2KB per-key limit; large JWT tokens fall back to AsyncStorage
const SecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    const local = await SecureStore.getItemAsync(key);
    if (local !== null) return local;
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      await AsyncStorage.setItem(key, value);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    await SecureStore.deleteItemAsync(key).catch(() => undefined);
    await AsyncStorage.removeItem(key);
  },
};

const extra = Constants.expoConfig?.extra ?? {};

export const supabase = createClient(extra.supabaseUrl as string, extra.supabaseAnonKey as string, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
