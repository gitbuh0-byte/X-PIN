import React, { useEffect, useState } from 'react';

interface TournamentWinnerAnimationProps {
  isUserWinner: boolean;
  winnerCount: number;
}

const TournamentWinnerAnimation: React.FC<TournamentWinnerAnimationProps> = ({ isUserWinner, winnerCount }) => {
  const [confetti, setConfetti] = useState<Array<{ id: number; x: number; y: number; delay: number; duration: number }>>([]);

  useEffect(() => {
    // Generate random confetti particles
    const particles = Array.from({ length: 50 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 0.3,
      duration: 2 + Math.random() * 1.5
    }));
    setConfetti(particles);
  }, []);

  return (
    <div className="fixed inset-0 z-[200] pointer-events-none">
      {/* Confetti layer - behind everything */}
      {confetti.map(p => {
        const emoji = ['🎉', '✨', '🎊', '🥳', '💥', '🪅', '🎈'][p.id % 7];
        return (
          <div
            key={p.id}
            className="absolute text-sm sm:text-lg md:text-2xl"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              animation: `fall ${p.duration}s linear forwards`,
              animationDelay: `${p.delay}s`,
              opacity: 0.8
            }}
          >
            {emoji}
          </div>
        );
      })}

      {/* Text above winner cards - non-obstructing */}
      <div className="absolute top-4 sm:top-8 left-1/2 -translate-x-1/2 text-center px-4 w-full">
        <div className="text-3xl sm:text-4xl md:text-5xl mb-1 sm:mb-2">🏆</div>
        <div className="bg-gradient-to-r from-neon-gold via-neon-cyan to-neon-pink bg-clip-text text-transparent text-lg sm:text-2xl md:text-3xl font-arcade font-black tracking-wider">
          GROUP WINNERS!
        </div>
        {isUserWinner && (
          <div className="mt-2 sm:mt-3 text-neon-green font-arcade text-xs sm:text-sm md:text-lg drop-shadow-[0_0_20px_rgba(0,255,0,0.8)]">
            🎊 YOU ADVANCED! 🎊
          </div>
        )}
        <div className="mt-1 sm:mt-2 text-neon-cyan font-arcade text-[9px] sm:text-[10px] md:text-xs tracking-widest">
          {winnerCount} Winners Selected
        </div>
      </div>

      {/* Winner/Loser Image - Bottom Right Corner of Screen */}
      <div className="fixed bottom-6 right-6 z-[250] pointer-events-none bg-transparent max-w-[320px] max-h-[320px]">
        <img 
          src={isUserWinner ? '/winner.png' : '/loser.png'}
          alt={isUserWinner ? 'Winner' : 'Loser'}
          className={`w-48 h-48 sm:w-64 sm:h-64 md:w-80 md:h-80 object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.8)] bg-transparent ${isUserWinner ? 'animate-winner-bounce' : 'animate-loser-shake'}`}
          style={{ backgroundColor: 'transparent' }}
        />
      </div>

      {/* Falling animation keyframes */}
      <style>{`
        @keyframes fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
        @keyframes winnerBreathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.12); }
        }
        @keyframes loserShake {
          0%, 100% { transform: translateX(0) rotate(0deg) scale(1); opacity: 1; }
          25% { transform: translateX(-8px) rotate(-4deg) scale(0.96); opacity: 0.85; }
          50% { transform: translateX(8px) rotate(4deg) scale(0.92); opacity: 0.7; }
          75% { transform: translateX(-8px) rotate(-4deg) scale(0.96); opacity: 0.85; }
        }
        .animate-winner-bounce {
          animation: winnerBreathe 2.5s ease-in-out infinite;
        }
        .animate-loser-shake {
          animation: loserShake 2.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default TournamentWinnerAnimation;
