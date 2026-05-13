import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { User, Transaction, UserRank, GameSession, AuthMethod } from './types.ts';
import Dashboard from './pages/Dashboard.tsx';
import GameRoom from './pages/GameRoom.tsx';
import TournamentRoom from './pages/TournamentRoom.tsx';
import Home from './pages/Home.tsx';
import HelpCentre from './pages/HelpCentre.tsx';
import TermsOfUse from './pages/TermsOfUse.tsx';
import PrivacyPolicy from './pages/PrivacyPolicy.tsx';
import PaymentModal from './components/PaymentModal.tsx';
import GameDock from './components/GameDock.tsx';
import Footer from './components/Footer.tsx';
import { Auth } from './components/Auth.tsx';
import { soundManager } from './services/soundManager.ts';
import { RANK_CONFIG } from './constants.ts';
import { detectPerformanceProfile, disableAnimationsGlobally } from './utils/performanceOptimizer.ts';

const INITIAL_USER: User = {
  id: 'user-1',
  username: 'SpinMaster',
  balance: 1000,
  avatar: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=SpinMaster',
  rank: UserRank.ROOKIE,
  rankXp: 0,
  email: 'player@xpin.com',
  phoneNumber: '',
  authMethod: AuthMethod.EMAIL,
  bio: 'Ready to pin it!'
};

const RANK_PROGRESSION = [UserRank.ROOKIE, UserRank.PRO, UserRank.MASTER, UserRank.LEGEND];

const getRankForXp = (wins: number): UserRank => {
  if (wins >= RANK_CONFIG[UserRank.LEGEND].minWins) return UserRank.LEGEND;
  if (wins >= RANK_CONFIG[UserRank.MASTER].minWins) return UserRank.MASTER;
  if (wins >= RANK_CONFIG[UserRank.PRO].minWins) return UserRank.PRO;
  return UserRank.ROOKIE;
};

const Layout: React.FC<{ children: React.ReactNode; user: User; onOpenPayment?: (type: 'DEPOSIT' | 'WITHDRAWAL') => void }> = ({ children, user, onOpenPayment }) => {
  const location = useLocation();
  const [isMuted, setIsMuted] = useState(soundManager.isMuted());
  const rankStyle = RANK_CONFIG[user.rank];

  const [balanceMenuOpen, setBalanceMenuOpen] = useState(false);
  const balanceRef = useRef<HTMLDivElement | null>(null);

  const isRoom = location.pathname.startsWith('/room');

  const toggleSound = () => {
    soundManager.play('click');
    setIsMuted(soundManager.toggleMute());
    // Force music to start on first interaction
    soundManager.forceBgmStart();
  };

  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      if (balanceRef.current && !balanceRef.current.contains(e.target as Node)) {
        setBalanceMenuOpen(false);
      }
    };
    document.addEventListener('click', handleDocClick);
    return () => document.removeEventListener('click', handleDocClick);
  }, []);

  return (
    <div className="min-h-[100dvh] bg-vegas-bg text-white flex flex-col font-ui relative overflow-hidden">
      {!isRoom && (
        <header className="h-14 sm:h-16 md:h-20 border-b border-neon-purple/50 bg-vegas-panel/90 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-2 sm:px-4 md:px-8 shadow-[0_0_20px_rgba(191,0,255,0.2)]">
          <div className="flex items-center gap-2 sm:gap-6 md:gap-10 flex-1 min-w-0">
            <Link to="/" onClick={() => soundManager.play('click')} className="text-lg sm:text-2xl md:text-3xl font-arcade font-black hover:scale-105 transition-transform whitespace-nowrap tracking-wider">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-pink to-neon-purple text-glow-pink">X</span>{' '}
              <span className="text-white">PIN</span>
            </Link>
            <nav className="hidden sm:flex gap-4 md:gap-8">
              <Link to="/" className={`text-xs md:text-sm font-arcade uppercase tracking-widest ${location.pathname === '/' ? 'text-neon-cyan text-glow-cyan' : 'text-slate-400 hover:text-white'}`}>Lobby</Link>
              <Link to="/dashboard" className={`text-xs md:text-sm font-arcade uppercase tracking-widest ${location.pathname === '/dashboard' ? 'text-neon-pink text-glow-pink' : 'text-slate-400 hover:text-white'}`}>Vault</Link>
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 md:gap-6 flex-shrink-0">
            <div
              ref={balanceRef}
              role="button"
              title="Balance — click for options"
              onClick={(e) => { e.stopPropagation(); soundManager.play('click'); setBalanceMenuOpen((v) => !v); }}
              className="group relative bg-black/60 px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 rounded-sm border border-neon-green/30 whitespace-nowrap cursor-pointer hover:shadow-[0_0_10px_rgba(0,255,0,0.08)]"
            >
              {/* subtle pulsing dot */}
              <span className="absolute -right-2 top-1/2 -translate-y-1/2 w-3 h-3 bg-neon-green rounded-full opacity-90 animate-pulse pointer-events-none" />

              <div className="font-arcade text-xs sm:text-sm md:text-lg text-neon-green text-glow-green">${user.balance.toLocaleString()}</div>

              {/* tooltip on hover */}
              <div className="hidden group-hover:block absolute -bottom-10 right-0 bg-black/90 border border-neon-green/20 text-neon-green text-[10px] px-2 py-1 rounded shadow-[0_0_10px_rgba(0,255,0,0.06)] whitespace-nowrap">
                Click to deposit or withdraw
              </div>

              {balanceMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-black/95 border-2 border-neon-green/60 rounded-md p-3 shadow-[0_0_30px_rgba(0,255,0,0.14)] z-50 backdrop-blur-sm">
                  <div style={{ position: 'absolute', top: '-8px', right: '14px', width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderBottom: '8px solid rgba(16, 185, 129, 0.12)' }} />
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); soundManager.play('click'); onOpenPayment?.('DEPOSIT'); setBalanceMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 bg-neon-green text-black font-arcade uppercase text-sm rounded-sm shadow-[0_0_18px_rgba(0,255,0,0.22)] hover:scale-[1.02] transition-transform"
                    >
                      INSERT CREDITS
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); soundManager.play('click'); onOpenPayment?.('WITHDRAWAL'); setBalanceMenuOpen(false); }}
                      className="w-full text-left px-3 py-2 bg-transparent border-2 border-neon-gold text-neon-gold font-arcade uppercase text-sm rounded-sm hover:bg-neon-gold/5 transition-colors"
                    >
                      WITHDRAW
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button onClick={toggleSound} className={`p-1.5 sm:p-2 rounded-full border transition-all ${isMuted ? 'border-red-500 text-red-500' : 'border-neon-cyan text-neon-cyan shadow-[0_0_10px_rgba(0,255,255,0.2)]'}`}>
              {isMuted ? (
                <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <line x1="23" y1="9" x2="17" y2="15"></line>
                  <line x1="17" y1="9" x2="23" y2="15"></line>
                </svg>
              ) : (
                <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                </svg>
              )}
            </button>
            <Link to="/dashboard" className="transition-all hover:scale-110 active:scale-95 flex-shrink-0">
              <img src={user.avatar} className={`w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full border-2 ${rankStyle.borderColor} shadow-[0_0_10px_rgba(255,255,255,0.1)]`} alt="Profile" />
            </Link>
          </div>
        </header>
      )}
      <main className="flex-1 relative overflow-y-auto overflow-x-hidden flex flex-col min-w-0">
        {children}
      </main>

      {!isRoom && <Footer />}
    </div>
  );
};

