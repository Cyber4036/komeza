import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const BENEFITS = [
  {
    icon: '☁️',
    en: 'Your data synced across every device',
    rw: "Amakuru yawe ahuza ku bikoresho byose",
  },
  {
    icon: '🔒',
    en: 'Private and encrypted — only you see it',
    rw: "Bihishwe kandi birinzwe — wewe gusa ubibona",
  },
  {
    icon: '📊',
    en: 'Your wellness history, never lost',
    rw: "Amateka yawe y'ubuzima, ntazababara",
  },
];

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export default function AuthScreen() {
  const { signInWithGoogle } = useAuth();
  const [lang, setLang]       = useState<'en' | 'rw'>('en');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const handleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Sign-in failed. Please try again.';
      if (!msg.includes('popup-closed')) setError(msg);
      setLoading(false);
    }
  };

  return (
    <div
      className="flex flex-col min-h-dvh relative overflow-hidden"
      style={{ background: 'var(--bg-app)' }}
    >
      {/* Language toggle */}
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setLang(l => l === 'en' ? 'rw' : 'en')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all hover:scale-105"
          style={{ background: 'var(--bg-muted)', color: 'var(--brand-text)', border: '1px solid var(--border-1)' }}
        >
          <span>{lang === 'en' ? '🇷🇼' : '🇬🇧'}</span>
          <span>{lang === 'en' ? 'RW' : 'EN'}</span>
        </button>
      </div>

      {/* Decorative blobs */}
      <div
        className="absolute top-0 right-0 w-72 h-72 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(82,183,136,0.12) 0%, transparent 70%)',
          transform: 'translate(30%, -30%)',
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-64 h-64 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(233,167,32,0.08) 0%, transparent 70%)',
          transform: 'translate(-30%, 30%)',
        }}
      />

      {/* Main content */}
      <div className="flex flex-col items-center justify-center flex-1 px-6 py-12">

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -16, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8"
        >
          <img
            src="/images/logo.png"
            alt="Komeza"
            className="h-16 w-auto object-contain mx-auto"
            style={{
              filter: 'drop-shadow(0 4px 16px rgba(26,71,49,0.18))',
            }}
          />
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-2"
        >
          <h1 className="text-2xl font-black mb-2" style={{ color: 'var(--text-1)' }}>
            {lang === 'en' ? 'Your wellness journey,' : "Urugendo rwawe rw'ubuzima,"}
          </h1>
          <h1 className="text-2xl font-black" style={{ color: 'var(--brand-accent)' }}>
            {lang === 'en' ? 'personalized.' : 'rwibukwa.'}
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-sm text-center mb-8 mt-3 max-w-xs"
          style={{ color: 'var(--text-2)' }}
        >
          {lang === 'en'
            ? 'Sign in to keep your check-ins, patterns, and chats across all your devices.'
            : "Injira kugirango ubike ibigenzura, imiterere n'ibibazo byawe ku bikoresho byose."}
        </motion.p>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.5 }}
          className="w-full max-w-xs mb-8 space-y-3"
        >
          {BENEFITS.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.34 + i * 0.07, duration: 0.4 }}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border-1)' }}
            >
              <span className="text-xl">{b.icon}</span>
              <span className="text-sm font-medium" style={{ color: 'var(--text-2)' }}>
                {lang === 'en' ? b.en : b.rw}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* Google sign-in button */}
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.55, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-xs"
        >
          <button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-6 rounded-2xl font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: 'var(--bg-card)',
              color: 'var(--text-1)',
              border: '1.5px solid var(--border-1)',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            }}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                {lang === 'en' ? 'Signing in…' : 'Kwinjira…'}
              </span>
            ) : (
              <>
                <GoogleIcon />
                {lang === 'en' ? 'Continue with Google' : 'Komeza na Google'}
              </>
            )}
          </button>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 text-xs text-center"
              style={{ color: '#E53E3E' }}
            >
              {error}
            </motion.p>
          )}
        </motion.div>

        {/* Privacy note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-6 text-xs text-center max-w-xs"
          style={{ color: 'var(--text-3)' }}
        >
          {lang === 'en'
            ? 'Your wellness data is private. We never share or sell it.'
            : "Amakuru yawe y'ubuzima arabikwa. Ntabwo tubisangira cyangwa tubigurana."}
        </motion.p>
      </div>

      {/* Bottom crisis line */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="pb-8 flex justify-center"
      >
        <a
          href="tel:114"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105"
          style={{ background: '#FFF4E6', color: '#C05621', border: '1px solid #FECBA150' }}
        >
          <span>🆘</span>
          <span>{lang === 'en' ? 'Crisis line: 114 (free, 24/7)' : 'Umurongo w\'ubufasha: 114 (buntu, 24/7)'}</span>
        </a>
      </motion.div>
    </div>
  );
}
