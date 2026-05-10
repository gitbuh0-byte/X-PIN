import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { soundManager } from '../services/soundManager.ts';
import { User, UserRank } from '../types.ts';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, bet: number) => void;
}

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('');
  const [bet, setBet] = useState('50');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="bg-vegas-panel/90 border border-neon-purple/50 p-4 sm:p-6 rounded-lg w-full max-w-md relative shadow-[0_0_50px_rgba(191,0,255,0.15)] clip-corner max-h-[95vh] my-auto overflow-y-auto">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-purple to-transparent opacity-50"></div>
        
        <h2 className="text-lg sm:text-xl md:text-2xl font-arcade text-white mb-4 sm:mb-6 text-center tracking-widest uppercase">HOST <span className="text-neon-purple">X ROOM</span></h2>
        
        <div className="space-y-3 sm:space-y-4 md:space-y-6">
          <div>
            <label className="block text-slate-400 text-[8px] sm:text-[9px] md:text-[10px] font-bold uppercase tracking-wider mb-1.5 sm:mb-2">Room Name</label>
            <input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black/50 border border-white/10 p-2 sm:p-3 md:p-4 text-white font-mono text-xs sm:text-sm focus:border-neon-purple focus:outline-none focus:bg-white/5 transition-all rounded-sm"
              placeholder="e.g. ELITE TABLE"
            />
          </div>
          <div>
            <label className="block text-slate-400 text-[8px] sm:text-[9px] md:text-[10px] font-bold uppercase tracking-wider mb-1.5 sm:mb-2">Min Bet ($)</label>
            <div className="relative">
              <span className="absolute left-2 sm:left-3 md:left-4 top-1/2 -translate-y-1/2 text-neon-purple font-arcade text-sm">$</span>
              <input 
                type="number"
                value={bet}
                onChange={(e) => setBet(e.target.value)}
                className="w-full bg-black/50 border border-white/10 p-2 sm:p-3 md:p-4 pl-7 sm:pl-8 md:pl-10 text-white font-mono text-xs sm:text-sm focus:border-neon-purple focus:outline-none focus:bg-white/5 transition-all rounded-sm"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 sm:gap-3 md:gap-4 mt-6 sm:mt-8">
          <button 
            onClick={() => { soundManager.play('click'); onClose(); }} 
            className="flex-1 py-2 sm:py-2.5 md:py-3 border border-slate-700 text-slate-400 font-arcade hover:border-white hover:text-white transition-colors uppercase text-[8px] sm:text-[9px] md:text-xs"
          >
            CANCEL
          </button>
          <button 
            onClick={() => { 
              if(name && bet) { 
                soundManager.play('lock'); 
                onCreate(name, parseInt(bet)); 
              } 
            }} 
            className="flex-1 py-2 sm:py-2.5 md:py-3 bg-neon-purple text-white font-arcade hover:bg-neon-purple/80 transition-colors uppercase text-[8px] sm:text-[9px] md:text-xs tracking-wide shadow-[0_0_15px_rgba(191,0,255,0.4)]"
          >
            CREATE
          </button>
        </div>
      </div>
    </div>
  );
};

interface HomeProps {
    user: User;
    onJoinGame?: (roomId: string) => void;
}