const AppContent: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('xpin_auth') === 'true';
  });
  const [user, setUser] = useState<User>(INITIAL_USER);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeSessions, setActiveSessions] = useState<GameSession[]>([]);
  const [payment, setPayment] = useState<{ open: boolean, type: 'DEPOSIT' | 'WITHDRAWAL' }>({ open: false, type: 'DEPOSIT' });

  const navigate = useNavigate();
  const location = useLocation();

  // Initialize performance optimization on app startup
  useEffect(() => {
    const perfProfile = detectPerformanceProfile();
    if (perfProfile.disableAnimations) {
      disableAnimationsGlobally();
      console.log('Performance mode: LOW-END - Animations disabled for better performance');
    } else {
      console.log('Performance mode: HIGH-END - Full animations enabled');
    }
  }, []);

  // Set up autoplay on any user interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      soundManager.forceBgmStart();
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keypress', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };

    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('keypress', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      document.removeEventListener('click', handleFirstInteraction);
      document.removeEventListener('keypress', handleFirstInteraction);
      document.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, []);

  const handleUpdateBalance = useCallback((amount: number) => {
    soundManager.forceBgmStart(); // Ensure music plays when user interacts
    setUser(prev => ({ ...prev, balance: prev.balance + amount }));
  }, []);

  const handleAwardWin = useCallback(() => {
    setUser(prev => {
      const rankIndex = RANK_PROGRESSION.indexOf(prev.rank);
      const normalizedXp = Math.max(prev.rankXp, RANK_CONFIG[prev.rank].minWins);
      const rankBaseXp = rankIndex >= 0 ? RANK_CONFIG[prev.rank].minWins : 0;
      const newXp = Math.max(normalizedXp + 1, rankBaseXp + 1);
      const newRank = getRankForXp(newXp);
      return { ...prev, rankXp: newXp, rank: newRank };
    });
  }, []);

  const handleJoinGame = useCallback((roomId: string) => {
    setActiveSessions(prev => {
      if (prev.find(s => s.id === roomId)) return prev;
      let type: 'blitz' | '1v1' | 'tournament' | 'grandprix' = 'blitz';
      let displayName = 'BLITZ';
      let themeColor = 'neon-cyan';
      if (roomId.includes('pve')) { type = '1v1'; displayName = '1v1 DUEL'; themeColor = 'neon-green'; }
      else if (roomId.includes('grandprix')) { type = 'grandprix'; displayName = 'GRAND PRIX'; themeColor = 'neon-pink'; }
      else if (roomId.includes('tournament')) { type = 'tournament'; displayName = 'TOURNAMENT'; themeColor = 'neon-pink'; }
      return [...prev, { id: roomId, type, mode: type, status: 'CONNECTING...', themeColor, lastUpdate: Date.now() }];
    });
    navigate(`/room/${roomId}`);
  }, [navigate]);

  const handleExitGame = useCallback((roomId: string) => {
    setActiveSessions(prev => prev.filter(s => s.id !== roomId));
    navigate('/');
  }, [navigate]);

  const updateSessionStatus = useCallback((roomId: string, status: string) => {
    setActiveSessions(prev => prev.map(s => s.id === roomId ? { ...s, status, lastUpdate: Date.now() } : s));
  }, []);

  const handleLogin = (username: string, email: string, phoneNumber?: string, authMethod?: AuthMethod) => {
    setUser(p => ({
      ...p,
      username,
      email,
      phoneNumber: phoneNumber || '',
      authMethod: authMethod || AuthMethod.EMAIL
    }));
    localStorage.setItem('xpin_auth', 'true');
    setIsAuthenticated(true);
    navigate('/');
  };

  const handleLogout = () => {
    localStorage.removeItem('xpin_auth');
    setIsAuthenticated(false);
    setUser(INITIAL_USER);
    navigate('/');
  };

  if (!isAuthenticated) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <Layout user={user} onOpenPayment={(type) => setPayment({ open: true, type })}>
      <Routes>
        <Route path="/" element={<Home user={user} onJoinGame={handleJoinGame} />} />
        <Route path="/dashboard" element={<Dashboard user={user} transactions={transactions} onOpenPayment={(type) => setPayment({open: true, type})} onUpdateProfile={(updates) => setUser(p => ({...p, ...updates}))} onLogout={handleLogout} />} />
        <Route path="/help-centre" element={<HelpCentre />} />
        <Route path="/terms-of-use" element={<TermsOfUse />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/room/:roomId" element={
          <RoomWrapper
            user={user}
            handleUpdateBalance={handleUpdateBalance}
            handleAwardWin={handleAwardWin}
            handleExitGame={handleExitGame}
            updateSessionStatus={updateSessionStatus}
          />
        } />
      </Routes>

      {/* GameDock disabled - active session panels removed */}

      <PaymentModal
        isOpen={payment.open}
        onClose={() => setPayment(p => ({...p, open: false}))}
        type={payment.type}
        userPhoneNumber={user.phoneNumber}
        onProcess={(method, amt) => {
          const final = payment.type === 'DEPOSIT' ? amt : -amt;
          handleUpdateBalance(final);
          setTransactions(p => [{ id: `tx-${Date.now()}`, type: payment.type, amount: amt, method, status: 'COMPLETED', date: new Date().toLocaleDateString() }, ...p]);
        }}
      />
    </Layout>
  );
};

