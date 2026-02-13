import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('[Supabase] URL 또는 ANON KEY가 설정되지 않았습니다. 클라우드 기능이 비활성화됩니다.');
}

const DUMMY_URL = 'https://placeholder.supabase.co';
const DUMMY_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MDAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.abc';

export const supabase = createClient(
  supabaseUrl || DUMMY_URL,
  supabaseKey || DUMMY_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: { 'X-Client-Info': 'pulse-diary-pwa' },
    },
  }
);

/** Supabase가 설정되어 있는지 확인 */
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseKey);
}