const Home: React.FC<HomeProps> = ({ user, onJoinGame }) => {
  const navigate = useNavigate();
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  const canCreateRoom = user.rank === UserRank.MASTER || user.rank === UserRank.LEGEND;

  const handleCreateRoom = (name: string, bet: number) => {
    setCreateModalOpen(false);
    const roomId = `custom-${Date.now()}?name=${encodeURIComponent(name)}&minBet=${bet}`;
    soundManager.forceBgmStart(); // Start background music when creating room
    if (onJoinGame) {
        onJoinGame(roomId);
    } else {
        navigate(`/room/${roomId}`);
    }
  };
  
  const handleHover = () => {
    soundManager.play('hover');
  };

  const handleGameStart = (roomId: string) => {
    soundManager.play('start');
    soundManager.forceBgmStart(); // Start background music on game start
    if (onJoinGame) {
        onJoinGame(roomId);
    } else {
        navigate(`/room/${roomId}`);
    }
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto flex flex-col justify-center min-h-[calc(100dvh-116px)] lg:min-h-[calc(100dvh-80px)] mt-2 sm:mt-6 md:mt-10 w-full">
      {/* Hero */}
      <div className="text-center mb-6 sm:mb-8 md:mb-12 relative mt-4 sm:mt-8 md:mt-12 z-20">
        <h1 className="relative z-10 text-5xl min-[380px]:text-6xl md:text-9xl font-arcade font-black text-white mb-2">
          X <span className="text-neon-pink text-glow-pink">PIN</span>
        </h1>
        <div className="h-1 w-16 md:w-24 bg-gradient-to-r from-neon-cyan via-white to-neon-pink mx-auto mb-4 md:mb-6"></div>
        <p className="relative z-10 text-slate-400 font-mono text-[10px] md:text-lg tracking-[0.14em] sm:tracking-[0.2em] md:tracking-[0.3em] uppercase opacity-80 px-2">
          Hyper-Competitive Betting Engine
        </p>
        
        <div className="mt-6 md:mt-8 inline-flex items-center gap-2 md:gap-3 px-3 py-1 md:px-4 md:py-1.5 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-neon-green rounded-full animate-pulse shadow-[0_0_5px_lime]"></span>
          <span className="font-ui font-bold text-neon-green text-[9px] md:text-xs tracking-wide">3,102 ONLINE NOW</span>
        </div>
      </div>

      {/* Game Modes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 w-full relative z-30 mb-8 md:mb-10">
        
        {/* Quick Match Card */}
        <div 
          onMouseEnter={handleHover}
          onClick={() => handleGameStart('quick-match-' + Date.now())}
          className="group relative bg-white/5 border border-white/10 p-0.5 md:p-1 cursor-pointer hover:border-neon-cyan transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(0,255,255,0.15)] flex flex-col rounded-sm"
        >
          <div className="bg-[#050508] p-4 md:p-6 flex flex-col h-full relative overflow-hidden">
             <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:opacity-100 group-hover:text-neon-cyan transition-all duration-500 transform group-hover:scale-110">
                 <svg className="w-16 h-16 md:w-20 md:h-20" fill="currentColor" viewBox="0 0 20 20"><path d="M13 7H7v6h6V7z"/><path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z" clipRule="evenodd"/></svg>
             </div>
             <div className="text-neon-cyan font-arcade text-xl md:text-2xl mb-1 z-10">BLITZ</div>
             <div className="w-6 h-0.5 bg-neon-cyan mb-3 md:mb-4 group-hover:w-20 transition-all duration-500"></div>
             <p className="text-slate-400 font-mono text-[10px] md:text-xs leading-relaxed mb-4 md:mb-6 flex-grow z-10">
               Standard 15-player lobby. High frequency rounds. Instant payouts.
             </p>
             <button className="w-full py-2.5 md:py-3 border border-neon-cyan text-neon-cyan font-arcade uppercase text-[10px] md:text-sm tracking-widest hover:bg-neon-cyan hover:text-black transition-all z-10">
               CONNECT
             </button>
          </div>
        </div>

        {/* 1v1 Card */}
        <div 
          onMouseEnter={handleHover}
          onClick={() => handleGameStart('pve-' + Date.now())}
          className="group relative bg-white/5 border border-white/10 p-0.5 md:p-1 cursor-pointer hover:border-neon-green transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(0,255,0,0.15)] flex flex-col rounded-sm"
        >
          <div className="bg-[#050508] p-4 md:p-6 flex flex-col h-full relative overflow-hidden">
             <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:opacity-100 group-hover:text-neon-green transition-all duration-500 transform group-hover:scale-110">
                <svg className="w-16 h-16 md:w-20 md:h-20" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd" /><path fillRule="evenodd" d="M12 10a1 1 0 01-1 1H6a1 1 0 100 2h5a3 3 0 003-3V8a1 1 0 012 0v2.4a1 1 0 11-2 0V10z" clipRule="evenodd" /></svg>
             </div>
             <div className="text-neon-green font-arcade text-xl md:text-2xl mb-1 z-10">1v1</div>
             <div className="w-6 h-0.5 bg-neon-green mb-3 md:mb-4 group-hover:w-20 transition-all duration-500"></div>
             <p className="text-slate-400 font-mono text-[10px] md:text-xs leading-relaxed mb-4 md:mb-6 flex-grow z-10">
               1v1 vs random. Both colors split 8 ways on the wheel. Test your luck. Earn XP and climb the Ranks.
             </p>
             <button className="w-full py-2.5 md:py-3 border border-neon-green text-neon-green font-arcade uppercase text-[10px] md:text-sm tracking-widest hover:bg-neon-green hover:text-black transition-all z-10">
               DUEL
             </button>
          </div>
        </div>

        {/* Tournament Card */}
        <div 
          onMouseEnter={handleHover}
          onClick={() => handleGameStart('tournament-' + Date.now())}
          className="group relative bg-white/5 border border-white/10 p-0.5 md:p-1 cursor-pointer hover:border-neon-pink transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(255,0,255,0.15)] flex flex-col rounded-sm"
        >
          <div className="bg-[#050508] p-4 md:p-6 flex flex-col h-full relative overflow-hidden">
             <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:opacity-100 group-hover:text-neon-pink transition-all duration-500 transform group-hover:scale-110">
               <svg className="w-16 h-16 md:w-20 md:h-20" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.699-3.181a1 1 0 111.772.954l-2.405 4.505c.686.678 1.157 1.595 1.285 2.618l.895.045a1 1 0 11-.098 1.998l-.895-.045c-.477 2.112-2.316 3.654-4.52 3.73l-.223 3.34A1 1 0 0110 19l.223-3.34c-2.204-.076-4.043-1.618-4.52-3.73l-.895.045a1 1 0 01-.098-1.998l.895-.045c.128-1.023.6-1.94 1.285-2.618L4.577 3.475a1 1 0 111.772-.954L8 5.701V3.5a1 1 0 011-1z" clipRule="evenodd"/></svg>
             </div>
             <div className="text-neon-pink font-arcade text-xl md:text-2xl mb-1 z-10">TOURNAMENT</div>
             <div className="w-6 h-0.5 bg-neon-pink mb-3 md:mb-4 group-hover:w-20 transition-all duration-500"></div>
             <p className="text-slate-400 font-mono text-[10px] md:text-xs leading-relaxed mb-4 md:mb-6 flex-grow z-10">
               100 Players • 20 Groups • 5 Per Group • 1 Grand Winner. Watch all groups spin. Winner takes all!
             </p>
             <button className="w-full py-2.5 md:py-3 border border-neon-pink text-neon-pink font-arcade uppercase text-[10px] md:text-sm tracking-widest hover:bg-neon-pink hover:text-black transition-all z-10">
               ENTER
             </button>
          </div>
        </div>

        {/* Create Room Card */}
        <div 
          onMouseEnter={handleHover}
          onClick={() => { 
            if(canCreateRoom) {
              soundManager.play('click');
              setCreateModalOpen(true);
            }
          }}
          className={`group relative bg-white/5 border border-white/10 p-0.5 md:p-1 transition-all flex flex-col rounded-sm ${
            canCreateRoom 
            ? 'cursor-pointer hover:border-neon-purple hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(191,0,255,0.15)]' 
            : 'opacity-50 cursor-not-allowed grayscale'
          }`}
        >
          <div className="bg-[#050508] p-4 md:p-6 flex flex-col h-full relative overflow-hidden">
             {!canCreateRoom && (
                <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center backdrop-blur-[1px]">
                   <span className="text-xl md:text-2xl mb-1">🔒</span>
                   <span className="text-[8px] md:text-[10px] font-arcade text-white tracking-widest uppercase">Rank: Master</span>
                </div>
             )}
             <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:opacity-100 group-hover:text-neon-purple transition-all duration-500 transform group-hover:scale-110">
               <svg className="w-16 h-16 md:w-20 md:h-20" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd"/></svg>
             </div>
             <div className="text-neon-purple font-arcade text-xl md:text-2xl mb-1 z-10">PRIVATE</div>
             <div className="w-6 h-0.5 bg-neon-purple mb-3 md:mb-4 group-hover:w-20 transition-all duration-500"></div>
             <p className="text-slate-400 font-mono text-[10px] md:text-xs leading-relaxed mb-4 md:mb-6 flex-grow z-10">
               Host a private table. Configure buy-ins and invite friends for a custom showdown.
             </p>
             <button 
                disabled={!canCreateRoom}
                className="w-full py-2.5 md:py-3 border border-neon-purple text-neon-purple font-arcade uppercase text-[10px] md:text-sm tracking-widest hover:bg-neon-purple hover:text-white transition-all z-10"
             >
               HOST
             </button>
          </div>
        </div>
      </div>
      
      {/* Footer Ticker */}
      <div className="mt-auto border-t border-white/5 bg-black/40 backdrop-blur-md overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center py-2 px-3 md:px-4 gap-2 md:gap-4">
             <div className="text-[8px] md:text-[10px] font-mono text-neon-green whitespace-nowrap">LIVE ::</div>
             <div className="overflow-hidden relative w-full h-5 md:h-6 mask-linear-fade">
                 <div className="absolute whitespace-nowrap animate-marquee flex gap-12 md:gap-16">
                    {[1,2,3,4,5,6,7].map(i => (
                        <span key={i} className="text-slate-400 font-mono text-[10px] md:text-xs">
                          <span className="text-neon-pink">WON</span> PLAYER_{1000+i} <span className="text-neon-gold">${(Math.random()*1000).toFixed(0)}</span>
                        </span>
                    ))}
                 </div>
             </div>
        </div>
      </div>

      <CreateRoomModal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)} onCreate={handleCreateRoom} />
    </div>
  );
};

export default Home;
