import Link from 'next/link';
import {
  GraduationCap,
  ClipboardList,
  BarChart3,
  MessagesSquare,
  ShieldCheck,
  Zap,
  ArrowRight,
} from 'lucide-react';
import { getSession } from '@/lib/session';

export default async function HomePage() {
  const session = await getSession();
  const dashboardHref = session?.role === 'PROFESSOR' ? '/professor' : '/student';

  return (
    <main className="relative overflow-hidden">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 shadow-glow">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Quiz<span className="gradient-text">Lab</span>
          </span>
        </div>
        <nav className="flex items-center gap-3">
          {session ? (
            <Link href={dashboardHref} className="btn-primary">
              Ir a mi panel <ArrowRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              <Link href="/auth/login" className="btn-ghost">
                Iniciar sesión
              </Link>
              <Link href="/auth/register" className="btn-primary">
                Empezar
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-16 text-center">
        <div className="animate-fade-in">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-sm text-brand-200">
            <Zap className="h-4 w-4" /> Evaluación online, simple y potente
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-slate-50 sm:text-6xl">
            Crea cuestionarios y <span className="gradient-text">califica al instante</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
            La plataforma educativa donde los profesores crean pruebas, los alumnos las realizan una
            sola vez y la nota sobre 10 se calcula automáticamente. Con mensajería y seguimiento del
            rendimiento.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href={session ? dashboardHref : '/auth/register'} className="btn-primary px-6 py-3 text-base">
              {session ? 'Ir a mi panel' : 'Crear cuenta gratis'}
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/auth/login" className="btn-secondary px-6 py-3 text-base">
              Ya tengo cuenta
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-24 grid gap-5 text-left sm:grid-cols-2 lg:grid-cols-4">
          <Feature
            icon={<ClipboardList className="h-6 w-6" />}
            title="Gestión de cuestionarios"
            description="CRUD completo de cuestionarios y preguntas con opciones y respuesta correcta."
          />
          <Feature
            icon={<Zap className="h-6 w-6" />}
            title="Notas automáticas"
            description="La calificación sobre 10 se calcula al enviar, comparando con las respuestas correctas."
          />
          <Feature
            icon={<BarChart3 className="h-6 w-6" />}
            title="Seguimiento"
            description="El profesor consulta el rendimiento y el historial de cada alumno."
          />
          <Feature
            icon={<MessagesSquare className="h-6 w-6" />}
            title="Mensajería"
            description="Comunicación general o individual entre profesor y alumnos."
          />
        </div>

        <div className="mx-auto mt-12 flex max-w-xl items-center justify-center gap-3 rounded-2xl border border-slate-800/60 bg-slate-900/40 p-4 text-sm text-slate-400">
          <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-400" />
          <p>
            Roles separados (profesor / alumno), un único intento por cuestionario y control de
            envíos duplicados con bloqueo distribuido.
          </p>
        </div>
      </section>

      <footer className="border-t border-slate-900 py-8 text-center text-sm text-slate-600">
        QuizLab — Plataforma de cuestionarios online · Next.js · PostgreSQL · Redis
      </footer>
    </main>
  );
}

function Feature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="card transition-all duration-300 hover:scale-[1.02] hover:border-brand-500/40">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 text-brand-300">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-slate-100">{title}</h3>
      <p className="mt-1.5 text-sm text-slate-400">{description}</p>
    </div>
  );
}
