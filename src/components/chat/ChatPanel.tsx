import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send } from 'lucide-react';
import type { ChatMessage, GamePhase } from '../../types/game';
import { cn } from '../../utils/cn';

// ─── ChatPanel ────────────────────────────────────────────────────────────────
interface ChatPanelProps {
  messages: ChatMessage[];
  onSend: (text: string) => void;
  disabled?: boolean;  // Dead players cannot send messages
  phase: GamePhase;
  isMafiaChannel?: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSend,
  disabled,
  phase,
  isMafiaChannel = false,
}) => {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setInput('');
  };

  const canType = !disabled && (phase === 'day' || (phase === 'night' && isMafiaChannel));

  return (
    <div className="flex flex-col h-full glass rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
        <div
          className={cn(
            'w-2 h-2 rounded-full',
            isMafiaChannel ? 'bg-red-500' : phase === 'day' ? 'bg-amber-400' : 'bg-indigo-400'
          )}
        />
        <p className="text-white/60 text-xs font-semibold uppercase tracking-widest">
          {isMafiaChannel ? 'Mafia Channel' : phase === 'day' ? 'Town Discussion' : 'Night Silence'}
        </p>
        {disabled && (
          <span className="ml-auto text-white/25 text-xs">Spectating</span>
        )}
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
        <AnimatePresence initial={false}>
          {messages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <MessageBubble message={msg} />
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t border-white/5">
        {canType ? (
          <form
            onSubmit={e => { e.preventDefault(); handleSend(); }}
            className="flex gap-2"
          >
            <input
              id="chat-input"
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={isMafiaChannel ? 'Plan with your allies...' : 'Say something...'}
              maxLength={200}
              className="flex-1 bg-white/5 border border-white/8 rounded-xl px-4 py-2 text-sm text-white placeholder-white/25 focus:outline-none focus:border-white/20 transition-colors"
            />
            <motion.button
              type="submit"
              disabled={!input.trim()}
              whileTap={{ scale: 0.9 }}
              className="w-9 h-9 rounded-xl bg-crimson-700 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
            >
              <Send size={15} className="text-white" />
            </motion.button>
          </form>
        ) : (
          <p className="text-center text-white/20 text-xs py-1">
            {phase === 'night' && !isMafiaChannel
              ? '🌙 The village sleeps. Chat disabled.'
              : phase === 'voting'
              ? '🗳️ Voting in progress.'
              : '👁 You are spectating.'}
          </p>
        )}
      </div>
    </div>
  );
};

// ─── MessageBubble ────────────────────────────────────────────────────────────
const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  if (message.type === 'narrator') {
    return (
      <div className="chat-narrator text-xs leading-relaxed">
        <span className="text-purple-400/60 text-[10px] uppercase tracking-wider block mb-0.5">
          Narrator
        </span>
        {message.content}
      </div>
    );
  }

  if (message.type === 'system') {
    return (
      <div className="text-center">
        <span className="text-white/25 text-xs">{message.content}</span>
      </div>
    );
  }

  if (message.type === 'mafia') {
    return (
      <div className="chat-mafia text-sm">
        <span className="text-red-400/70 text-xs font-semibold">{message.senderName}</span>
        <p className="text-white/75 mt-0.5">{message.content}</p>
      </div>
    );
  }

  // Public message
  return (
    <div>
      <span className="text-white/40 text-xs font-medium">{message.senderName}</span>
      <p className="text-white/80 text-sm mt-0.5 leading-relaxed">{message.content}</p>
    </div>
  );
};

export default ChatPanel;
