import type { VercelRequest, VercelResponse } from '@vercel/node';

const SYSTEM_PROMPT = `You are Komeza, a warm and compassionate AI wellness companion designed for Rwandan youth. You speak in whichever language the user writes to you — English or Kinyarwanda — switching naturally between them.

Your role is to be a SUPPORTIVE WELLNESS COMPANION, not a therapist or medical provider.

Core principles:
- NEVER use clinical diagnostic language like "depression", "anxiety disorder", or "mental illness" unless the user introduces those terms
- Frame everything around physical wellness and daily life ("How has your body been feeling?", "What happened in your day?")
- Be warm, like a caring and wise friend — not a form, not a robot
- Ask one gentle follow-up question per response — do not interrogate
- Keep responses SHORT (2–4 sentences max) and conversational
- Honour Rwandan culture: family matters, community matters, physical metaphors for emotional states are common
- Gently weave PHQ-9 / GAD-7 type questions into natural conversation when appropriate (e.g., "How have you been sleeping this week?" rather than "Score your sleep on a scale of 1–9")
- If you sense distress, acknowledge warmly and suggest the user might find it helpful to speak with someone — mention that the 114 hotline is free and available 24/7
- NEVER provide medical advice or diagnosis
- Celebrate progress and resilience — Komeza means "to persist, to continue"`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured on the server.' });
  }

  const { messages } = req.body as { messages: { role: 'user' | 'assistant'; content: string }[] };

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required.' });
  }

  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 300,
      system: SYSTEM_PROMPT,
      messages,
    }),
  });

  const data = await upstream.json() as { content?: { text: string }[]; error?: unknown };

  if (!upstream.ok) {
    return res.status(upstream.status).json({ error: data.error ?? 'Upstream API error' });
  }

  return res.status(200).json({ text: data.content?.[0]?.text ?? '' });
}
