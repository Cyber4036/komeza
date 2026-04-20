import { jsPDF } from 'jspdf';
import type { WellnessEntry } from '../types';
import type { Language } from './i18n';

function avg(vals: number[]): string {
  if (!vals.length) return '—';
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
}

function ratingLabel(score: number): string {
  if (score >= 4.5) return 'Excellent';
  if (score >= 3.5) return 'Good';
  if (score >= 2.5) return 'Moderate';
  if (score >= 1.5) return 'Low';
  return 'Very Low';
}

export function generateResilienceBrief(
  entries: WellnessEntry[],
  language: Language
): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const weekEntries = entries.slice(0, 7);
  const isRw = language === 'rw';

  const W = doc.internal.pageSize.getWidth();

  // Header background
  doc.setFillColor(26, 71, 49); // #1A4731
  doc.rect(0, 0, W, 45, 'F');

  // Logo text
  doc.setTextColor(233, 167, 32); // gold
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text('KOMEZA', 20, 22);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(isRw ? 'Incamake y\'Ubuzima' : 'Personal Wellness Brief', 20, 32);
  doc.text(isRw ? 'Si isuzuma rya muganga' : 'Not a medical diagnosis', 20, 38);

  // Date
  const dateStr = new Date().toLocaleDateString('en-RW', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(9);
  doc.text(dateStr, W - 20, 38, { align: 'right' });

  // Section: Summary stats
  let y = 58;
  doc.setTextColor(26, 71, 49);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(isRw ? 'Incamake y\'icyumweru (iminsi 7 ishize)' : 'Weekly Snapshot (Last 7 Days)', 20, y);

  y += 8;
  doc.setDrawColor(26, 71, 49);
  doc.setLineWidth(0.5);
  doc.line(20, y, W - 20, y);
  y += 8;

  const energies = weekEntries.map((e) => e.ratings.energy);
  const sleeps = weekEntries.map((e) => e.ratings.sleep);
  const moods = weekEntries.map((e) => e.ratings.mood);
  const pains = weekEntries.map((e) => e.ratings.bodyPain);

  const stats = [
    { label: isRw ? 'Impuzandengo y\'imbaraga' : 'Avg. Energy', value: avg(energies), sub: ratingLabel(parseFloat(avg(energies))) },
    { label: isRw ? 'Impuzandengo y\'ibitotsi' : 'Avg. Sleep Quality', value: avg(sleeps), sub: ratingLabel(parseFloat(avg(sleeps))) },
    { label: isRw ? 'Impuzandengo y\'akanyamuneza' : 'Avg. Mood', value: avg(moods), sub: ratingLabel(parseFloat(avg(moods))) },
    { label: isRw ? "Iminsi y'ububabare" : 'Days with Pain', value: String(pains.filter((p) => p >= 3).length), sub: isRw ? 'mu minsi 7' : 'of 7 days' },
  ];

  const colW = (W - 40) / 4;
  stats.forEach((stat, i) => {
    const x = 20 + i * colW;
    doc.setFillColor(238, 249, 241);
    doc.roundedRect(x, y, colW - 3, 22, 2, 2, 'F');
    doc.setTextColor(26, 71, 49);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(stat.value, x + (colW - 3) / 2, y + 10, { align: 'center' });
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(stat.label, x + (colW - 3) / 2, y + 15, { align: 'center' });
    doc.setTextColor(100, 140, 110);
    doc.text(stat.sub, x + (colW - 3) / 2, y + 20, { align: 'center' });
  });

  y += 32;

  // Daily log table
  doc.setTextColor(26, 71, 49);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(isRw ? 'Ibyanditswe bya buri munsi' : 'Daily Log', 20, y);

  y += 6;
  doc.line(20, y, W - 20, y);
  y += 6;

  const headers = isRw
    ? ['Itariki', 'Imbaraga', 'Ibitotsi', 'Akanyamuneza', 'Ububabare']
    : ['Date', 'Energy', 'Sleep', 'Mood', 'Body Pain'];

  const colWidths = [45, 30, 30, 30, 30];
  const startX = 20;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(50, 50, 50);
  let x = startX;
  headers.forEach((h, i) => {
    doc.text(h, x, y);
    x += colWidths[i];
  });

  y += 2;
  doc.setLineWidth(0.3);
  doc.line(20, y, W - 20, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  weekEntries.forEach((entry, idx) => {
    const bg = idx % 2 === 0;
    if (bg) {
      doc.setFillColor(248, 253, 250);
      doc.rect(20, y - 4, W - 40, 8, 'F');
    }
    doc.setTextColor(50, 50, 50);
    x = startX;
    const dateLabel = new Date(entry.date + 'T12:00:00').toLocaleDateString('en-RW', {
      weekday: 'short', month: 'short', day: 'numeric',
    });
    [dateLabel, String(entry.ratings.energy) + '/5', String(entry.ratings.sleep) + '/5', String(entry.ratings.mood) + '/5', String(entry.ratings.bodyPain) + '/5'].forEach((val, i) => {
      doc.text(val, x, y);
      x += colWidths[i];
    });
    y += 8;
  });

  y += 8;

  // Observations
  doc.setTextColor(26, 71, 49);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(isRw ? 'Ibigaragara' : 'Pattern Observations', 20, y);

  y += 6;
  doc.line(20, y, W - 20, y);
  y += 8;

  const avgE = parseFloat(avg(energies));
  const avgS = parseFloat(avg(sleeps));
  const avgM = parseFloat(avg(moods));
  const painCount = pains.filter((p) => p >= 3).length;

  const observations: string[] = [];

  if (avgE < 3) observations.push(isRw ? '• Imbaraga zari nke mu cyumweru gishize — reba niba usingira neza.' : '• Energy levels were consistently low this week — worth monitoring rest and nutrition.');
  if (avgE >= 4) observations.push(isRw ? '• Imbaraga nziza zarafashaga mu cyumweru gishize.' : '• Strong energy levels noted throughout the week — positive sign.');
  if (avgS < 3) observations.push(isRw ? '• Itiro ryagaragaye nka ikibazo — reba uburyo bwo gutuza.' : '• Sleep quality was below optimal — consider wind-down routines.');
  if (avgM < 2.5) observations.push(isRw ? '• Umutima wagaragaye nke cyane — iyi raporo irashobora kufasha muganga wawe.' : '• Mood scores were notably low — this report may support a conversation with a health professional.');
  if (painCount >= 3) observations.push(isRw ? `• Ububabare bw'umubiri bwaravuzwe iminsi ${painCount} mu 7 — bifite akamaro kuvuga na muganga.` : `• Body discomfort was reported on ${painCount} of 7 days — worth discussing with a health provider.`);
  if (!observations.length) observations.push(isRw ? '• Ubuzima bwawe bwarafanye neza mu cyumweru gishize.' : '• Your wellness indicators were broadly stable this week — keep it up!');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  observations.forEach((obs) => {
    const lines = doc.splitTextToSize(obs, W - 40);
    doc.text(lines, 20, y);
    y += lines.length * 6 + 3;
  });

  y += 8;

  // Disclaimer box
  doc.setFillColor(255, 250, 235);
  doc.setDrawColor(233, 167, 32);
  doc.setLineWidth(0.5);
  doc.roundedRect(20, y, W - 40, 20, 2, 2, 'FD');
  doc.setTextColor(120, 80, 0);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text(isRw ? 'Itangazo' : 'Important Notice', 25, y + 7);
  doc.setFont('helvetica', 'normal');
  const disclaimer = isRw
    ? 'Iyi raporo ni incamake y\'amakuru bwite y\'ubuzima. Si isuzuma rya muganga cyangwa ibyandikwa bya muganga.'
    : 'This report is a personal wellness summary only. It is not a medical diagnosis or clinical document. Please share with a qualified health provider for professional interpretation.';
  const dLines = doc.splitTextToSize(disclaimer, W - 50);
  doc.text(dLines, 25, y + 13);

  // Footer
  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.text('Komeza · AI Mental Wellness Companion · Rwanda 2025 · Built with Claude AI (Anthropic)', W / 2, 287, { align: 'center' });

  doc.save('Komeza_Wellness_Brief.pdf');
}
