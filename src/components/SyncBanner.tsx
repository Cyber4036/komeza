import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import type { SyncStatus } from '../types';

type VisibleStatus = Exclude<SyncStatus, 'idle'>;

const CONFIG: Record<VisibleStatus, {
  label: { en: string; rw: string };
  bg: string;
  color: string;
}> = {
  syncing: {
    label: { en: 'Syncing…', rw: 'Guhuza…' },
    bg: 'rgba(82,183,136,0.12)',
    color: '#52b788',
  },
  offline: {
    label: { en: 'Offline — data saved locally', rw: 'Nta interineti — amakuru abitswe hano' },
    bg: 'rgba(233,167,32,0.13)',
    color: '#e9a720',
  },
  error: {
    label: { en: 'Sync failed — will retry automatically', rw: 'Guhuza byanze — bizageragezwa ukundi' },
    bg: 'rgba(220,38,38,0.10)',
    color: '#dc2626',
  },
};

export default function SyncBanner() {
  const { state } = useApp();
  const { syncStatus, language } = state;
  const visible = syncStatus !== 'idle';
  const cfg = visible ? CONFIG[syncStatus as VisibleStatus] : null;

  return (
    <AnimatePresence>
      {visible && cfg && (
        <motion.div
          key={syncStatus}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
          className="flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-medium"
          style={{ background: cfg.bg }}
          role="status"
          aria-live="polite"
        >
          <motion.span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: cfg.color }}
            animate={syncStatus === 'syncing' ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <span style={{ color: cfg.color }}>
            {cfg.label[language]}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
