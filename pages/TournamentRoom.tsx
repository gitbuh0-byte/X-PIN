import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import SpinWheel from '../components/SpinWheel.tsx';
import TournamentWinnerAnimation from '../components/TournamentWinnerAnimation.tsx';
import TournamentBracketNew from '../components/TournamentBracketNew.tsx';
import RankUpModal from '../components/RankUpModal.tsx';
import { User, Player, UserRank } from '../types.ts';
import { COLORS, COLOR_HEX, RANK_CONFIG } from '../constants.ts';
import { soundManager } from '../services/soundManager.ts';

interface TournamentRoomProps {
  user: User;
  updateBalance: (amount: number) => void;
  onWin?: () => void;
  onLeaveGame?: (roomId: string) => void;
}

const DEFAULT_ENTRY_FEE = 10;
const BET_OPTIONS = [10, 25, 50, 100];
const TOTAL_PLAYERS = 100;
const GROUPS_COUNT = 20;
const PLAYERS_PER_GROUP = 5;
const FORCE_TOURNAMENT_TEST_WIN = true;

// Round 1 & Round 2: 5 segments - one for each player in the group/QF
const TOURNAMENT_SEGMENTS_ROUND1_2 = Array.from({ length: 5 }).map((_, idx) => ({
  label: `P${idx + 1}`,
  color: COLORS[idx % COLORS.length],
  value: idx
}));

// Final Round: 4 segments - one for each finalist
const TOURNAMENT_SEGMENTS_FINAL = Array.from({ length: 4 }).map((_, idx) => ({
  label: `F${idx + 1}`,
  color: COLORS[idx % COLORS.length],
  value: idx
}));

// Legacy: 20 segments - one for each group (kept for reference/backward compatibility)
const TOURNAMENT_SEGMENTS = Array.from({ length: 20 }).map((_, idx) => ({
  label: `G${idx + 1}`,
  color: COLORS[idx % COLORS.length],
  value: idx
}));

