import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config.js';
import { query } from '../database/db.js';
import { supabase } from '../database/supabase.js';
import { User, JWTPayload, AppError } from '../types/index.js';
import { logger } from '../utils/logger.js';

type SupabaseProfileMetadata = {
  username?: string;
  preferred_username?: string;
  full_name?: string;
  name?: string;
  avatar_url?: string;
  phone_number?: string;
};

export class AuthService {
  async register(
    email: string,
    password: string,
    username: string,
    authProvider: string = 'email'
  ): Promise<User> {
    try {
      const existingRes = await query(
        'SELECT id FROM users WHERE email = $1 OR username = $2',
        [email, username]
      );

      if (existingRes.rows.length > 0) {
        throw new AppError('USER_EXISTS', 'Email or username already in use', 409);
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const result = await query(
        `INSERT INTO users (email, username, password_hash, auth_provider, balance)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, supabase_user_id, email, phone_number, username, auth_provider, balance, total_wagered, total_won, role, verification_status, is_active, created_at, updated_at`,
        [email, username, passwordHash, authProvider, 1000]
      );

      logger.info(`User registered: ${email}`);
      return result.rows[0] as User;
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error('Registration error:', err);
      throw new AppError('REGISTRATION_FAILED', 'Failed to register user');
    }
  }

  async login(email: string, password: string): Promise<{ user: User; token: string; refreshToken: string }> {
    try {
      const result = await query('SELECT * FROM users WHERE email = $1', [email]);

      if (result.rows.length === 0) {
        throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
      }

      const user = result.rows[0] as User;

      if (!user.password_hash) {
        throw new AppError('NO_PASSWORD', 'User registered with OAuth provider', 401);
      }

      const passwordValid = await bcrypt.compare(password, user.password_hash);

      if (!passwordValid) {
        throw new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401);
      }

      if (!user.is_active) {
        throw new AppError('USER_INACTIVE', 'User account is inactive', 403);
      }

      const token = this.generateToken(user);
      const refreshToken = this.generateRefreshToken(user);

      logger.info(`User logged in: ${email}`);

      return { user, token, refreshToken };
    } catch (err) {
      if (err instanceof AppError) throw err;
      logger.error('Login error:', err);
      throw new AppError('LOGIN_FAILED', 'Login failed');
    }
  }

  async loginOAuth(
    email: string,
    username: string,
    authProvider: string,
    profile?: Record<string, unknown>
  ): Promise<{ user: User; token: string; refreshToken: string }> {
    try {
      const profileMetadata = (profile ?? {}) as SupabaseProfileMetadata;
      const user = await this.findOrCreateSupabaseUser({
        supabaseUserId: typeof profile?.sub === 'string' ? profile.sub : undefined,
        email,
        username,
        authProvider,
        phoneNumber: profileMetadata.phone_number,
      });

      const token = this.generateToken(user);
      const refreshToken = this.generateRefreshToken(user);

      return { user, token, refreshToken };
    } catch (err) {
      logger.error('OAuth login error:', err);
      throw new AppError('OAUTH_LOGIN_FAILED', 'OAuth login failed');
    }
  }

