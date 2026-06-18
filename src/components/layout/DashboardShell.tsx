'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as Icons from 'lucide-react';
import { GraduationCap, LogOut, Menu, X } from 'lucide-react';
import { cn, initials } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';

export interface NavItem {
  href: string;
  label: string;
  icon: string | React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

interface Props {
  navItems: NavItem[];
  user: { username: string; email: string; role: 'PROFESSOR' | 'STUDENT' };
  children: React.ReactNode;
}

export function DashboardShell({ navItems, user, children }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const roleLabel = user.role === 'PROFESSOR' ? 'Profesor' : 'Alumno';

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      toast.info('Sesión cerrada.');
      router.replace('/auth/login');
      router.refresh();
    } catch {
      setLoggingOut(false);
    }
  }

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + '/');

  const NavLinks = () => (
    <nav className="flex flex-1 flex-col gap-1">
      {navItems.map((item) => {
        const active = isActive(item);
        const Icon = typeof item.icon === 'string'
          ? (Icons[item.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }>) || Icons.HelpCircle
          : item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setOpen(false)}
            className={cn(
              'group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all duration-200',
              active
                ? 'bg-gradient-to-r from-brand-600/20 to-violet-600/10 text-white shadow-inner ring-1 ring-brand-500/30'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100',
            )}
          >
            <Icon
              className={cn('h-[18px] w-[18px] transition-colors', active ? 'text-brand-300' : 'text-slate-500 group-hover:text-slate-300')}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const Sidebar = () => (
    <div className="flex h-full flex-col gap-6 p-5">
      <Link href="/" className="flex items-center gap-2 px-1">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 shadow-glow">
          <GraduationCap className="h-6 w-6 text-white" />
        </div>
        <span className="text-lg font-bold tracking-tight">
          Quiz<span className="gradient-text">Lab</span>
        </span>
      </Link>

      <NavLinks />

      <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-violet-600 text-sm font-bold text-white">
            {initials(user.username)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-200">{user.username}</p>
            <p className="truncate text-xs text-slate-500">{roleLabel}</p>
          </div>
        </div>
        <button
          onClick={logout}
          disabled={loggingOut}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700/70 bg-slate-800/40 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-rose-600/20 hover:text-rose-200 disabled:opacity-60"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r border-slate-900 bg-slate-950/40 lg:block">
        <Sidebar />
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 animate-fade-in-fast border-r border-slate-800 bg-slate-950">
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-900 bg-slate-950/70 px-4 py-3 backdrop-blur-md lg:hidden">
          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg p-2 text-slate-300 hover:bg-slate-800"
            aria-label="Abrir menú"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="font-bold">
            Quiz<span className="gradient-text">Lab</span>
          </span>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto w-full max-w-6xl animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 text-sm text-slate-400">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
