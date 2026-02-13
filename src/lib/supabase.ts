import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('[Supabase] URL 또는 ANON KEY가 설정되지 않았습니다. 클라우드 기능이 비활성화됩니다.');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseKey || '',
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
