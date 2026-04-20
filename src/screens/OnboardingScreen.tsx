import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { t } from '../lib/i18n';
import HowItWorksModal from '../components/HowItWorksModal';
import type { Language } from '../lib/i18n';

const slide = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

export default function OnboardingScreen() {
  const { dispatch } = useApp();
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState<Language>('en');
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);

  const tr = t[lang];

  function selectLanguage(l: Language) {
    setLang(l);
    dispatch({ type: 'SET_LANGUAGE', payload: l });
  }

  function finish() {
    dispatch({ type: 'COMPLETE_ONBOARDING' });
  }

  return (
    <>
      <div className="min-h-screen flex flex-col" style={{ background: 'linear-gradient(160deg, #0d2e1c 0%, #1a4731 50%, #2d6a4f 100%)' }}>
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #74C69D, transparent)', transform: 'translate(30%, -30%)' }} />
        <div className="absolute bottom-20 left-0 w-48 h-48 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #E9A720, transparent)', transform: 'translate(-30%, 30%)' }} />

        {/* Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 relative z-10">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="step0" {...slide} className="text-center w-full">
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  className="mx-auto mb-8 w-24 h-24 rounded-3xl flex items-center justify-center"
                  style={{ background: 'rgba(233,167,32,0.15)', border: '2px solid rgba(233,167,32,0.3)' }}
                >
                  <span className="text-5xl">🌿</span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="text-6xl font-black tracking-tight mb-2"
                  style={{ color: '#E9A720' }}
                >
                  KOMEZA
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-sm font-medium mb-8 tracking-widest uppercase"
                  style={{ color: '#74C69D' }}
                >
                  {tr.tagline}
                </motion.p>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65 }}
                  className="text-lg leading-relaxed mb-8"
                  style={{ color: 'rgba(255,255,255,0.75)' }}
                >
                  {tr.onboarding1Sub}
                </motion.p>

                {/* Stat pills */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="flex justify-center gap-3 mb-6 flex-wrap"
                >
                  {[
                    { stat: '74%', label: lang === 'rw' ? 'rubyiruko' : 'youth unaware' },
                    { stat: '1:800k', label: lang === 'rw' ? 'inzobere' : 'psychiatrists' },
                    { stat: '6×', label: lang === 'rw' ? 'app vs kliniki' : 'prefer app' },
                  ].map((item) => (
                    <div key={item.stat} className="px-4 py-2 rounded-full text-center" style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}>
                      <div className="text-lg font-bold" style={{ color: '#E9A720' }}>{item.stat}</div>
                      <div className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{item.label}</div>
                    </div>
                  ))}
                </motion.div>

                {/* How it works link */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.9 }}
                  className="mb-8"
                >
                  <button
                    onClick={() => setHowItWorksOpen(true)}
                    className="text-sm font-semibold flex items-center gap-1.5 mx-auto px-4 py-2 rounded-xl transition-all hover:bg-white/10"
                    style={{ color: '#74C69D' }}
                  >
                    <span>ⓘ</span>
                    <span>{t[lang].howItWorks}</span>
                  </button>
                </motion.div>

                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.95 }}
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setStep(1)}
                  className="w-full py-4 rounded-2xl text-lg font-bold transition-all"
                  style={{ background: '#E9A720', color: '#0d2e1c' }}
                >
                  {tr.getStarted} →
                </motion.button>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="step1" {...slide} className="text-center w-full">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="mx-auto mb-8 w-20 h-20 rounded-3xl flex items-center justify-center"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                >
                  <span className="text-4xl">🌍</span>
                </motion.div>

                <h2 className="text-3xl font-bold mb-3" style={{ color: '#fff' }}>
                  {tr.onboarding2Title}
                </h2>
                <p className="text-sm mb-10" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  {t.en.onboarding2Sub}
                </p>

                <div className="flex flex-col gap-4 mb-12">
                  {(['en', 'rw'] as Language[]).map((l) => (
                    <motion.button
                      key={l}
                      whileTap={{ scale: 0.97 }}
                      whileHover={{ scale: 1.01 }}
                      onClick={() => selectLanguage(l)}
                      className="w-full py-5 rounded-2xl flex items-center justify-between px-6 transition-all"
                      style={{
                        background: lang === l ? '#E9A720' : 'rgba(255,255,255,0.08)',
                        border: `2px solid ${lang === l ? '#E9A720' : 'rgba(255,255,255,0.15)'}`,
                        color: lang === l ? '#0d2e1c' : '#fff',
                      }}
                    >
                      <span className="text-2xl">{l === 'en' ? '🇬🇧' : '🇷🇼'}</span>
                      <span className="text-lg font-semibold">
                        {l === 'en' ? 'English' : 'Ikinyarwanda'}
                      </span>
                      {lang === l ? <span className="text-xl">✓</span> : <span className="w-5" />}
                    </motion.button>
                  ))}
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={finish}
                  className="w-full py-4 rounded-2xl text-lg font-bold transition-all"
                  style={{ background: '#E9A720', color: '#0d2e1c' }}
                >
                  {t[lang].getStarted} →
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-2 pb-12 relative z-10">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="rounded-full transition-all"
              style={{
                width: step === i ? 24 : 8,
                height: 8,
                background: step === i ? '#E9A720' : 'rgba(255,255,255,0.3)',
              }}
            />
          ))}
        </div>
      </div>

      <HowItWorksModal
        open={howItWorksOpen}
        onClose={() => setHowItWorksOpen(false)}
        language={lang}
      />
    </>
  );
}
