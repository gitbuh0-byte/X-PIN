import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { soundManager } from '../services/soundManager.ts';
import { CustomGameRoom, User, UserRank } from '../types.ts';

type CustomRoomSettings = Omit<CustomGameRoom, 'id' | 'creatorId' | 'creatorName' | 'createdAt' | 'players'>;

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (settings: CustomRoomSettings) => void;
}

const formatCurrency = (amount: number | string) => `KSh ${amount}`;
const ARM_WRESTLING_ICON_URL = 'https://img.icons8.com/?size=100&id=dUtrk7y9UcAJ&format=png&color=000000';

const WheelBoltIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 96 96" fill="none" aria-hidden="true">
    <path d="M55 12L39 42H52L41 84L66 47H52L55 12Z" fill="currentColor" />
  </svg>
);

const DuelIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <img
    src={ARM_WRESTLING_ICON_URL}
    alt=""
    aria-hidden="true"
    className={className}
    style={{ filter: 'brightness(0) saturate(100%) invert(73%) sepia(80%) saturate(2906%) hue-rotate(72deg) brightness(104%) contrast(122%)' }}
  />
);

const TournamentIcon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 96 96" fill="none" aria-hidden="true">
    <path d="M31 18H65V28C65 38 58 46 48 48C38 46 31 38 31 28V18Z" stroke="currentColor" strokeWidth="6" />
    <path d="M31 22H20C20 32 24 38 33 40" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
    <path d="M65 22H76C76 32 72 38 63 40" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
    <path d="M48 48V62" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
    <path d="M36 76H60" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
    <path d="M40 62H56V76H40V62Z" stroke="currentColor" strokeWidth="6" />
    <circle cx="48" cy="33" r="7" fill="currentColor" />
  </svg>
);

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ isOpen, onClose, onCreate }) => {
  const [name, setName] = useState('Elite Table');
  const [entryFee, setEntryFee] = useState('50');
  const [gameMode, setGameMode] = useState<'blitz' | '1v1'>('blitz');
  const [maxPlayers, setMaxPlayers] = useState('10');
  const [readyCountdown, setReadyCountdown] = useState('5');
  const [spinCountdown, setSpinCountdown] = useState('3');

  if (!isOpen) return null;

  const parsedEntryFee = Math.max(10, parseInt(entryFee) || 10);
  const parsedMaxPlayers = Math.min(10, Math.max(2, parseInt(maxPlayers) || 10));
  const parsedReadyCountdown = Math.min(30, Math.max(3, parseInt(readyCountdown) || 5));
  const parsedSpinCountdown = Math.min(15, Math.max(3, parseInt(spinCountdown) || 3));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="bg-vegas-panel/95 border border-neon-cyan/50 px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 rounded-lg w-full max-w-md relative shadow-[0_0_50px_rgba(0,255,255,0.15)] clip-corner max-h-[calc(100dvh-32px)] overflow-y-auto custom-scrollbar">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-cyan to-transparent opacity-50" />

        <div className="text-center mb-4 sm:mb-5">
          <div className="text-3xl sm:text-4xl font-arcade font-black text-neon-cyan mb-1 text-glow-cyan">KSh</div>
          <h2 className="text-base sm:text-lg md:text-xl font-arcade text-white mb-1 tracking-widest uppercase">Host Private Room</h2>
          <p className="text-[10px] sm:text-xs font-mono text-neon-cyan opacity-80">Invite-only - max 10 players</p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-slate-400 text-[8px] sm:text-[9px] md:text-[10px] font-bold uppercase tracking-wider mb-1.5 sm:mb-2">Room Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black/50 border border-white/10 p-2.5 sm:p-3 text-white font-mono text-xs sm:text-sm focus:border-neon-cyan focus:outline-none focus:bg-white/5 transition-all rounded-sm"
              placeholder="Elite Table"
            />
          </div>

          <div>
            <label className="block text-slate-400 text-[8px] sm:text-[9px] md:text-[10px] font-bold uppercase tracking-wider mb-1.5 sm:mb-2">Entry Fee</label>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-2">
              {[10, 25, 50, 100].map(amount => (
                <button
                  key={amount}
                  onClick={() => { soundManager.play('click'); setEntryFee(String(amount)); }}
                  className={`py-2 border font-arcade text-[8px] sm:text-[9px] uppercase tracking-widest transition-all rounded-sm ${parsedEntryFee === amount ? 'bg-neon-cyan text-black border-neon-cyan shadow-[0_0_15px_rgba(0,255,255,0.35)]' : 'border-neon-cyan text-neon-cyan hover:bg-neon-cyan/20'}`}
                >
                  {formatCurrency(amount)}
                </button>
              ))}
            </div>
            <div className="flex items-center bg-black/50 border border-white/10 rounded-sm overflow-hidden focus-within:border-neon-cyan transition-all">
              <span className="px-3 py-2.5 sm:py-3 text-neon-cyan font-arcade text-xs sm:text-sm border-r border-white/10 bg-black/40">KSh</span>
              <input
                type="number"
                min={10}
                value={entryFee}
                onChange={(e) => setEntryFee(e.target.value)}
                className="w-full bg-transparent p-2.5 sm:p-3 text-white font-mono text-xs sm:text-sm focus:outline-none focus:bg-white/5 transition-all min-w-0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(['blitz', '1v1'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => {
                  soundManager.play('click');
                  setGameMode(mode);
                  if (mode === '1v1') setMaxPlayers('2');
                }}
                className={`py-2.5 border font-arcade text-[9px] sm:text-[10px] uppercase tracking-widest rounded-sm transition-all ${gameMode === mode ? 'bg-neon-cyan text-black border-neon-cyan' : 'border-white/10 text-slate-400 hover:border-neon-cyan hover:text-neon-cyan'}`}
              >
                {mode === '1v1' ? '1v1 Duel' : 'Blitz Rules'}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <label className="block">
              <span className="block text-slate-400 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider mb-1.5">Players</span>
              <input
                type="number"
                min={2}
                max={10}
                disabled={gameMode === '1v1'}
                value={gameMode === '1v1' ? '2' : maxPlayers}
                onChange={(e) => setMaxPlayers(e.target.value)}
                className="w-full bg-black/50 border border-white/10 p-2.5 text-white font-mono text-xs focus:border-neon-cyan focus:outline-none disabled:opacity-50"
              />
            </label>
            <label className="block">
              <span className="block text-slate-400 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider mb-1.5">Start In</span>
              <input
                type="number"
                min={3}
                max={30}
                value={readyCountdown}
                onChange={(e) => setReadyCountdown(e.target.value)}
                className="w-full bg-black/50 border border-white/10 p-2.5 text-white font-mono text-xs focus:border-neon-cyan focus:outline-none"
              />
            </label>
            <label className="block">
              <span className="block text-slate-400 text-[8px] sm:text-[9px] font-bold uppercase tracking-wider mb-1.5">Spin In</span>
              <input
                type="number"
                min={3}
                max={15}
                value={spinCountdown}
                onChange={(e) => setSpinCountdown(e.target.value)}
                className="w-full bg-black/50 border border-white/10 p-2.5 text-white font-mono text-xs focus:border-neon-cyan focus:outline-none"
              />
            </label>
          </div>

          <div className="bg-neon-purple/10 border border-neon-purple/30 rounded-sm p-3">
            <p className="text-slate-400 text-[9px] sm:text-xs font-mono leading-relaxed">
              Players join with your room link. No random opponents are added.
            </p>
          </div>
        </div>

        <div className="flex gap-2 sm:gap-3 md:gap-4 mt-6 sm:mt-8">
          <button
            onClick={() => { soundManager.play('click'); onClose(); }}
            className="flex-1 py-2 sm:py-2.5 md:py-3 border border-slate-700 text-slate-400 font-arcade hover:border-white hover:text-white transition-colors uppercase text-[8px] sm:text-[9px] md:text-xs"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (name.trim()) {
                soundManager.play('lock');
                onCreate({
                  name: name.trim(),
                  entryFee: parsedEntryFee,
                  gameMode,
                  maxPlayers: gameMode === '1v1' ? 2 : parsedMaxPlayers,
                  readyCountdown: parsedReadyCountdown,
                  spinCountdown: parsedSpinCountdown
                });
              }
            }}
            className="flex-1 py-2 sm:py-2.5 md:py-3 bg-neon-cyan text-black font-arcade hover:bg-white transition-colors uppercase text-[8px] sm:text-[9px] md:text-xs tracking-wide shadow-[0_0_15px_rgba(0,255,255,0.4)] font-black"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

