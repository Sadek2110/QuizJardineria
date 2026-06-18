import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type Tone = 'brand' | 'emerald' | 'amber' | 'rose' | 'slate' | 'violet';

const tones: Record<Tone, string> = {
  brand: 'bg-brand-500/15 text-brand-300 border-brand-500/30',
  emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  rose: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  slate: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
  violet: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
};

export function Badge({
  children,
  tone = 'slate',
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