  async verifyToken(token: string): Promise<JWTPayload> {
    try {
      return jwt.verify(token, config.JWT_SECRET) as JWTPayload;
    } catch (legacyError) {
      try {
        const { data, error } = await supabase.auth.getUser(token);

        if (error || !data.user) {
          throw error ?? new Error('Supabase user not found');
        }

        const user = await this.ensureLocalUserForSupabaseIdentity(data.user);

        return {
          user_id: user.id,
          supabase_user_id: data.user.id,
          email: user.email,
          role: user.role,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + 3600,
        };
      } catch (supabaseError) {
        logger.warn('Token verification failed for both legacy JWT and Supabase token', {
          legacyError,
          supabaseError,
        });
        throw new AppError('INVALID_TOKEN', 'Invalid or expired token', 401);
      }
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    try {
      const payload = jwt.verify(refreshToken, config.JWT_SECRET) as JWTPayload;

      const result = await query('SELECT * FROM users WHERE id = $1 AND is_active = true', [
        payload.user_id,
      ]);

      if (result.rows.length === 0) {
        throw new AppError('USER_INACTIVE', 'User is not active', 403);
      }

      const user = result.rows[0] as User;
      return this.generateToken(user);
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError('INVALID_REFRESH_TOKEN', 'Invalid refresh token', 401);
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    const result = await query(
      `SELECT id, supabase_user_id, email, phone_number, username, auth_provider, balance, total_wagered, total_won, role, verification_status, is_active, created_at, updated_at
       FROM users
       WHERE id = $1`,
      [userId]
    );

    return (result.rows[0] as User | undefined) ?? null;
  }

  private async ensureLocalUserForSupabaseIdentity(authUser: {
    id: string;
    email?: string;
    phone?: string | null;
    app_metadata?: { provider?: string };
    user_metadata?: SupabaseProfileMetadata;
  }): Promise<User> {
    const email = authUser.email?.toLowerCase().trim();

    if (!email) {
      throw new AppError('MISSING_EMAIL', 'Supabase user is missing an email address', 400);
    }

    const usernameSeed =
      authUser.user_metadata?.username ||
      authUser.user_metadata?.preferred_username ||
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      email.split('@')[0];

    return this.findOrCreateSupabaseUser({
      supabaseUserId: authUser.id,
      email,
      username: usernameSeed,
      authProvider: authUser.app_metadata?.provider || 'email',
      phoneNumber: authUser.user_metadata?.phone_number || authUser.phone || undefined,
    });
  }

  private async findOrCreateSupabaseUser({
    supabaseUserId,
    email,
    username,
    authProvider,
    phoneNumber,
  }: {
    supabaseUserId?: string;
    email: string;
    username: string;
    authProvider: string;
    phoneNumber?: string;
  }): Promise<User> {
    const normalizedEmail = email.toLowerCase().trim();

    if (supabaseUserId) {
      const bySupabaseId = await query(
        `SELECT id, supabase_user_id, email, phone_number, username, auth_provider, balance, total_wagered, total_won, role, verification_status, is_active, created_at, updated_at
         FROM users
         WHERE supabase_user_id = $1`,
        [supabaseUserId]
      );

      if (bySupabaseId.rows.length > 0) {
        const existing = bySupabaseId.rows[0] as User;
        await query(
          `UPDATE users
           SET email = $2, phone_number = COALESCE($3, phone_number), auth_provider = $4, updated_at = NOW()
           WHERE id = $1`,
          [existing.id, normalizedEmail, phoneNumber ?? null, authProvider]
        );
        return {
          ...existing,
          email: normalizedEmail,
          phone_number: phoneNumber ?? existing.phone_number,
          auth_provider: authProvider as User['auth_provider'],
        };
      }
    }

    const byEmail = await query(
      `SELECT id, supabase_user_id, email, phone_number, username, auth_provider, balance, total_wagered, total_won, role, verification_status, is_active, created_at, updated_at
       FROM users
       WHERE email = $1`,
      [normalizedEmail]
    );

    if (byEmail.rows.length > 0) {
      const existing = byEmail.rows[0] as User;

      await query(
        `UPDATE users
         SET supabase_user_id = COALESCE(supabase_user_id, $2),
             phone_number = COALESCE($3, phone_number),
             auth_provider = $4,
             updated_at = NOW()
         WHERE id = $1`,
        [existing.id, supabaseUserId ?? null, phoneNumber ?? null, authProvider]
      );

      return {
        ...existing,
        supabase_user_id: supabaseUserId ?? existing.supabase_user_id,
        phone_number: phoneNumber ?? existing.phone_number,
        auth_provider: authProvider as User['auth_provider'],
      };
    }

    const availableUsername = await this.generateAvailableUsername(username);
    const result = await query(
      `INSERT INTO users (supabase_user_id, email, phone_number, username, auth_provider, balance)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, supabase_user_id, email, phone_number, username, auth_provider, balance, total_wagered, total_won, role, verification_status, is_active, created_at, updated_at`,
      [supabaseUserId ?? null, normalizedEmail, phoneNumber ?? null, availableUsername, authProvider, 1000]
    );

    return result.rows[0] as User;
  }

  private async generateAvailableUsername(seed: string): Promise<string> {
    const normalizedSeed = seed
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 18);

    const base = normalizedSeed || `player_${Math.floor(Math.random() * 9000) + 1000}`;

    for (let attempt = 0; attempt < 100; attempt += 1) {
      const suffix = attempt === 0 ? '' : `_${attempt + 1}`;
      const candidate = `${base.slice(0, Math.max(3, 18 - suffix.length))}${suffix}`;
      const existing = await query('SELECT 1 FROM users WHERE username = $1 LIMIT 1', [candidate]);

      if (existing.rows.length === 0) {
        return candidate;
      }
    }

    throw new AppError('USERNAME_UNAVAILABLE', 'Could not allocate a unique username', 409);
  }

  private generateToken(user: User): string {
    return jwt.sign(
      {
        user_id: user.id,
        supabase_user_id: user.supabase_user_id,
        email: user.email,
        role: user.role,
      } as Record<string, unknown>,
      config.JWT_SECRET as string,
      { expiresIn: config.JWT_EXPIRATION } as SignOptions
    );
  }

  private generateRefreshToken(user: User): string {
    return jwt.sign(
      {
        user_id: user.id,
        supabase_user_id: user.supabase_user_id,
        email: user.email,
      } as Record<string, unknown>,
      config.JWT_SECRET as string,
      { expiresIn: config.JWT_REFRESH_EXPIRATION } as SignOptions
    );
  }
}

export const authService = new AuthService();
