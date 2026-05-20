import React, { useState } from 'react';
import { User } from '../types.ts';
import { soundManager } from '../services/soundManager.ts';

interface ProfileSettingsProps {
  user: User;
  onUpdateProfile: (updates: Partial<User>) => void;
  onClose?: () => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ user, onUpdateProfile, onClose }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    phoneNumber: user.phoneNumber || '',
    email: user.email || '',
    bio: user.bio || '',
  });

  const formatKenyanPhoneInput = (value: string) => {
    let digits = value.replace(/\D/g, '');
    if (digits.startsWith('254')) digits = digits.slice(3);
    if (digits.startsWith('0')) digits = digits.slice(1);
    digits = digits.slice(0, 9);

    const firstBlock = digits.slice(0, 3);
    const secondBlock = digits.slice(3, 6);
    const thirdBlock = digits.slice(6, 9);

    return ['0' + firstBlock, secondBlock, thirdBlock].filter(Boolean).join(' ').trim();
  };

  const handleSave = () => {
    soundManager.play('click');
    onUpdateProfile({
      phoneNumber: formData.phoneNumber || undefined,
      email: formData.email,
      bio: formData.bio || undefined,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    soundManager.play('click');
    setFormData({
      phoneNumber: user.phoneNumber || '',
      email: user.email || '',
      bio: user.bio || '',
    });
    setIsEditing(false);
  };

  return (
    <div className="bg-vegas-panel/95 backdrop-blur-xl border-2 sm:border-4 border-neon-cyan/40 rounded p-4 sm:p-6 md:p-8 max-w-2xl w-full mx-auto">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <h3 className="text-lg sm:text-xl md:text-2xl font-arcade text-white uppercase tracking-widest">Account Info</h3>
        {onClose && (
          <button 
            onClick={onClose} 
            className="text-neon-pink hover:text-neon-cyan transition-colors text-lg sm:text-2xl"
          >
            ✕
          </button>
        )}
      </div>

      <div className="space-y-4 sm:space-y-6">
        {/* Display Mode */}
        {!isEditing && (
          <>
            <div className="space-y-3 sm:space-y-4">
              <div className="bg-black/40 border border-neon-cyan/20 rounded p-3 sm:p-4">
                <label className="text-[8px] sm:text-[10px] text-neon-pink uppercase font-arcade tracking-[0.2em] block opacity-80 mb-2">Username</label>
                <p className="text-white font-mono text-xs sm:text-sm">{user.username}</p>
              </div>

              <div className="bg-black/40 border border-neon-cyan/20 rounded p-3 sm:p-4">
                <label className="text-[8px] sm:text-[10px] text-neon-pink uppercase font-arcade tracking-[0.2em] block opacity-80 mb-2">Email</label>
                <p className="text-white font-mono text-xs sm:text-sm break-all">{user.email || 'Not set'}</p>
              </div>

              <div className="bg-black/40 border border-neon-green/20 rounded p-3 sm:p-4">
                <label className="text-[8px] sm:text-[10px] text-neon-green uppercase font-arcade tracking-[0.2em] block opacity-80 mb-2">Phone Number (Auto-fill for Deposits/Withdrawals)</label>
                <p className="text-neon-green font-mono text-xs sm:text-sm">{user.phoneNumber || 'Not set'}</p>
              </div>

              <div className="bg-black/40 border border-neon-cyan/20 rounded p-3 sm:p-4">
                <label className="text-[8px] sm:text-[10px] text-neon-pink uppercase font-arcade tracking-[0.2em] block opacity-80 mb-2">Bio</label>
                <p className="text-white font-mono text-xs sm:text-sm">{user.bio || 'No bio set'}</p>
              </div>
            </div>

            <button
              onClick={() => { setIsEditing(true); soundManager.play('click'); }}
              className="w-full bg-neon-cyan text-black font-arcade py-2 sm:py-3 uppercase tracking-widest text-xs sm:text-sm font-black transition-all hover:bg-white hover:shadow-[0_0_30px_rgba(0,255,255,0.8)] active:scale-95"
            >
              Edit Profile
            </button>
          </>
        )}

        {/* Edit Mode */}
        {isEditing && (
          <>
            <div className="space-y-3 sm:space-y-4">
              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-[8px] sm:text-[10px] text-neon-pink uppercase font-arcade tracking-[0.2em] block opacity-80">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(p => ({...p, email: e.target.value}))}
                  className="w-full bg-black border-2 border-neon-cyan/20 p-2 sm:p-3 text-white font-mono focus:border-neon-cyan focus:outline-none transition-all placeholder-slate-800 text-xs sm:text-sm"
                  placeholder="your@email.com"
                />
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-[8px] sm:text-[10px] text-neon-green uppercase font-arcade tracking-[0.2em] block opacity-80">Phone Number (Optional)</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData(p => ({...p, phoneNumber: formatKenyanPhoneInput(e.target.value)}))}
                  className="w-full bg-black border-2 border-neon-green/20 p-2 sm:p-3 text-white font-mono focus:border-neon-green focus:outline-none transition-all placeholder-slate-800 text-xs sm:text-sm"
                  placeholder="0712 345 678"
                />
                <p className="text-[6px] sm:text-[7px] text-neon-green/60 font-arcade">Will be auto-filled for deposits and withdrawals</p>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <label className="text-[8px] sm:text-[10px] text-neon-pink uppercase font-arcade tracking-[0.2em] block opacity-80">Bio (Optional)</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData(p => ({...p, bio: e.target.value}))}
                  className="w-full bg-black border-2 border-neon-cyan/20 p-2 sm:p-3 text-white font-mono focus:border-neon-cyan focus:outline-none transition-all placeholder-slate-800 text-xs sm:text-sm resize-none h-20"
                  placeholder="Tell others about yourself..."
                  maxLength={200}
                />
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3">
              <button
                onClick={handleSave}
                className="flex-1 bg-neon-cyan text-black font-arcade py-2 sm:py-3 uppercase tracking-widest text-xs sm:text-sm font-black transition-all hover:bg-white hover:shadow-[0_0_30px_rgba(0,255,255,0.8)] active:scale-95"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 bg-neon-pink/20 border-2 border-neon-pink text-neon-pink font-arcade py-2 sm:py-3 uppercase tracking-widest text-xs sm:text-sm font-black transition-all hover:bg-neon-pink hover:text-black active:scale-95"
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {/* Account Management Section */}
        {!isEditing && (
          <div className="mt-6 sm:mt-8 border-t border-neon-cyan/20 pt-6 sm:pt-8">
            <h4 className="text-neon-pink font-arcade text-xs sm:text-sm mb-3 sm:mb-4 uppercase tracking-wider">Account & Support</h4>
            
            <div className="space-y-2 sm:space-y-3">
              {/* Terms of Use */}
              <a
                href="#/terms-of-use"
                className="block bg-black/40 border border-neon-cyan/20 rounded p-3 sm:p-4 hover:border-neon-cyan/50 hover:bg-neon-cyan/5 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-neon-cyan text-sm sm:text-base">📋</span>
                    <span className="text-white font-arcade text-xs sm:text-sm uppercase group-hover:text-neon-cyan transition-colors">Terms of Use</span>
                  </div>
                  <span className="text-neon-cyan/50 text-xs sm:text-sm">→</span>
                </div>
              </a>

              {/* Privacy Policy */}
              <a
                href="#/privacy-policy"
                className="block bg-black/40 border border-neon-cyan/20 rounded p-3 sm:p-4 hover:border-neon-cyan/50 hover:bg-neon-cyan/5 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-neon-cyan text-sm sm:text-base">🔒</span>
                    <span className="text-white font-arcade text-xs sm:text-sm uppercase group-hover:text-neon-cyan transition-colors">Privacy Policy</span>
                  </div>
                  <span className="text-neon-cyan/50 text-xs sm:text-sm">→</span>
                </div>
              </a>

              {/* Help Centre */}
              <a
                href="#/help-centre"
                className="block bg-black/40 border border-neon-green/20 rounded p-3 sm:p-4 hover:border-neon-green/50 hover:bg-neon-green/5 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-neon-green text-sm sm:text-base">❓</span>
                    <span className="text-white font-arcade text-xs sm:text-sm uppercase group-hover:text-neon-green transition-colors">Help Centre</span>
                  </div>
                  <span className="text-neon-green/50 text-xs sm:text-sm">→</span>
                </div>
              </a>
            </div>

            {/* Danger Zone */}
            <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-neon-pink/20">
              <h5 className="text-neon-pink font-arcade text-[10px] sm:text-xs mb-3 sm:mb-4 uppercase tracking-wider opacity-80">Danger Zone</h5>
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to deactivate your account? You will not be able to access your account for 30 days.')) {
                    if (window.confirm('This action cannot be undone. Continue?')) {
                      // TODO: Call API to deactivate account
                    }
                  }
                }}
                className="w-full bg-red-900/20 border-2 border-red-500/50 rounded p-3 sm:p-4 hover:bg-red-900/40 hover:border-red-500 transition-colors text-left group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-red-500 text-sm sm:text-base">⏸️</span>
                  <div>
                    <div className="text-red-500 font-arcade text-xs sm:text-sm uppercase font-bold group-hover:text-red-400">Deactivate Account</div>
                    <div className="text-red-500/60 text-[8px] sm:text-[9px] font-mono mt-0.5">30-day recovery period</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => {
                  if (window.confirm('Are you absolutely sure? All your data will be permanently deleted and cannot be recovered.')) {
                    if (window.confirm('This is permanent. Type CONFIRM to delete your account.')) {
                      // TODO: Call API to delete account
                    }
                  }
                }}
                className="w-full mt-2 sm:mt-3 bg-red-950/40 border-2 border-red-600/40 rounded p-3 sm:p-4 hover:bg-red-950 hover:border-red-600 transition-colors text-left group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-red-600 text-sm sm:text-base">🗑️</span>
                  <div>
                    <div className="text-red-600 font-arcade text-xs sm:text-sm uppercase font-bold group-hover:text-red-500">Delete Account</div>
                    <div className="text-red-600/50 text-[8px] sm:text-[9px] font-mono mt-0.5">Permanent & irreversible</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
