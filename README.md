# Komeza — AI Wellness Companion

> *Komeza* means **to persist, to continue, to thrive** in Kinyarwanda.

An AI-powered wellness companion built for Rwandan youth — meeting users through how their body feels, not clinical labels. Komeza helps track daily somatic check-ins, surfaces wellness patterns over time, and provides a warm, conversational space powered by Claude AI.

**Live:** [komeza-health.vercel.app](https://komeza-health.vercel.app)

---

## What It Does

| Feature | Description |
|---|---|
| **Daily Check-In** | Rate energy, sleep, mood, and body comfort (1–5) in under a minute |
| **AI Chat** | Claude AI responds like a caring friend — in English or Kinyarwanda — to what the user actually shares, not just their scores |
| **Insights** | Line charts showing wellness trends over 7 or 30 days |
| **Health Brief** | Weekly summary with averages, downloadable as a PDF to share with a clinician |
| **Crisis Support** | Keyword detection routes users to the 114 Rwanda mental health hotline immediately |
| **Privacy-first** | All data stays on the device via localStorage — nothing sent to a server |

---

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS v4
- **Animation:** Framer Motion
- **Charts:** Recharts
- **PDF:** jsPDF + html2canvas
- **AI:** Claude Sonnet (`claude-sonnet-4-5`) via Anthropic API
- **Deployment:** Vercel (serverless function proxies the API key)

---

## Architecture

Single-page React app — no router. Navigation is a discriminated union in `AppState.screen`:

```
onboarding → home → chat → insights → brief
                                    ↘ safety (crisis overlay, always on top)
```

**State** lives in `src/context/AppContext.tsx` (`useReducer` + Context). All localStorage reads/writes happen in the reducer or on initial load via `src/lib/storage.ts`.

**AI Security** — the Anthropic API key never reaches the browser. All Claude requests go through `api/chat.ts`, a Vercel serverless function that holds `ANTHROPIC_API_KEY` server-side.

---

## Local Development

### Prerequisites
- Node.js 18+
- Vercel CLI (`npm i -g vercel`)

### Setup

```bash
git clone https://github.com/danielstriver/komeza.git
cd komeza
npm install
```

### Running (with real AI)

Vercel CLI is required to run the `/api/chat` serverless function locally:

```bash
# 1. Add your key to .env.local
cp .env.example .env.local
# then edit .env.local and set ANTHROPIC_API_KEY=sk-ant-...

# 2. Start the full stack
vercel dev
```

App runs at **http://localhost:3000**

> Without an API key the app runs in **demo mode** — scripted responses cycle through a set of pre-written replies with a simulated delay.

### Without Vercel CLI (UI only)

```bash
npm run dev   # http://localhost:5173 — demo mode only
```

---

## Environment Variables

| Variable | Where | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | Vercel project settings / `.env.local` | Server-side only — never exposed to the browser |

> Do **not** prefix with `VITE_`. That would bake the key into the JS bundle.

---

## Commands

```bash
npm run dev      # Vite dev server (demo mode, no API)
npm run build    # Type-check + production build
npm run lint     # ESLint
npm run preview  # Serve production build locally
vercel dev       # Full stack with real AI (requires .env.local)
vercel --prod    # Deploy to production
```

---

## Key Conventions

- `bodyPain` is **inverted** for wellness scoring — `1` = no pain (good), `5` = severe pain (bad)
- One entry per calendar day — saves merge on existing date
- Chat history capped at 50 messages, entries at 90 days
- Demo seed data generated on first load if no entries exist
- i18n: flat key-value in `src/lib/i18n.ts` — `en` is source of truth, `rw` must have every key or the build fails

---

## Crisis & Safety

Komeza is **not a medical device**. It is a wellness companion.

- Every user message is scanned for crisis keywords (English + Kinyarwanda)
- On match, `SafetyScreen` overlays immediately with **114** as the primary CTA
- The 114 Rwanda mental health hotline is free and available 24/7

---

## Built By

Daniel — Rwanda Hackathon 2026  
Powered by [Claude AI](https://anthropic.com) · Deployed on [Vercel](https://vercel.com)
