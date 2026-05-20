import React from 'react';
import { soundManager } from '../services/soundManager.ts';

interface PlayAgainModalProps {
  isOpen: boolean;
  winnerName: string;
  winAmount: number;
  isUserWin: boolean;
  onPlayAgain: () => void;
  onExit: () => void;
}

const PlayAgainModal: React.FC<PlayAgainModalProps> = ({
  isOpen,
  winnerName,
  winAmount,
  isUserWin,
  onPlayAgain,
  onExit
}) => {
  if (!isOpen) return null;
  const formatCurrency = (amount: number) => `KSh ${amount.toLocaleString()}`;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-black/95 backdrop-blur-lg p-3 sm:p-4">
      <div className="bg-vegas-panel/95 border border-neon-gold rounded-lg w-full max-w-md relative shadow-[0_0_50px_rgba(255,215,0,0.2)] clip-corner overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-gold to-transparent opacity-50"></div>
        
        {/* Winner Information */}
        <div className="p-4 sm:p-6 md:p-8 text-center">
          {isUserWin ? (
            <>
              <div className="text-5xl sm:text-6xl md:text-7xl mb-4">🎉</div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-arcade font-black text-neon-green mb-2 text-glow-green">
                YOU WON!
              </h2>
            </>
          ) : (
            <>
              <div className="text-5xl sm:text-6xl md:text-7xl mb-4">🏆</div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-arcade font-black text-neon-gold mb-2">
                ROUND OVER
              </h2>
            </>
          )}
          
          <div className="border-b border-white/20 py-4 mb-4">
            <p className="text-sm sm:text-base text-slate-300 font-mono mb-2">WINNER</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-arcade font-black text-neon-cyan">
              {winnerName}
            </p>
          </div>

          {isUserWin && (
            <div className="bg-neon-green/20 border border-neon-green rounded-sm p-3 sm:p-4 mb-6">
              <p className="text-xs sm:text-sm text-neon-green/70 font-arcade uppercase tracking-wider mb-2">
                POT WON
              </p>
              <p className="text-2xl sm:text-3xl md:text-4xl font-arcade font-black text-neon-green">
                +{formatCurrency(winAmount)}
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="border-t border-white/10 p-4 sm:p-6 md:p-8 space-y-3 sm:space-y-4">
          <button
            onClick={() => {
              soundManager.play('click');
              onPlayAgain();
            }}
            className="w-full py-3 sm:py-4 bg-neon-cyan text-black font-arcade hover:bg-white transition-colors uppercase text-[10px] sm:text-[11px] md:text-xs tracking-widest rounded-sm shadow-[0_0_15px_rgba(0,255,255,0.4)] font-black active:scale-95"
          >
            ▶ PLAY AGAIN
          </button>
          
          <button
            onClick={() => {
              soundManager.play('beep');
              onExit();
            }}
            className="w-full py-3 sm:py-4 border-2 border-neon-pink text-neon-pink font-arcade hover:bg-neon-pink/20 transition-colors uppercase text-[10px] sm:text-[11px] md:text-xs tracking-widest rounded-sm active:scale-95"
          >
            ✕ EXIT TO LOBBY
          </button>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 bg-black/40 p-2 sm:p-3 text-center">
          <p className="text-[8px] sm:text-[9px] font-mono text-slate-500 uppercase tracking-wider">
            Play again to reset your bets and colors
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlayAgainModal;
