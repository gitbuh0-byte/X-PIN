import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const appOrigin = import.meta.env.VITE_APP_URL || 'https://x-pin-theta.vercel.app';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: (url, params) => {
          const hash = url.hash || '';
          const authFragmentPattern = /access_token=|refresh_token=|provider_token=|code=|error_description=/;
          const hasAuthInHash = authFragmentPattern.test(hash);
          const hasAuthInSearch = Boolean(params.access_token || params.error_description || params.error);
          return hasAuthInHash || hasAuthInSearch;
        },
      },
    })
  : null;

export const getAuthCallbackUrl = () => `${appOrigin}/#/auth/callback`;
