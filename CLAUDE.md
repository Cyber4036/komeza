# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # Vite dev server — demo mode only (no real AI)
npm run build      # Type-check + production build (tsc -b && vite build)
npm run lint       # ESLint
npm run preview    # Serve production build locally
vercel dev         # Full stack with real AI (requires .env.local)
vercel --prod      # Deploy to production
```

No test suite is configured.

## Environment

Copy `.env.example` to `.env.local`.

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | **Server-side only** — never prefix with `VITE_`. Used by `api/chat.ts` (Vercel serverless). |
| `VITE_USE_API=true` | Set this to route chat through `/api/chat` instead of demo mode. Requires `vercel dev`. |
| `VITE_FIREBASE_*` | Six Firebase vars — enables Google sign-in and Firestore cloud sync. Without them the app runs in localStorage-only mode. |

**Demo mode** (`IS_DEMO = import.meta.env.DEV && !import.meta.env.VITE_USE_API`) — cycles through `DEMO_RESPONSES` in `src/lib/claude.ts` with a simulated delay. This is the default when running `npm run dev`.

## Architecture

**Single-page React app** — no router. Navigation is managed through `AppState.screen` (a discriminated union: `onboarding | auth | home | chat | insights | brief | safety`). `App.tsx` switches on this value, wrapping transitions in Framer Motion's `AnimatePresence`.

**State** lives in `src/context/AppContext.tsx` (`useReducer` + Context). All localStorage reads/writes happen in the reducer or on initial load via `src/lib/storage.ts` (five `komeza_*` keys; entries capped at 90 days, chat history at 50 messages).

**Auth & cloud sync** (`src/context/AuthContext.tsx`, `src/lib/firebase.ts`, `src/lib/firestore.ts`): Google sign-in via Firebase Auth. When signed in, wellness entries, chat history, and user profile are synced to Firestore under `users/{uid}/`. `FIREBASE_CONFIGURED` guards all Firebase calls — the app degrades gracefully to localStorage-only when the vars are absent.

**AI integration** (`src/lib/claude.ts` + `api/chat.ts`): The browser POSTs to `/api/chat` (a Vercel serverless function). The function holds `ANTHROPIC_API_KEY` server-side and calls `claude-sonnet-4-5` with `max_tokens: 300`. Today's somatic ratings are sent as `checkInContext` and injected into the system prompt as silent background — the model is instructed not to reference them unless the user brings up that topic.

**Crisis detection** (`src/lib/crisis.ts`): keyword scan on every user message (English + Kinyarwanda lists). On match, dispatches `TRIGGER_CRISIS` which forces the `SafetyScreen` overlay with the 114 Rwanda mental health hotline as primary CTA.

**i18n** (`src/lib/i18n.ts`): flat key-value objects for `en` and `rw`. All UI strings go through `t[language][key]`. `en` is the source of truth — `rw` must have every key. The `Language` type is defined in both `src/types/index.ts` and `src/lib/i18n.ts`; prefer importing from `src/lib/i18n.ts` in files that use `t[lang]`.

**Layout**: `DesktopLayout` centers the mobile shell (~390px) on wide screens. `BottomNav` is shown on all screens except onboarding and auth.

## Key conventions

- `bodyPain` rating is **inverted** for wellness scoring: `1` = no pain (good), `5` = severe pain (bad).
- One entry per calendar day — saves merge on existing date; demo seed data is written on first load if no entries exist.
- Firebase calls are all no-ops when `db`/`auth` is `null` — guard checks are already in place; don't add redundant ones.
- Screens live in `src/screens/`, shared UI in `src/components/`. `useVoice.ts` provides optional speech-input for the chat screen.