const RoomWrapper: React.FC<{
  user: User;
  handleUpdateBalance: (amt: number) => void;
  handleAwardWin: () => void;
  handleExitGame: (id: string) => void;
  updateSessionStatus: (id: string, s: string) => void;
}> = ({ user, handleUpdateBalance, handleAwardWin, handleExitGame, updateSessionStatus }) => {
  const { roomId } = useParams<{ roomId: string }>();

  const handleStatusChange = useCallback((status: string) => {
    if (roomId) {
      updateSessionStatus(roomId, status);
    }
  }, [roomId, updateSessionStatus]);

  // Check if this is a Grand Prix room (tournament rooms are also Grand Prix)
  const isGrandPrix = !!roomId && (roomId.includes('grandprix') || roomId.includes('tournament'));

  if (isGrandPrix) {
    return (
        <TournamentRoom
          user={user}
          updateBalance={handleUpdateBalance}
          onWin={handleAwardWin}
          onLeaveGame={handleExitGame}
        />
    );
  }

  return (
    <GameRoom
      user={user}
      updateBalance={handleUpdateBalance}
      onWin={handleAwardWin}
      roomId={roomId}
      onLeaveGame={handleExitGame}
      onStatusChange={handleStatusChange}
    />
  );
};

const App: React.FC = () => (
  <HashRouter>
    <AppContent />
  </HashRouter>
);

export default App;
