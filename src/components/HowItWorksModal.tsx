import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  open: boolean;
  onClose: () => void;
  language: 'en' | 'rw';
}

const STEPS = [
  {
    icon: '🌿',
    color: '#1a4731',
    en: { title: 'Daily Check-In', desc: 'Rate your energy, sleep, mood and body comfort in under a minute. No right or wrong answers.' },
    rw: { title: 'Genzura bya Buri Munsi', desc: 'Suzuma imbaraga, ibitotsi, akanyamuneza n\'ubuzima bw\'umubiri mu minota mike. Nta gisubizo cyiza cyangwa cyabi.' },
  },
  {
    icon: '💬',
    color: '#E9357A',
    en: { title: 'Chat with Komeza', desc: 'Your AI companion listens warmly in English or Kinyarwanda. Share your day, ask questions, no clinical labels.' },
    rw: { title: 'Ganira na Komeza', desc: 'Inshuti yawe ya AI yumva mu Cyongereza no mu Kinyarwanda. Sangira umunsi wawe, nta magambo ya muganga.' },
  },
  {
    icon: '📊',
    color: '#FF8C42',
    en: { title: 'Track Your Patterns', desc: 'After a few days, spot trends in your wellness and download a brief to share with a health provider.' },
    rw: { title: 'Kurikirana Imiterere Yawe', desc: 'Nyuma y\'iminsi mike, reba imiterere y\'ubuzima bwawe. Kurura raporo kugirango usangire na muganga wawe.' },
  },
  {
    icon: '🔒',
    color: '#7C5CBF',
    en: { title: 'Your data stays on this device', desc: 'Nothing is sent without your knowledge. Komeza works offline and never shares your information.' },
    rw: { title: 'Amakuru yasigara ku gikoresho cyawe', desc: 'Nta kintu na kimwe cyoherezwa utabizi. Komeza ikora nta interineti kandi ntisangira amakuru yawe.' },
  },
];

export default function HowItWorksModal({ open, onClose, language }: Props) {
  const l = language;

  const content = (
    <>
      {/* Header */}
      <div className="px-6 pt-5 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-1)' }}>
              {l === 'rw' ? 'Uko bikorwa' : 'How it works'}
            </h2>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>
              {l === 'rw' ? 'Inzira enye zoroshye mu minota mike' : 'Four steps to a clearer picture of your wellness'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:opacity-70"
            style={{ background: 'var(--bg-muted)', color: 'var(--text-2)' }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Steps */}
      <div className="px-6 pb-5 space-y-4">
        {STEPS.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            className="flex gap-4 items-start"
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0"
              style={{ background: step.color + '18', border: `1.5px solid ${step.color}28` }}
            >
              {step.icon}
            </div>
            <div className="flex-1 pt-0.5">
              <p className="font-semibold text-sm" style={{ color: 'var(--text-1)' }}>
                {l === 'rw' ? step.rw.title : step.en.title}
              </p>
              <p className="text-xs leading-relaxed mt-0.5" style={{ color: 'var(--text-2)' }}>
                {l === 'rw' ? step.rw.desc : step.en.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <div className="px-6 pb-7 pt-1">
        <button
          onClick={onClose}
          className="w-full py-4 rounded-2xl text-base font-bold transition-opacity hover:opacity-90"
          style={{
            background: 'linear-gradient(135deg, #1a4731, #2d6a4f)',
            color: '#fff',
            boxShadow: '0 6px 24px rgba(26,71,49,0.3)',
          }}
        >
          {l === 'rw' ? 'Ntoze — Tangira →' : "Got it — let's begin →"}
        </button>
      </div>
    </>
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[59]"
            style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          />

          {/* Desktop: centered modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: 'spring', stiffness: 340, damping: 32 }}
            className="fixed inset-0 z-[60] hidden md:flex items-center justify-center p-6 pointer-events-none"
          >
            <div
              className="w-full max-w-md rounded-3xl overflow-hidden pointer-events-auto"
              style={{ background: 'var(--bg-card)', boxShadow: '0 24px 64px rgba(0,0,0,0.25)' }}
            >
              {content}
            </div>
          </motion.div>

          {/* Mobile: bottom sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full z-[60] rounded-t-[32px] overflow-hidden md:hidden"
            style={{ maxWidth: 430, background: 'var(--bg-card)', boxShadow: '0 -8px 40px rgba(0,0,0,0.2)' }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-4 pb-1">
              <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border-1)' }} />
            </div>
            {content}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
