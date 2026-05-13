
export enum PaymentMethod {
  PAYPAL = 'PayPal',
  MPESA = 'M-Pesa',
  AIRTEL = 'Airtel Money',
  PAYSTACK = 'Paystack',
  PESAPAL = 'Pesapal'
}

export enum GameState {
  PRE_GAME = 'PRE_GAME',      // Before bet placement
  BETTING = 'BETTING',        // Bet placement phase (5 seconds)
  COLOR_ASSIGN = 'COLOR_ASSIGN', // Color assignment phase
  WAITING = 'WAITING',        // Waiting for players to ready up
  LOCKED = 'LOCKED',          // Game locked, all players ready
  SPINNING = 'SPINNING',      // Wheel is spinning
  RESULT = 'RESULT'           // Result phase
}

export enum PlayerStatus {
  IDLE = 'IDLE',
  THINKING = 'THINKING',
  PLACED = 'PLACED', // Bet placed, in 5s window
  CONFIRMED = 'CONFIRMED' // 5s passed, locked in
}

export enum UserRank {
  ROOKIE = 'ROOKIE',
  PRO = 'PRO',
  MASTER = 'MASTER',
  LEGEND = 'LEGEND'
}

export enum AuthMethod {
  EMAIL = 'EMAIL',
  GOOGLE = 'GOOGLE',
  FACEBOOK = 'FACEBOOK',
  APPLE = 'APPLE'
}

export interface User {
  id: string;
  username: string;
  balance: number;
  avatar: string;
  rank: UserRank;
  rankXp: number; // Wins in competitive modes
  email?: string;
  phoneNumber?: string;
  bio?: string;
  authMethod?: AuthMethod;
}

export interface Player {
  id: string;
  username: string;
  avatar: string;
  betAmount: number;
  selectedColor: string;
  assignedColor: string; // The color this player must bet on
  status: PlayerStatus;
  isBot: boolean;
  lockInTime?: number; // Timestamp when bet becomes confirmed
  color?: string;
  rank?: UserRank; // Display rank in game
}

export interface Transaction {
  id: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'WIN' | 'LOSS';
  amount: number;
  method?: PaymentMethod;
  date: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
}

export interface Room {
  id: string;
  name: string;
  type: 'COMPETITIVE' | 'TOURNAMENT';
  capacity: number;
  entryFee: number;
  prizePool: number;
  players: Player[];
  gameState: GameState;
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  isAi?: boolean;
  timestamp: Date;
}

export interface GameSession {
  id: string;
  type: 'blitz' | '1v1' | 'tournament' | 'grandprix' | 'custom'; // Game mode
  mode: 'blitz' | '1v1' | 'tournament' | 'grandprix' | 'custom'; // Alternative alias
  status: string; // e.g., "SPINNING", "WAITING"
  themeColor: string;
  lastUpdate: number;
  playerCount?: number;
  maxPlayers?: number;
  isLocked?: boolean;
  groupNumber?: number; // For Grand Prix: which group (1-10)
  totalPot?: number; // For Grand Prix: total pot from all 100 players
}

export interface CustomRoomPlayer {
  id: string;
  username: string;
  avatar: string;
  rank: UserRank;
  joinedAt: number;
}

export interface CustomGameRoom {
  id: string;
  name: string;
  creatorId: string;
  creatorName: string;
  entryFee: number;
  maxPlayers: number;
  gameMode: 'blitz' | '1v1';
  readyCountdown: number;
  spinCountdown: number;
  createdAt: number;
  players: CustomRoomPlayer[];
}

export interface GrandPrixGroup {
  groupNumber: number; // 1-10
  players: Player[];
  roomId: string;
  winner?: Player;
  spinning: boolean;
  totalPot: number;
}

export interface GrandPrixState {
  totalPlayers: number; // 100
  groups: GrandPrixGroup[]; // 10 groups
  groupWinners: Player[]; // Winners from each group (10)
  finalSpinning: boolean;
  grandWinner?: Player;
  totalPot: number; // Sum of all bets
}
