import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { soundManager } from '../services/soundManager.ts';
import { getCurrentAuthenticatedUser, processAuthRedirect } from '../services/auth.ts';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  useEffect(() => {
    const complete = async () => {
      try {
        const result = await processAuthRedirect();
        const authenticatedUser = await getCurrentAuthenticatedUser();
        if (authenticatedUser) {
          soundManager.play('win');
          navigate('/home', { replace: true });
          return;
        }
        const info = {
          message: 'No authenticated session found after callback.',
          location: {
            href: window.location.href,
            search: window.location.search,
            hash: window.location.hash,
          },
          result,
        };
        throw new Error(JSON.stringify(info, null, 2));
      } catch (err) {
        soundManager.play('error');
        const message = err instanceof Error ? err.message : 'Authentication callback failed.';
        setError(message);
        setDebugInfo(err instanceof Error ? err.stack || JSON.stringify(err, null, 2) : JSON.stringify(err, null, 2));
      }
    };

    void complete();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-vegas-bg text-white flex items-center justify-center p-4">
      <div className="bg-vegas-panel/90 border-2 border-neon-cyan/40 retro-card p-8 max-w-md w-full text-center shadow-[0_0_80px_rgba(255,255,255,0.12)]">
        <div className="text-3xl sm:text-4xl font-arcade text-neon-cyan mb-4">
          {error ? 'AUTH ERROR' : 'SYNCING SESSION'}
        </div>
        <p className={`font-ui text-sm sm:text-base ${error ? 'text-neon-pink' : 'text-slate-300'}`}>
          {error || 'Completing secure sign-in and loading your profile...'}
        </p>
        {error && (
          <>
            <button
              type="button"
              onClick={() => navigate('/home', { replace: true })}
              className="mt-6 px-6 py-3 bg-neon-cyan text-black font-arcade uppercase tracking-widest text-xs sm:text-sm"
            >
              Back to Login
            </button>
            {debugInfo && (
              <pre className="mt-6 p-4 text-left text-[10px] leading-snug bg-black/70 border border-neon-pink/20 rounded text-neon-pink overflow-x-auto max-h-56">
                {debugInfo}
              </pre>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