const TournamentRoom: React.FC<TournamentRoomProps> = ({ user, updateBalance, onWin, onLeaveGame }) => {
  const navigate = useNavigate();
  const mounted = useRef(true);

  // Phase: BET_PROMPT -> COLOR_ASSIGN -> BRACKET_VIEW -> LOBBY -> GROUPS -> ROUND_2 -> FINAL_COLOR -> FINAL_PREP -> FINAL -> FINAL_RESULT -> (back to BROWSE or ELIM_LOSE if lose)
  const [phase, setPhase] = useState<'BROWSE' | 'BET_PROMPT' | 'COLOR_ASSIGN' | 'ROOM_ASSIGN' | 'BRACKET_VIEW' | 'LOBBY' | 'GROUPS' | 'ROUND_2' | 'FINAL_COLOR' | 'FINAL_PREP' | 'FINAL' | 'FINAL_RESULT' | 'ELIM_LOSE' | 'GROUP_RESULT'>('BET_PROMPT');
  
  // Tournament data
  const [groups, setGroups] = useState<Array<{ groupNumber: number; players: Player[]; totalPot: number }>>([]);
  const [userGroup, setUserGroup] = useState<number>(0);
  const [userRoom, setUserRoom] = useState<string>('');
  const [userColor, setUserColor] = useState<string>('');
  const [colorRevealed, setColorRevealed] = useState<boolean>(false);
  
  // Spinning state
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [groupWinners, setGroupWinners] = useState<Player[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [targetIndex, setTargetIndex] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [countdownActive, setCountdownActive] = useState(false);
  const [announcing, setAnnouncing] = useState(false);
  const [announceIndex, setAnnounceIndex] = useState(0);
  const [displayedWinners, setDisplayedWinners] = useState<Player[]>([]);
  const [loserCountdown, setLoserCountdown] = useState<number | null>(null);
  const [winnerCountdown, setWinnerCountdown] = useState<number | null>(null);
  const [showWinnerProceed, setShowWinnerProceed] = useState(false);
  const [proceedCountdown, setProceedCountdown] = useState<number | null>(null);
  const [finalColorCountdown, setFinalColorCountdown] = useState<number | null>(null);
  
  // Final round
  const [finalTarget, setFinalTarget] = useState(0);
  const [finalSpinning, setFinalSpinning] = useState(false);
  const [grandWinner, setGrandWinner] = useState<Player | null>(null);
  
  // UI state
  const [expandedGroup, setExpandedGroup] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{ user: string; msg: string }>>([]);
  const [chatInput, setChatInput] = useState('');
  const [showGroupsPanel, setShowGroupsPanel] = useState(false);
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [showStatusPanel, setShowStatusPanel] = useState(false);

  // Rank-up state
  const [showRankUp, setShowRankUp] = useState(false);
  const [previousRank, setPreviousRank] = useState<UserRank>(user.rank);
  const [tournamentBetAmount, setTournamentBetAmount] = useState(DEFAULT_ENTRY_FEE);
  
  const isColorVisible = phase === 'COLOR_ASSIGN' || ((phase !== 'BROWSE' && phase !== 'BET_PROMPT') && colorRevealed);
  const userColorDisplay = isColorVisible ? userColor : 'Hidden';
  const userColorStyle = isColorVisible ? COLOR_HEX[userColor as keyof typeof COLOR_HEX] : '#4b5563';
  const showTournamentHeader = false;
  const showExitButton = phase === 'GROUPS' || phase === 'ROUND_2' || phase === 'FINAL';
  const userGroupPlayers = groups.find(group => group.groupNumber === userGroup)?.players ?? [];
  const quarterfinalGroupIndex = Math.max(0, Math.floor(groupWinners.findIndex(player => player.id === user.id) / PLAYERS_PER_GROUP));
  const quarterfinalPlayers = groupWinners.slice(quarterfinalGroupIndex * PLAYERS_PER_GROUP, quarterfinalGroupIndex * PLAYERS_PER_GROUP + PLAYERS_PER_GROUP);
  const userColorIndex = Math.max(0, COLORS.indexOf(userColor));

  // Calculate total pot (100 players * selected entry fee)
  const totalPot = TOTAL_PLAYERS * tournamentBetAmount;

  // Initialize groups and assign user on mount
  useEffect(() => {
    if (groups.length === 0 && mounted.current) {
      // Start background music when entering tournament room
      soundManager.play('bgm');
      
      const assignedGroup = Math.floor(Math.random() * GROUPS_COUNT) + 1;
      const assignedPositionInGroup = FORCE_TOURNAMENT_TEST_WIN
        ? Math.floor(Math.random() * TOURNAMENT_SEGMENTS_FINAL.length)
        : Math.floor(Math.random() * PLAYERS_PER_GROUP);
      const assignedColor = COLORS[assignedPositionInGroup % COLORS.length];
      const assignedRoom = `ROOM-${Math.floor(Math.random() * 1000).toString().padStart(4, '0')}`;
      
      setUserGroup(assignedGroup);
      setUserColor(assignedColor);
      setUserRoom(assignedRoom);

      const newGroups = Array.from({ length: GROUPS_COUNT }).map((_, gi) => {
        const groupNumber = gi + 1;
        const players: Player[] = Array.from({ length: PLAYERS_PER_GROUP }).map((__, pi) => {
          if (groupNumber === assignedGroup && pi === assignedPositionInGroup) {
            return {
              id: user.id,
              username: user.username,
              avatar: user.avatar,
              betAmount: tournamentBetAmount,
              selectedColor: assignedColor,
              assignedColor: assignedColor,
              status: 'CONFIRMED' as any,
              isBot: false
            } as Player;
          }

          const randomNames = ['NeonGhost', 'CyberVortex', 'PixelKing', 'ShadowEcho', 'VortexRider', 'ThunderStrike', 'NovaBlast', 'SilentRunner', 'IceReaper', 'PhantomEye', 'CrimsonFury', 'VoidWalker', 'TitanForce', 'SolarFlare', 'DarkNinja', 'ElectroMage', 'MysticShade', 'FrostByte', 'LunarEclipse', 'InfernoKnight'];
          const botName = randomNames[Math.floor(Math.random() * randomNames.length)] + Math.floor(Math.random() * 999);
          // Assign one color per player (pi=0 gets COLORS[0], pi=1 gets COLORS[1], etc.)
          // This ensures each group has exactly one player of each color
          const playerColor = COLORS[pi % COLORS.length];
          return {
            id: `bot-${groupNumber}-${pi}`,
            username: botName,
            avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${botName}`,
            betAmount: tournamentBetAmount,
            selectedColor: playerColor,
            assignedColor: playerColor,
            status: 'CONFIRMED' as any,
            isBot: true
          } as Player;
        });

        return { groupNumber, players, totalPot: tournamentBetAmount * PLAYERS_PER_GROUP };
      });

      setGroups(newGroups);
    }

    return () => { mounted.current = false; };
  }, [user]);

  // Countdown timer for spin
  useEffect(() => {
    if (!countdownActive || countdown === 0) return;
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, countdownActive]);

  // Start spinning when countdown reaches 0
  useEffect(() => {
    if (countdown === 0 && countdownActive) {
      setCountdownActive(false);
      if (phase === 'GROUPS') startGroupSpin();
      if (phase === 'ROUND_2') {
        // auto-start the round 2 spin
        setSpinning(true);
      }
      if (phase === 'FINAL_PREP') {
        // start the final spin
        setPhase('FINAL');
        const finalT = FORCE_TOURNAMENT_TEST_WIN ? userColorIndex : Math.floor(Math.random() * Math.max(1, groupWinners.length));
        setFinalTarget(finalT);
        setFinalSpinning(true);
      }
      if (phase === 'FINAL') {
        // auto-start the final spin
        setFinalSpinning(true);
      }
    }
  }, [countdown, countdownActive, phase]);

  const startBetFlow = () => {
    setPhase('BET_PROMPT');
  };

  const updateTournamentBet = (amount: number) => {
    setTournamentBetAmount(amount);
    setGroups(prev => prev.map(group => ({
      ...group,
      totalPot: amount * PLAYERS_PER_GROUP,
      players: group.players.map(player => ({ ...player, betAmount: amount }))
    })));
  };

  const confirmBet = () => {
    if (user.balance < tournamentBetAmount) {
      alert('Insufficient balance. Need $' + tournamentBetAmount);
      return;
    }
    setPhase('COLOR_ASSIGN');
  };

  const proceedFromColor = () => {
    setColorRevealed(true);
    joinGameroom();
  };

  const joinGameroom = () => {
    updateBalance(-tournamentBetAmount);
    setPhase('BRACKET_VIEW');
  };

  const startGroupSpin = () => {
    // Single simultaneous spin for all groups once every player has placed their bet
    if (groups.length === 0) return;
    const t = FORCE_TOURNAMENT_TEST_WIN ? userColorIndex : Math.floor(Math.random() * TOURNAMENT_SEGMENTS_ROUND1_2.length);
    setTargetIndex(t);
    setSpinning(true);
  };

  const onGroupSpinEnd = () => {
    // Only players whose assigned color matches the winning wheel color advance
    setSpinning(false);
    
    const winningColor = TOURNAMENT_SEGMENTS_ROUND1_2[targetIndex].color;
    
    // TESTING MODE: Set to true to always win all rounds
    const FORCE_TESTING_WIN = true;
    
    // For each group, select a player only if their color matches the winning color
    const winners = groups.map((g) => {
      const playersWithWinningColor = g.players.filter(p => p.assignedColor === winningColor);
      if (playersWithWinningColor.length > 0) {
        // TESTING: Always favor user to win
        if (FORCE_TESTING_WIN) {
          const userInGroup = playersWithWinningColor.find(p => p.id === user.id);
          if (userInGroup) {
            return userInGroup; // USER FORCED WIN FOR TESTING
          }
        }
        // Pick one random player from this group with the winning color
        return playersWithWinningColor[Math.floor(Math.random() * playersWithWinningColor.length)];
      }
      // No one in this group has the winning color - no winner from this group
      return null as any;
    }).filter(w => w !== null);

    setGroupWinners(winners);
    setDisplayedWinners(winners);
    setAnnouncing(true);
    soundManager.play('win');

    const userIsWinner = winners.some(w => w.id === user.id);
    if (userIsWinner) {
      // show winners animation and start a 5s countdown before round 2
      setWinnerCountdown(5);
    } else {
      // show winners overlay but start a 5s countdown for losers then route to ELIM_LOSE
      // rely on a React effect to drive the countdown reliably
      setLoserCountdown(5);
    }
  };

  const proceedToRound2 = () => {
    // 20 winners are split into 4 groups of 5
    // Each group spins to select 1 winner → 4 winners for finals
    // PRESERVE original winning colors - do NOT reassign!
    setAnnouncing(false);
    setPhase('ROUND_2');
    setCountdown(3);
    setCountdownActive(true);
    const t = FORCE_TOURNAMENT_TEST_WIN ? userColorIndex : Math.floor(Math.random() * TOURNAMENT_SEGMENTS_ROUND1_2.length);
    setTargetIndex(t);
  };

  const onRound2SpinEnd = () => {
    setSpinning(false);
    
    // Get the winning color from the spin
    const winningColor = TOURNAMENT_SEGMENTS_ROUND1_2[targetIndex].color;
    
    // TESTING MODE: Set to true to always win all rounds
    const FORCE_TESTING_WIN = true;
    
    // From 20 winners, select 4 winners (1 from each group of 5)
    // Winners are divided: indices 0-4, 5-9, 10-14, 15-19
    const quarterfinalists = [];
    for (let i = 0; i < 4; i++) {
      const groupStart = i * 5;
      const groupEnd = groupStart + 5;
      const qfGroup = groupWinners.slice(groupStart, groupEnd);
      // Select only players whose assigned color matches the winning color
      const playersWithWinningColor = qfGroup.filter(p => p.assignedColor === winningColor);
      if (playersWithWinningColor.length > 0) {
        const winner = FORCE_TOURNAMENT_TEST_WIN
          ? (playersWithWinningColor.find(p => p.id === user.id) || playersWithWinningColor[0])
          : playersWithWinningColor[Math.floor(Math.random() * playersWithWinningColor.length)];
        quarterfinalists.push(winner);
      }
    }
    
    setGroupWinners(quarterfinalists);
    setDisplayedWinners(quarterfinalists);
    setAnnouncing(true);
    soundManager.play('win');

    const userIsWinner = quarterfinalists.some(w => w.id === user.id);
    if (userIsWinner) {
      // show winners animation and start a 5s countdown before final round
      setWinnerCountdown(5);
    } else {
      // show winners overlay but start a 5s countdown for losers then route to ELIM_LOSE
      setLoserCountdown(5);
    }
  };

  // Drive the loser countdown using a React effect (ensures proper cleanup and updates)
  useEffect(() => {
    if (loserCountdown === null) return;
    if (loserCountdown <= 0) {
      setAnnouncing(false);
      setLoserCountdown(null);
      setPhase('ELIM_LOSE');
      return;
    }
    const t = setTimeout(() => setLoserCountdown(c => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [loserCountdown]);

  // Drive the winner countdown and auto-advance to the next tournament round.
  useEffect(() => {
    if (winnerCountdown === null) return;
    if (winnerCountdown <= 0) {
      setWinnerCountdown(null);
      setShowWinnerProceed(false);
      if (phase === 'GROUPS') {
        proceedToRound2();
      } else if (phase === 'ROUND_2') {
        setAnnouncing(false);
        setPhase('FINAL_COLOR');
        setFinalColorCountdown(5);
      }
      return;
    }
    const t = setTimeout(() => setWinnerCountdown(c => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [winnerCountdown, phase]);
  // Drive the final color countdown - when it hits 0, move to FINAL with 3s countdown before auto-spin
  useEffect(() => {
    if (finalColorCountdown === null) return;
    if (finalColorCountdown <= 0) {
      setFinalColorCountdown(null);
      setPhase('FINAL');
      setCountdown(3);
      setCountdownActive(true);
      const finalT = FORCE_TOURNAMENT_TEST_WIN ? userColorIndex : Math.floor(Math.random() * groupWinners.length);
      setFinalTarget(finalT);
      return;
    }
    const t = setTimeout(() => setFinalColorCountdown(c => (c !== null ? c - 1 : null)), 1000);
    return () => clearTimeout(t);
  }, [finalColorCountdown]);

  // Auto-advance winners from GROUP_RESULT
  useEffect(() => {
    if (phase !== 'GROUP_RESULT') return;
    const userIsWinner = groupWinners.some(w => w.id === user.id);
    
    // Winners auto-advance after 3 seconds
    if (userIsWinner) {
      const timer = setTimeout(() => {
        setAnnouncing(false);
        // PRESERVE original winning colors - do NOT reassign!
        setPhase('FINAL_COLOR');
        setFinalColorCountdown(5);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      // Losers auto-advance after 4 seconds to ELIM_LOSE
      const timer = setTimeout(() => {
        setPhase('ELIM_LOSE');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [phase, groupWinners]);

  const startFinalSpin = () => {
    if (groupWinners.length === 0) return;
    
    // Check if user is in group winners
    const userIsWinner = groupWinners.some(w => w.id === user.id);
    if (!userIsWinner) {
      setPhase('GROUP_RESULT');
      return;
    }

    const finalT = FORCE_TOURNAMENT_TEST_WIN ? userColorIndex : Math.floor(Math.random() * groupWinners.length);
    setFinalTarget(finalT);
    setCountdown(3);
    setCountdownActive(true);
    setPhase('FINAL');
  };

  const onFinalSpinEnd = () => {
    setFinalSpinning(false);
    const winningColor = TOURNAMENT_SEGMENTS_FINAL[finalTarget]?.color;
    const winner = (FORCE_TOURNAMENT_TEST_WIN && groupWinners.find(w => w.id === user.id))
      || groupWinners.find(w => w.assignedColor === winningColor)
      || groupWinners[finalTarget]
      || groupWinners[0];
    setGrandWinner(winner);
    if (winner.id === user.id) {
      updateBalance(totalPot);
      onWin?.();
      soundManager.play('win'); // Winner announcement sound (same as group winners)
    }
    setPhase('FINAL_RESULT');
  };

  const exitToLobby = () => {
    soundManager.play('click');
    if (onLeaveGame) onLeaveGame('tournament');
    else navigate('/');
  };

  const playAgainTournament = () => {
    soundManager.play('click');
    setGrandWinner(null);
    setGroupWinners([]);
    setDisplayedWinners([]);
    setAnnouncing(false);
    setSpinning(false);
    setFinalSpinning(false);
    setCountdown(3);
    setCountdownActive(false);
    setLoserCountdown(null);
    setWinnerCountdown(null);
    setShowWinnerProceed(false);
    setFinalColorCountdown(null);
    setPhase('BET_PROMPT');
  };

  return (
    <div className="w-full h-[100dvh] bg-gradient-to-b from-slate-900 to-black text-white flex flex-col overflow-hidden">
      {/* Main Header - Always visible except on BROWSE */}
      {showTournamentHeader && phase !== 'BROWSE' && (
        <div className="bg-gradient-to-r from-neon-gold/15 via-black to-neon-pink/15 border-b-2 border-neon-gold/40 shadow-[0_0_30px_rgba(255,215,0,0.3)] px-2 sm:px-4 py-2 sm:py-3 md:py-4 flex items-center justify-between flex-shrink-0 gap-2 backdrop-blur-sm">
          <div className="min-w-0 flex-1">
            <div className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-arcade text-transparent bg-clip-text bg-gradient-to-r from-neon-gold via-neon-pink to-neon-cyan whitespace-nowrap animate-pulse drop-shadow-[0_0_30px_rgba(255,215,0,0.8)] font-black tracking-wider">🏆 TOURNAMENT</div>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-[10px] sm:text-xs text-slate-400 font-arcade tracking-wider uppercase">Your Balance</div>
            <div className="text-neon-green font-arcade text-sm sm:text-base md:text-xl font-black drop-shadow-[0_0_10px_rgba(0,255,0,0.5)]">${user.balance.toLocaleString()}</div>
          </div>
        </div>
      )}

      {showExitButton && (
        <button
          onClick={exitToLobby}
          className="fixed top-2 sm:top-4 left-2 sm:left-4 z-[100] px-3 sm:px-4 py-2 sm:py-2.5 font-arcade text-xs sm:text-sm font-bold tracking-widest uppercase transition-all duration-200 active:scale-95 cursor-pointer bg-red-600 border-2 border-red-400 text-white hover:bg-red-500 hover:border-red-300 hover:shadow-[0_0_20px_rgba(255,0,0,0.8)] rounded-sm"
        >
          ← EXIT
        </button>
      )}

      {/* Content Area */}
      {/* GROUPS Phase: 20 wheels spinning (invisible), only player's room wheel visible */}
      {phase === 'GROUPS' && (
        <div className={`fixed inset-0 z-30 flex items-center justify-center pointer-events-none px-2 sm:px-0 pt-12 sm:pt-16 md:pt-24 pb-32 lg:pb-0`}>
          <div className="pointer-events-none origin-center">
            {/* Player's group wheel for current spin */}
            <SpinWheel
              segments={TOURNAMENT_SEGMENTS_ROUND1_2}
              spinning={spinning}
              targetIndex={targetIndex}
              onSpinEnd={onGroupSpinEnd}
              themeColor="neon-cyan"
              playerColor={userColor}
            />
          </div>
        </div>
      )}

      {/* ROUND_2 Phase: Shared wheel with 5 players per group */}
      {phase === 'ROUND_2' && (
        <div className={`fixed inset-0 z-30 flex items-center justify-center pointer-events-none px-2 sm:px-0 pt-12 sm:pt-16 md:pt-24 pb-32 lg:pb-0`}>
          <div className="pointer-events-none origin-center">
            {/* Round 2 wheel for current spin */}
            <SpinWheel
              segments={TOURNAMENT_SEGMENTS_ROUND1_2}
              spinning={spinning}
              targetIndex={targetIndex}
              onSpinEnd={onRound2SpinEnd}
              themeColor="neon-pink"
              playerColor={userColor}
            />
          </div>
        </div>
      )}

      {/* FINAL Phase: Shared wheel with 4 finalists */}
      {phase === 'FINAL' && (
        <div className={`fixed inset-0 z-30 flex items-center justify-center pointer-events-none px-2 sm:px-0 pt-8 sm:pt-12 md:pt-16 pb-32 lg:pb-0`}>
          <div className="pointer-events-none origin-center">
            <SpinWheel
              segments={TOURNAMENT_SEGMENTS_FINAL}
              spinning={finalSpinning}
              targetIndex={finalTarget}
              onSpinEnd={onFinalSpinEnd}
              themeColor="neon-gold"
              playerColor={userColor}
            />
          </div>
        </div>
      )}

      {/* FINAL Phase - Buttons at bottom on mobile - Vegas Casino style */}
      {phase === 'FINAL' && (
        <div className="lg:hidden fixed left-0 right-0 bottom-28 z-50 px-4 pointer-events-auto">
          <div className="grid grid-cols-3 gap-2 w-full">
            <button 
              onClick={() => { soundManager.play('click'); setShowGroupsPanel(true); }}
              className="px-3 py-3 text-neon-cyan bg-black/50 font-arcade text-[10px] border-2 border-neon-cyan hover:bg-neon-cyan hover:text-black transition font-black tracking-wider shadow-[0_0_15px_rgba(0,255,255,0.5)] active:scale-95">
              FINALISTS
            </button>
            <button 
              onClick={() => { soundManager.play('click'); setShowStatusPanel(true); }}
              className="px-3 py-3 text-neon-pink bg-black/50 font-arcade text-[10px] border border-neon-pink hover:bg-neon-pink hover:text-black transition font-black tracking-wider shadow-[0_0_15px_rgba(255,0,128,0.5)] active:scale-95">
              STATUS
            </button>
            <button 
              onClick={() => { soundManager.play('click'); setShowChatPanel(true); }}
              className="px-3 py-3 text-neon-green bg-black/50 font-arcade text-[10px] border border-neon-green hover:bg-neon-green hover:text-black transition font-black tracking-wider shadow-[0_0_15px_rgba(0,255,0,0.5)] active:scale-95">
              CHATS
            </button>
          </div>
        </div>
      )}

      {/* Floating cards removed */}

      {/* Trophy announcement removed */}

      {/* Show custom tournament winner animation when winners are announced */}
      {announcing && displayedWinners.length > 0 && (phase === 'GROUP_RESULT' || phase === 'ROUND_2') && (
        <TournamentWinnerAnimation
          isUserWinner={displayedWinners.some(dw => dw.id === user.id)}
          winnerCount={displayedWinners.length}
        />
      )}

      {/* Show winner countdown during announcement phase - Vegas style with clear visibility */}
      {announcing && displayedWinners.some(dw => dw.id === user.id) && winnerCountdown !== null && (phase === 'GROUPS' || phase === 'ROUND_2') && (
        <div className="fixed inset-0 z-[350] pointer-events-none flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="text-center px-4">
            {/* Large Countdown Timer */}
            <div className="mb-8">
              <div className="text-6xl sm:text-8xl font-arcade font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-gold via-neon-pink to-neon-cyan animate-pulse drop-shadow-[0_0_50px_rgba(255,215,0,0.8)]">
                {winnerCountdown}
              </div>
            </div>
            
            {/* Main Announcement Text */}
            <div className="text-2xl sm:text-4xl font-arcade font-black text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan to-neon-green mb-4 tracking-wider drop-shadow-[0_0_30px_rgba(0,255,255,0.6)]">
              {phase === 'ROUND_2' ? 'ADVANCING TO FINAL ROUND' : 'ADVANCING TO ROUND 2'}
            </div>
            
            {/* Finalists Grid - Clear and Visible */}
            <div className="max-w-2xl bg-black/60 border border-neon-pink/50 p-4 sm:p-6 shadow-[0_0_40px_rgba(255,0,128,0.3)]">
              <div className="text-sm sm:text-base font-arcade text-neon-pink mb-3">{phase === 'ROUND_2' ? 'FINAL ROUND PLAYERS (4)' : 'ROUND 1 WINNERS'}</div>
              <div className={`grid ${phase === 'ROUND_2' ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-5'} gap-2`}>
                {displayedWinners.map((w, idx) => (
                  <div 
                    key={w.id}
                    className={`p-2 border transition ${
                      w.id === user.id 
                        ? 'bg-neon-pink/20 border-neon-pink shadow-[0_0_20px_rgba(255,0,128,0.4)]' 
                        : 'bg-black/40 border-neon-pink/30 hover:border-neon-pink'
                    }`}
                  >
                    <img src={w.avatar} alt={w.username} className="w-8 h-8 rounded-full mx-auto mb-1 border border-neon-pink/50" />
                    <div className="text-[10px] font-arcade text-neon-pink truncate">{w.username.substring(0, 8)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Show winner countdown for Round 2 - auto-advances */}
      {showWinnerProceed && phase === 'GROUPS' && (
        <div className="fixed inset-0 z-[350] pointer-events-none flex items-center justify-center p-4 sm:p-6">
          <div className="bg-gradient-to-br from-slate-900/95 via-black/95 to-slate-900/90 border-2 border-neon-pink/50 rounded-xl p-6 sm:p-8 text-center max-w-sm w-full shadow-[0_0_40px_rgba(255,0,128,0.3)]">
            <div className="text-6xl sm:text-7xl mb-4 sm:mb-5 animate-bounce">🎊</div>
            <div className="text-3xl sm:text-4xl font-arcade text-transparent bg-clip-text bg-gradient-to-r from-neon-pink to-neon-cyan mb-3 sm:mb-4 font-black tracking-wider">TOP 20!</div>
            <div className="text-sm sm:text-base text-slate-300 mb-2 leading-relaxed">You've made the top 20! Advancing to Round 2...</div>
            <div className="text-5xl sm:text-6xl font-arcade text-neon-green font-black animate-pulse">{proceedCountdown}</div>
          </div>
        </div>
      )}

      {/* Show winner countdown for Round 2 finalists - auto-advances */}
      {showWinnerProceed && phase === 'ROUND_2' && (
        <div className="fixed inset-0 z-[350] pointer-events-none flex items-center justify-center p-4 sm:p-6">
          <div className="bg-gradient-to-br from-slate-900/95 via-black/95 to-slate-900/90 border-2 border-neon-pink/50 rounded-xl p-6 sm:p-8 text-center max-w-sm w-full shadow-[0_0_40px_rgba(255,0,128,0.3)]">
            <div className="text-6xl sm:text-7xl mb-4 sm:mb-5 animate-bounce">🏆</div>
            <div className="text-3xl sm:text-4xl font-arcade text-transparent bg-clip-text bg-gradient-to-r from-neon-pink to-neon-cyan mb-3 sm:mb-4 font-black tracking-wider">FINALIST!</div>
            <div className="text-sm sm:text-base text-slate-300 mb-2 leading-relaxed">You've made it to the Final Round with 3 other champions!</div>
            <div className="text-5xl sm:text-6xl font-arcade text-neon-green font-black animate-pulse">{proceedCountdown}</div>
          </div>
        </div>
      )}

      {/* For final-stage celebrations, show custom tournament animation for finals */}
      {announcing && displayedWinners.length > 0 && (phase === 'FINAL_PREP' || phase === 'FINAL' || phase === 'FINAL_RESULT') && (
        <TournamentWinnerAnimation
          isUserWinner={displayedWinners.some(dw => dw.id === user.id)}
          winnerCount={displayedWinners.length}
        />
      )}
      <div className="flex-1 flex overflow-auto relative">
        {/* BROWSE - Initial Tournament Selection */}
        {phase === 'BROWSE' && (
          <div className="flex-1 flex items-center justify-center bg-black/95 px-3 py-4 sm:p-4 overflow-y-auto">
            <div className="bg-vegas-panel/95 border border-neon-cyan/50 px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 rounded-lg w-full max-w-sm sm:max-w-md max-h-[calc(100dvh-32px)] overflow-y-auto custom-scrollbar relative shadow-[0_0_50px_rgba(0,255,255,0.15)] clip-corner text-center">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-cyan to-transparent opacity-50"></div>
              <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-1 sm:mb-2 text-neon-pink text-glow-pink">🎰</div>
              <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-arcade text-white mb-1 tracking-widest uppercase">TOURNAMENT</div>
              <div className="text-[10px] sm:text-xs md:text-sm font-mono text-neon-cyan opacity-80 mb-4 sm:mb-5 md:mb-6">200 Players • 20 Groups • Winner Takes All</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 sm:mb-4 md:mb-6 text-left">
                <div className="bg-black/40 border border-white/10 rounded-sm p-2 sm:p-3 md:p-4">
                  <div className="text-slate-500 text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1">Entry Fee</div>
                  <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-arcade text-neon-green font-black">${tournamentBetAmount}</div>
                </div>
                <div className="bg-black/40 border border-white/10 rounded-sm p-2 sm:p-3 md:p-4">
                  <div className="text-slate-500 text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1">Prize Pool</div>
                  <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-arcade text-neon-gold font-black">${totalPot.toLocaleString()}</div>
                </div>
              </div>

              <div className="bg-neon-purple/10 border border-neon-purple/30 rounded-sm p-2.5 sm:p-3 md:p-4 mb-3 sm:mb-4 md:mb-5">
                <div className="text-slate-400 text-[8px] sm:text-[9px] md:text-xs font-mono leading-relaxed space-y-1.5 text-left">
                  <div className="flex items-center gap-2"><span className="text-neon-green text-base sm:text-lg">✓</span><span>20 groups of 5 players</span></div>
                  <div className="flex items-center gap-2"><span className="text-neon-cyan text-base sm:text-lg">✓</span><span>Win your group → Join Final Round</span></div>
                  <div className="flex items-center gap-2"><span className="text-neon-gold text-base sm:text-lg">✓</span><span>Grand Champion wins <span className="font-black text-neon-gold">${totalPot.toLocaleString()}</span></span></div>
                </div>
              </div>
              <div className="flex gap-2 sm:gap-3 md:gap-4">
                <button
                  onClick={() => { soundManager.play('click'); navigate('/'); }}
                  className="flex-1 py-2 sm:py-2.5 md:py-3 border border-slate-700 text-slate-400 font-arcade hover:border-white hover:text-white transition-colors uppercase text-[8px] sm:text-[9px] md:text-xs tracking-wide rounded-sm"
                >
                  CANCEL
                </button>
                <button
                  onClick={() => { soundManager.play('click'); startBetFlow(); }}
                  className="flex-1 py-2 sm:py-2.5 md:py-3 bg-neon-cyan text-black font-arcade hover:bg-neon-cyan/80 transition-colors uppercase text-[8px] sm:text-[9px] md:text-xs tracking-wide rounded-sm shadow-[0_0_15px_rgba(0,255,255,0.4)] font-black"
                >
                  JOIN
                </button>
              </div>
            </div>
          </div>
        )}

        {/* BET_PROMPT - Place Bet */}
        {phase === 'BET_PROMPT' && (
          <div className="flex-1 flex items-center justify-center bg-black/95 px-3 py-4 sm:p-4 overflow-y-auto">
            <div className="bg-vegas-panel/95 border border-neon-cyan/50 px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 rounded-lg w-full max-w-sm sm:max-w-md max-h-[calc(100dvh-32px)] overflow-y-auto custom-scrollbar relative shadow-[0_0_50px_rgba(0,255,255,0.15)] clip-corner text-center">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-cyan to-transparent opacity-50"></div>
              <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-arcade font-black text-neon-cyan mb-1 sm:mb-2 text-glow-cyan">💰</div>
              <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-arcade text-white mb-1 tracking-widest uppercase">Place Your Bet</div>
              <div className="text-[10px] sm:text-xs md:text-sm font-mono text-neon-cyan opacity-80 mb-3 sm:mb-4">TOURNAMENT • {TOTAL_PLAYERS}-Player Bracket</div>

              <div className="bg-black/40 border border-white/10 rounded-sm p-2.5 sm:p-3 md:p-4 mb-2.5 sm:mb-3 md:mb-4 text-left">
                <div className="text-slate-500 text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1">Available Balance</div>
                <div className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl font-arcade font-black ${user.balance >= tournamentBetAmount ? 'text-neon-green' : 'text-red-400'}`}>
                  ${Math.max(0, user.balance - tournamentBetAmount).toLocaleString()}
                </div>
              </div>

              <div className="bg-black/40 border border-white/10 rounded-sm p-2.5 sm:p-3 md:p-4 mb-2.5 sm:mb-3 md:mb-4 text-left">
                <div className="text-slate-500 text-[9px] sm:text-[10px] md:text-xs font-bold uppercase tracking-wider mb-1">Bet Amount</div>
                <div className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-arcade text-neon-cyan font-black">${tournamentBetAmount}</div>
              </div>

              <div className="mb-3 sm:mb-4 md:mb-5">
                <div className="text-slate-500 text-[8px] sm:text-[9px] md:text-[10px] font-bold uppercase tracking-wider mb-1 sm:mb-2 text-left">
                  Quick Select
                </div>
                <div className="grid grid-cols-4 gap-1 sm:gap-2">
                  {BET_OPTIONS.map(amount => (
                    <button
                      key={amount}
                      onClick={() => { soundManager.play('click'); updateTournamentBet(amount); }}
                      disabled={amount > user.balance}
                      className={`py-1.5 sm:py-2 md:py-2.5 border font-arcade text-[8px] sm:text-[9px] md:text-xs uppercase tracking-widest transition-all rounded-sm ${
                        amount === tournamentBetAmount
                          ? 'border-neon-cyan bg-neon-cyan text-black shadow-[0_0_15px_rgba(0,255,255,0.4)]'
                          : amount > user.balance
                            ? 'border-slate-700 text-slate-600 opacity-50 cursor-not-allowed'
                            : 'border-neon-cyan text-neon-cyan hover:bg-neon-cyan/20'
                      }`}
                    >
                      ${amount}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-neon-purple/10 border border-neon-purple/30 rounded-sm p-2.5 sm:p-3 md:p-4 mb-3 sm:mb-4 md:mb-5">
                <p className="text-slate-400 text-[8px] sm:text-[9px] md:text-xs font-mono leading-relaxed text-left">
                  Your entry is locked once confirmed. Your color and group are assigned before the tournament bracket opens.
                </p>
                <div className={`text-[10px] sm:text-xs font-arcade mt-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg ${
                  user.balance >= tournamentBetAmount
                    ? 'bg-neon-green/20 text-neon-green border border-neon-green/40' 
                    : 'bg-red-500/20 text-red-300 border border-red-500/40'
                }`}>
                  {user.balance >= tournamentBetAmount ? '✓ Sufficient funds' : '⚠ Insufficient funds'}
                </div>
              </div>
              <div className="flex gap-2 sm:gap-3 md:gap-4">
                <button
                  onClick={() => { soundManager.play('click'); navigate('/'); }}
                  className="flex-1 py-2 sm:py-2.5 md:py-3 border border-slate-700 text-slate-400 font-arcade hover:border-white hover:text-white transition-colors uppercase text-[8px] sm:text-[9px] md:text-xs tracking-wide rounded-sm"
                >
                  CANCEL
                </button>
                <button
                  onClick={() => { soundManager.play('click'); confirmBet(); }}
                  disabled={user.balance < tournamentBetAmount}
                  className={`flex-1 py-2 sm:py-2.5 md:py-3 font-arcade uppercase text-[8px] sm:text-[9px] md:text-xs tracking-wide rounded-sm font-black transition-colors ${
                    user.balance < tournamentBetAmount
                      ? 'bg-slate-900 text-slate-700 cursor-not-allowed border border-white/5'
                      : 'bg-neon-cyan text-black hover:bg-neon-cyan/80 shadow-[0_0_15px_rgba(0,255,255,0.4)]'
                  }`}
                >
                  CONFIRM BET
                </button>
              </div>
            </div>
          </div>
        )}

        {/* COLOR_ASSIGN - Color Assignment */}
        {phase === 'COLOR_ASSIGN' && (
          <div className="flex-1 flex items-center justify-center bg-black/95 p-3 sm:p-4 overflow-y-auto">
            <div className="bg-vegas-panel/95 border border-white/20 p-4 sm:p-6 md:p-8 rounded-lg w-full max-w-md relative shadow-[0_0_50px_rgba(0,255,255,0.15)] clip-corner text-center">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-cyan to-transparent opacity-50"></div>
              <div className="mb-6 sm:mb-8">
                <div className="text-sm sm:text-base md:text-lg font-arcade text-slate-500 uppercase tracking-widest mb-3">TOURNAMENT</div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-arcade text-white mb-4 tracking-widest uppercase">Your Color Assignment</h2>
              </div>
              <div className="flex justify-center mb-6 sm:mb-8">
                <div className="relative" style={{ boxShadow: `0 0 60px ${COLOR_HEX[userColor as keyof typeof COLOR_HEX]}99, inset 0 0 30px ${COLOR_HEX[userColor as keyof typeof COLOR_HEX]}44` }}>
                  <div
                    className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 border-4 rounded-full flex items-center justify-center text-5xl sm:text-6xl md:text-7xl font-arcade font-black"
                    style={{
                      borderColor: COLOR_HEX[userColor as keyof typeof COLOR_HEX],
                      backgroundColor: `${COLOR_HEX[userColor as keyof typeof COLOR_HEX]}15`,
                      color: COLOR_HEX[userColor as keyof typeof COLOR_HEX]
                    }}
                  >
                    {userColor.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute inset-0 rounded-full border-2 animate-pulse" style={{ borderColor: COLOR_HEX[userColor as keyof typeof COLOR_HEX], opacity: 0.3 }} />
                  <div className="absolute -inset-4 rounded-full border-2 animate-pulse" style={{ borderColor: COLOR_HEX[userColor as keyof typeof COLOR_HEX], opacity: 0.15, animationDelay: '0.2s' }} />
                </div>
              </div>
              <div className="text-center mb-2">
                <div className="text-2xl sm:text-3xl md:text-4xl font-arcade font-black uppercase tracking-wider mb-1" style={{ color: COLOR_HEX[userColor as keyof typeof COLOR_HEX] }}>{userColorDisplay}</div>
                <div className="text-xs sm:text-sm font-mono text-slate-500">{COLOR_HEX[userColor as keyof typeof COLOR_HEX]}</div>
              </div>
              <div className="bg-black/40 border border-white/10 rounded-sm p-3 sm:p-4 mb-6 sm:mb-8 mt-6 sm:mt-8 text-left">
                <div className="text-slate-400 text-[9px] sm:text-xs font-bold uppercase tracking-wider mb-2">Game Status</div>
                <div className="text-slate-300 text-[10px] sm:text-xs font-mono leading-relaxed">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-block w-2 h-2 bg-neon-purple rounded-full animate-pulse"></span>
                    COLOR LOCKED
                  </div>
                  <div className="text-slate-500 text-[9px] mt-2">
                    Your <span className="font-bold uppercase" style={{ color: COLOR_HEX[userColor as keyof typeof COLOR_HEX] }}>{userColorDisplay}</span> color is fixed for this tournament. Bet locked: ${tournamentBetAmount}.
                  </div>
                </div>
              </div>
              <button
                onClick={() => { soundManager.play('click'); proceedFromColor(); }}
                className="w-full py-3 sm:py-4 bg-neon-cyan text-black font-arcade hover:bg-neon-cyan/80 transition-colors uppercase text-[9px] sm:text-xs tracking-widest rounded-sm shadow-[0_0_15px_rgba(0,255,255,0.4)] font-black"
              >
                ENTER GAME ROOM
              </button>
              <div className="text-center mt-4 sm:mt-6">
                <p className="text-slate-500 text-[8px] sm:text-[9px] font-mono uppercase tracking-wider">All players must place bets to proceed</p>
              </div>
            </div>
          </div>
        )}

        {/* ROOM_ASSIGN - Room Assignment */}
        {phase === 'ROOM_ASSIGN' && (
          <div className="flex-1 flex items-center justify-center p-3 sm:p-4">
            <div className="text-center max-w-sm w-full">
              <div className="text-5xl sm:text-6xl mb-3 sm:mb-4">🚪</div>
              <div className="text-2xl sm:text-3xl font-arcade text-transparent bg-clip-text bg-gradient-to-r from-neon-pink to-neon-gold mb-4 font-black tracking-wider">Room Assigned</div>
              <div className="bg-gradient-to-br from-slate-900/80 via-black/80 to-slate-900/60 border-2 border-neon-pink/40 rounded-xl p-4 sm:p-6 mb-4 sm:mb-5 shadow-[0_0_30px_rgba(255,0,128,0.2)] space-y-3.5">
                <div>
                  <div className="text-slate-400 mb-1.5 text-xs font-arcade tracking-wider uppercase">Your Group</div>
                  <div className="text-3xl sm:text-4xl font-arcade text-neon-cyan font-black drop-shadow-[0_0_25px_rgba(0,255,255,0.8)] animate-pulse" style={{ textShadow: '0 0 30px rgba(0,255,255,0.8), 0 0 60px rgba(0,255,255,0.5)' }}>GROUP {userGroup}</div>
                </div>
                <div className="border-t border-slate-700/50 pt-3">
                  <div className="text-slate-400 mb-1.5 text-xs font-arcade tracking-wider uppercase">Room Number</div>
                  <div className="text-3xl sm:text-4xl font-arcade text-neon-gold font-black tracking-wider drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]">{userRoom}</div>
                </div>
                <div className="text-xs font-arcade text-slate-400 bg-slate-800/50 rounded-lg p-2.5 border border-slate-700/50">
                  ⏳ Waiting for other players...
                </div>
              </div>
              <button
                onClick={() => { soundManager.play('click'); joinGameroom(); }}
                className="hidden lg:block w-full px-6 sm:px-8 py-2.5 sm:py-3 text-neon-pink border-2 border-neon-pink font-arcade text-sm sm:text-base font-black hover:bg-gradient-to-r hover:from-neon-pink hover:to-neon-gold hover:text-black hover:shadow-[0_0_30px_rgba(255,0,128,0.6)] transition-all duration-300 rounded-lg"
              >
                Join Gameroom
              </button>
            </div>
          </div>
        )}

        {/* BRACKET_VIEW - Tournament Bracket with Proceed Button */}
        {phase === 'BRACKET_VIEW' && (
          <div className="flex-1 bg-black/95 overflow-hidden">
            <TournamentBracketNew 
              groupNumber={userGroup}
              playersInGroup={PLAYERS_PER_GROUP}
              userUsername={user.username}
              autoStartSeconds={10}
              onProceedClick={() => {
                soundManager.play('click');
                setPhase('GROUPS');
                setCountdown(3);
                setCountdownActive(true);
              }}
            />
          </div>
        )}

        {/* LOBBY - Waiting Room */}
        {phase === 'LOBBY' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl mb-4 animate-bounce">⏳</div>
              <div className="text-2xl font-arcade text-neon-cyan mb-2">Tournament Starting</div>
              <div className="text-neon-green font-arcade">Room {userRoom}</div>
            </div>
          </div>
        )}

        {/* GROUPS - Tournament Spinning */}
        {phase === 'GROUPS' && (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden gap-2 lg:gap-4 p-2 lg:p-4">
            {/* Left: Active player rail - Hidden on mobile, shown on desktop */}
            <div className="hidden lg:flex w-72 pt-14 bg-vegas-panel border-r border-white/5 overflow-y-auto flex-col flex-shrink-0 custom-scrollbar">
              <div className="p-4 border-b border-white/5 bg-black/40">
                <h2 className="font-arcade text-[9px] text-neon-cyan tracking-widest uppercase opacity-70">SYST_ACTIVE_NODES</h2>
                <div className="mt-1 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_lime]"></span>
                  <span className="text-[10px] font-mono text-slate-400">GROUP {userGroup} • {userGroupPlayers.length} CONNECTED</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1.5">
                {userGroupPlayers.map((p) => {
                  const rankConfig = RANK_CONFIG[p.rank || UserRank.ROOKIE];
                  return (
                    <div
                      key={p.id}
                      className={`flex items-center gap-3 p-2 rounded border border-transparent transition-all duration-300 ${
                        p.id === user.id ? 'bg-white/10 border-white/20' : 'bg-black/20 hover:bg-white/5'
                      }`}
                    >
                      <div
                        className="relative w-9 h-9 rounded-full border-2 flex-shrink-0 bg-black"
                        style={{ borderColor: rankConfig.color, boxShadow: `0 0 12px ${rankConfig.color}66` }}
                      >
                        <img src={p.avatar} alt={p.username} className="w-full h-full object-cover rounded-full p-[1px]" />
                        <div className="absolute -bottom-1 -right-1 bg-neon-green rounded-full w-4 h-4 flex items-center justify-center border border-black shadow-[0_0_8px_lime]">
                          <span className="text-black text-[8px] font-black">✓</span>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-bold text-white truncate uppercase flex items-center justify-between">
                          <span>{p.username}</span>
                          {p.id === user.id && <span className="text-[7px] text-neon-cyan border border-neon-cyan/50 px-1 rounded ml-1 animate-pulse">YOU</span>}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[8px] font-arcade px-1 border-b uppercase opacity-80" style={{ color: rankConfig.color, borderColor: rankConfig.color + '44' }}>
                            {rankConfig.label}
                          </span>
                          <span className="text-neon-green text-[9px] font-mono font-black">${p.betAmount}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {/* Left: Groups Panel - Hidden on mobile, shown on desktop */}
            <div className="hidden w-80 bg-black/40 border border-neon-cyan/30 rounded overflow-y-auto flex-col flex-shrink-0">
              <div className="sticky top-0 bg-black/80 border-b border-neon-cyan/30 p-3">
                <div className="text-neon-cyan font-arcade text-sm">📊 GROUPS</div>
                <div className="text-neon-green text-xs mt-1">Spinning: Group {currentGroupIndex + 1}/20</div>
              </div>
              <div className="flex-1 p-2 overflow-y-auto">
                <div className="space-y-2">
                  {groups.map((group) => (
                    <div
                      key={group.groupNumber}
                      onClick={() => setExpandedGroup(expandedGroup === group.groupNumber ? null : group.groupNumber)}
                      className={`mb-0 rounded cursor-pointer transition ${group.groupNumber === userGroup ? 'user-group-highlight' : 'bg-slate-800/30 border border-slate-600/30'}`}
                    >
                    <div className="p-2 flex items-center justify-between">
                      <div className="font-arcade text-sm">
                        {group.groupNumber === userGroup && '👤 '}GROUP {group.groupNumber}
                      </div>
                      <span className="text-xs text-slate-400">{expandedGroup === group.groupNumber ? '▼' : '▶'}</span>
                    </div>
                    {expandedGroup === group.groupNumber && (
                      <div className="border-t border-slate-600/30 p-2 bg-black/40">
                        {group.players.map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center gap-2 p-1.5 mb-1 rounded text-[11px] bg-slate-700/20"
                          >
                            <img src={p.avatar} alt={p.username} className="w-4 h-4 rounded-full" />
                            <span className="flex-1 truncate font-arcade">{p.username}</span>
                            {p.id === user.id && <span className="text-neon-gold animate-pulse">✓</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                </div>
              </div>
            </div>

            {/* Center: Wheel + Mobile Controls */}
            <div className="lg:hidden flex-1 flex flex-col items-center justify-center px-2 py-2 gap-3">
              {/* Status counters area */}
              <div className="flex flex-col items-center justify-end gap-1 flex-shrink-0 min-h-[48px] pt-4">
                {countdownActive && countdown > 0 && (
                  <div className="text-center">
                    <div className="text-2xl font-arcade text-neon-pink animate-pulse">{countdown}</div>
                    <div className="text-[9px] text-slate-400 mt-1">Preparing to spin...</div>
                  </div>
                )}
                
                {spinning && (
                  <div className="text-[9px] sm:text-xs text-neon-cyan font-arcade font-bold animate-pulse">Spinning... Group {currentGroupIndex + 1}/20</div>
                )}
              </div>

              {/* Responsive Wheel Container - Compact for mobile */}
              <div className="flex items-center justify-center w-full max-w-sm h-56 flex-shrink-0">
                <div className="w-full h-full" />
              </div>

              {/* Mobile Control Buttons - Below wheel */}
              <div className="fixed left-0 right-0 bottom-28 z-50 flex gap-2 justify-center px-4 pointer-events-auto">
                <button
                  onClick={() => { soundManager.play('click'); setShowGroupsPanel(true); }}
                  className="min-w-[104px] px-4 py-3 font-arcade text-[10px] tracking-wider transition-all border-2 border-neon-cyan text-neon-cyan bg-black/50 hover:bg-neon-cyan hover:text-black whitespace-nowrap font-black"
                >
                  GROUPS
                </button>
                <button
                  onClick={() => { soundManager.play('click'); setShowStatusPanel(true); }}
                  className="min-w-[104px] px-4 py-3 font-arcade text-[10px] tracking-wider transition-all border border-neon-pink text-neon-pink bg-black/50 hover:bg-neon-pink hover:text-black whitespace-nowrap font-black"
                >
                  STATUS
                </button>
                <button
                  onClick={() => { soundManager.play('click'); setShowChatPanel(true); }}
                  className="min-w-[104px] px-4 py-3 font-arcade text-[10px] tracking-wider transition-all border border-neon-green text-neon-green bg-black/50 hover:bg-neon-green hover:text-black whitespace-nowrap font-black"
                >
                  CHATS
                </button>
              </div>
            </div>

            {/* Desktop Layout - Hidden on mobile */}
            <div className="hidden lg:flex flex-1 flex-col items-center justify-center gap-4 sm:gap-6 px-2 sm:px-6">
              {countdownActive && countdown > 0 && (
                <div className="text-center mb-2 sm:mb-4 mt-12 sm:mt-14">
                  <div className="text-4xl sm:text-6xl font-arcade text-neon-pink animate-pulse">{countdown}</div>
                  <div className="text-xs sm:text-sm text-slate-400 mt-2">Preparing to spin...</div>
                </div>
              )}
              
              {spinning && (
                <div className="text-sm sm:text-lg font-arcade text-neon-cyan mb-4 animate-pulse">Spinning... Group {currentGroupIndex + 1}/20</div>
              )}

              {/* Responsive Wheel Container */}
              <div className="flex items-center justify-center w-full max-w-2xl aspect-square">
                <div className="w-full h-full max-w-xl max-h-xl" />
              </div>
            </div>

            {/* Right: Chat + Status - Hidden on mobile, collapsible */}
            <div className="hidden lg:flex w-80 bg-black border-l border-neon-pink/40 flex-col flex-shrink-0">
              <div className="px-3 py-3 border-b border-neon-pink/40 flex items-center justify-between">
                <div className="text-neon-pink font-arcade text-xs tracking-widest uppercase">COMM_CHANNEL_01</div>
                <span className="w-2 h-2 bg-neon-green rounded-full shadow-[0_0_8px_lime]"></span>
              </div>
              {/* Total Pot */}
              <div className="p-3 border-b border-neon-pink/30">
                <div className="text-neon-gold font-arcade text-[10px] mb-1">TOTAL POT</div>
                <div className="text-neon-green font-arcade">${totalPot.toLocaleString()}</div>
              </div>
              {/* User Status */}
              <div className="bg-black/80 border-b border-neon-pink/30 p-3">
                <div className="text-neon-pink font-arcade text-sm mb-2">🎮 YOUR STATUS</div>
                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-slate-400">Your Color:</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div
                        className="w-4 h-4 rounded-full border border-white"
                        style={{ backgroundColor: isColorVisible ? COLOR_HEX[userColor as keyof typeof COLOR_HEX] : '#4b5563' }}
                      />
                      <span className="font-arcade capitalize">{isColorVisible ? userColor : 'Hidden'}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Bet:</span>
                    <div className="font-arcade text-neon-green">${tournamentBetAmount} 🔒</div>
                  </div>
                </div>
              </div>

              {/* Chat */}
              <div className="flex-1 border-b border-neon-pink/30 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-2 space-y-1.5 text-xs">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-slate-500 py-4">No messages</div>
                  ) : (
                    chatMessages.map((msg, i) => (
                      <div key={i}>
                        <div className="text-neon-cyan font-arcade text-[10px]">{msg.user}</div>
                        <div className="text-slate-300 ml-2 text-[11px]">{msg.msg}</div>
                      </div>
                    ))
                  )}
                </div>
                <div className="border-t border-neon-pink/30 p-2 flex gap-1">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && chatInput.trim()) {
                        setChatMessages([...chatMessages, { user: user.username, msg: chatInput }]);
                        setChatInput('');
                      }
                    }}
                    placeholder="Say..."
                    className="flex-1 bg-black/60 border border-neon-pink/30 rounded px-2 py-1 text-xs text-white placeholder-slate-600 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      if (chatInput.trim()) {
                        setChatMessages([...chatMessages, { user: user.username, msg: chatInput }]);
                        setChatInput('');
                      }
                    }}
                    className="border border-neon-pink text-neon-pink text-xs px-2 py-1 hover:bg-neon-pink hover:text-black"
                  >
                    ✓
                  </button>
                </div>
              </div>

              {/* Winners */}
              <div className="bg-black/80 p-3 max-h-32 overflow-y-auto">
                <div className="text-neon-green font-arcade text-[10px] mb-2">WINNERS: {groupWinners.length}/20</div>
                <div className="space-y-1 text-[10px]">
                  {groupWinners.map((w, i) => (
                    <div key={w.id} className="flex items-center gap-1">
                      <span className="text-neon-gold font-arcade">G{i + 1}:</span>
                      <span className={w.id === user.id ? 'text-neon-cyan' : 'text-slate-300'}>{w.username}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* GROUPS MODAL - Mobile Only */}
            {showGroupsPanel && (
              <div className="lg:hidden fixed inset-0 bg-black/80 z-50 flex items-end">
                <div className="w-full bg-black/95 border-t border-neon-cyan/30 rounded-t-lg max-h-[70vh] overflow-y-auto">
                  <div className="sticky top-0 bg-black/80 border-b border-neon-cyan/30 p-4 flex justify-between items-center">
                    <div className="text-neon-cyan font-arcade">📊 ALL GROUPS</div>
                    <button
                      onClick={() => { soundManager.play('click'); setShowGroupsPanel(false); }}
                      className="text-neon-cyan hover:text-white text-2xl leading-none"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="p-3 space-y-2">
                    {groups.map((group) => (
                      <div
                        key={group.groupNumber}
                        onClick={() => setExpandedGroup(expandedGroup === group.groupNumber ? null : group.groupNumber)}
                        className={`rounded cursor-pointer transition ${group.groupNumber === userGroup ? 'user-group-highlight' : 'bg-slate-800/30 border border-slate-600/30'}`}
                      >
                        <div className="p-2.5 flex items-center justify-between">
                          <div className="font-arcade text-sm">
                            {group.groupNumber === userGroup && '👤 '}GROUP {group.groupNumber}
                          </div>
                          <span className="text-xs text-slate-400">{expandedGroup === group.groupNumber ? '▼' : '▶'}</span>
                        </div>
                        {expandedGroup === group.groupNumber && (
                          <div className="border-t border-slate-600/30 p-2 bg-black/40">
                            {group.players.map((p) => (
                              <div
                                key={p.id}
                                className="flex items-center gap-2 p-1.5 mb-1 rounded text-[11px] bg-slate-700/20"
                              >
                                <img src={p.avatar} alt={p.username} className="w-4 h-4 rounded-full" />
                                <span className="flex-1 truncate font-arcade">{p.username}</span>
                                {p.id === user.id && <span className="text-neon-gold animate-pulse">✓</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STATUS MODAL - Mobile Only */}
            {showStatusPanel && (
              <div className="lg:hidden fixed inset-0 bg-black/80 z-50 flex items-end">
                <div className="w-full bg-black/95 border-t border-neon-pink/30 rounded-t-lg max-h-[70vh] overflow-y-auto">
                  <div className="sticky top-0 bg-black/80 border-b border-neon-pink/30 p-4 flex justify-between items-center">
                    <div className="text-neon-pink font-arcade">🎮 YOUR STATUS</div>
                    <button
                      onClick={() => { soundManager.play('click'); setShowStatusPanel(false); }}
                      className="text-neon-pink hover:text-white text-2xl leading-none"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="p-4 space-y-4">
                    {/* Total Pot */}
                    <div className="bg-black/60 border border-neon-gold/30 rounded p-3">
                      <div className="text-neon-gold font-arcade text-xs mb-2">TOTAL POT</div>
                      <div className="text-lg sm:text-xl font-arcade font-black text-neon-green">${totalPot.toLocaleString()}</div>
                    </div>
                    {/* Your Details */}
                    <div className="bg-black/60 border border-neon-pink/30 rounded p-3 space-y-2">
                      <div>
                        <span className="text-slate-400 text-xs">Your Color</span>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div
                            className="w-6 h-6 rounded border-2 border-white"
                            style={{ backgroundColor: userColorStyle }}
                          />
                          <span className="font-arcade text-sm capitalize">{userColorDisplay}</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-neon-pink/20">
                        <span className="text-slate-400 text-xs">Bet Amount</span>
                        <div className="font-arcade text-neon-green mt-1">${tournamentBetAmount} 🔒</div>
                      </div>
                      <div className="pt-2 border-t border-neon-pink/20">
                        <span className="text-slate-400 text-xs">Your Group</span>
                        <div className="font-arcade text-neon-cyan mt-1 font-black drop-shadow-[0_0_25px_rgba(0,255,255,0.8)] animate-pulse" style={{ textShadow: '0 0 30px rgba(0,255,255,0.8), 0 0 60px rgba(0,255,255,0.5)' }}>GROUP {userGroup}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CHAT MODAL - Mobile Only */}
            {showChatPanel && (
              <div className="lg:hidden fixed inset-0 bg-black/80 z-50 flex items-end">
                <div className="w-full bg-black/95 border-t border-neon-green/30 rounded-t-lg max-h-[70vh] overflow-y-auto flex flex-col">
                  <div className="sticky top-0 bg-black/80 border-b border-neon-green/30 p-4 flex justify-between items-center">
                    <div className="text-neon-green font-arcade">💬 CHAT</div>
                    <button
                      onClick={() => { soundManager.play('click'); setShowChatPanel(false); }}
                      className="text-neon-green hover:text-white text-2xl leading-none"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {chatMessages.length === 0 ? (
                      <div className="text-center text-slate-500 py-8">No messages yet</div>
                    ) : (
                      chatMessages.map((msg, i) => (
                        <div key={i} className="text-xs">
                          <div className="text-neon-cyan font-arcade text-[10px]">{msg.user}</div>
                          <div className="text-slate-300 ml-2">{msg.msg}</div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="border-t border-neon-green/30 p-3 bg-black/60 flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && chatInput.trim()) {
                          setChatMessages([...chatMessages, { user: user.username, msg: chatInput }]);
                          setChatInput('');
                        }
                      }}
                      placeholder="Say..."
                      className="flex-1 bg-black/60 border border-neon-green/30 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        if (chatInput.trim()) {
                          soundManager.play('click');
                          setChatMessages([...chatMessages, { user: user.username, msg: chatInput }]);
                          setChatInput('');
                        }
                      }}
                      className="border border-neon-green text-neon-green px-2.5 py-1.5 hover:bg-neon-green hover:text-black text-xs font-bold transition"
                    >
                      ✓
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ROUND_2 - Round 2 Spinning */}
        {phase === 'ROUND_2' && (
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden gap-2 lg:gap-4 p-2 lg:p-4">
            {/* Left: Round 2 Matches Panel - Hidden on mobile */}
            <div className="hidden lg:flex w-80 bg-black/40 border border-neon-pink/30 rounded overflow-y-auto flex-col flex-shrink-0">
              <div className="sticky top-0 bg-black/80 border-b border-neon-pink/30 p-3">
                <div className="text-neon-pink font-arcade text-sm">🏆 ROUND 2</div>
                <div className="text-neon-green text-xs mt-1">Spinning: Round 1/4</div>
              </div>
              <div className="flex-1 p-2 overflow-y-auto">
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, qfIdx) => {
                    const groupStart = qfIdx * 5;
                    const groupEnd = groupStart + 5;
                    const qfGroup = groupWinners.slice(groupStart, groupEnd);
                    const userInThisGroup = qfGroup.some(p => p.id === user.id);
                    return (
                      <div
                        key={qfIdx}
                        onClick={() => setExpandedGroup(expandedGroup === qfIdx + 100 ? null : qfIdx + 100)}
                        className={`mb-0 rounded cursor-pointer transition ${userInThisGroup ? 'user-group-highlight' : 'bg-slate-800/30 border border-slate-600/30'}`}
                      >
                        <div className="p-2 flex items-center justify-between">
                          <div className="font-arcade text-sm">
                            {userInThisGroup && '👤 '}MATCH {qfIdx + 1}
                          </div>
                          <span className="text-xs text-slate-400">{expandedGroup === qfIdx + 100 ? '▼' : '▶'}</span>
                        </div>
                        {expandedGroup === qfIdx + 100 && (
                          <div className="border-t border-slate-600/30 p-2 bg-black/40">
                            {qfGroup.map((p) => (
                              <div
                                key={p.id}
                                className="flex items-center gap-2 p-1.5 mb-1 rounded text-[11px] bg-slate-700/20"
                              >
                                <img src={p.avatar} alt={p.username} className="w-4 h-4 rounded-full" />
                                <span className="flex-1 truncate font-arcade">{p.username}</span>
                                {p.id === user.id && <span className="text-neon-gold animate-pulse">✓</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Center: Wheel + Mobile Controls */}
            <div className="lg:hidden flex-1 flex flex-col items-center justify-center px-2 py-2 gap-3">
              {/* Status counters area */}
              <div className="flex flex-col items-center justify-end gap-1 flex-shrink-0 min-h-[48px] pt-4">
                {countdownActive && countdown > 0 && (
                  <div className="text-center">
                    <div className="text-2xl font-arcade text-neon-pink animate-pulse">{countdown}</div>
                    <div className="text-[9px] text-slate-400 mt-1">Preparing Round 2...</div>
                  </div>
                )}
                
                {spinning && (
                  <div className="text-[9px] sm:text-xs text-neon-pink font-arcade font-bold animate-pulse">ROUND 2 Spinning...</div>
                )}
              </div>

              {/* Responsive Wheel Container - Compact for mobile */}
              <div className="flex items-center justify-center w-full max-w-sm h-56 flex-shrink-0">
                <div className="w-full h-full" />
              </div>

              {/* Mobile Control Buttons - Below wheel */}
              <div className="fixed left-0 right-0 bottom-28 z-50 flex gap-2 justify-center px-4 pointer-events-auto">
                <button
                  onClick={() => { soundManager.play('click'); setShowGroupsPanel(true); }}
                  className="min-w-[104px] px-4 py-3 font-arcade text-[10px] tracking-wider transition-all border-2 border-neon-pink text-neon-pink bg-black/50 hover:bg-neon-pink hover:text-black whitespace-nowrap font-black"
                >
                  MATCHES
                </button>
                <button
                  onClick={() => { soundManager.play('click'); setShowStatusPanel(true); }}
                  className="min-w-[104px] px-4 py-3 font-arcade text-[10px] tracking-wider transition-all border border-neon-cyan text-neon-cyan bg-black/50 hover:bg-neon-cyan hover:text-black whitespace-nowrap font-black"
                >
                  STATUS
                </button>
                <button
                  onClick={() => { soundManager.play('click'); setShowChatPanel(true); }}
                  className="min-w-[104px] px-4 py-3 font-arcade text-[10px] tracking-wider transition-all border border-neon-green text-neon-green bg-black/50 hover:bg-neon-green hover:text-black whitespace-nowrap font-black"
                >
                  CHATS
                </button>
              </div>
            </div>

            {/* Desktop Layout - Hidden on mobile */}
            <div className="hidden lg:flex flex-1 flex-col items-center justify-center gap-4 sm:gap-6 px-2 sm:px-6">
              {countdownActive && countdown > 0 && (
                <div className="text-center mb-2 sm:mb-4 mt-10 sm:mt-12">
                  <div className="text-4xl sm:text-6xl font-arcade text-neon-pink animate-pulse">{countdown}</div>
                  <div className="text-xs sm:text-sm text-slate-400 mt-2">Preparing Round 2...</div>
                </div>
              )}
              
              {spinning && (
                <div className="text-sm sm:text-lg font-arcade text-neon-pink mb-4 animate-pulse">Round 2 Spinning...</div>
              )}

              {/* Responsive Wheel Container */}
              <div className="flex items-center justify-center w-full max-w-2xl aspect-square">
                <div className="w-full h-full max-w-xl max-h-xl" />
              </div>
            </div>

            {/* Right: Chat + Status - Hidden on mobile */}
            <div className="hidden lg:flex w-80 bg-black/40 border border-neon-pink/30 rounded flex-col flex-shrink-0">
              {/* Total Pot */}
              <div className="p-3 border-b border-neon-pink/30">
                <div className="text-neon-gold font-arcade text-[10px] mb-1">TOTAL POT</div>
                <div className="text-neon-green font-arcade">${totalPot.toLocaleString()}</div>
              </div>
              {/* User Status */}
              <div className="bg-black/80 border-b border-neon-pink/30 p-3">
                <div className="text-neon-pink font-arcade text-sm mb-2">🎮 YOUR STATUS</div>
                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-slate-400">Your Color:</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div
                        className="w-4 h-4 rounded-full border border-white"
                        style={{ backgroundColor: userColorStyle }}
                      />
                      <span className="font-arcade capitalize">{userColorDisplay}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Stage:</span>
                    <div className="font-arcade text-neon-pink">Round 2 🏆</div>
                  </div>
                </div>
              </div>

              {/* Chat */}
              <div className="flex-1 border-b border-neon-pink/30 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-2 space-y-1.5 text-xs">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-slate-500 py-4">No messages</div>
                  ) : (
                    chatMessages.map((msg, i) => (
                      <div key={i}>
                        <div className="text-neon-pink font-arcade text-[10px]">{msg.user}</div>
                        <div className="text-slate-300 ml-2 text-[11px]">{msg.msg}</div>
                      </div>
                    ))
                  )}
                </div>
                <div className="border-t border-neon-pink/30 p-2 flex gap-1">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && chatInput.trim()) {
                        setChatMessages([...chatMessages, { user: user.username, msg: chatInput }]);
                        setChatInput('');
                      }
                    }}
                    placeholder="Say..."
                    className="flex-1 bg-black/60 border border-neon-pink/30 rounded px-2 py-1 text-xs text-white placeholder-slate-600 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      if (chatInput.trim()) {
                        setChatMessages([...chatMessages, { user: user.username, msg: chatInput }]);
                        setChatInput('');
                      }
                    }}
                    className="border border-neon-pink text-neon-pink text-xs px-2 py-1 hover:bg-neon-pink hover:text-black"
                  >
                    ✓
                  </button>
                </div>
              </div>

              {/* Winners */}
              <div className="bg-black/80 p-3 max-h-32 overflow-y-auto">
                <div className="text-neon-green font-arcade text-[10px] mb-2">COMPETING: {groupWinners.length}/20</div>
                <div className="space-y-1 text-[10px]">
                  {groupWinners.map((w, i) => (
                    <div key={w.id} className="flex items-center gap-1">
                      <span className="text-neon-gold font-arcade">Q{Math.floor(i / 5) + 1}:</span>
                      <span className={w.id === user.id ? 'text-neon-pink' : 'text-slate-300'}>{w.username}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ROUND_2 MODAL - Mobile Only */}
            {showGroupsPanel && phase === 'ROUND_2' && (
              <div className="lg:hidden fixed inset-0 bg-black/80 z-50 flex items-end">
                <div className="w-full bg-black/95 border-t border-neon-pink/30 rounded-t-lg max-h-[70vh] overflow-y-auto">
                  <div className="sticky top-0 bg-black/80 border-b border-neon-pink/30 p-4 flex justify-between items-center">
                    <div className="text-neon-pink font-arcade">🏆 ROUND 2 MATCHES</div>
                    <button
                      onClick={() => { soundManager.play('click'); setShowGroupsPanel(false); }}
                      className="text-neon-pink hover:text-white text-2xl leading-none"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="p-3 space-y-2">
                    {Array.from({ length: 4 }).map((_, qfIdx) => {
                      const groupStart = qfIdx * 5;
                      const groupEnd = groupStart + 5;
                      const qfGroup = groupWinners.slice(groupStart, groupEnd);
                      const userInThisGroup = qfGroup.some(p => p.id === user.id);
                      return (
                        <div
                          key={qfIdx}
                          onClick={() => setExpandedGroup(expandedGroup === qfIdx + 100 ? null : qfIdx + 100)}
                          className={`rounded cursor-pointer transition ${userInThisGroup ? 'user-group-highlight' : 'bg-slate-800/30 border border-slate-600/30'}`}
                        >
                          <div className="p-2.5 flex items-center justify-between">
                            <div className="font-arcade text-sm">
                              {userInThisGroup && '👤 '}MATCH {qfIdx + 1}
                            </div>
                            <span className="text-xs text-slate-400">{expandedGroup === qfIdx + 100 ? '▼' : '▶'}</span>
                          </div>
                          {expandedGroup === qfIdx + 100 && (
                            <div className="border-t border-slate-600/30 p-2 bg-black/40">
                              {qfGroup.map((p) => (
                                <div
                                  key={p.id}
                                  className="flex items-center gap-2 p-1.5 mb-1 rounded text-[11px] bg-slate-700/20"
                                >
                                  <img src={p.avatar} alt={p.username} className="w-4 h-4 rounded-full" />
                                  <span className="flex-1 truncate font-arcade">{p.username}</span>
                                  {p.id === user.id && <span className="text-neon-pink animate-pulse">✓</span>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* STATUS MODAL - Mobile Only */}
            {showStatusPanel && phase === 'ROUND_2' && (
              <div className="lg:hidden fixed inset-0 bg-black/80 z-50 flex items-end">
                <div className="w-full bg-black/95 border-t border-neon-cyan/30 rounded-t-lg max-h-[70vh] overflow-y-auto">
                  <div className="sticky top-0 bg-black/80 border-b border-neon-cyan/30 p-4 flex justify-between items-center">
                    <div className="text-neon-cyan font-arcade">🎮 YOUR STATUS</div>
                    <button
                      onClick={() => { soundManager.play('click'); setShowStatusPanel(false); }}
                      className="text-neon-cyan hover:text-white text-2xl leading-none"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="p-4 space-y-4">
                    {/* Total Pot */}
                    <div className="bg-black/60 border border-neon-gold/30 rounded p-3">
                      <div className="text-neon-gold font-arcade text-xs mb-2">TOTAL POT</div>
                      <div className="text-lg sm:text-xl font-arcade font-black text-neon-green">${totalPot.toLocaleString()}</div>
                    </div>
                    {/* Your Details */}
                    <div className="bg-black/60 border border-neon-cyan/30 rounded p-3 space-y-2">
                      <div>
                        <span className="text-slate-400 text-xs">Your Color</span>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div
                            className="w-6 h-6 rounded border-2 border-white"
                            style={{ backgroundColor: userColorStyle }}
                          />
                          <span className="font-arcade text-sm capitalize">{userColorDisplay}</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-neon-cyan/20">
                        <span className="text-slate-400 text-xs">Tournament Stage</span>
                        <div className="font-arcade text-neon-pink mt-1 font-black">ROUND 2 🏆</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CHAT MODAL - Mobile Only */}
            {showChatPanel && phase === 'ROUND_2' && (
              <div className="lg:hidden fixed inset-0 bg-black/80 z-50 flex items-end">
                <div className="w-full bg-black/95 border-t border-neon-green/30 rounded-t-lg max-h-[70vh] overflow-y-auto flex flex-col">
                  <div className="sticky top-0 bg-black/80 border-b border-neon-green/30 p-4 flex justify-between items-center">
                    <div className="text-neon-green font-arcade">💬 CHAT</div>
                    <button
                      onClick={() => { soundManager.play('click'); setShowChatPanel(false); }}
                      className="text-neon-green hover:text-white text-2xl leading-none"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {chatMessages.length === 0 ? (
                      <div className="text-center text-slate-500 py-8">No messages yet</div>
                    ) : (
                      chatMessages.map((msg, i) => (
                        <div key={i} className="text-xs">
                          <div className="text-neon-pink font-arcade text-[10px]">{msg.user}</div>
                          <div className="text-slate-300 ml-2">{msg.msg}</div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="border-t border-neon-green/30 p-3 bg-black/60 flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && chatInput.trim()) {
                          setChatMessages([...chatMessages, { user: user.username, msg: chatInput }]);
                          setChatInput('');
                        }
                      }}
                      placeholder="Say..."
                      className="flex-1 bg-black/60 border border-neon-green/30 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        if (chatInput.trim()) {
                          soundManager.play('click');
                          setChatMessages([...chatMessages, { user: user.username, msg: chatInput }]);
                          setChatInput('');
                        }
                      }}
                      className="border border-neon-green text-neon-green px-2.5 py-1.5 hover:bg-neon-green hover:text-black text-xs font-bold transition"
                    >
                      ✓
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* GROUP_RESULT - Tournament Flow Visualization */}
        {phase === 'GROUP_RESULT' && (
          <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto relative">
            <div className="w-full max-w-4xl">
              {/* Tournament Flow Diagram */}
              <div className="space-y-6">
                {/* Stage 2: Group Winners */}
                <div className="bg-gradient-to-br from-slate-900/80 via-black/80 to-slate-900/60 border-2 border-neon-gold/40 rounded-xl p-6 sm:p-8 relative shadow-[0_0_30px_rgba(255,215,0,0.2)]">
                  <div className="text-xs sm:text-sm font-arcade text-slate-300 mb-5 uppercase tracking-wider font-bold">🎯 Stage 2: 20 Winners Selected</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-6">
                    {groupWinners.map((winner, idx) => (
                      <div 
                        key={winner.id} 
                        className={`rounded-lg p-3 transition duration-300 border-2 ${
                          winner.id === user.id 
                            ? 'bg-gradient-to-b from-neon-gold/30 to-neon-cyan/30 border-neon-gold shadow-[0_0_20px_rgba(255,215,0,0.4)]' 
                            : 'bg-slate-800/40 border-slate-600/40 hover:border-neon-gold/50'
                        }`}
                      >
                        <img src={winner.avatar} alt={winner.username} className="w-10 h-10 rounded-full mx-auto mb-2 border-2 border-neon-gold/50" />
                        <div className={`text-[10px] font-arcade truncate font-bold ${winner.id === user.id ? 'text-neon-gold' : 'text-slate-300'}`}>
                          {winner.username.substring(0, 10)}
                        </div>
                        {winner.id === user.id && <div className="text-[9px] text-neon-green mt-1 font-black">✓ YOU</div>}
                      </div>
                    ))}
                  </div>
                  {groupWinners.some(w => w.id === user.id) ? (
                    <div className="bg-neon-gold/15 border-2 border-neon-gold/40 rounded-lg px-4 py-3 text-center">
                      <div className="text-neon-gold font-arcade text-sm mb-1 font-black">🎉 YOU ADVANCED!</div>
                      <div className="text-xs text-slate-400">Final Round starts automatically</div>
                    </div>
                  ) : (
                    <div className="bg-red-950/20 border-2 border-red-700/30 rounded-lg px-4 py-3 text-center">
                      <div className="text-red-400 font-arcade text-sm mb-1 font-black">❌ ELIMINATED</div>
                      <div className="text-xs text-slate-400">You didn't win your group</div>
                    </div>
                  )}

                  {/* Winner/Loser Image - Bottom Right of Card */}
                  <div className="absolute bottom-4 right-4 z-[201] pointer-events-none bg-transparent max-w-[360px] max-h-[360px]">
                    <img 
                      src={groupWinners.some(w => w.id === user.id) ? '/winner.png' : '/loser.png'}
                      alt={groupWinners.some(w => w.id === user.id) ? 'Winner' : 'Loser'}
                      className="w-28 h-28 sm:w-56 sm:h-56 md:w-64 md:h-64 object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.5)] bg-transparent"
                      style={{ backgroundColor: 'transparent' }}
                    />
                  </div>
                </div>

                {/* Arrow Down - Only show if winner */}
                {groupWinners.some(w => w.id === user.id) && (
                  <div className="flex justify-center">
                    <div className="text-3xl text-neon-gold font-black animate-bounce">↓</div>
                  </div>
                )}

                {/* Final Round (Upcoming) - Only show if winner */}
                {groupWinners.some(w => w.id === user.id) && (
                  <div className="bg-gradient-to-br from-slate-900/60 via-black/60 to-slate-900/50 border-2 border-neon-cyan/30 rounded-xl p-6 text-center">
                    <div className="text-sm font-arcade text-slate-300 mb-2 uppercase tracking-wider font-bold">⚙️ Final Round</div>
                    <div className="text-xs text-slate-400">1 winner from the finalists</div>
                  </div>
                )}

                {/* Arrow Down - Only show if winner */}
                {groupWinners.some(w => w.id === user.id) && (
                  <div className="flex justify-center">
                    <div className="text-3xl text-neon-cyan font-black animate-bounce">↓</div>
                  </div>
                )}

                {/* Stage 4: Champion (Upcoming) - Only show if winner */}
                {groupWinners.some(w => w.id === user.id) && (
                  <div className="bg-gradient-to-br from-slate-900/60 via-black/60 to-slate-900/50 border-2 border-neon-gold/30 rounded-xl p-6 text-center">
                    <div className="text-sm font-arcade text-neon-gold font-black uppercase tracking-wider">Grand Champion</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ELIM_LOSE - Prompt losers to return to lobby */}
        {phase === 'ELIM_LOSE' && (
          <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
            <div className="text-center max-w-md w-full bg-gradient-to-br from-slate-900/80 via-black/80 to-slate-900/60 border-2 border-red-500/40 rounded-xl p-6 sm:p-8 shadow-[0_0_30px_rgba(255,0,0,0.2)]">
              <div className="text-5xl sm:text-6xl mb-4 sm:mb-5">😔</div>
              <div className="text-3xl sm:text-4xl font-arcade text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-neon-pink mb-3 sm:mb-4 font-black tracking-wider">Eliminated</div>
              <div className="text-slate-300 text-sm sm:text-base mb-6 sm:mb-8 leading-relaxed">You weren't among the 20 group winners. Better luck on your next tournament!</div>
              <button 
                onClick={exitToLobby} 
                className="w-full px-6 sm:px-8 py-3 sm:py-4 border-2 border-slate-500 text-slate-300 font-arcade text-base sm:text-lg font-black hover:border-neon-pink hover:text-neon-pink hover:bg-neon-pink/20 transition-all duration-300 rounded-lg hover:shadow-[0_0_15px_rgba(255,0,128,0.3)]"
              >
                Back to Lobby
              </button>
            </div>
          </div>
        )}

        {/* FINAL_COLOR - Show user's assigned color with 5s countdown */}
        {phase === 'FINAL_COLOR' && (
          <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
            <div className="text-center max-w-sm w-full bg-gradient-to-br from-slate-900/80 via-black/80 to-slate-900/60 border-2 border-neon-cyan/40 rounded-xl p-6 sm:p-8 shadow-[0_0_30px_rgba(0,255,255,0.2)]">
              <div className="text-6xl sm:text-7xl mb-5 sm:mb-6">🎮</div>
              <div className="text-3xl sm:text-4xl font-arcade text-transparent bg-clip-text bg-gradient-to-r from-neon-gold to-neon-cyan mb-6 font-black tracking-wider">Your Final Color</div>
              <div className="flex justify-center mb-6">
                <div
                  className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl border-4 border-white shadow-[0_0_40px_rgba(255,255,255,0.3)] transform hover:scale-105 transition-transform duration-300"
                  style={{ backgroundColor: COLOR_HEX[userColor as keyof typeof COLOR_HEX], boxShadow: `0_0_50px_${COLOR_HEX[userColor as keyof typeof COLOR_HEX]}80` }}
                />
              </div>
              <div className="text-2xl sm:text-3xl font-arcade capitalize text-neon-cyan mb-6 font-black tracking-wider drop-shadow-[0_0_15px_rgba(0,255,255,0.5)]">{userColorDisplay}</div>
              <div className="text-5xl sm:text-6xl font-arcade text-neon-pink mb-5 animate-bounce font-black">{finalColorCountdown}</div>
              <div className="text-sm text-slate-400 font-arcade">⏳ Joining final room...</div>
            </div>
          </div>
        )}

        {/* FINAL_PREP - Winners get ready prompt */}
        {phase === 'FINAL_PREP' && (
          <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
            <div className="text-center max-w-md w-full bg-gradient-to-br from-slate-900/80 via-black/80 to-slate-900/60 border-2 border-neon-gold/40 rounded-xl p-6 sm:p-8 shadow-[0_0_30px_rgba(255,215,0,0.2)]">
              <div className="text-5xl sm:text-6xl mb-4 sm:mb-5">🚀</div>
              <div className="text-3xl sm:text-4xl font-arcade text-transparent bg-clip-text bg-gradient-to-r from-neon-gold to-neon-pink mb-4 sm:mb-5 font-black tracking-wider">Get Ready</div>
              <div className="text-slate-300 text-sm sm:text-base mb-6 sm:mb-8">The 20 group winners have been assigned new colors and will spin for the grand prize.</div>
              {/* Testing: Display all 20 finalists */}
              <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
                {groupWinners.slice(0,20).map((w, i) => (
                  <div key={w.id} className="flex flex-col items-center text-center">
                    <div 
                      className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white shadow-lg transform hover:scale-110 transition-transform duration-300" 
                      style={{ backgroundColor: COLOR_HEX[w.assignedColor as keyof typeof COLOR_HEX] }} 
                    />
                  </div>
                ))}
              </div>
              <div className="text-6xl sm:text-7xl font-arcade text-neon-cyan mb-3 sm:mb-4 font-black animate-pulse">{countdownActive ? countdown : 3}</div>
              <div className="text-xs sm:text-sm text-slate-400 font-arcade">Final spin starts shortly</div>
            </div>
          </div>
        )}

        {/* FINAL - Grand Final Spin */}
        {phase === 'FINAL' && (
          <div className="flex-1 flex flex-col lg:flex-row gap-2 lg:gap-4 p-2 lg:p-4 overflow-hidden w-full h-auto relative">
            {countdownActive && countdown > 0 && (
              <div className="absolute top-10 sm:top-12 md:top-14 left-1/2 -translate-x-1/2 z-20 text-center pointer-events-none">
                <div className="text-3xl sm:text-5xl md:text-6xl font-arcade text-neon-gold animate-pulse">{countdown}</div>
                <div className="text-[10px] sm:text-xs text-slate-400 mt-1 sm:mt-2">Preparing final spin...</div>
              </div>
            )}

            {/* Left: Finalists - Hidden on mobile */}
            <div className="hidden lg:flex w-72 bg-black/40 border border-neon-gold/30 rounded overflow-hidden flex-col flex-shrink-0">
              <div className="sticky top-0 bg-black/80 border-b border-neon-gold/30 p-3">
                <div className="text-neon-gold font-arcade text-sm">🏆 FINALISTS</div>
                <div className="text-neon-cyan text-xs mt-1">{groupWinners.length} Players</div>
              </div>
              <div className="flex-1 p-2 overflow-y-auto">
                {groupWinners.map((w, i) => (
                  <div
                    key={w.id}
                    className={`flex items-center gap-2 p-2 mb-1 rounded text-xs border transition ${
                      w.id === user.id
                        ? 'bg-neon-cyan/20 border-neon-cyan shadow-lg shadow-neon-cyan/50'
                        : 'bg-slate-800/30 border-slate-600/30'
                    }`}
                  >
                    <div className={`font-arcade font-bold ${
                      w.id === user.id ? 'text-neon-cyan' : 'text-neon-gold'
                    }`}>{i + 1}</div>
                    <img src={w.avatar} alt={w.username} className="w-5 h-5 rounded-full flex-shrink-0" />
                    <div className={`flex-1 truncate font-arcade ${
                      w.id === user.id ? 'text-neon-cyan drop-shadow-lg drop-shadow-[0_0_10px_rgba(0,255,255,0.8)]' : 'text-white'
                    } transition`}>{w.username}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* MOBILE: FINALISTS MODAL */}
            {showGroupsPanel && phase === 'FINAL' && (
              <div className="lg:hidden fixed inset-0 bg-black/80 z-50 flex items-end">
                <div className="w-full bg-black/95 border-t border-neon-gold/30 rounded-t-lg max-h-[70vh] overflow-y-auto">
                  <div className="sticky top-0 bg-black/80 border-b border-neon-gold/30 p-4 flex justify-between items-center">
                    <div className="text-neon-gold font-arcade">🏆 FINALISTS ({groupWinners.length})</div>
                    <button
                      onClick={() => { soundManager.play('click'); setShowGroupsPanel(false); }}
                      className="text-neon-gold hover:text-white text-2xl leading-none"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="p-3 space-y-2">
                    {groupWinners.map((w, i) => (
                      <div
                        key={w.id}
                        className={`flex items-center gap-3 p-2.5 rounded border ${
                          w.id === user.id
                            ? 'bg-neon-cyan/20 border-neon-cyan shadow-lg shadow-neon-cyan/50'
                            : 'bg-slate-800/30 border-slate-600/30'
                        }`}
                      >
                        <div className={`font-arcade font-bold ${
                          w.id === user.id ? 'text-neon-cyan' : 'text-neon-gold'
                        }`}>{i + 1}</div>
                        <img src={w.avatar} alt={w.username} className="w-6 h-6 rounded-full flex-shrink-0" />
                        <div className={`flex-1 truncate font-arcade text-sm ${
                          w.id === user.id ? 'text-neon-cyan drop-shadow-lg drop-shadow-[0_0_10px_rgba(0,255,255,0.8)]' : 'text-white'
                        } transition`}>{w.username}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Mobile: Hide everything on mobile - just show the wheel */}
            <div className="hidden lg:flex flex-1" />

            {/* Center: Spacer for wheel - takes up middle space */}
            <div className="hidden lg:flex flex-1" />

            {/* Right: Your Status - Hidden on mobile */}
            <div className="hidden lg:flex w-72 bg-black/40 border border-neon-pink/30 rounded overflow-y-auto flex-col flex-shrink-0">
              {/* Total Pot */}
              <div className="p-2 sm:p-3 border-b border-neon-pink/30">
                <div className="text-neon-gold font-arcade text-[8px] sm:text-[10px] mb-1">TOTAL POT</div>
                <div className="text-neon-green font-arcade text-sm sm:text-base">${totalPot.toLocaleString()}</div>
              </div>
              {/* User Status */}
              <div className="bg-black/80 border-b border-neon-pink/30 p-2 sm:p-3">
                <div className="text-neon-pink font-arcade text-[9px] sm:text-sm mb-1.5 sm:mb-2">🎮 YOUR STATUS</div>
                <div className="space-y-1 sm:space-y-1.5 text-[8px] sm:text-xs">
                  <div>
                    <span className="text-slate-400">Your Color:</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div
                        className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border border-white"
                        style={{ backgroundColor: userColorStyle }}
                      />
                      <span className="font-arcade capitalize text-[7px] sm:text-xs">{userColorDisplay}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Bet:</span>
                    <div className="font-arcade text-neon-green text-[7px] sm:text-xs">${tournamentBetAmount} 🔒</div>
                  </div>
                </div>
              </div>

              {/* Chat */}
              <div className="flex-1 border-b border-neon-pink/30 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto p-1 sm:p-2 space-y-1 text-[7px] sm:text-xs">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-slate-500 py-2 sm:py-4">No messages</div>
                  ) : (
                    chatMessages.map((msg, i) => (
                      <div key={i}>
                        <div className="text-neon-pink font-arcade text-[7px] sm:text-[9px]">{msg.user}</div>
                        <div className="text-slate-300 ml-1 sm:ml-2 text-[6px] sm:text-[10px]">{msg.msg}</div>
                      </div>
                    ))
                  )}
                </div>
                <div className="border-t border-neon-pink/30 p-1.5 sm:p-2 flex gap-1">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && chatInput.trim()) {
                        setChatMessages([...chatMessages, { user: user.username, msg: chatInput }]);
                        setChatInput('');
                      }
                    }}
                    placeholder="Say..."
                    className="flex-1 bg-black/60 border border-neon-pink/40 rounded px-1.5 sm:px-2 py-1 text-[7px] sm:text-xs text-white placeholder-slate-600 focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      if (chatInput.trim()) {
                        setChatMessages([...chatMessages, { user: user.username, msg: chatInput }]);
                        setChatInput('');
                      }
                    }}
                    className="border border-neon-pink text-neon-pink px-1.5 sm:px-2 py-1 sm:py-1.5 hover:bg-neon-pink hover:text-white text-xs font-bold min-h-[32px] sm:min-h-[36px] transition"
                  >
                    ✓
                  </button>
                </div>
              </div>

              {/* Winners count */}
              <div className="p-2 sm:p-3">
                <div className="text-neon-green font-arcade text-[8px] sm:text-[10px]">WINNERS: {groupWinners.length}/20</div>
              </div>
            </div>

            {/* MOBILE: STATUS MODAL */}
            {showStatusPanel && phase === 'FINAL' && (
              <div className="lg:hidden fixed inset-0 bg-black/80 z-50 flex items-end">
                <div className="w-full bg-black/95 border-t border-neon-pink/30 rounded-t-lg max-h-[70vh] overflow-y-auto">
                  <div className="sticky top-0 bg-black/80 border-b border-neon-pink/30 p-4 flex justify-between items-center">
                    <div className="text-neon-pink font-arcade">🎮 YOUR STATUS</div>
                    <button
                      onClick={() => { soundManager.play('click'); setShowStatusPanel(false); }}
                      className="text-neon-pink hover:text-white text-2xl leading-none"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="p-4 space-y-4">
                    {/* Total Pot */}
                    <div className="bg-black/60 border border-neon-gold/30 rounded p-3">
                      <div className="text-neon-gold font-arcade text-xs mb-2">TOTAL POT</div>
                      <div className="text-2xl font-arcade text-neon-green font-black">${totalPot.toLocaleString()}</div>
                    </div>
                    {/* Your Details */}
                    <div className="bg-black/60 border border-neon-pink/30 rounded p-3 space-y-2">
                      <div>
                        <span className="text-slate-400 text-xs">Your Color</span>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div
                            className="w-6 h-6 rounded border-2 border-white"
                            style={{ backgroundColor: userColorStyle }}
                          />
                          <span className="font-arcade text-sm capitalize">{userColorDisplay}</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-neon-pink/20">
                        <span className="text-slate-400 text-xs">Bet Amount</span>
                        <div className="font-arcade text-neon-green mt-1">${tournamentBetAmount} 🔒</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MOBILE: CHATS MODAL */}
            {showChatPanel && phase === 'FINAL' && (
              <div className="lg:hidden fixed inset-0 bg-black/80 z-50 flex items-end">
                <div className="w-full bg-black/95 border-t border-neon-green/30 rounded-t-lg max-h-[70vh] overflow-y-auto flex flex-col">
                  <div className="sticky top-0 bg-black/80 border-b border-neon-green/30 p-4 flex justify-between items-center">
                    <div className="text-neon-green font-arcade">💬 CHAT</div>
                    <button
                      onClick={() => { soundManager.play('click'); setShowChatPanel(false); }}
                      className="text-neon-green hover:text-white text-2xl leading-none"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {chatMessages.length === 0 ? (
                      <div className="text-center text-slate-500 py-8">No messages yet</div>
                    ) : (
                      chatMessages.map((msg, i) => (
                        <div key={i} className="text-xs">
                          <div className="text-neon-cyan font-arcade text-[10px]">{msg.user}</div>
                          <div className="text-slate-300 ml-2">{msg.msg}</div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="border-t border-neon-green/30 p-3 bg-black/60 flex gap-2">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && chatInput.trim()) {
                          setChatMessages([...chatMessages, { user: user.username, msg: chatInput }]);
                          setChatInput('');
                        }
                      }}
                      placeholder="Say..."
                      className="flex-1 bg-black/60 border border-neon-green/30 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        if (chatInput.trim()) {
                          soundManager.play('click');
                          setChatMessages([...chatMessages, { user: user.username, msg: chatInput }]);
                          setChatInput('');
                        }
                      }}
                      className="border border-neon-green text-neon-green px-2.5 py-1.5 hover:bg-neon-green hover:text-black text-xs font-bold transition"
                    >
                      ✓
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FINAL_RESULT - Grand Winner or Elimination */}
        {phase === 'FINAL_RESULT' && (
          <div className="flex-1 flex items-center justify-center relative overflow-y-auto px-4 py-6 sm:px-6 sm:py-8">
            <div className="w-full max-w-[420px] text-center">
              {grandWinner?.id === user.id ? (
                <div className="bg-vegas-panel/95 border border-neon-gold/60 rounded-sm px-5 py-6 sm:px-7 sm:py-8 shadow-[0_0_32px_rgba(255,215,0,0.18)]">
                  <img src="/pwa-192x192.png" alt="X-SPIN" className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 object-contain" />
                  <div className="text-2xl sm:text-3xl font-arcade text-neon-gold font-black tracking-widest uppercase mb-2">Grand Champion</div>
                  <div className="text-neon-green text-base sm:text-lg font-arcade font-black mb-1">You won</div>
                  <div className="font-arcade text-sm sm:text-base text-neon-cyan mb-5 truncate">{user.username}</div>
                  <div className="border-y border-white/10 py-4 mb-5">
                    <div className="text-[10px] sm:text-xs text-slate-400 font-arcade uppercase tracking-widest mb-1">Prize Pool</div>
                    <div className="text-4xl sm:text-5xl font-arcade text-neon-gold font-black tracking-wider">${totalPot.toLocaleString()}</div>
                  </div>
                  <div className="text-[10px] sm:text-xs font-arcade text-neon-green bg-neon-green/10 border border-neon-green/40 rounded-sm px-3 py-3 mb-5">
                    Prize added to balance
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={playAgainTournament}
                      className="w-full px-5 py-3 bg-neon-cyan text-black font-arcade text-xs sm:text-sm font-black hover:bg-white transition-colors rounded-sm uppercase tracking-widest"
                    >
                      Play Again
                    </button>
                    <button
                      onClick={exitToLobby}
                      className="w-full px-5 py-3 border border-neon-gold text-neon-gold font-arcade text-xs sm:text-sm font-black hover:bg-neon-gold hover:text-black transition-colors rounded-sm uppercase tracking-widest"
                    >
                      Exit to Lobby
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-vegas-panel/95 border border-neon-pink/50 rounded-sm px-5 py-6 sm:px-7 sm:py-8 shadow-[0_0_28px_rgba(255,0,128,0.16)]">
                  <img src="/loser.png" alt="Lost" className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-4 object-contain" />
                  <div className="text-2xl sm:text-3xl font-arcade text-neon-pink font-black tracking-widest uppercase mb-3">Eliminated</div>
                  <div className="text-sm sm:text-base text-slate-300 mb-5 leading-relaxed">The final pointer landed on another player.</div>
                  <div className="bg-black/40 border border-white/10 rounded-sm p-4 mb-5">
                    <div className="text-[10px] sm:text-xs text-slate-400 font-arcade uppercase tracking-widest mb-2">Champion</div>
                    <div className="font-arcade text-sm sm:text-base text-neon-gold font-black truncate">{grandWinner?.username}</div>
                  </div>
                  <button
                    onClick={exitToLobby}
                    className="w-full px-5 py-3 border border-slate-500 text-slate-300 font-arcade text-xs sm:text-sm font-black hover:border-neon-pink hover:text-neon-pink transition-colors rounded-sm uppercase tracking-widest"
                  >
                    Back to Lobby
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Rank Up Modal */}
        {showRankUp && <RankUpModal newRank={user.rank} previousRank={previousRank} onClose={() => setShowRankUp(false)} />}
      </div>

      {/* Bottom Status Bar - visible from ROOM_ASSIGN onwards (after COLOR_ASSIGN flow) */}
      {(phase === 'ROOM_ASSIGN' || phase === 'LOBBY' || phase === 'FINAL_COLOR' || phase === 'FINAL_PREP' || phase === 'FINAL_RESULT' || phase === 'ELIM_LOSE' || phase === 'GROUP_RESULT') && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-2 sm:px-3 py-2 sm:py-3 bg-black border-t-2 border-neon-cyan flex items-center justify-between gap-2">
          <div className="text-[10px] sm:text-xs font-arcade text-slate-400">Your Group: <span className="room-badge">G{userGroup}</span></div>
          {phase === 'ROOM_ASSIGN' && (
            <button
              onClick={() => { soundManager.play('click'); joinGameroom(); }}
              className="px-4 sm:px-5 py-2 sm:py-2.5 border-2 border-neon-green text-neon-white bg-gradient-to-r from-neon-green to-neon-cyan font-arcade text-xs sm:text-sm font-black tracking-widest shadow-[0_0_20px_rgba(0,255,0,0.6)] hover:from-neon-cyan hover:to-neon-green hover:text-black transition-all active:scale-95"
            >
              JOIN
            </button>
          )}
        </div>
      )}

      {(phase === 'GROUPS' || phase === 'ROUND_2' || phase === 'FINAL') && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 p-3 bg-vegas-panel/95 border-t border-white/10 backdrop-blur-md">
          <div className="text-center">
            <div className="text-[8px] sm:text-[9px] font-arcade text-white/60 uppercase tracking-widest mb-2">YOUR COLOR</div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-7 h-7 rounded border-2" style={{ borderColor: userColorStyle, backgroundColor: `${userColorStyle}33` }}></div>
              <div className="text-xl font-arcade font-black tracking-wider uppercase" style={{ color: userColorStyle }}>
                {userColorDisplay}
              </div>
            </div>
            <div className="text-[8px] text-white/50 font-mono tracking-widest">
              BET LOCKED - WAITING FOR SPIN
            </div>
          </div>
        </div>
      )}

      {/* Animation Styles */}
      <style>{`
        .room-badge {
          display: inline-block !important;
          font-size: 18px !important;
          font-weight: 900 !important;
          color: white !important;
          background-color: #00FFFF !important;
          padding: 8px 14px !important;
          margin: 0 6px !important;
          border-radius: 6px !important;
          box-shadow: 0 0 20px #00FFFF, 0 0 40px #00FFFF, inset 0 0 10px rgba(255,255,255,0.3) !important;
          font-family: arcade, monospace !important;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
        @keyframes groupGlow {
          0%, 100% { 
            text-shadow: 0 0 10px #00FFFF, 0 0 20px #00FFFF;
            color: #00FFFF;
          }
          50% { 
            text-shadow: 0 0 20px #00FFFF, 0 0 40px #00FFFF, 0 0 60px #00FFFF;
            color: #FFFFFF;
          }
        }
        .group-glow {
          font-size: 1.5rem;
          font-weight: 900;
          font-family: arcade, monospace;
          animation: groupGlow 1s ease-in-out infinite;
        }
        .user-group-highlight {
          background-color: rgba(0, 255, 255, 0.3) !important;
          border: 2px solid rgb(0, 255, 255) !important;
          box-shadow: 0 0 20px rgba(0, 255, 255, 1), 0 0 40px rgba(0, 255, 255, 0.8), 0 0 60px rgba(0, 255, 255, 0.6) !important;
          filter: drop-shadow(0 0 20px rgba(0, 255, 255, 0.9)) !important;
          position: relative !important;
          z-index: 10 !important;
        }
        @keyframes winnerBreathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        @keyframes loserSad {
          0%, 100% { transform: translateY(0) rotate(0deg) scale(1); opacity: 0.8; }
          50% { transform: translateY(10px) rotate(-20deg) scale(0.9); opacity: 0.6; }
        }
        @keyframes loserCry {
          0%, 100% { transform: translateY(0) rotate(-5deg) scale(0.95); opacity: 0.7; }
          25% { transform: translateY(15px) rotate(-25deg) scale(0.85); opacity: 0.5; }
          50% { transform: translateY(0) rotate(-5deg) scale(0.95); opacity: 0.7; }
          75% { transform: translateY(10px) rotate(-20deg) scale(0.9); opacity: 0.6; }
        }
        .animate-winner-jump {
          animation: winnerBreathe 2.5s ease-in-out infinite;
        }
        .animate-winner-celebrate {
          animation: winnerBreathe 2.5s ease-in-out infinite;
        }
        .animate-loser-sad {
          animation: loserSad 2.5s ease-in-out infinite;
        }
        .animate-loser-cry {
          animation: loserCry 2.8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default TournamentRoom;
