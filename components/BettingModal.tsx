import React, { useState, useEffect } from 'react';
import { soundManager } from '../services/soundManager.ts';

interface BettingModalProps {
  isOpen: boolean;
  userBalance?: number;
  balance?: number;
  minBet?: number;
  maxBet?: number;
  onConfirm: (betAmount: number) => void;
  onCancel: () => void;
  gameMode: 'blitz' | '1v1' | 'tournament' | 'grandprix';
}

const BettingModal: React.FC<BettingModalProps> = ({
  isOpen,
  userBalance,
  balance,
  minBet = 10,
  maxBet,
  onConfirm,
  onCancel,
  gameMode
}) => {
  const [betAmount, setBetAmount] = useState<string>('50');
  const [error, setError] = useState<string>('');
  const availableBalance = balance || userBalance || 0;
  const maxAllowed = maxBet || availableBalance;
  const formatCurrency = (amount: number) => `KSh ${amount.toLocaleString()}`;

  if (!isOpen) return null;

  const handleBetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setBetAmount(value);
    setError('');
  };

  const handleQuickBet = (amount: number) => {
    if (amount <= availableBalance && amount >= minBet) {
      setBetAmount(amount.toString());
      setError('');
      soundManager.play('click');
    } else {
      setError('Invalid bet amount');
      soundManager.play('warning');
    }
  };

  const handleConfirm = () => {
    const amount = parseInt(betAmount);

    if (isNaN(amount)) {
      setError('Please enter a valid amount');
      soundManager.play('warning');
      return;
    }

    if (amount < minBet) {
      setError(`Minimum bet is KSh ${minBet}`);
      soundManager.play('warning');
      return;
    }

    // Allow onConfirm to be called regardless of balance or max
    // GameRoom will handle all validation and deposit prompts
    soundManager.play('lock');
    onConfirm(amount);
  };

  const modeConfig = {
    blitz: { name: 'BLITZ', color: 'neon-cyan', description: '15-Player Lobby' },
    '1v1': { name: '1v1 DUEL', color: 'neon-green', description: 'Head to Head' },
    tournament: { name: 'TOURNAMENT', color: 'neon-pink', description: '20-Player Elite' },
    grandprix: { name: 'GRAND PRIX', color: 'neon-pink', description: '100 Players • 20 Groups • 5 Per Group' }
  };

  const config = modeConfig[gameMode];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-lg px-3 py-4 sm:p-4">
      <div className={`bg-vegas-panel/95 border border-${config.color}/50 px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 rounded-lg w-full max-w-sm sm:max-w-md max-h-[calc(100dvh-32px)] overflow-y-auto custom-scrollbar relative shadow-[0_0_50px_rgba(0,255,255,0.15)] clip-corner`}>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-cyan to-transparent opacity-50"></div>
        
        {/* Header */}
        <div className="text-center mb-3 sm:mb-4">
          <div className={`text-3xl sm:text-4xl md:text-5xl font-arcade font-black text-${config.color} mb-1 text-glow-cyan`}>
            💰
          </div>
          <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-arcade text-white mb-1 tracking-widest uppercase">
            PLACE YOUR BET
          </h2>
          <p className={`text-[10px] sm:text-xs md:text-sm font-mono text-${config.color} opacity-80`}>
            {config.name} • {config.description}
          </p>
        </div>

        {/* Balance Display */}
        <div className="bg-black/40 border border-white/10 rounded-sm p-2.5 sm:p-3 md:p-4 mb-2.5 sm:mb-3 md:mb-4">
          <div className="text-slate-500 text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1">
            Available Balance
          </div>
          <div className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl font-arcade font-black ${
            (userBalance - parseInt(betAmount)) < 0 ? 'text-red-500' : 'text-neon-green'
          }`}>
            {formatCurrency(userBalance - parseInt(betAmount))}
          </div>
        </div>

        {/* Bet Amount Display */}
        <div className="bg-black/40 border border-white/10 rounded-sm p-2.5 sm:p-3 md:p-4 mb-2.5 sm:mb-3 md:mb-4">
          <div className="text-slate-500 text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1">
            Bet Amount
          </div>
          <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-arcade text-neon-cyan font-black">
            {formatCurrency(parseInt(betAmount))}
          </div>
        </div>

        {/* Quick Bet Buttons */}
        <div className="mb-3 sm:mb-4 md:mb-5">
          <div className="text-slate-500 text-[8px] sm:text-[9px] md:text-[10px] font-bold uppercase tracking-wider mb-1 sm:mb-2">
            Quick Select
          </div>
          <div className="grid grid-cols-4 gap-1 sm:gap-2">
            {[10, 25, 50, 100].map(amount => (
              <button
                key={amount}
                onClick={() => handleQuickBet(amount)}
                disabled={amount > userBalance}
                className={`py-1.5 sm:py-2 md:py-2.5 border font-arcade text-[8px] sm:text-[9px] md:text-xs uppercase tracking-widest transition-all rounded-sm ${
                  amount > userBalance
                    ? 'border-slate-700 text-slate-600 opacity-50 cursor-not-allowed'
                    : 'border-neon-cyan text-neon-cyan hover:bg-neon-cyan/20'
                }`}
              >
                {formatCurrency(amount)}
              </button>
            ))}
          </div>
        </div>

        {/* Info Text */}
        <div className="bg-neon-purple/10 border border-neon-purple/30 rounded-sm p-2.5 sm:p-3 md:p-4 mb-3 sm:mb-4 md:mb-5">
          <p className="text-slate-400 text-[8px] sm:text-[9px] md:text-xs font-mono leading-relaxed">
            Your bet is locked in once confirmed. You cannot enter the game room without placing a bet.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 sm:gap-3 md:gap-4">
          <button
            onClick={() => {
              soundManager.play('click');
              onCancel();
            }}
            className="flex-1 py-2 sm:py-2.5 md:py-3 border border-slate-700 text-slate-400 font-arcade hover:border-white hover:text-white transition-colors uppercase text-[8px] sm:text-[9px] md:text-xs tracking-wide rounded-sm"
          >
            CANCEL
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-2 sm:py-2.5 md:py-3 bg-neon-cyan text-black font-arcade hover:bg-neon-cyan/80 transition-colors uppercase text-[8px] sm:text-[9px] md:text-xs tracking-wide rounded-sm shadow-[0_0_15px_rgba(0,255,255,0.4)] font-black"
          >
            CONFIRM BET
          </button>
        </div>
      </div>
    </div>
  );
};

export default BettingModal;
