import React from 'react';
import { Link } from 'react-router-dom';
import { soundManager } from '../services/soundManager.ts';

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-neon-cyan/20 bg-black/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {/* Brand */}
          <div>
            <div className="text-lg sm:text-xl font-arcade font-black mb-3 tracking-wider">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-pink to-neon-purple">X</span>{' '}
              <span className="text-white">PIN</span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 leading-relaxed">Ultimate and authentic spin-the-wheel action. Place your wager and stand the chance to win your 1,000 KSh.</p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-neon-cyan font-arcade text-xs sm:text-sm mb-3 uppercase tracking-wider">GAME</h3>
            <ul className="space-y-2 text-[10px] sm:text-xs">
              <li>
                <Link to="/" onClick={() => soundManager.play('click')} className="text-slate-400 hover:text-neon-cyan transition-colors">
                  Lobby
                </Link>
              </li>
              <li>
                <Link to="/dashboard" onClick={() => soundManager.play('click')} className="text-slate-400 hover:text-neon-cyan transition-colors">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-neon-cyan font-arcade text-xs sm:text-sm mb-3 uppercase tracking-wider">LEGAL</h3>
            <ul className="space-y-2 text-[10px] sm:text-xs">
              <li>
                <Link to="/terms-of-use" onClick={() => soundManager.play('click')} className="text-slate-400 hover:text-neon-cyan transition-colors">
                  Terms of Use
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" onClick={() => soundManager.play('click')} className="text-slate-400 hover:text-neon-cyan transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-neon-cyan font-arcade text-xs sm:text-sm mb-3 uppercase tracking-wider">SUPPORT</h3>
            <ul className="space-y-2 text-[10px] sm:text-xs">
              <li>
                <Link to="/help-centre" onClick={() => soundManager.play('click')} className="text-slate-400 hover:text-neon-cyan transition-colors">
                  Help Centre
                </Link>
              </li>
              <li>
                <a href="mailto:support@x-spin.com" className="text-slate-400 hover:text-neon-cyan transition-colors">
                  Contact Us
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-neon-cyan/10 pt-6 sm:pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[9px] sm:text-[10px] text-slate-500">
          <p>© 2024 X-SPIN. All rights reserved. Play responsibly.</p>
          <div className="flex gap-3 sm:gap-6">
            <a href="#" className="hover:text-neon-cyan transition-colors">Twitter</a>
            <a href="#" className="hover:text-neon-cyan transition-colors">Discord</a>
            <a href="#" className="hover:text-neon-cyan transition-colors">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
