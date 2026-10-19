import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

const DEFAULT_SUPABASE_URL = 'https://gntwkruukiqqryjxghgr.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_fVGinlvNn-0H_3ZTI8a3Dw_Z8slHzIl';

export const getSupabase = () => {
  if (supabaseInstance) return supabaseInstance;

  // Бүх өгөгдөл (тоног төхөөрөмж, эрх, засвар) нэг төсөлд байна.
  // Vercel-ийн хуучин VITE_SUPABASE_* хувьсагч эсвэл хөтчид үлдсэн
  // CUSTOM_SUPABASE_* утга устсан төсөл рүү чиглэж болзошгүй тул ашиглахгүй.
  const supabaseUrl: string = DEFAULT_SUPABASE_URL;
  const supabaseAnonKey: string = DEFAULT_SUPABASE_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      'Supabase configuration error: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing in your environment variables. ' +
      'Please check your .env file or deployment settings.'
    );
    return null;
  }

  if (typeof supabaseUrl !== 'string' || !supabaseUrl.startsWith('http')) {
    console.error(
      `Supabase configuration error: Invalid VITE_SUPABASE_URL format. Expected a string starting with http, got: "${supabaseUrl}"`
    );
    return null;
  }

  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      // PKCE: имэйлийн холбоос ?code=... хэлбэрээр ирж, hash router-тэй зөрчилдөхгүй
      auth: { flowType: 'pkce', detectSessionInUrl: true, persistSession: true },
    });
    return supabaseInstance;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
};

export const resetSupabaseInstance = () => {
  supabaseInstance = null;
};

// For backward compatibility
// Модуль ачааллахад клиент үүсгэхгүй — getSupabase()-ийг шаардлагатай үед дуудна
