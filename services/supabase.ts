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
          if (url.hash.startsWith('#/auth/callback')) return true;
          if (url.hash.includes('access_token=') || url.hash.includes('refresh_token=') || url.hash.includes('provider_token=')) return true;
          return Boolean(params.access_token || params.error_description || params.error_description);
        },
      },
    })
  : null;

export const getAuthCallbackUrl = () => `${appOrigin}/auth/callback`;
