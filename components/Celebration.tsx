import React from 'react';
import { detectPerformanceProfile, getParticleCount } from '../utils/performanceOptimizer.ts';

interface CelebrationProps {
  winnerName?: string;
  amount?: number;
  isUserWin?: boolean;
}

const Celebration: React.FC<CelebrationProps> = ({ winnerName, amount, isUserWin = false }) => {
  const perfProfile = detectPerformanceProfile();
  const particleCount = getParticleCount(28);
  const formatCurrency = (value: number) => `KSh ${value.toLocaleString()}`;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center z-[300] pointer-events-none p-2 sm:p-4">
      {/* falling dots background - copied style from Blitz WinnerAlert */}
      {!perfProfile.reduceParticles && (
        <div className="absolute inset-0 opacity-80">
          {[...Array(particleCount)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: ['#00ffff', '#ff00ff', '#ffd700', '#00ff00'][Math.floor(Math.random() * 4)],
                animation: `fall 2.6s linear infinite`,
                animationDelay: `${Math.random() * 1.2}s`
              }}
            />
          ))}
        </div>
      )}

      <div className={`relative pointer-events-auto max-w-sm w-full p-3 sm:p-4 md:p-6 rounded-lg shadow-[0_0_100px_rgba(0,0,0,0.6)]`}>
        <div className="text-3xl sm:text-4xl md:text-6xl mb-2 sm:mb-3 md:mb-3 text-center">{isUserWin ? '🎉' : '🏆'}</div>
        <div className={`text-lg sm:text-2xl md:text-3xl font-arcade font-black mb-1.5 sm:mb-2 md:mb-2 text-center ${isUserWin ? 'text-neon-green text-glow-green' : 'text-neon-gold'}`}>
          {isUserWin ? 'YOU WON!' : 'WINNER!'}
        </div>
        {winnerName && (
          <div className="text-center border-b border-white/20 py-2 sm:py-2.5 md:py-3 mb-2 sm:mb-2.5 md:mb-3">
            <div className="text-xs sm:text-sm md:text-lg font-arcade font-bold truncate">{winnerName}</div>
          </div>
        )}
        {amount !== undefined && (
          <div className="text-center">
            <div className="text-[8px] sm:text-[9px] md:text-sm font-arcade uppercase tracking-wider text-slate-300">POT WON</div>
            <div className={`text-lg sm:text-xl md:text-2xl font-arcade font-black ${isUserWin ? 'text-neon-green text-glow-green' : 'text-neon-gold'}`}>+{formatCurrency(amount)}</div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fall {
          to { transform: translateY(100vh) rotate(360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default Celebration;
