import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { t } from '../lib/i18n';
import type { WellnessEntry } from '../types';

const SERIES = [
  { key: 'energy',    color: '#FF8C42', label_en: 'Energy',     label_rw: 'Imbaraga' },
  { key: 'sleep',     color: '#7C5CBF', label_en: 'Sleep',      label_rw: 'Ibitotsi'     },
  { key: 'mood',      color: '#E9357A', label_en: 'Mood',       label_rw: 'Akanyamuneza' },
  { key: 'bodyPain',  color: '#3B82F6', label_en: 'Body Pain',  label_rw: 'Ububabare'},
];

function buildChartData(entries: WellnessEntry[], days: number) {
  const sliced = entries.slice(0, days).reverse();
  return sliced.map((e) => ({
    date: new Date(e.date + 'T12:00:00').toLocaleDateString('en-RW', { weekday: 'short', day: 'numeric' }),
    energy: e.ratings.energy,
    sleep: e.ratings.sleep,
    mood: e.ratings.mood,
    bodyPain: e.ratings.bodyPain,
  }));
}

function buildObservations(entries: WellnessEntry[], lang: 'en' | 'rw'): string[] {
  const week = entries.slice(0, 7);
  if (week.length < 3) return [];

  const avg = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;
  const energies = week.map((e) => e.ratings.energy);
  const sleeps = week.map((e) => e.ratings.sleep);
  const moods = week.map((e) => e.ratings.mood);
  const pains = week.map((e) => e.ratings.bodyPain);
  const painDays = pains.filter((p) => p >= 3).length;

  const obs: string[] = [];

  if (avg(energies) < 2.8) {
    obs.push(lang === 'rw'
      ? '⚡ Imbaraga zawe zagaragaye nke mu cyumweru gishize. Reba uburyo bwo kuryama neza no kurya neza.'
      : '⚡ Your energy has been consistently low this week. Rest and nutrition may help.');
  } else if (avg(energies) >= 4) {
    obs.push(lang === 'rw'
      ? '⚡ Imbaraga nziza! Komeza ugumye muri iyi miterere nziza.'
      : '⚡ Strong energy week! Keep up whatever you are doing.');
  }

  if (avg(sleeps) < 3) {
    obs.push(lang === 'rw'
      ? '🌙 Ibitotsi byawe ntibyari bihagije. Uburyo bwo gutuza mbere yo guturika bushobora gufasha.'
      : '🌙 Sleep quality has been below average. A wind-down routine before bed may help.');
  }

  if (avg(moods) < 2.5) {
    obs.push(lang === 'rw'
      ? '☀️ Akanyamuneza kawe kagaragaye nke. Iyi raporo irashobora kufasha muganga wawe kumva ibintu byinshi.'
      : '☀️ Mood scores were notably low. Consider sharing this brief with a health professional.');
  }

  if (painDays >= 3) {
    obs.push(lang === 'rw'
      ? `🫂 Ububabare bw'umubiri bwaravuzwe iminsi ${painDays} mu 7. Bifite akamaro kuvuga na muganga.`
      : `🫂 Body discomfort was reported on ${painDays} of the last 7 days — worth monitoring.`);
  }

  const lowEnergyThursdays = week.filter((e) => {
    const d = new Date(e.date + 'T12:00:00').getDay();
    return d === 4 && e.ratings.energy <= 2;
  });
  if (lowEnergyThursdays.length > 0) {
    obs.push(lang === 'rw'
      ? '📊 Imbaraga zawe zigaragara nke ku wa kane — hano hashobora kuba imiterere ifite akamaro.'
      : '📊 Your energy tends to dip on Thursdays — there may be a pattern worth exploring.');
  }

  if (!obs.length) {
    obs.push(lang === 'rw'
      ? '✨ Ubuzima bwawe bwagaragaye neza muri iki cyumweru. Komeza!'
      : '✨ Your wellness looks balanced this week. Keep going!');
  }

  return obs;
}

