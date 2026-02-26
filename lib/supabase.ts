import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
// import { Database } from '@/types/supabase';
// ^ Uncomment after running: supabase gen types typescript --local > types/supabase.ts

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables: EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are required');
}

// Platform-aware storage: localStorage on web, AsyncStorage on native
const storage = Platform.OS === 'web'
    ? (typeof localStorage === 'undefined' ? {
        getItem: () => Promise.resolve(null),
        setItem: () => Promise.resolve(),
        removeItem: () => Promise.resolve(),
    } : {
        getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
        setItem: (key: string, value: string) => Promise.resolve(localStorage.setItem(key, value)),
        removeItem: (key: string) => Promise.resolve(localStorage.removeItem(key)),
    })
    : AsyncStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});
// When you have generated types, change the above to:
// export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, { ... });
