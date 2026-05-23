// User types
export type UserRole = 'user' | 'admin' | 'moderator';
export type AuthProvider = 'email' | 'google' | 'facebook' | 'apple';
export type VerificationStatus = 'unverified' | 'verified' | 'rejected';

export interface User {
  id: string;
  supabase_user_id?: string;
  email: string;
  phone_number?: string;
  username: string;
  auth_provider: AuthProvider;
  password_hash?: string;
  balance: number;
  total_wagered: number;
  total_won: number;
  role: UserRole;
  verification_status: VerificationStatus;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

// Game types
export type GameType = 'blitz' | 'duel' | 'tournament';
export type GameStatus = 'waiting' | 'ready' | 'spinning' | 'completed' | 'cancelled';

export interface Game {
  id: string;
  type: GameType;
  status: GameStatus;
  entry_fee: number;
  pot: number;
  players: string[]; // user IDs
  winner_id?: string;
  max_players: number;
  created_at: Date;
  updated_at: Date;
  started_at?: Date;
  ended_at?: Date;
  round_data?: RoundData;
}

export interface RoundData {
  seed: string;
  winner_segment: number;
  durations_ms: number;
  spins: SpinRecord[];
}

export interface SpinRecord {
  user_id: string;
  segment: number;
  timestamp: Date;
  win_amount: number;
}

// Tournament types
export type TournamentStatus = 'registration' | 'in_progress' | 'completed' | 'cancelled';

export interface Tournament {
  id: string;
  status: TournamentStatus;
  entry_fee: number;
  max_players: number;
  current_players: number;
  total_pot: number;
  current_round: number;
  bracket_data: BracketData;
  created_at: Date;
  updated_at: Date;
  started_at?: Date;
  ended_at?: Date;
  winner_id?: string;
}

export interface BracketData {
  round: number;
  groups: BracketGroup[];
  completed_rounds: CompletedRound[];
}

export interface BracketGroup {
  id: string;
  players: string[];
  game_id?: string;
  winner_id?: string;
}

export interface CompletedRound {
  round: number;
  winners: string[];
  timestamp: Date;
}

// Transaction types
export type TransactionType = 'deposit' | 'withdrawal' | 'game_play' | 'game_win' | 'tournament_refund' | 'tournament_payout';
export type TransactionStatus = 'pending' | 'completed' | 'failed' | 'cancelled';
export type PaymentMethod = 'mpesa' | 'paystack' | 'airtel' | 'wallet';

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  status: TransactionStatus;
  payment_method: PaymentMethod;
  reference: string; // provider reference for idempotency
  metadata?: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
  completed_at?: Date;
}

// Escrow types
export type EscrowStatus = 'locked' | 'released' | 'refunded';
export type EscrowEntityType = 'game' | 'tournament';

export interface Escrow {
  id: string;
  user_id: string;
  entity_type: EscrowEntityType;
  entity_id: string;
  amount: number;
  status: EscrowStatus;
  released_to?: string;
  created_at: Date;
  released_at?: Date;
}

// WebSocket event types
export interface MatchmakingPayload {
  gameType: GameType;
  entryFee: number;
}

export interface DuelPayload {
  opponentId: string;
  betAmount: number;
}

export interface ReadyForSpinPayload {
  gameId: string;
}

export interface TournamentJoinPayload {
  tournamentId: string;
}

export interface SpinStartPayload {
  gameId: string;
  duration: number;
  seed: string;
  winnerSegment: number;
}

export interface SpinEndPayload {
  gameId: string;
  winner: string;
  winnings: number;
}

export interface BalanceUpdatePayload {
  newBalance: number;
  delta: number;
}

// JWT payload
export interface JWTPayload {
  user_id: string;
  email: string;
  role: UserRole;
  supabase_user_id?: string;
  iat: number;
  exp: number;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public status: number = 400
  ) {
    super(message);
    this.name = 'AppError';
  }
}
