import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('Missing Supabase environment variables.');
}

export const supabase = createClient(
  supabaseUrl ?? 'https://example.supabase.co',
  supabaseKey ?? 'public-anon-key',
);