export default function InsightsScreen() {
  const { state } = useApp();
  const { language, entries } = state;
  const tr = t[language];
  const [days, setDays] = useState<7 | 30>(7);

  const data = buildChartData(entries, days);
  const observations = buildObservations(entries, language);

  const avgOf = (key: keyof WellnessEntry['ratings']) => {
    const week = entries.slice(0, 7);
    if (!week.length) return 0;
    return +(week.reduce((s, e) => s + e.ratings[key], 0) / week.length).toFixed(1);
  };

  const stats = [
    { emoji: '⚡', value: avgOf('energy'), label: tr.energy, color: '#FF8C42' },
    { emoji: '🌙', value: avgOf('sleep'),  label: tr.sleep,  color: '#7C5CBF' },
    { emoji: '☀️', value: avgOf('mood'),   label: tr.mood,   color: '#E9357A' },
    { emoji: '🫂', value: avgOf('bodyPain'), label: tr.bodyPain, color: '#3B82F6' },
  ];

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: 'var(--bg-app)', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)' }}>
      {/* Header */}
      <div
        className="px-6 pb-6"
        style={{
          background: 'linear-gradient(140deg, #0d2e1c, #1a4731)',
          paddingTop: 'max(56px, calc(env(safe-area-inset-top, 0px) + 12px))',
        }}
      >
        <h1 className="text-2xl font-bold mb-1" style={{ color: '#fff' }}>
          {tr.insightsTitle}
        </h1>
        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
          {tr.basedOnCheckins}
        </p>
      </div>

      {entries.length < 2 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-20 text-center">
          <div className="text-5xl mb-4">📊</div>
          <p className="text-base" style={{ color: 'var(--text-2)' }}>{tr.noDataYet}</p>
        </div>
      ) : (
        <div className="px-4 py-5 space-y-5">
          {/* 7-day stat pills */}
          <div className="grid grid-cols-2 gap-3">
            {stats.map((s) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-2xl p-4 flex items-center gap-3 transition-transform hover:scale-[1.02]"
                style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0"
                  style={{ background: s.color + '18' }}
                >
                  {s.emoji}
                </div>
                <div>
                  <div className="text-xl font-bold leading-none" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>{s.label}</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Range toggle */}
          <div className="flex gap-2">
            {([7, 30] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                style={{
                  background: days === d ? '#1a4731' : 'var(--bg-card)',
                  color: days === d ? '#fff' : 'var(--text-2)',
                  border: `1.5px solid ${days === d ? '#1a4731' : 'var(--border-1)'}`,
                }}
              >
                {d === 7 ? tr.last7days : tr.last30days}
              </button>
            ))}
          </div>

          {/* Chart */}
          {data.length > 1 && (
            <div className="rounded-3xl p-4" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
              <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-1)' }}>
                {tr.dailyTrends}
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                  <defs>
                    {SERIES.map((s) => (
                      <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={s.color} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={s.color} stopOpacity={0.02} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-2)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--text-3)' }} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 10, fill: 'var(--text-3)' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-2)', borderRadius: 12, fontSize: 12, color: 'var(--text-1)' }}
                    labelStyle={{ color: 'var(--text-1)', fontWeight: 600 }}
                  />
                  {SERIES.map((s) => (
                    <Area
                      key={s.key}
                      type="monotone"
                      dataKey={s.key}
                      name={language === 'rw' ? s.label_rw : s.label_en}
                      stroke={s.color}
                      strokeWidth={2}
                      fill={`url(#grad-${s.key})`}
                      dot={false}
                      activeDot={{ r: 4, strokeWidth: 0 }}
                    />
                  ))}
                </AreaChart>
              </ResponsiveContainer>

              {/* Legend */}
              <div className="flex flex-wrap gap-3 mt-3 justify-center">
                {SERIES.map((s) => (
                  <div key={s.key} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ background: s.color }} />
                    <span className="text-xs" style={{ color: 'var(--text-2)' }}>
                      {language === 'rw' ? s.label_rw : s.label_en}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pattern observations */}
          {observations.length > 0 && (
            <div className="rounded-3xl p-5" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
              <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-1)' }}>
                {tr.patternTitle}
              </p>
              <div className="space-y-3">
                {observations.map((obs, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="text-sm leading-relaxed py-3 px-4 rounded-2xl"
                    style={{ background: 'var(--bg-app)', color: 'var(--text-1)' }}
                  >
                    {obs}
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
