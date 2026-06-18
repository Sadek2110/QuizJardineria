'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GraduationCap, UserPlus, BookOpen, Presentation } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { apiFetch, jsonBody } from '@/lib/client';
import { cn } from '@/lib/utils';

type Role = 'STUDENT' | 'PROFESSOR';

interface RegisterResponse {
  user: { id: string; username: string; email: string; role: Role };
}

export default function RegisterPage() {
  const router = useRouter();
  const toast = useToast();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('STUDENT');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await apiFetch<RegisterResponse>(
        '/api/auth/register',
        jsonBody({ username, email, password, role }),
      );
      toast.success('Cuenta creada correctamente. ¡Bienvenido!');
      router.replace(data.user.role === 'PROFESSOR' ? '/professor' : '/student');
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-in">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 shadow-glow">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">
            Quiz<span className="gradient-text">Lab</span>
          </span>
        </Link>

        <div className="card">
          <h1 className="text-2xl font-bold text-slate-100">Crear cuenta</h1>
          <p className="mt-1 text-sm text-slate-400">Únete a la plataforma en segundos.</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <RoleCard
                active={role === 'STUDENT'}
                onClick={() => setRole('STUDENT')}
                icon={<BookOpen className="h-5 w-5" />}
                label="Alumno"
              />
              <RoleCard
                active={role === 'PROFESSOR'}
                onClick={() => setRole('PROFESSOR')}
                icon={<Presentation className="h-5 w-5" />}
                label="Profesor"
              />
            </div>

            <Field label="Nombre de usuario" htmlFor="username">
              <Input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="tu_usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                minLength={3}
                required
              />
            </Field>
            <Field label="Correo electrónico" htmlFor="email">
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>
            <Field label="Contraseña" htmlFor="password" hint="Mínimo 6 caracteres.">
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </Field>
            <Button type="submit" loading={loading} className="w-full">
              <UserPlus className="h-4 w-4" />
              Crear cuenta
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            ¿Ya tienes cuenta?{' '}
            <Link href="/auth/login" className="font-semibold text-brand-300 hover:text-brand-200">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

function RoleCard({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col items-center gap-2 rounded-xl border p-4 transition-all duration-200',
        active
          ? 'border-brand-500 bg-brand-500/10 text-brand-200 shadow-glow'
          : 'border-slate-700 bg-slate-900/40 text-slate-400 hover:border-slate-600',
      )}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
