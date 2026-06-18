'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { GraduationCap, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { apiFetch, jsonBody } from '@/lib/client';

interface LoginResponse {
  user: { id: string; username: string; email: string; role: 'PROFESSOR' | 'STUDENT' };
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await apiFetch<LoginResponse>(
        '/api/auth/login',
        jsonBody({ email: identifier, password }),
      );
      toast.success(`¡Bienvenido de nuevo, ${data.user.username}!`);
      const callback = params.get('callbackUrl');
      const target =
        callback && callback.startsWith('/')
          ? callback
          : data.user.role === 'PROFESSOR'
            ? '/professor'
            : '/student';
      router.replace(target);
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
          <h1 className="text-2xl font-bold text-slate-100">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-slate-400">
            Accede a tu panel de profesor o alumno.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <Field label="Correo o usuario" htmlFor="identifier">
              <Input
                id="identifier"
                type="text"
                autoComplete="username"
                placeholder="tu@correo.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </Field>
            <Field label="Contraseña" htmlFor="password">
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Field>
            <Button type="submit" loading={loading} className="w-full">
              <LogIn className="h-4 w-4" />
              Entrar
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            ¿No tienes cuenta?{' '}
            <Link href="/auth/register" className="font-semibold text-brand-300 hover:text-brand-200">
              Regístrate
            </Link>
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-slate-800/60 bg-slate-900/40 p-4 text-center text-xs text-slate-500">
          <p className="font-medium text-slate-400">Cuentas de demostración</p>
          <p className="mt-1">Profesor: profesor@demo.com · Alumno: ana@demo.com</p>
          <p>Contraseña: password123</p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        Cargando...
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
