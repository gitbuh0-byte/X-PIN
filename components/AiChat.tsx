import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types.ts';

interface AiChatProps {
  chatHistory: ChatMessage[];
  onSendMessage: (msg: string) => void;
}

const AiChat: React.FC<AiChatProps> = ({ chatHistory, onSendMessage }) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSend = async () => {
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-black font-mono text-xs sm:text-sm relative">
      {/* Scanline overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] pointer-events-none z-10 opacity-20"></div>

      <div className="p-2 sm:p-3 bg-vegas-panel border-b border-neon-purple/30 flex justify-between items-center shadow-lg z-20">
        <h3 className="font-arcade text-neon-pink text-[7px] sm:text-[8px] md:text-xs tracking-widest">COMM_CHANNEL_01</h3>
        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_5px_lime]"></span>
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-2 sm:space-y-3 custom-scrollbar bg-black/50">
        {chatHistory.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === 'YOU' ? 'items-end' : 'items-start'}`}>
            <span className={`text-[8px] sm:text-[9px] mb-0.5 sm:mb-1 font-bold tracking-wider ${
              msg.isAi ? 'text-neon-gold' : msg.sender === 'YOU' ? 'text-neon-cyan' : 'text-slate-500'
            }`}>
              {msg.isAi ? '>>> ORACLE_AI' : `> ${msg.sender}`}
            </span>
            <div className={`px-2 sm:px-3 py-1 sm:py-2 border max-w-[90%] relative text-[7px] sm:text-[8px] break-words ${
              msg.sender === 'YOU' 
                ? 'border-neon-cyan text-neon-cyan bg-neon-cyan/5 shadow-[0_0_10px_rgba(0,255,255,0.1)]' 
                : msg.isAi
                  ? 'border-neon-gold text-neon-gold bg-neon-gold/5 shadow-[0_0_10px_rgba(255,215,0,0.1)]'
                  : 'border-slate-700 text-slate-300 bg-slate-900/50'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      <div className="p-2 sm:p-3 bg-vegas-panel border-t border-neon-purple/30 z-20">
        <div className="flex gap-1 sm:gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="MSG..."
            className="flex-1 bg-black border border-neon-purple/50 px-2 sm:px-3 py-1.5 sm:py-2 text-neon-pink placeholder-neon-purple/50 focus:border-neon-pink focus:outline-none focus:shadow-[0_0_10px_rgba(255,0,255,0.3)] font-mono text-[7px] sm:text-[8px]"
          />
          <button 
            onClick={handleSend}
            className="bg-neon-pink text-black font-bold px-2 sm:px-3 hover:bg-white transition-colors font-arcade text-[7px] sm:text-[8px] whitespace-nowrap"
          >
            SEND
          </button>
        </div>
      </div>
    </div>
  );
};

export default AiChat;