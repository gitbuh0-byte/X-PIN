import React from 'react';
import { Player, GameState } from '../types.ts';

interface RoomStatusProps {
  gameState: GameState;
  playerCount: number;
  maxPlayers: number;
  currentPot: number;
  timer: number;
}

const RoomStatus: React.FC<RoomStatusProps> = ({ gameState, playerCount, maxPlayers, currentPot, timer }) => {
  const formatCurrency = (amount: number) => `KSh ${amount.toLocaleString()}`;

  const getStatusText = () => {
    switch (gameState) {
      case GameState.PRE_GAME:
        return 'READY TO JOIN';
      case GameState.WAITING:
        return `PLAYERS READY - STARTING IN ${timer}s`;
      case GameState.LOCKED:
        return `🔒 ROOM LOCKED - SPINNING IN ${timer}s`;
      case GameState.SPINNING:
        return '🎡 WHEEL SPINNING...';
      case GameState.RESULT:
        return '✓ RESULT CALCULATED';
      case GameState.BETTING:
        return `PLACE BETS - ${timer}s REMAINING`;
      case GameState.COLOR_ASSIGN:
        return 'COLOR ASSIGNMENT';
      default:
        return 'STANDBY';
    }
  };

  const getStatusColor = () => {
    switch (gameState) {
      case GameState.LOCKED:
      case GameState.SPINNING:
        return 'neon-pink';
      case GameState.RESULT:
        return 'neon-green';
      case GameState.WAITING:
        return 'neon-cyan';
      default:
        return 'neon-gold';
    }
  };

  const allPlayersReady = playerCount === maxPlayers;

  return (
    <div className="flex flex-col gap-2 sm:gap-3">
      {/* Status Header */}
      <div className={`bg-black/60 border-2 border-${getStatusColor()} rounded-sm p-3 sm:p-4 text-center`}>
        <div className={`text-[10px] sm:text-[11px] md:text-xs font-arcade text-${getStatusColor()} uppercase tracking-widest font-black`}>
          {getStatusText()}
        </div>
      </div>

      {/* Player Count */}
      <div className="bg-black/40 border border-white/10 rounded-sm p-2 sm:p-3 flex items-center justify-between text-xs sm:text-sm">
        <span className="text-slate-400 font-mono uppercase tracking-widest">Players Ready</span>
        <div className="flex items-center gap-2">
          <span className={`font-arcade font-black ${allPlayersReady ? 'text-neon-green' : 'text-neon-gold'}`}>
            {playerCount}/{maxPlayers}
          </span>
          {allPlayersReady && (
            <span className="text-neon-green text-lg animate-pulse">✓</span>
          )}
        </div>
      </div>

      {/* Pot Display */}
      {currentPot > 0 && (
        <div className="bg-neon-gold/20 border border-neon-gold rounded-sm p-2 sm:p-3 text-center">
          <div className="text-[9px] sm:text-[10px] font-arcade text-neon-gold/70 uppercase tracking-wider mb-1">
            Total Pot
          </div>
          <div className="text-lg sm:text-xl md:text-2xl font-arcade font-black text-neon-gold">
            {formatCurrency(currentPot)}
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomStatus;
