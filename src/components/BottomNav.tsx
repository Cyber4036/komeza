import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { t } from '../lib/i18n';
import type { Screen } from '../types';

const NAV_ITEMS: {
  screen: Screen;
  emoji: string;
  key: keyof typeof t.en;
}[] = [
  { screen: 'home',     emoji: '✅', key: 'home'   },
  { screen: 'chat',     emoji: '💬', key: 'chat'   },
  { screen: 'insights', emoji: '📊', key: 'trends' },
  { screen: 'brief',    emoji: '📄', key: 'report' },
];

export default function BottomNav() {
  const { state, dispatch } = useApp();
  const { screen, language } = state;
  const tr = t[language];

  return (
    /* Hidden on md+ — desktop users navigate via the top navbar */
    <div
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 md:hidden"
      style={{ width: 'calc(100% - 32px)', maxWidth: 380 }}
    >
      <div
        className="flex items-center justify-around px-2 py-2 rounded-[28px]"
        style={{
          background: 'var(--bg-card)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid var(--border-2)',
        }}
      >
        {NAV_ITEMS.map((item) => {
          const active = screen === item.screen;
          return (
            <motion.button
              key={item.screen}
              onClick={() => dispatch({ type: 'SET_SCREEN', payload: item.screen })}
              whileTap={{ scale: 0.88 }}
              className="flex flex-col items-center gap-0.5 flex-1 py-2 px-1 rounded-[22px] relative transition-colors"
              style={{
                background: active ? 'var(--nav-active-bg)' : 'transparent',
              }}
            >
              {/* Active indicator dot */}
              {active && (
                <motion.div
                  layoutId="nav-dot"
                  className="absolute -top-px left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full"
                  style={{ background: 'var(--nav-active-color)' }}
                  transition={{ type: 'spring', stiffness: 450, damping: 38 }}
                />
              )}

              <motion.span
                className="text-[20px] leading-none"
                animate={active ? { y: [-1, 0] } : { y: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              >
                {item.emoji}
              </motion.span>

              <span
                className="text-[10px] font-semibold leading-none"
                style={{ color: active ? 'var(--nav-active-color)' : 'var(--text-3)' }}
              >
                {tr[item.key]}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
