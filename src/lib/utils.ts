/** Tiny classNames combiner (clsx-like, no dependency). */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}

/** Grade out of 10 from correct/total, rounded to 2 decimals. */
export function calcGrade(correct: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((correct / total) * 10 * 100) / 100;
}

/** Format a grade for display (Spanish-style, up to 2 decimals). */
export function formatGrade(score: number): string {
  return score.toLocaleString('es-ES', { maximumFractionDigits: 2 });
}

/** Tailwind text color class based on the grade value. */
export function gradeColor(score: number): string {
  if (score >= 7) return 'text-emerald-400';
  if (score >= 5) return 'text-amber-400';
  return 'text-rose-400';
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function initials(name: string): string {
  return name.trim().slice(0, 2).toUpperCase();
}
