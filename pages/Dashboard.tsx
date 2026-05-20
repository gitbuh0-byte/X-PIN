import React, { useState } from 'react';
import { User, Transaction } from '../types.ts';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RANK_CONFIG } from '../constants.ts';
import { soundManager } from '../services/soundManager.ts';
import { ProfileSettings } from '../components/ProfileSettings.tsx';

interface DashboardProps {
  user: User;
  transactions: Transaction[];
  onOpenPayment: (type: 'DEPOSIT' | 'WITHDRAWAL') => void;
  onUpdateProfile?: (updates: Partial<User>) => void;
  onLogout?: () => void;
}

const formatCurrency = (amount: number) => `KSh ${amount.toFixed(0)}`;

const data = [
  { name: 'Mon', balance: 400 },
  { name: 'Tue', balance: 300 },
  { name: 'Wed', balance: 550 },
  { name: 'Thu', balance: 480 },
  { name: 'Fri', balance: 890 },
  { name: 'Sat', balance: 1200 },
  { name: 'Sun', balance: 1550 },
];

const EditProfileModal: React.FC<{ isOpen: boolean; onClose: () => void; user: User; onSave: (u: Partial<User>) => void }> = ({ isOpen, onClose, user, onSave }) => {
  const [username, setUsername] = useState(user.username);
  const [avatar, setAvatar] = useState(user.avatar);
  const [email, setEmail] = useState(user.email || '');
  const [bio, setBio] = useState(user.bio || '');

  // Preset avatars for selection
  const presetAvatars = [
    `https://api.dicebear.com/7.x/pixel-art/svg?seed=SpinMaster`,
    `https://api.dicebear.com/7.x/pixel-art/svg?seed=Cyber`,
    `https://api.dicebear.com/7.x/pixel-art/svg?seed=Neon`,
    `https://api.dicebear.com/7.x/pixel-art/svg?seed=Ghost`,
    `https://api.dicebear.com/7.x/pixel-art/svg?seed=Phoenix`,
    `https://api.dicebear.com/7.x/pixel-art/svg?seed=Vortex`,
    `https://api.dicebear.com/7.x/pixel-art/svg?seed=Plasma`,
    `https://api.dicebear.com/7.x/pixel-art/svg?seed=Eclipse`,
  ];

  if (!isOpen) return null;

  const handleSave = () => { onSave({ username, avatar, email, bio }); soundManager.play('lock'); onClose(); };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-vegas-panel border-2 border-neon-cyan box-glow-cyan p-4 sm:p-6 rounded w-full max-w-2xl relative max-h-[95vh] my-auto overflow-y-auto">
        <h2 className="text-lg sm:text-xl font-arcade text-white mb-4 sm:mb-6 text-center tracking-widest uppercase">PLAYER SETTINGS</h2>
        <div className="space-y-4 sm:space-y-6">
          {/* Profile Picture Section */}
          <div>
            <label className="block text-neon-cyan text-xs sm:text-sm font-bold uppercase mb-2 sm:mb-3">Profile Picture</label>
            <div className="mb-3 sm:mb-4 p-3 sm:p-4 bg-black/40 rounded border border-neon-cyan/30 flex items-center justify-center">
              <img src={avatar} className="w-14 sm:w-20 h-14 sm:h-20 rounded-full border-2 border-neon-cyan shadow-[0_0_15px_rgba(0,255,255,0.3)]" alt="Current Avatar" />
            </div>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
              {presetAvatars.map((presetAvatar, idx) => (
                <button
                  key={idx}
                  onClick={() => { soundManager.play('click'); setAvatar(presetAvatar); }}
                  className={`p-1 sm:p-2 rounded border-2 transition-all ${
                    avatar === presetAvatar 
                      ? 'border-neon-cyan bg-neon-cyan/10 shadow-[0_0_10px_rgba(0,255,255,0.5)]' 
                      : 'border-slate-700 hover:border-neon-cyan/50'
                  }`}
                >
                  <img src={presetAvatar} className="w-full h-10 sm:h-16 rounded object-cover" alt={`Avatar ${idx + 1}`} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-neon-cyan text-xs sm:text-sm font-bold uppercase mb-1">Username</label>
            <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-black border border-neon-cyan/50 p-2 sm:p-3 text-white font-mono text-sm sm:text-base focus:outline-none" />
          </div>
          <div>
            <label className="block text-neon-cyan text-xs sm:text-sm font-bold uppercase mb-1">Bio</label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} className="w-full bg-black border border-neon-cyan/50 p-2 sm:p-3 text-white font-mono text-sm sm:text-base h-12 sm:h-16 focus:outline-none" />
          </div>
        </div>
        <div className="flex gap-3 sm:gap-4 mt-6 sm:mt-8">
          <button onClick={onClose} className="flex-1 py-2 sm:py-3 border border-red-500 text-red-500 font-arcade text-xs sm:text-sm uppercase">BACK</button>
          <button onClick={handleSave} className="flex-1 py-2 sm:py-3 bg-neon-cyan text-black font-arcade text-xs sm:text-sm font-bold uppercase">SAVE</button>
        </div>
      </div>
    </div>
  );
};

const MusicSettingsModal: React.FC<{ isOpen: boolean; onClose: () => void; bgmVolume: number; sfxVolume: number; onBgmChange: (v: number) => void; onSfxChange: (v: number) => void }> = ({ isOpen, onClose, bgmVolume, sfxVolume, onBgmChange, onSfxChange }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-vegas-panel border-2 border-neon-pink box-glow-pink p-4 sm:p-6 rounded w-full max-w-md relative">
        <h2 className="text-lg sm:text-xl font-arcade text-white mb-6 sm:mb-8 text-center tracking-widest uppercase">MUSIC SETTINGS</h2>
        <div className="space-y-6 sm:space-y-8">
          {/* Background Music Volume */}
          <div>
            <label className="block text-neon-pink text-xs sm:text-sm font-bold uppercase mb-3 sm:mb-4 flex items-center gap-2">
              <span>🎵</span>
              <span>Background Music</span>
            </label>
            <div className="flex items-center gap-3 sm:gap-4">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={bgmVolume}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  onBgmChange(v);
                  soundManager.setBgmVolume(v);
                }}
                className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-neon-pink"
              />
              <span className="text-neon-pink font-mono text-sm sm:text-base font-bold w-8 text-right">{Math.round(bgmVolume * 100)}</span>
            </div>
          </div>

          {/* SFX Volume */}
          <div>
            <label className="block text-neon-cyan text-xs sm:text-sm font-bold uppercase mb-3 sm:mb-4 flex items-center gap-2">
              <span>🔊</span>
              <span>Game Sound Effects</span>
            </label>
            <div className="flex items-center gap-3 sm:gap-4">
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={sfxVolume}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  onSfxChange(v);
                  soundManager.setSfxVolume(v);
                  soundManager.play('click');
                }}
                className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-neon-cyan"
              />
              <span className="text-neon-cyan font-mono text-sm sm:text-base font-bold w-8 text-right">{Math.round(sfxVolume * 100)}</span>
            </div>
          </div>

          {/* Test Buttons */}
          <div className="space-y-2 pt-4 border-t border-slate-700">
            <p className="text-slate-400 text-xs uppercase font-mono mb-2">TEST SOUND</p>
            <div className="flex gap-2">
              <button
                onClick={() => soundManager.play('click')}
                className="flex-1 py-2 bg-neon-cyan text-black font-arcade text-xs font-bold uppercase rounded hover:bg-neon-cyan/80 active:scale-95 transition"
              >
                SFX Test
              </button>
              <button
                onClick={() => soundManager.play('bgm')}
                className="flex-1 py-2 bg-neon-pink text-black font-arcade text-xs font-bold uppercase rounded hover:bg-neon-pink/80 active:scale-95 transition"
              >
                Music Test
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-3 sm:gap-4 mt-6 sm:mt-8">
          <button onClick={onClose} className="flex-1 py-2 sm:py-3 border border-neon-pink text-neon-pink font-arcade text-xs sm:text-sm uppercase rounded hover:bg-neon-pink/10 active:scale-95 transition">CLOSE</button>
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC<DashboardProps> = ({ user, transactions, onOpenPayment, onUpdateProfile, onLogout }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showMusicSettings, setShowMusicSettings] = useState(false);
  const [bgmVolume, setBgmVolume] = useState(soundManager.getBgmVolume());
  const [sfxVolume, setSfxVolume] = useState(soundManager.getSfxVolume());
  const rank = RANK_CONFIG[user.rank];
  const nextRankXp = user.rankXp >= 15 ? 15 : user.rankXp >= 10 ? 15 : user.rankXp >= 5 ? 10 : 5;
  const progress = Math.min((user.rankXp / nextRankXp) * 100, 100);

  return (
    <div className="min-h-screen px-1.5 sm:px-3 md:px-6 py-1.5 sm:py-3 md:py-6 mx-auto max-w-7xl space-y-1.5 sm:space-y-2 md:space-y-4 pb-24 w-full overflow-x-hidden">
      {onUpdateProfile && <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} user={user} onSave={onUpdateProfile} />}

      {/* Profile Settings Modal */}
      {showProfileSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-2 sm:p-3 md:p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <ProfileSettings
              user={user}
              onUpdateProfile={onUpdateProfile || (() => {})}
              onClose={() => setShowProfileSettings(false)}
            />
          </div>
        </div>
      )}

      {/* Music Settings Modal */}
      {showMusicSettings && (
        <MusicSettingsModal
          isOpen={showMusicSettings}
          onClose={() => setShowMusicSettings(false)}
          bgmVolume={bgmVolume}
          sfxVolume={sfxVolume}
          onBgmChange={setBgmVolume}
          onSfxChange={setSfxVolume}
        />
      )}

      {/* Stats Grid - Fully responsive with better mobile spacing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1.5 sm:gap-2 md:gap-3 w-full">
        <div className="bg-vegas-panel border border-neon-gold/30 p-2 sm:p-3 md:p-4 shadow-xl relative overflow-hidden group w-full min-h-[90px] sm:min-h-[100px]">
          <div className="absolute top-0 right-0 w-6 h-6 sm:w-8 sm:h-8 bg-neon-gold/5 -translate-y-4 translate-x-4 rotate-45 group-hover:bg-neon-gold/10 transition-colors"></div>
          <h3 className="text-neon-gold text-[8px] sm:text-[9px] md:text-xs font-bold uppercase tracking-widest mb-1 sm:mb-1.5">BANKROLL</h3>
          <button
            onClick={() => onOpenPayment('DEPOSIT')}
            className="text-sm sm:text-base md:text-xl font-arcade text-white text-glow-gold break-words cursor-pointer hover:text-neon-gold transition-colors active:scale-95 w-full text-left py-0.5"
            title="Click to add funds"
          >
            {formatCurrency(user.balance)}
          </button>
          <div className="mt-1.5 sm:mt-2 flex gap-1.5 sm:gap-2 w-full">
            <button onClick={() => onOpenPayment('DEPOSIT')} className="flex-1 bg-neon-gold text-black font-bold py-1 sm:py-1.5 md:py-2 uppercase text-[7px] sm:text-[8px] md:text-xs tracking-wide transition-transform active:scale-95 rounded-sm">Deposit</button>
            <button onClick={() => onOpenPayment('WITHDRAWAL')} className="flex-1 border border-neon-gold text-neon-gold font-bold py-1 sm:py-1.5 md:py-2 uppercase text-[7px] sm:text-[8px] md:text-xs tracking-wide transition-transform active:scale-95 rounded-sm">Withdraw</button>
          </div>
        </div>

        <div className="bg-vegas-panel border p-2 sm:p-3 md:p-4 shadow-xl relative w-full min-h-[90px] sm:min-h-[100px]" style={{ borderColor: rank.color + '50' }}>
          <h3 className="text-xs sm:text-sm md:text-base font-bold uppercase tracking-widest mb-1.5" style={{ color: rank.color }}>RANK</h3>
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5">
             <div className={`w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11 rounded-full border border-2 ${rank.borderColor} flex items-center justify-center bg-black font-arcade text-xs sm:text-sm md:text-base shrink-0`} style={{ color: rank.color, boxShadow: `0 0 10px ${rank.color}44` }}>{rank.label.charAt(0)}</div>
             <div className="min-w-0 flex-1">
               <span className="text-sm sm:text-base md:text-lg font-arcade text-white uppercase block break-words line-clamp-1">{rank.label}</span>
               <span className="text-xs sm:text-sm md:text-base text-slate-500 font-mono block uppercase line-clamp-1">XP: {user.rankXp}/{nextRankXp}</span>
             </div>
          </div>
          <div className="w-full h-0.5 bg-slate-800 rounded overflow-hidden">
            <div className="h-full transition-all duration-1000" style={{ width: `${progress}%`, backgroundColor: rank.color }}></div>
          </div>
        </div>

        <div className="bg-vegas-panel border border-neon-cyan/30 p-2 sm:p-3 md:p-4 shadow-xl relative w-full min-h-[90px] sm:min-h-[100px]">
          <h3 className="text-neon-cyan text-[8px] sm:text-[9px] md:text-xs font-bold uppercase tracking-widest mb-1.5">PROFILE</h3>
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5">
               <img src={user.avatar} className="w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11 rounded-full border border-2 border-neon-cyan shadow-[0_0_10px_rgba(0,255,255,0.2)] shrink-0" alt="U" />
               <div className="min-w-0 flex-1"><div className="text-white font-bold font-mono break-words uppercase text-[7px] sm:text-[8px] md:text-sm line-clamp-1">{user.username}</div></div>
          </div>
          <div className="space-y-0.5 sm:space-y-1">
            <button onClick={() => setIsEditModalOpen(true)} className="w-full bg-transparent border border-neon-cyan text-neon-cyan font-bold py-1 sm:py-1.5 md:py-2 uppercase text-xs sm:text-sm md:text-base tracking-wider hover:bg-neon-cyan/10 transition-colors text-center rounded-sm">EDIT</button>
            <button onClick={() => setShowProfileSettings(true)} className="w-full bg-transparent border border-neon-green text-neon-green font-bold py-1 sm:py-1.5 md:py-2 uppercase text-xs sm:text-sm md:text-base tracking-wider hover:bg-neon-green/10 transition-colors text-center rounded-sm">INFO</button>
            <button onClick={() => setShowMusicSettings(true)} className="w-full bg-transparent border border-neon-pink text-neon-pink font-bold py-1 sm:py-1.5 md:py-2 uppercase text-xs sm:text-sm md:text-base tracking-wider hover:bg-neon-pink/10 transition-colors text-center rounded-sm">SETTINGS</button>
            {onLogout && (
              <button onClick={onLogout} className="w-full bg-transparent border border-red-500 text-red-500 font-bold py-1 sm:py-1.5 md:py-2 uppercase text-xs sm:text-sm md:text-base tracking-wider hover:bg-red-500/10 transition-colors text-center rounded-sm">LOGOUT</button>
            )}
          </div>
        </div>
      </div>

      {/* History Chart */}
      <div className="bg-vegas-panel border border-slate-800 p-2 sm:p-3 md:p-4 h-28 sm:h-40 md:h-56 relative overflow-hidden w-full">
        <h3 className="text-white font-arcade mb-1.5 sm:mb-2 md:mb-3 tracking-widest text-xs sm:text-sm md:text-base uppercase">WALLET HISTORY</h3>
        <div className="h-[calc(100%-1.5rem)] sm:h-[calc(100%-2rem)] w-full">

          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 3, right: 3, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
              <XAxis dataKey="name" stroke="#444" tick={{fill: '#666', fontSize: 14}} tickLine={false} axisLine={false} />
              <YAxis stroke="#444" tick={{fill: '#666', fontSize: 14}} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0a0a12', borderColor: '#bf00ff', fontSize: '10px', borderRadius: '0px' }} 
                itemStyle={{ color: '#fff' }}
              />
              <Area type="monotone" dataKey="balance" stroke="#bf00ff" fill="#bf00ff33" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-vegas-panel border border-slate-800 shadow-xl overflow-hidden rounded-sm w-full">
        <div className="p-2 sm:p-3 md:p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-1.5 h-1.5 bg-neon-cyan rounded-full animate-pulse"></div>
            <h3 className="text-white font-arcade text-xs sm:text-sm md:text-base tracking-widest uppercase">TRANSACTIONS</h3>
          </div>
        </div>
        <div className="overflow-x-auto custom-scrollbar w-full">
          <table className="w-full text-left text-xs sm:text-sm md:text-base min-w-full">
            <thead className="bg-black/80 text-slate-500 uppercase font-mono">
              <tr>
                <th className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm md:text-base">Type</th>
                <th className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm md:text-base">Amount</th>
                <th className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm md:text-base hidden sm:table-cell">Status</th>
                <th className="px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 text-xs sm:text-sm md:text-base hidden md:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 font-mono text-xs sm:text-sm md:text-base">
              {transactions.slice(0, 5).map((tx) => (
                <tr key={tx.id} className="hover:bg-white/5 transition-colors group">
                  <td className={`px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 font-bold ${tx.type === 'DEPOSIT' || tx.type === 'WIN' ? 'text-neon-green' : 'text-neon-pink'}`}>{tx.type.substring(0, 3)}</td>
                  <td className="px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 text-white whitespace-nowrap">{formatCurrency(tx.amount)}</td>
                  <td className="px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 hidden sm:table-cell">
                    <span className={`px-1 py-0.5 border text-[6px] sm:text-[7px] rounded-sm inline-block ${tx.status === 'COMPLETED' ? 'border-neon-green/50 text-neon-green' : 'border-neon-gold/50 text-neon-gold'}`}>
                      {tx.status.substring(0, 3)}
                    </span>
                  </td>
                  <td className="px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 text-slate-600 group-hover:text-slate-400 transition-colors text-[6px] sm:text-[7px] md:text-[8px] hidden md:table-cell">{tx.date.substring(0, 10)}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-2 sm:px-3 md:px-4 py-2 sm:py-3 text-center text-slate-700 font-arcade uppercase text-xs sm:text-sm md:text-base tracking-wide">
                    No History
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
