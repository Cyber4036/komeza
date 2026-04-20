import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { t } from '../lib/i18n';
import { sendMessage, getOpeningMessage } from '../lib/claude';
import { detectCrisis } from '../lib/crisis';
import { useVoice, speak, stopSpeaking } from '../hooks/useVoice';
import type { ChatMessage } from '../types';

function TypingDots() {
  return (
    <div className="flex gap-1.5 items-center px-1 py-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2.5 h-2.5 rounded-full"
          style={{ background: '#52b788' }}
          animate={{ y: [0, -7, 0], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.18, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

function VoicePulse() {
  return (
    <div className="relative flex items-center justify-center w-full h-10">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ background: '#E9357A', width: 44 + i * 22, height: 44 + i * 22 }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.35 - i * 0.08, 0.15, 0.35 - i * 0.08] }}
          transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
      <div className="relative z-10 w-11 h-11 rounded-full flex items-center justify-center" style={{ background: '#E9357A' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" fill="white"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          <line x1="12" y1="19" x2="12" y2="23" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          <line x1="8" y1="23" x2="16" y2="23" stroke="white" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
    </div>
  );
}

export default function ChatScreen() {
  const { state, dispatch } = useApp();
  const { language, chatHistory, currentRatings } = state;
  const tr = t[language];

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [speakResponses, setSpeakResponses] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleFinalTranscript = useCallback((text: string) => {
    setInput((prev) => (prev ? prev + ' ' + text : text));
    inputRef.current?.focus();
  }, []);

  const voice = useVoice(language, handleFinalTranscript);

  useEffect(() => {
    if (!hasOpened && chatHistory.length === 0) {
      setHasOpened(true);
      const opening = getOpeningMessage(currentRatings, language);
      const msg: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: opening,
        timestamp: new Date().toISOString(),
      };
      const timer = setTimeout(() => {
        dispatch({ type: 'ADD_MESSAGE', payload: msg });
        if (speakResponses) speak(opening, language);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isLoading]);

  async function handleSend(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if (!text || isLoading) return;

    if (detectCrisis(text)) {
      dispatch({ type: 'TRIGGER_CRISIS' });
      return;
    }

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    dispatch({ type: 'ADD_MESSAGE', payload: userMsg });
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';
    setIsLoading(true);
    stopSpeaking();

    try {
      const allMessages = [...chatHistory, userMsg];
      const reply = await sendMessage(allMessages, currentRatings, language);

      if (detectCrisis(reply)) {
        dispatch({ type: 'TRIGGER_CRISIS' });
        return;
      }

      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_MESSAGE', payload: aiMsg });
      if (speakResponses) speak(reply, language);
    } catch {
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: language === 'rw'
            ? 'Ihangane gato. Komeza isohoka iminota mike. Ongera ugerageze.'
            : "I'm having a moment of difficulty. Please try again shortly.",
          timestamp: new Date().toISOString(),
        },
      });
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const activeInput = input || (voice.isListening ? voice.interimTranscript : '');

  return (
    <div className="flex flex-col" style={{ height: '100dvh', maxHeight: '100dvh' }}>
      {/* Header */}
      <div
        className="px-5 pb-4 flex items-center justify-between shrink-0"
        style={{
          background: 'linear-gradient(140deg, #0d2e1c, #1a4731)',
          paddingTop: 'max(56px, calc(env(safe-area-inset-top, 0px) + 12px))',
        }}
      >
        <div className="flex items-center gap-3">
          <motion.div
            animate={isLoading ? { rotate: [0, 15, -15, 0] } : {}}
            transition={{ duration: 1.5, repeat: isLoading ? Infinity : 0 }}
            className="w-10 h-10 rounded-2xl overflow-hidden shrink-0"
            style={{ background: '#fff' }}
          >
            <img src="/images/logo.png" alt="Komeza" className="w-full h-full object-contain p-1" />
          </motion.div>
          <div>
            <p className="font-bold text-sm" style={{ color: '#fff' }}>{tr.chatTitle}</p>
            <p className="text-xs" style={{ color: voice.isListening ? '#E9357A' : isLoading ? '#E9A720' : '#74C69D' }}>
              {voice.isListening
                ? (language === 'rw' ? '🎙 Iri kumva...' : '🎙 Listening...')
                : isLoading
                ? tr.listening
                : language === 'rw' ? 'Iri hano kukumva' : 'Here to listen'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {'speechSynthesis' in window && (
            <button
              onClick={() => { setSpeakResponses((v) => !v); stopSpeaking(); }}
              title={speakResponses ? 'Mute responses' : 'Speak responses aloud'}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-110"
              style={{
                background: speakResponses ? 'rgba(233,167,32,0.25)' : 'rgba(255,255,255,0.08)',
                border: speakResponses ? '1px solid rgba(233,167,32,0.4)' : '1px solid transparent',
              }}
            >
              <span className="text-base">{speakResponses ? '🔊' : '🔇'}</span>
            </button>
          )}

          <button
            onClick={() => dispatch({ type: 'SET_LANGUAGE', payload: language === 'en' ? 'rw' : 'en' })}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.1)', color: '#74C69D' }}
          >
            {language === 'en' ? '🇷🇼 RW' : '🇬🇧 EN'}
          </button>
        </div>
      </div>


      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4" style={{ background: 'var(--bg-app)' }}>
        <AnimatePresence initial={false}>
          {chatHistory.map((msg, idx) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 14, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.28, ease: [0.34, 1.56, 0.64, 1] }}
              className={`flex items-end gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-[14px] flex items-center justify-center text-base shrink-0 mb-0.5" style={{ background: '#1a4731' }}>
                  🌿
                </div>
              )}
              <div
                className="max-w-[76%] px-4 py-3 text-sm leading-relaxed relative group"
                style={
                  msg.role === 'user'
                    ? {
                        background: 'linear-gradient(135deg, #1a4731, #2d6a4f)',
                        color: '#fff',
                        borderRadius: '20px 20px 6px 20px',
                        boxShadow: '0 4px 16px rgba(26,71,49,0.25)',
                      }
                    : {
                        background: 'var(--bg-card)',
                        color: 'var(--text-1)',
                        borderRadius: '20px 20px 20px 6px',
                        boxShadow: 'var(--shadow-card)',
                      }
                }
              >
                {msg.content}
                {msg.role === 'assistant' && 'speechSynthesis' in window && (
                  <button
                    onClick={() => speak(msg.content, language)}
                    className="absolute -bottom-2 right-2 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs"
                    style={{ background: 'var(--bg-card)', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}
                    title="Read aloud"
                  >
                    🔊
                  </button>
                )}
              </div>
              {msg.role === 'user' && idx === chatHistory.length - 1 && (
                <div className="w-8 h-8 rounded-[14px] flex items-center justify-center text-sm shrink-0 mb-0.5 font-bold" style={{ background: 'rgba(26,71,49,0.12)', color: '#1a4731' }}>
                  Y
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-end gap-2.5"
          >
            <div className="w-8 h-8 rounded-[14px] flex items-center justify-center text-base shrink-0" style={{ background: '#1a4731' }}>
              🌿
            </div>
            <div className="px-4 py-3.5 rounded-3xl" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', borderBottomLeftRadius: 6 }}>
              <TypingDots />
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Voice listening state */}
      <AnimatePresence>
        {voice.isListening && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mx-4 mb-2 px-5 py-4 rounded-2xl flex flex-col items-center gap-2 shrink-0"
            style={{ background: 'var(--bg-card)', boxShadow: '0 4px 20px rgba(233,53,122,0.15)', border: '1.5px solid #E9357A20' }}
          >
            <VoicePulse />
            <p className="text-xs font-semibold mt-1" style={{ color: '#E9357A' }}>
              {language === 'rw' ? 'Iri kumva — vuga...' : 'Listening — speak now...'}
            </p>
            {voice.interimTranscript && (
              <p className="text-xs text-center italic" style={{ color: 'var(--text-3)' }}>
                "{voice.interimTranscript}"
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice error */}
      <AnimatePresence>
        {voice.error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mx-4 mb-2 px-4 py-2 rounded-xl text-xs text-center shrink-0"
            style={{ background: '#FFF0F0', color: '#B91C1C' }}
          >
            {voice.error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <div
        className="shrink-0 px-4 pt-3 transition-colors"
        style={{
          background: 'var(--bg-card)',
          borderTop: '1px solid var(--border-2)',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 80px)',
        }}
      >
        <div className="flex gap-2.5 items-end">
          {voice.isSupported && (
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={voice.isListening ? voice.stopListening : voice.startListening}
              className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all"
              style={{
                background: voice.isListening
                  ? 'linear-gradient(135deg, #E9357A, #C2185B)'
                  : 'var(--bg-muted)',
                border: voice.isListening ? 'none' : `1.5px solid var(--border-1)`,
                boxShadow: voice.isListening ? '0 4px 16px rgba(233,53,122,0.35)' : 'none',
              }}
              animate={voice.isListening ? { scale: [1, 1.06, 1] } : {}}
              transition={{ duration: 1.2, repeat: voice.isListening ? Infinity : 0 }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
                  fill={voice.isListening ? 'white' : 'var(--text-2)'} />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"
                  stroke={voice.isListening ? 'white' : 'var(--text-2)'}
                  strokeWidth="2" strokeLinecap="round" />
                <line x1="12" y1="19" x2="12" y2="23" stroke={voice.isListening ? 'white' : 'var(--text-2)'} strokeWidth="2" strokeLinecap="round" />
                <line x1="8" y1="23" x2="16" y2="23" stroke={voice.isListening ? 'white' : 'var(--text-2)'} strokeWidth="2" strokeLinecap="round" />
              </svg>
            </motion.button>
          )}

          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={voice.isListening
              ? (language === 'rw' ? 'Iri kumva...' : 'Listening...')
              : tr.chatPlaceholder}
            rows={1}
            className="flex-1 resize-none rounded-2xl px-4 py-3 text-sm outline-none transition-all"
            style={{
              background: voice.isListening ? '#FFF5F8' : 'var(--bg-input)',
              color: 'var(--text-1)',
              border: `1.5px solid ${voice.isListening ? '#E9357A40' : 'var(--border-1)'}`,
              maxHeight: 100,
              lineHeight: 1.55,
            }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 100) + 'px';
            }}
          />

          <motion.button
            whileTap={{ scale: 0.88 }}
            whileHover={activeInput.trim() && !isLoading ? { scale: 1.05 } : {}}
            onClick={() => handleSend()}
            disabled={!activeInput.trim() || isLoading}
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all"
            style={{
              background: activeInput.trim() && !isLoading
                ? 'linear-gradient(135deg, #1a4731, #2d6a4f)'
                : 'var(--bg-muted)',
              boxShadow: activeInput.trim() ? '0 4px 16px rgba(26,71,49,0.3)' : 'none',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M22 2L11 13" stroke={activeInput.trim() ? '#fff' : 'var(--text-3)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke={activeInput.trim() ? '#fff' : 'var(--text-3)'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.button>
        </div>

        <p className="text-center text-xs mt-2" style={{ color: 'var(--text-4)' }}>
          {voice.isSupported ? tr.voiceHintMic : tr.voiceHint}
        </p>
      </div>
    </div>
  );
}
