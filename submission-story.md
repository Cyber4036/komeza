# Komeza — Project Story

## Inspiration

*Komeza* means **to persist, to continue, to thrive** in Kinyarwanda. The name came before the app did — because the word already captured everything we wanted for the people who would use it.

The starting point was a number that is hard to sit with: according to the 2018 Rwanda Mental Health Survey, **1 in 5 people in Rwanda** meets the criteria for a mental disorder — a prevalence of

$$P(\text{disorder}) = 20.49\%$$

which exceeds the global average. Among young people specifically, depression prevalence ranges from $9.5\%$ to $16.8\%$, climbing higher for youth navigating chronic illness or trauma. Globally, the WHO estimates that **1 in 7 adolescents (ages 10–19)** lives with a diagnosable mental health condition, making it the leading cause of disability in that age group.

The gap between need and access is where this project began. Rwanda has only **16 psychiatrists** for a population of nearly 14 million:

$$\text{Psychiatrist density} = \frac{16}{13{,}800{,}000} \approx 0.06 \text{ per } 100{,}000 \text{ people}$$

The country trains only $3$–$4$ psychiatry graduates per year. Despite this, only **5.6%** of those who need mental health support ever reach formal care:

$$P(\text{seeking care} \mid \text{need}) = 5.6\%$$

The barrier is not always cost or geography — it is stigma, unfamiliarity with clinical language, and the absence of a first step that feels human rather than medical.

We built Komeza to be that first step.

---

## What We Built

Komeza is an AI-powered wellness companion designed specifically for Rwandan youth. It meets users where they actually are — not in a clinic, not filling out a DSM checklist, but through the body. Each day, users rate how their energy, sleep, mood, and physical comfort feel on a simple 1–5 scale. That takes under a minute.

From there, they can talk to Komeza AI — powered by Claude — in English or Kinyarwanda. The AI does not behave like a chatbot. It responds like a caring friend: naming the specific thing the user shared, validating it before anything else, and asking one human question. The somatic check-in scores are passed silently as background context, so the AI has awareness without making the conversation feel like a medical intake.

The app also surfaces wellness trends over 7 or 30 days using line charts, generates a downloadable weekly health brief (PDF) that a user could share with a clinician, and — critically — scans every message for crisis keywords in both English and Kinyarwanda. On detection, the app immediately surfaces the **114 Rwanda mental health hotline**, which is free and available 24/7.

All data stays on the device by default. Google sign-in via Firebase unlocks optional cloud sync across devices, but users who want full privacy never have to create an account.

---

## How We Built It

The stack is deliberately lean:

- **React 19 + TypeScript + Vite** — fast iteration, strong type safety
- **Tailwind CSS v4** — mobile-first, constrained to a ~390px shell to match how Rwandan youth primarily access the internet (on phones)
- **Framer Motion** — smooth screen transitions that make the app feel considered, not clinical
- **Claude (`claude-sonnet-4-5`)** via a Vercel serverless function — the API key never reaches the browser
- **Firebase Auth + Firestore** — optional Google sign-in and cross-device sync
- **Recharts + jsPDF** — trend visualisation and the downloadable health brief
- **i18n built from scratch** — a flat key-value system for `en` and `rw`, with Kinyarwanda as a first-class language from day one, not an afterthought

The AI system prompt was the most carefully designed part of the project. We defined the difference between a "wrong" response (pivoting to wellness scores, using clinical language) and a "right" response (naming the user's exact situation, asking one specific question) through worked examples directly in the prompt. The check-in scores are injected as *silent background context* — available if needed, never referenced unless the user brings them up.

---

## Challenges

**Getting the AI tone right** was the hardest problem. Early versions of the system prompt produced responses that felt like a wellness app — generic validation, pivoting to habits and self-care. We iterated extensively, using concrete counterexamples in the prompt itself until the model consistently responded with the specificity of a real friend rather than the generality of a product.

**Kinyarwanda** presented a genuine challenge. There is no off-the-shelf i18n library that handles Kinyarwanda gracefully, and machine translation is unreliable for a language with significant cultural nuance. We built translation from the ground up, treating `rw` as a first-class locale from the start — every UI string is keyed, and the build fails if any key is missing in either language.

**The crisis detection balance** — between catching genuine distress and not triggering on ordinary conversation — required careful tuning of the keyword lists in both languages. We erred on the side of sensitivity: a false positive that surfaces the 114 hotline costs a moment of friction. A missed crisis costs far more.

**Privacy vs. continuity**: most wellness apps assume cloud storage. We designed the opposite default — localStorage only, with cloud sync as an opt-in. This meant building two parallel data layers (`src/lib/storage.ts` for local, `src/lib/firestore.ts` for cloud) that merge cleanly when a user signs in.

---

## What We Learned

Building Komeza clarified something important: **the interface is the intervention**. The technology is not what makes this meaningful — Claude's API is one function call. What matters is the decision to use somatic language instead of clinical language, to put Kinyarwanda on equal footing with English, to make the first screen a body check-in instead of a symptom questionnaire.

Those are design decisions, and they required understanding the specific cultural context of Rwandan youth: the weight that family reputation carries, the way community belonging shapes identity, the deep stigma around anything that sounds like a psychiatric label.

We also learned that AI companions in mental health contexts demand a level of prompt discipline that most applications don't. The difference between a response that helps and one that harms is often a single sentence. That responsibility is not abstract — it is the entire point.

---

*Built at Rwanda Hackathon 2026. Powered by Claude AI. Deployed on Vercel.*
