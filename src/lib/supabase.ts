import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = () => {
  if (supabaseInstance) return supabaseInstance;

  // 1. Try localStorage first (User input fallback)
  let supabaseUrl = localStorage.getItem('CUSTOM_SUPABASE_URL');
  let supabaseAnonKey = localStorage.getItem('CUSTOM_SUPABASE_ANON_KEY');

  // 2. Try environment variables
  if (!supabaseUrl || !supabaseAnonKey) {
    supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  }

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
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
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
export const supabase = getSupabase();
