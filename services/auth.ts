import { initializeApp } from 'firebase/app';
import {
  Auth,
  browserLocalPersistence,
  getAuth,
  setPersistence,
  signOut,
} from 'firebase/auth';
import { AuthMethod, User, UserRank } from '../types.ts';
import { getAuthCallbackUrl, isSupabaseConfigured, supabase } from './supabase.ts';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  avatar: string;
  authMethod: AuthMethod;
  phoneNumber?: string;
}

interface EmailAuthInput {
  email: string;
  password: string;
}

interface RegisterAuthInput extends EmailAuthInput {
  username: string;
  phoneNumber?: string;
}

interface ProfileRow {
  id: string;
  email: string;
  username: string;
  avatar_url: string;
  phone_number: string | null;
  balance: number;
  rank: UserRank;
  rank_xp: number;
  bio: string | null;
  auth_method: AuthMethod;
}

const FIREBASE_CONFIG = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

let firebaseApp: unknown = null;
let firebaseAuth: Auth | null = null;
let firebaseInitialized = false;

const ensureSupabase = () => {
  if (!supabase || !isSupabaseConfigured) {
    throw new Error('Supabase auth is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  }

  return supabase;
};

const pickAvatar = (email: string, avatar?: string | null) =>
  avatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${email}`;

const normalizeAuthMethod = (provider?: string | null): AuthMethod => {
  switch ((provider || '').toLowerCase()) {
    case 'google':
      return AuthMethod.GOOGLE;
    case 'facebook':
      return AuthMethod.FACEBOOK;
    case 'apple':
      return AuthMethod.APPLE;
    default:
      return AuthMethod.EMAIL;
  }
};

const buildDefaultProfile = (authUser: AuthUser): Omit<ProfileRow, 'id'> => ({
  email: authUser.email,
  username: authUser.username,
  avatar_url: authUser.avatar,
  phone_number: authUser.phoneNumber || null,
  balance: 1000,
  rank: UserRank.ROOKIE,
  rank_xp: 0,
  bio: 'Ready to pin it!',
  auth_method: authUser.authMethod,
});

const mapProfileToUser = (profile: ProfileRow): User => ({
  id: profile.id,
  username: profile.username,
  balance: Number(profile.balance ?? 1000),
  avatar: profile.avatar_url,
  rank: profile.rank || UserRank.ROOKIE,
  rankXp: Number(profile.rank_xp ?? 0),
  email: profile.email,
  phoneNumber: profile.phone_number || '',
  bio: profile.bio || 'Ready to pin it!',
  authMethod: profile.auth_method || AuthMethod.EMAIL,
});

const mapSessionUserToAuthUser = (sessionUser: any): AuthUser => {
  const metadata = sessionUser.user_metadata || {};
  const email = sessionUser.email || metadata.email || '';
  const provider = metadata.provider || sessionUser.app_metadata?.provider;

  return {
    id: sessionUser.id,
    username: metadata.username || metadata.full_name || email.split('@')[0] || 'Player',
    email,
    avatar: pickAvatar(email, metadata.avatar_url || metadata.picture || metadata.avatar),
    phoneNumber: metadata.phone_number || metadata.phoneNumber || undefined,
    authMethod: normalizeAuthMethod(provider),
  };
};

export const initializeFirebase = async (): Promise<void> => {
  if (firebaseInitialized && firebaseAuth) return;
  if (!FIREBASE_CONFIG.apiKey) return;

  try {
    firebaseApp = initializeApp(FIREBASE_CONFIG);
    firebaseAuth = getAuth(firebaseApp as any);
    await setPersistence(firebaseAuth, browserLocalPersistence);
    firebaseInitialized = true;
  } catch (error: any) {
    if (error?.code === 'app/duplicate-app') {
      firebaseAuth = getAuth();
      firebaseInitialized = true;
      return;
    }
    throw error;
  }
};

export const initializeGoogleAuth = async (): Promise<void> => undefined;
export const initializeFacebookAuth = async (): Promise<void> => undefined;
export const authenticateWithGoogleFirebase = async (): Promise<AuthUser> => {
  throw new Error('Firebase-first auth is disabled. Use Supabase Google auth instead.');
};

export const signUpWithEmail = async ({ email, password, username, phoneNumber }: RegisterAuthInput): Promise<void> => {
  const client = ensureSupabase();
  const { error } = await client.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: getAuthCallbackUrl(),
      data: {
        username,
        phone_number: phoneNumber,
        auth_method: AuthMethod.EMAIL,
        avatar_url: pickAvatar(email),
      },
    },
  });

  if (error) throw error;
};

export const signInWithEmail = async ({ email, password }: EmailAuthInput): Promise<void> => {
  const client = ensureSupabase();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
};

const oauthProviderMap: Record<AuthMethod, 'google' | 'facebook' | 'apple'> = {
  [AuthMethod.GOOGLE]: 'google',
  [AuthMethod.FACEBOOK]: 'facebook',
  [AuthMethod.APPLE]: 'apple',
  [AuthMethod.EMAIL]: 'google',
};

export const signInWithProvider = async (method: AuthMethod): Promise<void> => {
  if (method === AuthMethod.EMAIL) {
    throw new Error('Email auth must use email/password sign-in.');
  }

  const client = ensureSupabase();
  const provider = oauthProviderMap[method];
  const { error } = await client.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: getAuthCallbackUrl(),
      queryParams: provider === 'google' ? { prompt: 'select_account' } : undefined,
    },
  });

  if (error) throw error;
};

export const processAuthRedirect = async (): Promise<void> => {
  if (!isSupabaseConfigured || !supabase) return;
  const client = ensureSupabase();
  const url = new URL(window.location.href);
  const authCode = url.searchParams.get('code');
  const hasAuthFragment = /access_token=|refresh_token=|provider_token=/.test(window.location.hash);

  if (!authCode && !hasAuthFragment) {
    return;
  }

  if (authCode) {
    const { error } = await client.auth.exchangeCodeForSession(authCode);
    if (error) throw error;
  }

  if (window.history.replaceState) {
    const cleanUrl = `${window.location.origin}${window.location.pathname}${window.location.search}`;
    window.history.replaceState({}, document.title, cleanUrl);
  }
};

export const exchangeAuthCodeForSession = processAuthRedirect;

export const ensureUserProfile = async (authUser: AuthUser): Promise<User> => {
  const client = ensureSupabase();
  const payload = {
    id: authUser.id,
    ...buildDefaultProfile(authUser),
  };

  const { data, error } = await client
    .from('profiles')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return mapProfileToUser(data as ProfileRow);
};

export const getCurrentAuthenticatedUser = async (): Promise<User | null> => {
  if (!isSupabaseConfigured || !supabase) return null;

  const client = ensureSupabase();
  const {
    data: { session },
    error: sessionError,
  } = await client.auth.getSession();

  if (sessionError) throw sessionError;
  if (!session?.user) return null;

  const authUser = mapSessionUserToAuthUser(session.user);
  return ensureUserProfile(authUser);
};

export const subscribeToAuthChanges = (onChange: () => Promise<void> | void) => {
  if (!isSupabaseConfigured || !supabase) {
    return { unsubscribe: () => undefined };
  }

  const {
    data: { subscription },
  } = ensureSupabase().auth.onAuthStateChange(() => {
    void onChange();
  });

  return {
    unsubscribe: () => subscription.unsubscribe(),
  };
};

export const getAccessToken = async (): Promise<string | null> => {
  if (!isSupabaseConfigured || !supabase) return null;
  const {
    data: { session },
  } = await ensureSupabase().auth.getSession();
  return session?.access_token || null;
};

export const syncBackendSession = async (): Promise<void> => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  if (!backendUrl) return;

  const token = await getAccessToken();
  if (!token) return;

  try {
    await fetch(`${backendUrl.replace(/\/$/, '')}/api/auth/session`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch (error) {
    console.warn('Backend session sync skipped:', error);
  }
};

export const updateUserProfile = async (user: User): Promise<void> => {
  const client = ensureSupabase();

  const payload = {
    id: user.id,
    email: user.email || '',
    username: user.username,
    avatar_url: user.avatar,
    phone_number: user.phoneNumber || null,
    balance: user.balance,
    rank: user.rank,
    rank_xp: user.rankXp,
    bio: user.bio || 'Ready to pin it!',
    auth_method: user.authMethod || AuthMethod.EMAIL,
  };

  const { error } = await client.from('profiles').upsert(payload, { onConflict: 'id' });
  if (error) {
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  if (isSupabaseConfigured && supabase) {
    const { error } = await ensureSupabase().auth.signOut();
    if (error) throw error;
  }

  if (firebaseAuth) {
    await signOut(firebaseAuth);
  }
};

export const authenticateWithGoogle = async (): Promise<void> => signInWithProvider(AuthMethod.GOOGLE);
export const authenticateWithFacebook = async (): Promise<void> => signInWithProvider(AuthMethod.FACEBOOK);
export const authenticateWithApple = async (): Promise<void> => signInWithProvider(AuthMethod.APPLE);
export const checkAuthStatus = async (): Promise<User | null> => getCurrentAuthenticatedUser();
