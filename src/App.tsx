import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import DesktopLayout from './components/DesktopLayout';
import BottomNav from './components/BottomNav';
import OnboardingScreen from './screens/OnboardingScreen';
import HomeScreen from './screens/HomeScreen';
import ChatScreen from './screens/ChatScreen';
import InsightsScreen from './screens/InsightsScreen';
import BriefScreen from './screens/BriefScreen';
import SafetyScreen from './screens/SafetyScreen';
import AuthScreen from './screens/AuthScreen';

const SCREEN_ORDER: Record<string, number> = {
  onboarding: -1,
  home: 0,
  chat: 1,
  insights: 2,
  brief: 3,
  safety: 99,
};

function getTransition(current: string, prev: string | null) {
  if (!prev || prev === 'onboarding' || current === 'safety') {
    return {
      initial: { opacity: 0, y: 18, scale: 0.98 },
      animate: { opacity: 1, y: 0,  scale: 1    },
      exit:    { opacity: 0, y: -12, scale: 0.98 },
    };
  }
  const dir = (SCREEN_ORDER[current] ?? 0) > (SCREEN_ORDER[prev] ?? 0) ? 1 : -1;
  return {
    initial: { opacity: 0, x: dir * 28, scale: 0.98 },
    animate: { opacity: 1, x: 0,        scale: 1    },
    exit:    { opacity: 0, x: dir * -20, scale: 0.98 },
  };
}

let prevScreen: string | null = null;

function AppInner() {
  const { state } = useApp();
  const { screen, crisisDetected } = state;

  if (crisisDetected) return <SafetyScreen />;

  const showNav = screen !== 'onboarding';
  const tr = getTransition(screen, prevScreen);
  prevScreen = screen;

  return (
    <div className="flex flex-col" style={{ minHeight: '100dvh' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={tr.initial}
          animate={tr.animate}
          exit={tr.exit}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          className="flex flex-col flex-1"
        >
          {screen === 'onboarding' && <OnboardingScreen />}
          {screen === 'home'       && <HomeScreen />}
          {screen === 'chat'       && <ChatScreen />}
          {screen === 'insights'   && <InsightsScreen />}
          {screen === 'brief'      && <BriefScreen />}
        </motion.div>
      </AnimatePresence>

      {showNav && <BottomNav />}
    </div>
  );
}

function DataLoader({ children }: { children: React.ReactNode }) {
  const { dataLoaded } = useApp();

  if (!dataLoaded) {
    return (
      <div
        className="flex flex-col items-center justify-center"
        style={{ minHeight: '100dvh', background: 'var(--bg-app)' }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center gap-4"
        >
          <img src="/images/logo.png" alt="Komeza" className="h-14 w-auto object-contain" />
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full"
                style={{ background: 'var(--brand-accent)' }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, authLoading, configured } = useAuth();

  if (authLoading) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ minHeight: '100dvh', background: 'var(--bg-app)' }}
      >
        <motion.img
          src="/images/logo.png"
          alt="Komeza"
          className="h-14 w-auto object-contain"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        />
      </div>
    );
  }

  if (configured && !user) return <AuthScreen />;

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGuard>
        <AppProvider>
          <DataLoader>
            <DesktopLayout>
              <AppInner />
            </DesktopLayout>
          </DataLoader>
        </AppProvider>
      </AuthGuard>
    </AuthProvider>
  );
}