interface HomeProps {
  user: User;
  customRooms: CustomGameRoom[];
  onCreateCustomRoom: (settings: CustomRoomSettings) => string;
  onDeleteCustomRoom: (roomId: string) => void;
  onJoinGame?: (roomId: string) => void;
}

const Home: React.FC<HomeProps> = ({ user, customRooms, onCreateCustomRoom, onDeleteCustomRoom, onJoinGame }) => {
  const navigate = useNavigate();
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [roomPendingDelete, setRoomPendingDelete] = useState<CustomGameRoom | null>(null);
  const [roomPendingEntryId, setRoomPendingEntryId] = useState<string | null>(null);
  const [copiedRoomId, setCopiedRoomId] = useState<string | null>(null);

  const canCreateRoom = user.rank === UserRank.MASTER || user.rank === UserRank.LEGEND;

  const handleCreateRoom = (settings: CustomRoomSettings) => {
    setCreateModalOpen(false);
    const roomId = onCreateCustomRoom(settings);
    soundManager.forceBgmStart();
    setRoomPendingEntryId(roomId);
  };

  const handleHover = () => {
    soundManager.play('hover');
  };

  const handleGameStart = (roomId: string) => {
    soundManager.play('start');
    soundManager.forceBgmStart();
    if (onJoinGame) {
      onJoinGame(roomId);
    } else {
      navigate(`/room/${roomId}`);
    }
  };

  const getInviteUrl = (room: CustomGameRoom) => {
    const invitePayload = encodeURIComponent(JSON.stringify(room));
    return `${window.location.origin}${window.location.pathname}#/room/${room.id}?invite=${invitePayload}`;
  };

  const handleShareRoom = async (room: CustomGameRoom) => {
    soundManager.play('click');
    const url = getInviteUrl(room);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedRoomId(room.id);
      window.setTimeout(() => setCopiedRoomId(current => current === room.id ? null : current), 2200);
    } catch {
      window.prompt('Copy invite link', url);
    }
  };

  const pendingEntryRoom = roomPendingEntryId ? customRooms.find(room => room.id === roomPendingEntryId) || null : null;

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto flex flex-col justify-center min-h-[calc(100dvh-116px)] lg:min-h-[calc(100dvh-80px)] mt-2 sm:mt-6 md:mt-10 w-full">
      <div className="text-center mb-6 sm:mb-8 md:mb-12 relative mt-4 sm:mt-8 md:mt-12 z-20">
        <h1 className="relative z-10 text-5xl min-[380px]:text-6xl md:text-9xl font-arcade font-black mb-2 tracking-wider">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-pink to-neon-purple text-glow-pink">X</span>{' '}
          <span className="text-white">PIN</span>
        </h1>
        <div className="h-1 w-16 md:w-24 bg-gradient-to-r from-neon-cyan via-white to-neon-pink mx-auto mb-4 md:mb-6" />
        <p className="relative z-10 text-slate-400 font-mono text-[10px] md:text-lg tracking-[0.14em] sm:tracking-[0.2em] md:tracking-[0.3em] uppercase opacity-80 px-2">
          XPIN XPIN AND WIN
        </p>

        <div className="mt-6 md:mt-8 inline-flex items-center gap-2 md:gap-3 px-3 py-1 md:px-4 md:py-1.5 bg-white/5 rounded-full border border-white/10 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-neon-green rounded-full animate-pulse shadow-[0_0_5px_lime]" />
          <span className="font-ui font-bold text-neon-green text-[9px] md:text-xs tracking-wide">3,102 ONLINE NOW</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6 w-full relative z-30 mb-8 md:mb-10">
        <div
          onMouseEnter={handleHover}
          onClick={() => handleGameStart('quick-match-' + Date.now())}
          className="group relative bg-white/5 border border-white/10 p-0.5 md:p-1 cursor-pointer hover:border-neon-cyan transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(0,255,255,0.15)] flex flex-col rounded-sm"
        >
          <div className="bg-[#050508] p-4 md:p-5 flex flex-col h-full relative overflow-hidden min-h-[280px]">
            <div className="absolute top-4 right-4 p-1 mode-icon mode-icon--cyan transition-all duration-500 transform group-hover:scale-105">
              <WheelBoltIcon className="w-12 h-12 md:w-14 md:h-14" />
            </div>
            <div className="text-neon-cyan font-arcade text-[22px] sm:text-[24px] md:text-[26px] mb-1 z-10 pr-12">QUICK MATCH</div>
            <div className="w-8 h-0.5 bg-neon-cyan mb-3 md:mb-4 group-hover:w-14 transition-all duration-500" />
            <p className="pr-12 text-slate-400 font-mono text-[11px] md:text-xs leading-6 md:leading-relaxed mb-4 md:mb-6 flex-grow z-10">
              Jump into a fast 15-player wheel battle.<br />
              Lock your color, spin quick, and cash out in KSh.
            </p>
            <button className="w-full py-2.5 md:py-3 border border-neon-cyan text-neon-cyan font-arcade uppercase text-[10px] md:text-sm tracking-widest hover:bg-neon-cyan hover:text-black transition-all z-10">
              Join Match
            </button>
          </div>
        </div>

        <div
          onMouseEnter={handleHover}
          onClick={() => handleGameStart('pve-' + Date.now())}
          className="group relative bg-white/5 border border-white/10 p-0.5 md:p-1 cursor-pointer hover:border-neon-green transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(0,255,0,0.15)] flex flex-col rounded-sm"
        >
          <div className="bg-[#050508] p-4 md:p-5 flex flex-col h-full relative overflow-hidden min-h-[280px]">
            <div className="absolute top-4 right-4 p-1 mode-icon mode-icon--green transition-all duration-500 transform group-hover:scale-105">
              <DuelIcon className="w-12 h-12 md:w-14 md:h-14 object-contain" />
            </div>
            <div className="text-neon-green font-arcade text-[22px] sm:text-[24px] md:text-[26px] mb-1 z-10 pr-12">1V1 DUEL</div>
            <div className="w-8 h-0.5 bg-neon-green mb-3 md:mb-4 group-hover:w-14 transition-all duration-500" />
            <p className="pr-12 text-slate-400 font-mono text-[11px] md:text-xs leading-6 md:leading-relaxed mb-4 md:mb-6 flex-grow z-10">
              Challenge one rival in a tight head-to-head spin.<br />
              One wheel, two colors, one winner takes the whole pot.
            </p>
            <button className="w-full py-2.5 md:py-3 border border-neon-green text-neon-green font-arcade uppercase text-[10px] md:text-sm tracking-widest hover:bg-neon-green hover:text-black transition-all z-10">
              Duel
            </button>
          </div>
        </div>

        <div
          onMouseEnter={handleHover}
          onClick={() => handleGameStart('tournament-' + Date.now())}
          className="group relative bg-white/5 border border-white/10 p-0.5 md:p-1 cursor-pointer hover:border-neon-pink transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(255,0,255,0.15)] flex flex-col rounded-sm"
        >
          <div className="bg-[#050508] p-4 md:p-5 flex flex-col h-full relative overflow-hidden min-h-[280px]">
            <div className="absolute top-4 right-4 p-1 mode-icon mode-icon--pink transition-all duration-500 transform group-hover:scale-105">
              <TournamentIcon className="w-12 h-12 md:w-14 md:h-14" />
            </div>
            <div className="text-neon-pink font-arcade text-[22px] sm:text-[24px] md:text-[26px] mb-1 z-10 pr-12">TOURNAMENT</div>
            <div className="w-8 h-0.5 bg-neon-pink mb-3 md:mb-4 group-hover:w-14 transition-all duration-500" />
            <p className="pr-12 text-slate-400 font-mono text-[11px] md:text-xs leading-6 md:leading-relaxed mb-4 md:mb-6 flex-grow z-10">
              Survive every round in a knockout wheel showdown.<br />
              Advance through the bracket and chase the grand KSh prize.
            </p>
            <button className="w-full py-2.5 md:py-3 border border-neon-pink text-neon-pink font-arcade uppercase text-[10px] md:text-sm tracking-widest hover:bg-neon-pink hover:text-black transition-all z-10">
              Enter
            </button>
          </div>
        </div>

        <div
          onMouseEnter={handleHover}
          onClick={() => {
            if (canCreateRoom) {
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
          <div className="bg-[#050508] p-4 md:p-5 flex flex-col h-full relative overflow-hidden min-h-[280px]">
            {!canCreateRoom && (
              <div className="absolute inset-0 z-50 bg-black/80 flex flex-col items-center justify-center backdrop-blur-[1px]">
                <span className="text-xl md:text-2xl mb-1">LOCK</span>
                <span className="text-[8px] md:text-[10px] font-arcade text-white tracking-widest uppercase">Rank: Master</span>
              </div>
            )}
            <div className="absolute top-4 right-4 p-1 mode-icon mode-icon--purple transition-all duration-500 transform group-hover:scale-105">
              <svg className="w-12 h-12 md:w-14 md:h-14" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg>
            </div>
            <div className="text-neon-purple font-arcade text-[22px] sm:text-[24px] md:text-[26px] mb-1 z-10 pr-12">PRIVATE</div>
            <div className="w-8 h-0.5 bg-neon-purple mb-3 md:mb-4 group-hover:w-14 transition-all duration-500" />
            <p className="pr-12 text-slate-400 font-mono text-[11px] md:text-xs leading-6 md:leading-relaxed mb-4 md:mb-6 flex-grow z-10">
              Host an invite-only room. Share the link, cap the table, and choose countdown timing.
            </p>
            <button
              disabled={!canCreateRoom}
              className="w-full py-2.5 md:py-3 border border-neon-purple text-neon-purple font-arcade uppercase text-[10px] md:text-sm tracking-widest hover:bg-neon-purple hover:text-white transition-all z-10"
            >
              Host
            </button>
          </div>
        </div>
      </div>

      {customRooms.length > 0 && (
        <section className="relative z-30 mb-8 md:mb-10">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <h2 className="font-arcade text-neon-cyan text-sm sm:text-base md:text-lg tracking-widest uppercase">Private Rooms</h2>
              <p className="text-slate-500 font-mono text-[10px] sm:text-xs mt-1">Invite-only rooms stay here until the creator deletes them.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {customRooms.map(room => {
              const isCreator = room.creatorId === user.id;
              const hasJoined = room.players.some(player => player.id === user.id);
              const isFull = room.players.length >= room.maxPlayers && !hasJoined;
              return (
                <div key={room.id} className="bg-vegas-panel/90 border border-neon-cyan/30 rounded-sm p-3 sm:p-4 shadow-[0_0_24px_rgba(0,255,255,0.08)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-arcade text-white text-sm sm:text-base truncate uppercase">{room.name}</div>
                      <div className="text-[9px] sm:text-[10px] text-neon-cyan font-mono mt-1 uppercase">
                        {room.gameMode} - {formatCurrency(room.entryFee)} - {room.players.length}/{room.maxPlayers}
                      </div>
                    </div>
                    <div className="text-[8px] sm:text-[9px] font-arcade text-neon-green border border-neon-green/30 px-2 py-1 rounded-sm whitespace-nowrap">
                      OPEN
                    </div>
                  </div>

                  <div className="mt-3 flex -space-x-2 overflow-hidden">
                    {room.players.slice(0, 10).map(player => (
                      <img key={player.id} src={player.avatar} alt={player.username} title={player.username} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-black bg-black" />
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <button
                      onClick={() => { soundManager.play('click'); setRoomPendingEntryId(room.id); }}
                      disabled={isFull}
                      className="py-2 border border-neon-cyan bg-neon-cyan text-black font-arcade text-[9px] sm:text-[10px] uppercase tracking-widest hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {hasJoined ? 'Enter' : 'Join'}
                    </button>
                    <button
                      onClick={() => handleShareRoom(room)}
                      className={`py-2 border font-arcade text-[9px] sm:text-[10px] uppercase tracking-widest transition-all ${copiedRoomId === room.id ? 'border-neon-green bg-neon-green text-black' : 'border-neon-purple text-neon-purple hover:bg-neon-purple hover:text-white'}`}
                    >
                      {copiedRoomId === room.id ? 'Copied' : 'Share'}
                    </button>
                  </div>

                  {isCreator && (
                    <button
                      onClick={() => { soundManager.play('beep'); setRoomPendingDelete(room); }}
                      className="mt-2 w-full py-2 border border-red-500/40 text-red-300 font-arcade text-[8px] sm:text-[9px] uppercase tracking-widest hover:bg-red-500 hover:text-white"
                    >
                      Delete Room
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {roomPendingDelete && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-4">
          <div className="bg-vegas-panel/95 border border-red-500/50 px-4 py-5 sm:px-6 sm:py-6 rounded-lg w-full max-w-sm relative shadow-[0_0_50px_rgba(255,0,80,0.18)] clip-corner">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-60" />
            <div className="text-center">
              <div className="text-red-300 font-arcade text-2xl sm:text-3xl mb-3">!</div>
              <h2 className="text-white font-arcade text-base sm:text-xl uppercase tracking-widest mb-2">Delete Room?</h2>
              <p className="text-slate-400 font-mono text-[10px] sm:text-xs leading-relaxed">
                Are you sure you want to delete <span className="text-neon-cyan">{roomPendingDelete.name}</span>? The invite link will no longer open this room on this account.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-5">
              <button
                onClick={() => { soundManager.play('click'); setRoomPendingDelete(null); }}
                className="py-2.5 border border-slate-600 text-slate-300 font-arcade text-[9px] sm:text-xs uppercase tracking-widest hover:border-white hover:text-white"
              >
                Back
              </button>
              <button
                onClick={() => {
                  soundManager.play('beep');
                  onDeleteCustomRoom(roomPendingDelete.id);
                  setRoomPendingDelete(null);
                }}
                className="py-2.5 border border-red-500 bg-red-600 text-white font-arcade text-[9px] sm:text-xs uppercase tracking-widest hover:bg-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingEntryRoom && (
        <div className="fixed inset-0 z-[115] flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
          <div className="bg-vegas-panel/95 border border-neon-cyan/50 px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 rounded-lg w-full max-w-lg relative shadow-[0_0_50px_rgba(0,255,255,0.15)] clip-corner max-h-[calc(100dvh-32px)] overflow-y-auto custom-scrollbar">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-neon-cyan to-transparent opacity-50" />
            <div className="text-center mb-4 sm:mb-5">
              <div className="text-3xl sm:text-4xl font-arcade font-black text-neon-cyan mb-1 text-glow-cyan">KSh</div>
              <h2 className="text-base sm:text-lg md:text-xl font-arcade text-white mb-1 tracking-widest uppercase">{pendingEntryRoom.name}</h2>
              <p className="text-[10px] sm:text-xs font-mono text-neon-cyan opacity-80 uppercase">
                {pendingEntryRoom.gameMode} • {formatCurrency(pendingEntryRoom.entryFee)} • {pendingEntryRoom.players.length}/{pendingEntryRoom.maxPlayers} players
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
              <div className="bg-black/40 border border-white/10 rounded-sm p-3 text-center">
                <div className="text-[8px] sm:text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Entry</div>
                <div className="text-lg sm:text-xl font-arcade text-neon-green">{formatCurrency(pendingEntryRoom.entryFee)}</div>
              </div>
              <div className="bg-black/40 border border-white/10 rounded-sm p-3 text-center">
                <div className="text-[8px] sm:text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Start In</div>
                <div className="text-lg sm:text-xl font-arcade text-neon-cyan">{pendingEntryRoom.readyCountdown}s</div>
              </div>
              <div className="bg-black/40 border border-white/10 rounded-sm p-3 text-center">
                <div className="text-[8px] sm:text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">Spin In</div>
                <div className="text-lg sm:text-xl font-arcade text-neon-cyan">{pendingEntryRoom.spinCountdown}s</div>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div className="text-[10px] sm:text-xs font-arcade text-white/70 uppercase tracking-widest">Joined Players</div>
                <div className="text-[9px] sm:text-[10px] font-mono text-neon-green">{pendingEntryRoom.players.length}/{pendingEntryRoom.maxPlayers} ready slots</div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {pendingEntryRoom.players.map(player => (
                  <div key={player.id} className="flex items-center gap-3 bg-black/35 border border-white/10 rounded-sm p-2.5">
                    <img src={player.avatar} alt={player.username} className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-black bg-black flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="font-arcade text-[10px] sm:text-[11px] text-white uppercase truncate">{player.username}</div>
                      <div className="text-[8px] sm:text-[9px] font-mono text-neon-cyan uppercase">{player.rank}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-neon-purple/10 border border-neon-purple/30 rounded-sm p-3 mb-4">
              <div className="text-[9px] sm:text-xs font-mono text-slate-400 leading-relaxed">
                Invite more Master or Legend players before you proceed into the game room.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
              <button
                onClick={() => handleShareRoom(pendingEntryRoom)}
                className={`py-2.5 border font-arcade text-[9px] sm:text-[10px] uppercase tracking-widest transition-all ${copiedRoomId === pendingEntryRoom.id ? 'border-neon-green bg-neon-green text-black' : 'border-neon-purple text-neon-purple hover:bg-neon-purple hover:text-white'}`}
              >
                {copiedRoomId === pendingEntryRoom.id ? 'Link Copied' : 'Share Invite'}
              </button>
              <button
                onClick={() => {
                  soundManager.play('start');
                  setRoomPendingEntryId(null);
                  handleGameStart(pendingEntryRoom.id);
                }}
                className="py-2.5 border border-neon-cyan bg-neon-cyan text-black font-arcade text-[9px] sm:text-[10px] uppercase tracking-widest hover:bg-white"
              >
                Proceed to Gameroom
              </button>
            </div>
            <button
              onClick={() => { soundManager.play('click'); setRoomPendingEntryId(null); }}
              className="w-full py-2.5 border border-slate-600 text-slate-300 font-arcade text-[9px] sm:text-[10px] uppercase tracking-widest hover:border-white hover:text-white"
            >
              Back
            </button>
          </div>
        </div>
      )}

      <div className="mt-auto border-t border-white/5 bg-black/40 backdrop-blur-md overflow-hidden">
        <div className="max-w-7xl mx-auto flex items-center py-2 px-3 md:px-4 gap-2 md:gap-4">
          <div className="text-[8px] md:text-[10px] font-mono text-neon-green whitespace-nowrap">LIVE ::</div>
          <div className="overflow-hidden relative w-full h-5 md:h-6 mask-linear-fade">
            <div className="absolute whitespace-nowrap animate-marquee flex gap-12 md:gap-16">
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <span key={i} className="text-slate-400 font-mono text-[10px] md:text-xs">
                  <span className="text-neon-pink">WON</span> PLAYER_{1000 + i} <span className="text-neon-gold">KSh {(Math.random() * 1000).toFixed(0)}</span>
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
