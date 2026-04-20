import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { FIREBASE_CONFIGURED } from '../lib/firebase';
import HowItWorksModal from './HowItWorksModal';

const FEATURES = [
  { emoji: '🫂', en: 'No mental health labels — start with how your body feels', rw: 'Nta majambo y\'ubuzima bwo mu mutwe — tangira uko umubiri wumva' },
  { emoji: '🤖', en: 'Claude AI listens in English & Kinyarwanda', rw: 'Claude AI iumva mu Cyongereza no mu Kinyarwanda' },
  { emoji: '📊', en: 'Spot patterns in your energy, sleep, and mood over time', rw: 'Reba imiterere y\'imbaraga, itiro, n\'umutima wawe' },
  { emoji: '🔒', en: 'Data stays on your device — nothing sent without your knowledge', rw: 'Amakuru asigara ku gikoresho cyawe gusa' },
];

export default function DesktopLayout({ children }: { children: React.ReactNode }) {
  const { state, dispatch } = useApp();
  const { user, signOut } = useAuth();
  const { language, screen, darkMode } = state;
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen]     = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-desktop)' }}>

        {/* === DESKTOP NAVBAR === */}
        <header
          className="hidden md:flex items-center justify-between px-10 py-4 sticky top-0 z-50 transition-colors"
          style={{
            background: 'var(--bg-desktop-header)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--bg-desktop-border)',
            boxShadow: '0 1px 20px rgba(0,0,0,0.06)',
          }}
        >
          {/* Logo */}
          <button
            onClick={() => dispatch({ type: 'SET_SCREEN', payload: 'home' })}
            className="flex items-center gap-2 group transition-transform hover:scale-105"
          >
            <img src="/images/logo.png" alt="Komeza" className="h-9 w-auto object-contain" />
          </button>

          {/* Nav links */}
          <nav className="hidden lg:flex items-center gap-1">
            {[
              { label: language === 'rw' ? 'Genzura' : 'Check-In',   scr: 'home'     as const },
              { label: language === 'rw' ? 'Ikiganiro' : 'Chat',      scr: 'chat'     as const },
              { label: language === 'rw' ? 'Imiterere' : 'Insights',  scr: 'insights' as const },
              { label: language === 'rw' ? 'Raporo' : 'Report',       scr: 'brief'    as const },
            ].map((item) => (
              <button
                key={item.scr}
                onClick={() => dispatch({ type: 'SET_SCREEN', payload: item.scr })}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                style={{
                  background: screen === item.scr ? 'var(--nav-active-bg)' : 'transparent',
                  color: screen === item.scr ? 'var(--nav-active-color)' : 'var(--text-2)',
                }}
              >
                {item.label}
              </button>
            ))}

            {/* How it works — desktop navbar */}
            <button
              onClick={() => setHowItWorksOpen(true)}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80 flex items-center gap-1.5"
              style={{ color: 'var(--text-3)', background: 'transparent' }}
            >
              <span>ⓘ</span>
              <span>{language === 'rw' ? 'Uko bikorwa' : 'How it works'}</span>
            </button>
          </nav>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* Crisis line */}
            <a
              href="tel:114"
              className="hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
              style={{ background: '#FFF4E6', color: '#C05621', border: '1px solid #FECBA150' }}
            >
              <span>🆘</span>
              <span>{language === 'rw' ? 'Ubufasha vuba: 114' : 'Crisis line: 114'}</span>
            </a>

            {/* Dark mode toggle */}
            <button
              onClick={() => dispatch({ type: 'TOGGLE_DARK_MODE' })}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
              style={{ background: 'var(--bg-muted)', color: 'var(--text-2)', border: '1px solid var(--border-1)' }}
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              <span>{darkMode ? '☀️' : '🌙'}</span>
              <span className="hidden lg:inline text-xs">{darkMode ? 'Light' : 'Dark'}</span>
            </button>

            {/* Language toggle */}
            <button
              onClick={() => dispatch({ type: 'SET_LANGUAGE', payload: language === 'en' ? 'rw' : 'en' })}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
              style={{ background: 'var(--bg-muted)', color: 'var(--brand-text)', border: '1px solid var(--border-1)' }}
            >
              <span>{language === 'en' ? '🇷🇼' : '🇬🇧'}</span>
              <span>{language === 'en' ? 'RW' : 'EN'}</span>
            </button>

            {/* User avatar — only when Firebase is configured and user is signed in */}
            {FIREBASE_CONFIGURED && user && (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-full transition-all hover:scale-105"
                  style={{ background: 'var(--bg-muted)', border: '1.5px solid var(--border-1)' }}
                  title={user.displayName ?? user.email ?? ''}
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName ?? 'User'}
                      className="w-7 h-7 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: 'var(--brand-mid)' }}
                    >
                      {(user.displayName ?? user.email ?? 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <span className="hidden lg:block text-xs font-semibold max-w-[96px] truncate" style={{ color: 'var(--text-1)' }}>
                    {user.displayName?.split(' ')[0] ?? user.email?.split('@')[0]}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-3)' }}>▾</span>
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -4, scale: 0.97 }}
                      transition={{ duration: 0.14 }}
                      className="absolute right-0 top-full mt-2 w-52 rounded-2xl overflow-hidden z-50"
                      style={{
                        background: 'var(--bg-card)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
                        border: '1px solid var(--border-1)',
                      }}
                    >
                      {/* User info */}
                      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border-1)' }}>
                        <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-1)' }}>
                          {user.displayName}
                        </p>
                        <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-3)' }}>
                          {user.email}
                        </p>
                      </div>

                      {/* Sign out */}
                      <button
                        onClick={() => { setUserMenuOpen(false); signOut(); }}
                        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors hover:opacity-75"
                        style={{ color: '#E53E3E' }}
                      >
                        <span>→</span>
                        <span>{language === 'rw' ? 'Sohoka' : 'Sign out'}</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </header>

        {/* === MAIN CONTENT AREA === */}
        <main className="flex-1 flex items-start justify-center md:py-8 md:px-6 lg:px-12 relative">

          {/* Left info panel — desktop only */}
          <motion.aside
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="hidden lg:flex flex-col gap-6 pt-4 mr-8 max-w-xs"
            style={{ width: 260 }}
          >
            {/* Tagline card */}
            <div
              className="rounded-3xl p-6"
              style={{ background: 'linear-gradient(140deg, #0d2e1c, #1a4731)' }}
            >
              <img src="/images/logo.png" alt="Komeza" className="h-10 w-auto object-contain mb-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.92)', padding: '4px 8px' }} />
              <p className="text-sm leading-relaxed mb-4" style={{ color: 'rgba(255,255,255,0.75)' }}>
                {language === 'rw'
                  ? 'Ubufasha mu buzima bwiza bw\'umuturage wo mu Rwanda — bwifashishije AI, nta matiku, nta bwoba.'
                  : 'AI-powered wellness for Rwandan youth — meeting you through how your body feels, not clinical labels.'}
              </p>
              <div className="flex flex-wrap gap-2 mb-5">
                {['Rwanda', 'Claude AI', 'Kinyarwanda'].map((tag) => (
                  <span key={tag} className="px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: 'rgba(255,255,255,0.1)', color: '#74C69D' }}>{tag}</span>
                ))}
              </div>
              {/* How it works CTA — prominent in sidebar */}
              <button
                onClick={() => setHowItWorksOpen(true)}
                className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90"
                style={{ background: 'rgba(233,167,32,0.18)', color: '#E9A720', border: '1px solid rgba(233,167,32,0.3)' }}
              >
                <span>ⓘ</span>
                <span>{language === 'rw' ? 'Uko bikorwa?' : 'How does it work?'}</span>
              </button>
            </div>

            {/* Features list */}
            <div className="rounded-3xl p-5" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-3)' }}>
                {language === 'rw' ? 'Ibintu bishimishije' : 'Why it works'}
              </p>
              <div className="space-y-4">
                {FEATURES.map((f, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <span className="text-lg mt-0.5">{f.emoji}</span>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-2)' }}>
                      {language === 'rw' ? f.rw : f.en}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="rounded-3xl p-5" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-3)' }}>
                {language === 'rw' ? 'Ikibazo cyacu' : 'The gap we bridge'}
              </p>
              <div className="space-y-3">
                {[
                  { val: '1:800k', label: language === 'rw' ? 'Inzobere kuri buri muturage' : 'Psychiatrist per capita' },
                  { val: '74%',   label: language === 'rw' ? 'Rubyiruko rudakizi serivisi' : 'Youth unaware of services' },
                  { val: '6×',    label: language === 'rw' ? 'Banyarwa bita app kuruta kliniki' : 'Prefer app over clinic' },
                ].map((s) => (
                  <div key={s.val} className="flex items-center justify-between">
                    <span className="text-xl font-black" style={{ color: '#E9A720' }}>{s.val}</span>
                    <span className="text-xs text-right ml-3" style={{ color: 'var(--text-2)', maxWidth: 130 }}>{s.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.aside>

          {/* === APP FRAME === */}
          <div
            className="w-full md:rounded-[40px] md:overflow-hidden flex flex-col"
            style={{
              maxWidth: 430,
              minHeight: '100dvh',
              background: 'var(--bg-app)',
              boxShadow: '0 0 0 1px rgba(0,0,0,0.04), 0 24px 80px rgba(0,0,0,0.18)',
            }}
          >
            {children}
          </div>

          {/* Right info panel — desktop only */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="hidden lg:flex flex-col gap-6 pt-4 ml-8"
            style={{ width: 220 }}
          >
            {/* Crisis CTA */}
            <a
              href="tel:114"
              className="block rounded-3xl p-5 text-center transition-transform hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #7F1D1D, #B91C1C)', boxShadow: '0 8px 32px rgba(127,29,29,0.35)' }}
            >
              <div className="text-3xl mb-2">📞</div>
              <div className="text-2xl font-black text-white mb-1">114</div>
              <div className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>
                {language === 'rw' ? 'Inzira y\'ubufasha buntu, amasaha 24/7' : 'Free crisis line, 24/7'}
              </div>
            </a>

            {/* Privacy card */}
            <div className="rounded-3xl p-5" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
              <p className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: 'var(--text-3)' }}>
                {language === 'rw' ? 'Ubwisanzure & umutekano' : 'Privacy & safety'}
              </p>
              <div className="space-y-3 text-xs" style={{ color: 'var(--text-2)' }}>
                {[
                  { icon: '🔒', text: FIREBASE_CONFIGURED ? (language === 'rw' ? 'Amakuru abikwa mu konte yawe bwite' : 'Data synced to your account') : (language === 'rw' ? 'Amakuru ku gikoresho cyawe gusa' : 'Data stays on your device') },
                  { icon: '🚫', text: language === 'rw' ? 'Nta isuzuma rya muganga' : 'No medical diagnosis' },
                  { icon: '🛡️', text: language === 'rw' ? 'Umurongo wa 114 ubikwa hejuru' : 'Crisis line always visible' },
                  { icon: '✅', text: language === 'rw' ? 'Yubahiriza umuco w\'u Rwanda' : 'Culturally designed for Rwanda' },
                ].map((item) => (
                  <div key={item.text} className="flex gap-2 items-start">
                    <span>{item.icon}</span>
                    <span className="leading-relaxed">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Built with badge */}
            <div className="rounded-2xl px-4 py-3 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-1)' }}>
              <p className="text-xs" style={{ color: 'var(--text-3)' }}>
                {language === 'rw' ? 'Yakozwe na' : 'Powered by'}
              </p>
              <p className="text-sm font-bold mt-1" style={{ color: 'var(--brand-text)' }}>Claude AI · Anthropic</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>Rwanda Hackathon 2025</p>
            </div>
          </motion.aside>
        </main>

        {/* === DESKTOP FOOTER === */}
        <footer
          className="hidden md:block px-10 py-6 transition-colors"
          style={{ borderTop: '1px solid var(--bg-desktop-border)', background: 'var(--bg-desktop-header)' }}
        >
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <div className="flex items-center gap-3">
              <img src="/images/logo.png" alt="Komeza" className="h-7 w-auto object-contain" />
              <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                © 2025 · AI Mental Wellness for Rwanda · Built with Claude AI (Anthropic)
              </span>
            </div>
            <div className="flex items-center gap-6 text-xs" style={{ color: 'var(--text-3)' }}>
              <span>{language === 'rw' ? 'Si isuzuma rya muganga' : 'Not a medical device'}</span>
              <span>·</span>
              <a href="tel:114" className="font-semibold hover:underline" style={{ color: '#E9A720' }}>
                {language === 'rw' ? '🆘 Ubufasha: 114' : '🆘 Crisis line: 114'}
              </a>
              <span>·</span>
              <span>Rwanda Hackathon 2025</span>
            </div>
          </div>
        </footer>
      </div>

      <HowItWorksModal
        open={howItWorksOpen}
        onClose={() => setHowItWorksOpen(false)}
        language={language}
      />
    </>
  );
}
