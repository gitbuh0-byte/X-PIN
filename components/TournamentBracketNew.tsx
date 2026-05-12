import React, { useEffect, useState } from 'react';
import { soundManager } from '../services/soundManager.ts';

interface Player {
  id: string;
  name: string;
  avatar: string;
  username?: string;
}

interface Room {
  id: string;
  roomNumber: number;
  roomLabel: string;
  players: Player[];
  status: 'active' | 'upcoming' | 'completed';
  winner?: string;
}

interface TournamentBracketNewProps {
  groupNumber: number;  // 1-20 (user's assigned room/group)
  playersInGroup: number;
  onProceedClick?: () => void;
  userUsername?: string;  // User's actual username to display in their room
  autoStartSeconds?: number;
}

const TournamentBracketNew: React.FC<TournamentBracketNewProps> = ({ 
  groupNumber, 
  playersInGroup,
  onProceedClick,
  userUsername,
  autoStartSeconds = 10
}) => {
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  const [autoStartCountdown, setAutoStartCountdown] = useState(autoStartSeconds);
  const [hasAutoStarted, setHasAutoStarted] = useState(false);

  useEffect(() => {
    if (!onProceedClick || hasAutoStarted) return;
    if (autoStartCountdown <= 0) {
      setHasAutoStarted(true);
      onProceedClick();
      return;
    }
    const timer = setTimeout(() => setAutoStartCountdown(seconds => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [autoStartCountdown, hasAutoStarted, onProceedClick]);

  // Generate mock players for demonstration
  const generatePlayers = (seedValue: string, count: number, includeUser: boolean = false): Player[] => {
    const names = ['NeonGhost', 'CyberVortex', 'PixelKing', 'ShadowEcho', 'VortexRider', 'CrimsonBlade', 'NovaStrike', 'PhantomRage'];
    return Array.from({ length: count }).map((_, i) => {
      // First player is the user if this is the user's room
      if (includeUser && i === 0 && userUsername) {
        return {
          id: `${seedValue}-player-${i}`,
          name: userUsername,
          username: userUsername,
          avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${userUsername}`
        };
      }
      return {
        id: `${seedValue}-player-${i}`,
        name: names[i % names.length],
        username: names[i % names.length],
        avatar: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${seedValue}-${i}`
      };
    });
  };

  // ROUND 1: 20 Rooms (G1 through G20)
  const round1Rooms: Room[] = Array.from({ length: 20 }).map((_, i) => {
    const isUserRoom = (i + 1) === groupNumber;
    return {
      id: `r1-room-${i + 1}`,
      roomNumber: i + 1,
      roomLabel: `G${i + 1}`,  // G1, G2, ... G20
      players: generatePlayers(`r1-room-${i + 1}`, playersInGroup, isUserRoom),
      status: 'completed' as const,
      winner: `r1-room-${i + 1}-player-0`
    };
  });

  // ROUND 2: 4 rooms. Each room gets winners from 5 Round 1 rooms.
  const round2Rooms: Room[] = Array.from({ length: 4 }).map((_, i) => ({
    id: `r2-room-${i + 1}`,
    roomNumber: i + 1,
    roomLabel: `R2-${i + 1}`,
    players: generatePlayers(`r2-room-${i + 1}`, 5),
    status: 'upcoming' as const
  }));

  // FINAL ROUND: 1 room with the 4 winners from Round 2.
  const round3Rooms: Room[] = Array.from({ length: 1 }).map((_, i) => ({
    id: `final-room-${i + 1}`,
    roomNumber: i + 1,
    roomLabel: 'FINAL',
    players: generatePlayers(`final-room-${i + 1}`, 4),  // 4 finalists competing
    status: 'upcoming' as const
  }));

  const RoomCardContent = ({ room, isHovered, round, showPlayers = true, isSelected = false }: { room: Room; isHovered: boolean; round: 1 | 2 | 3; showPlayers?: boolean; isSelected?: boolean }) => {
    // Show detailed information on hover OR selection (for mobile click)
    const shouldShowDetails = isHovered || isSelected;
    
    // Only show player details in Round 1, for Round 2 and Final show "TBC"
    if (shouldShowDetails && showPlayers) {
      return (
        <div className="space-y-1">
          <div className="font-arcade text-neon-cyan font-bold text-[8px]">{room.roomLabel}</div>
          {room.players.map((player) => (
            <div key={player.id} className="flex items-center gap-1 p-1 bg-black/40 rounded text-[7px]">
              <img 
                src={player.avatar}
                alt={player.username || player.name}
                className="w-3 h-3 rounded-full"
              />
              <div className="flex-1 min-w-0 truncate text-neon-cyan">
                {(player.username || player.name).slice(0, 12)}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (shouldShowDetails && !showPlayers) {
      // Round 2 and Final: show "TBC" on hover/selection
      return (
        <div className="space-y-1">
          <div className="font-arcade text-neon-cyan font-bold text-[8px]">{room.roomLabel}</div>
          <div className="text-neon-pink/70 text-[7px] font-arcade">TBC</div>
        </div>
      );
    }

    return (
      <>
        <div className="font-arcade text-neon-cyan font-bold text-[9px]">{room.roomLabel}</div>
        {showPlayers && room.players.length > 0 && (
          <div className="text-neon-gold text-[8px] truncate">
            {(room.players[0].username || room.players[0].name).slice(0, 10)}
          </div>
        )}
        {!showPlayers && (
          <div className="text-neon-pink/60 text-[8px]">—</div>
        )}
      </>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-black overflow-hidden">
      {/* Header - full tournament style */}
      <div className="sticky top-0 bg-gradient-to-r from-black via-black to-black border-b-2 border-neon-cyan/60 px-2 sm:px-3 md:px-4 py-2 sm:py-3 z-20 backdrop-blur-sm flex-shrink-0">
        <div className="text-center">
          <p className="text-[8px] sm:text-[9px] md:text-xs text-neon-cyan font-mono">
            Round 1: 20 Rooms • Round 2: 4 Rooms • Final: 1 Room
          </p>
          <p className="text-[7px] sm:text-[8px] md:text-[9px] text-neon-pink font-arcade mt-1">
            Your Room: <span className="text-neon-green font-bold">G{groupNumber}</span>
          </p>
        </div>
      </div>

      {/* Bracket Container */}
      <div className="flex-1 overflow-auto relative pb-8 custom-scrollbar">
        <div className="w-full h-full flex flex-col justify-center items-center p-2 sm:p-4 min-h-fit">
          
          {/* Stage Headers - Mobile responsive */}
          <div className="grid grid-cols-[minmax(0,1.7fr)_minmax(0,0.9fr)_minmax(0,0.75fr)] gap-2 sm:gap-4 md:gap-6 w-full max-w-5xl mb-4 sm:mb-6 px-1 sm:px-2">
            <div className="text-center min-w-0">
              <div className="text-[10px] sm:text-xs md:text-sm font-arcade text-neon-pink font-bold uppercase tracking-wider">Round 1</div>
              <div className="text-[8px] sm:text-[9px] text-neon-pink/60">20 Rooms</div>
            </div>
            <div className="text-center min-w-0">
              <div className="text-[10px] sm:text-xs md:text-sm font-arcade text-neon-cyan font-bold uppercase tracking-wider">Round 2</div>
              <div className="text-[8px] sm:text-[9px] text-neon-cyan/60">4 Rooms</div>
            </div>
            <div className="text-center min-w-0">
              <div className="text-[10px] sm:text-xs md:text-sm font-arcade text-neon-gold font-bold uppercase tracking-wider">Final Round</div>
              <div className="text-[8px] sm:text-[9px] text-neon-gold/60">1 Room</div>
            </div>
          </div>

          <div className="hidden sm:grid grid-cols-[minmax(0,1.7fr)_minmax(0,0.9fr)_minmax(0,0.75fr)] gap-2 sm:gap-4 md:gap-6 w-full max-w-5xl -mt-3 mb-5 px-1 sm:px-2">
            <div className="flex items-center justify-end gap-2 min-w-0">
              <div className="h-px flex-1 max-w-[220px] bg-gradient-to-r from-transparent via-neon-pink to-neon-cyan shadow-[0_0_8px_rgba(0,255,255,0.8)]"></div>
              <div className="h-0 w-0 border-y-[5px] border-y-transparent border-l-[9px] border-l-neon-cyan drop-shadow-[0_0_6px_rgba(0,255,255,0.9)]"></div>
            </div>
            <div className="flex items-center justify-between gap-2 min-w-0">
              <span className="whitespace-nowrap text-[7px] font-arcade uppercase tracking-wider text-neon-cyan/80">
                Winners Advance
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-neon-cyan via-neon-gold to-neon-gold shadow-[0_0_8px_rgba(255,215,0,0.75)]"></div>
              <div className="h-0 w-0 border-y-[5px] border-y-transparent border-l-[9px] border-l-neon-gold drop-shadow-[0_0_6px_rgba(255,215,0,0.9)]"></div>
            </div>
            <div className="flex items-center min-w-0">
              <span className="whitespace-nowrap text-[7px] font-arcade uppercase tracking-wider text-neon-gold/80">
                Finalists Advance
              </span>
            </div>
          </div>

          {/* Main Bracket */}
          <div className="relative grid grid-cols-[minmax(0,1.7fr)_minmax(0,0.9fr)_minmax(0,0.75fr)] gap-2 sm:gap-4 md:gap-6 w-full max-w-5xl px-1 sm:px-2 pb-2 items-center">
            
            {/* ROUND 1 - 20 Rooms (G1-G20) - Mobile optimized */}
            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-1 min-w-0">
              {round1Rooms.map((room, idx) => {
                const isUserRoom = (idx + 1) === groupNumber;  // Fixed: direct comparison with groupNumber (1-20)
                const isHovered = hoveredRoom === `r1-${idx}`;
                const isSelected = selectedRoom === `r1-${idx}`;
                
                return (
                  <div key={room.id} className="flex flex-col gap-0.5">
                    <div
                      onClick={() => {
                        soundManager.play('click');
                        setSelectedRoom(selectedRoom === `r1-${idx}` ? null : `r1-${idx}`);
                      }}
                      onMouseEnter={() => setHoveredRoom(`r1-${idx}`)}
                      onMouseLeave={() => setHoveredRoom(null)}
                      className={`cursor-pointer transition-all duration-300 border rounded px-1 py-1 sm:px-1.5 sm:py-1.5 md:px-2 md:py-2 w-full text-center backdrop-blur-sm text-[7px] sm:text-[8px] md:text-[9px] ${
                        isUserRoom
                          ? 'border-neon-green/90 bg-neon-green/20 shadow-[0_0_25px_rgba(0,255,0,0.6)] ring-2 ring-neon-green/70'  // User's room highlighted in green
                          : selectedRoom === `r1-${idx}`
                          ? 'border-neon-cyan bg-neon-cyan/20 shadow-[0_0_15px_rgba(0,255,255,0.4)]'
                          : 'border-neon-cyan/40 bg-black/50 hover:border-neon-cyan'
                      }`}
                      title={`Room ${room.roomLabel}`}
                    >
                      <RoomCardContent room={room} isHovered={isHovered} round={1} showPlayers={true} isSelected={isSelected} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ROUND 2 - 4 rooms - Mobile optimized */}
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-2 min-w-0">
              {round2Rooms.map((room, idx) => {
                const isHovered = hoveredRoom === `r2-${idx}`;
                const isSelected = selectedRoom === `r2-${idx}`;
                
                return (
                  <div key={room.id} className="flex flex-col gap-0.5">
                    <div
                      onClick={() => {
                        soundManager.play('click');
                        setSelectedRoom(selectedRoom === `r2-${idx}` ? null : `r2-${idx}`);
                      }}
                      onMouseEnter={() => setHoveredRoom(`r2-${idx}`)}
                      onMouseLeave={() => setHoveredRoom(null)}
                      className={`cursor-pointer transition-all duration-300 border-2 rounded px-1 py-1 sm:px-1.5 sm:py-1.5 md:px-2 md:py-2 w-full text-center backdrop-blur-sm text-[7px] sm:text-[8px] md:text-[9px] ${
                        selectedRoom === `r2-${idx}`
                          ? 'border-neon-pink bg-neon-pink/20 shadow-[0_0_20px_rgba(255,0,128,0.4)]'
                          : 'border-neon-pink/40 bg-black/50 hover:border-neon-pink'
                      }`}
                      title={`${room.roomLabel}`}
                    >
                      <RoomCardContent room={room} isHovered={isHovered} round={2} showPlayers={false} isSelected={isSelected} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ROUND 3 - Final - Mobile optimized */}
            <div className="relative z-10 flex flex-col gap-1.5 justify-center min-w-0">
              {round3Rooms.map((room, idx) => {
                const isHovered = hoveredRoom === `r3-${idx}`;
                const isSelected = selectedRoom === `r3-${idx}`;
                
                return (
                  <div key={room.id} className="flex flex-col gap-0.5">
                    <div
                      onClick={() => {
                        soundManager.play('click');
                        setSelectedRoom(selectedRoom === `r3-${idx}` ? null : `r3-${idx}`);
                      }}
                      onMouseEnter={() => setHoveredRoom(`r3-${idx}`)}
                      onMouseLeave={() => setHoveredRoom(null)}
                      className={`cursor-pointer transition-all duration-300 border-2 rounded px-1 py-1 sm:px-1.5 sm:py-1.5 md:px-2 md:py-2 w-full text-center backdrop-blur-sm text-[7px] sm:text-[8px] md:text-[9px] ${
                        selectedRoom === `r3-${idx}`
                          ? 'border-neon-gold bg-neon-gold/20 shadow-[0_0_25px_rgba(255,215,0,0.5)]'
                          : 'border-neon-gold/40 bg-black/50 hover:border-neon-gold/70'
                      }`}
                      title="Grand Final - 4 Players"
                    >
                      <RoomCardContent room={room} isHovered={isHovered} round={3} showPlayers={false} isSelected={isSelected} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Auto-start countdown */}
          <div className="mt-6 sm:mt-8 md:mt-12 flex justify-center">
            <div className="min-w-[220px] border border-neon-cyan/60 bg-black/70 px-6 py-3 text-center shadow-[0_0_20px_rgba(0,255,255,0.25)]">
              <div className="text-[8px] sm:text-[9px] font-arcade uppercase tracking-widest text-neon-cyan/70 mb-1">
                Game Starts In
              </div>
              <div className="text-3xl sm:text-4xl font-arcade font-black text-neon-cyan drop-shadow-[0_0_18px_rgba(0,255,255,0.8)]">
                {Math.max(0, autoStartCountdown)}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TournamentBracketNew;
