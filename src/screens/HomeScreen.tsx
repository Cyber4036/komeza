import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { FIREBASE_CONFIGURED } from '../lib/firebase';
import { t } from '../lib/i18n';
import HowItWorksModal from '../components/HowItWorksModal';
import type { SomaticRatings } from '../types';

const CATEGORIES: {
  key: keyof SomaticRatings;
  emoji: string;
  color: string;
  bg: string;
  lowKey: keyof typeof t.en;
  highKey: keyof typeof t.en;
}[] = [
  { key: 'energy',   emoji: '⚡', color: '#FF8C42', bg: '#FFF4EE', lowKey: 'energyLow', highKey: 'energyHigh' },
  { key: 'sleep',    emoji: '🌙', color: '#7C5CBF', bg: '#F4F0FB', lowKey: 'sleepPoor', highKey: 'sleepGreat' },
  { key: 'mood',     emoji: '☀️', color: '#E9357A', bg: '#FFF0F5', lowKey: 'moodLow',   highKey: 'moodHigh'   },
  { key: 'bodyPain', emoji: '🫂', color: '#3B82F6', bg: '#EFF6FF', lowKey: 'painNone',  highKey: 'painSevere' },
];

// Dark-mode-aware pastel backgrounds for category icons
const CAT_BG_DARK: Record<string, string> = {
  energy:   'rgba(255,140,66,0.15)',
  sleep:    'rgba(124,92,191,0.15)',
  mood:     'rgba(233,53,122,0.15)',
  bodyPain: 'rgba(59,130,246,0.15)',
};

function getGreeting(lang: 'en' | 'rw'): string {
  const h = new Date().getHours();
  const key = h < 12 ? 'greeting_morning' : h < 17 ? 'greeting_afternoon' : 'greeting_evening';
  return t[lang][key];
}

