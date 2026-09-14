import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function isValidHttpUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export const isSupabaseConfigured = Boolean(
  rawUrl &&
  rawAnonKey &&
  isValidHttpUrl(rawUrl) &&
  !rawUrl.includes('your_supabase_url') &&
  !rawUrl.includes('placeholder') &&
  !rawAnonKey.includes('your_supabase_anon_key')
);

if (!isSupabaseConfigured) {
  console.warn(
    '[Supabase] URL atau Anon Key belum dikonfigurasi dengan benar di file .env. Aplikasi berjalan dalam mode pratinjau.'
  );
}

// Ensure safe URL for createClient to avoid runtime TypeError
const safeUrl = isValidHttpUrl(rawUrl) ? rawUrl! : 'https://placeholder-project.supabase.co';
const safeKey = (rawAnonKey && !rawAnonKey.includes('your_supabase_anon_key')) 
  ? rawAnonKey 
  : 'placeholder-anon-key-00000000000000000000000000000000';

export const supabase = createClient(safeUrl, safeKey);