function computeStreak(entries: { date: string }[]): number {
  if (!entries.length) return 0;
  const today = new Date().toISOString().split('T')[0];
  const dates = new Set(entries.map((e) => e.date));
  let streak = 0;
  let d = new Date();
  while (true) {
    const key = d.toISOString().split('T')[0];
    if (key === today || dates.has(key)) {
      if (key === today && !dates.has(key)) { d.setDate(d.getDate() - 1); continue; }
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

const DOT_LABELS = [1, 2, 3, 4, 5];

export default function HomeScreen() {
  const { state, dispatch } = useApp();
  const { user, signOut } = useAuth();
  const { language, currentRatings, entries, darkMode } = state;
  const tr = t[language];
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);

  const allRated = CATEGORIES.every((c) => currentRatings[c.key] !== undefined);
  const ratedCount = CATEGORIES.filter((c) => currentRatings[c.key] !== undefined).length;
  const streak = useMemo(() => computeStreak(entries), [entries]);

  const todayDone = entries[0]?.date === new Date().toISOString().split('T')[0];

  function handleRate(category: keyof SomaticRatings, value: number) {
    dispatch({ type: 'SET_RATING', payload: { category, value } });
  }

  function handleContinue() {
    dispatch({ type: 'SAVE_ENTRY' });
  }

  return (
    <>
      <div className="flex-1 overflow-y-auto" style={{ background: 'var(--bg-app)', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)' }}>
        {/* Header */}
        <div
          className="px-6 pb-7 relative overflow-hidden"
          style={{
            background: 'linear-gradient(140deg, #0d2e1c 0%, #1a4731 55%, #2d6a4f 100%)',
            paddingTop: 'max(56px, calc(env(safe-area-inset-top, 0px) + 12px))',
          }}
        >
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-[0.12]"
            style={{ background: 'radial-gradient(circle, #74C69D, transparent)', transform: 'translate(30%,-30%)' }} />

          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold" style={{ color: '#74C69D' }}>
                {getGreeting(language)} 👋
              </p>
              <div className="flex items-center gap-2">
                {/* Dark mode toggle */}
                <button
                  onClick={() => dispatch({ type: 'TOGGLE_DARK_MODE' })}
                  className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110"
                  style={{ background: 'rgba(255,255,255,0.12)' }}
                  title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  <span className="text-base leading-none">{darkMode ? '☀️' : '🌙'}</span>
                </button>

                {/* User avatar + sign-out — mobile only, shown when Firebase auth is active */}
                {FIREBASE_CONFIGURED && user && (
                  <button
                    onClick={signOut}
                    className="md:hidden flex items-center gap-1.5 pl-0.5 pr-2.5 py-0.5 rounded-full transition-all hover:scale-105 active:scale-95"
                    style={{ background: 'rgba(255,255,255,0.12)' }}
                    title={language === 'rw' ? 'Sohoka' : 'Sign out'}
                  >
                    {user.photoURL ? (
                      <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{ background: 'rgba(255,255,255,0.25)', color: '#fff' }}>
                        {(user.displayName ?? user.email ?? 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.8)' }}>
                      {language === 'rw' ? 'Sohoka' : 'Sign out'}
                    </span>
                  </button>
                )}

                {/* Streak badge */}
                {streak > 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, delay: 0.3 }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                    style={{ background: 'rgba(233,167,32,0.2)', border: '1px solid rgba(233,167,32,0.35)' }}
                  >
                    <span className="text-sm">🔥</span>
                    <span className="text-xs font-bold" style={{ color: '#E9A720' }}>
                      {streak} {streak === 1 ? tr.streakDay : tr.streakDays}
                    </span>
                  </motion.div>
                )}
              </div>
            </div>

            <h1 className="text-xl font-bold mb-1" style={{ color: '#fff' }}>
              {tr.checkInTitle}
            </h1>

            <div className="flex items-center justify-between">
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                {tr.checkInSub}
              </p>
              {/* How it works link */}
              <button
                onClick={() => setHowItWorksOpen(true)}
                className="text-xs font-semibold flex items-center gap-1 px-2 py-1 rounded-lg transition-all hover:bg-white/10 shrink-0 ml-3"
                style={{ color: '#74C69D' }}
              >
                <span>ⓘ</span>
                <span>{tr.howItWorks}</span>
              </button>
            </div>
          </motion.div>

          {/* Progress bar */}
          {ratedCount > 0 && ratedCount < 4 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.12)', height: 4 }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: '#E9A720' }}
                animate={{ width: `${(ratedCount / 4) * 100}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </motion.div>
          )}

          {/* All done badge */}
          <AnimatePresence>
            {allRated && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl w-fit"
                style={{ background: 'rgba(116,198,157,0.2)', border: '1px solid rgba(116,198,157,0.35)' }}
              >
                <span>✨</span>
                <span className="text-xs font-semibold" style={{ color: '#74C69D' }}>
                  {tr.allDone}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Today already logged */}
        {todayDone && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-4 mt-4 px-4 py-3 rounded-2xl flex items-center gap-3"
            style={{ background: '#EEF9F1', border: '1px solid #74C69D30' }}
          >
            <span className="text-xl">✅</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: '#1a4731' }}>{tr.todayLogged}</p>
              <button
                onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'chat' })}
                className="text-xs font-medium mt-0.5 hover:underline"
                style={{ color: '#2d6a4f' }}
              >
                {tr.continueChat} →
              </button>
            </div>
          </motion.div>
        )}

        {/* Category cards */}
        <div className="px-4 pt-5 flex flex-col gap-4">
          {CATEGORIES.map((cat, idx) => {
            const selected = currentRatings[cat.key];
            return (
              <motion.div
                key={cat.key}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.07, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
                className="rounded-3xl p-5"
                style={{
                  background: 'var(--bg-card)',
                  border: `1.5px solid ${selected ? cat.color + '35' : 'var(--border-2)'}`,
                  boxShadow: selected ? `0 4px 24px ${cat.color}18` : 'var(--shadow-card)',
                  transition: 'border-color 0.2s, box-shadow 0.2s',
                }}
              >
                {/* Category header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl"
                      style={{ background: darkMode ? CAT_BG_DARK[cat.key] : cat.bg }}
                      animate={selected ? { scale: [1, 1.1, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      {cat.emoji}
                    </motion.div>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>
                        {tr[cat.key]}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--text-4)' }}>
                        {selected
                          ? `${selected}/5`
                          : tr.tapToRate}
                      </p>
                    </div>
                  </div>

                  <AnimatePresence>
                    {selected !== undefined && (
                      <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{ background: cat.color, color: '#fff' }}
                      >
                        {selected}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Rating dots */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] w-14 leading-tight text-right" style={{ color: 'var(--text-4)' }}>
                    {tr[cat.lowKey]}
                  </span>
                  <div className="flex gap-2.5 flex-1 justify-center">
                    {DOT_LABELS.map((val) => {
                      const isSelected = selected === val;
                      const isFilled = selected !== undefined && selected >= val;
                      return (
                        <motion.button
                          key={val}
                          whileTap={{ scale: 0.78 }}
                          whileHover={{ scale: 1.08 }}
                          onClick={() => handleRate(cat.key, val)}
                          className="w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm transition-all relative overflow-hidden"
                          style={{
                            background: isSelected ? cat.color : isFilled ? cat.color + '22' : 'var(--bg-muted)',
                            color: isSelected ? '#fff' : isFilled ? cat.color : 'var(--text-3)',
                            border: isSelected ? `2px solid ${cat.color}` : '2px solid transparent',
                          }}
                        >
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 2 }}
                              className="absolute inset-0 rounded-full"
                              style={{ background: cat.color + '30' }}
                            />
                          )}
                          <span className="relative z-10">{val}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                  <span className="text-[10px] w-14 leading-tight" style={{ color: 'var(--text-4)' }}>
                    {tr[cat.highKey]}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="px-4 pt-6 pb-2">
          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={allRated ? { scale: 1.01 } : {}}
            onClick={handleContinue}
            disabled={!allRated}
            className="w-full py-4 rounded-2xl text-base font-bold transition-all relative overflow-hidden"
            style={{
              background: allRated ? 'linear-gradient(135deg, #1a4731, #2d6a4f)' : 'var(--bg-disabled)',
              color: allRated ? '#fff' : 'var(--text-3)',
              boxShadow: allRated ? '0 8px 28px rgba(26,71,49,0.32)' : 'none',
            }}
          >
            {allRated && (
              <motion.div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.07) 50%, transparent 100%)' }}
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 1.5 }}
              />
            )}
            <span className="relative z-10">
              {allRated ? `${tr.startChat} →` : `${tr.rateAll} (${ratedCount}/4)`}
            </span>
          </motion.button>

          {entries.length > 2 && (
            <button
              onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'insights' })}
              className="w-full mt-3 py-3 rounded-2xl text-sm font-medium transition-all hover:opacity-75"
              style={{ background: 'transparent', color: '#2d6a4f' }}
            >
              {tr.viewInsights} ↗
            </button>
          )}
        </div>
      </div>

      <HowItWorksModal
        open={howItWorksOpen}
        onClose={() => setHowItWorksOpen(false)}
        language={language}
      />
    </>
  );
}
