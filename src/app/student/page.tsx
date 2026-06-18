import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ClipboardList,
  GraduationCap,
  MessagesSquare,
  ArrowRight,
  Sparkles,
  Megaphone,
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { PageHeader } from '@/components/layout/DashboardShell';
import { formatDate, formatDateTime, formatGrade, gradeColor } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function StudentDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== 'STUDENT') {
    redirect('/auth/login');
  }

  const studentId = session.sub;

  // Fetch student stats, general messages, and count of active quizzes not attempted yet.
  const [attemptAgg, announcements, pendingQuizzesCount, privateMessages] = await Promise.all([
    prisma.attempt.aggregate({
      where: { studentId },
      _count: { _all: true },
      _avg: { score: true },
    }),
    prisma.message.findMany({
      where: { type: 'GENERAL' },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: { sender: { select: { username: true } } },
    }),
    prisma.quiz.count({
      where: {
        isActive: true,
        attempts: {
          none: { studentId },
        },
      },
    }),
    prisma.message.count({
      where: { receiverId: studentId, type: 'INDIVIDUAL' },
    }),
  ]);

  const attemptsCount = attemptAgg._count._all;
  const averageGrade = attemptAgg._avg.score != null ? Math.round(attemptAgg._avg.score * 100) / 100 : null;

  return (
    <div className="space-y-8">
      <PageHeader
        title={`¡Hola de nuevo, ${session.username}!`}
        description="Este es tu panel de control. Revisa tus cuestionarios pendientes, calificaciones y mensajes."
      />

      {/* Stats row */}
      <div className="grid gap-5 sm:grid-cols-3">
        {/* Completed Quizzes */}
        <div className="card relative overflow-hidden group hover:border-slate-700/80 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Completados</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-white">{attemptsCount}</p>
              <p className="mt-1 text-xs text-slate-500">Cuestionarios realizados</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-brand-600 text-white shadow-lg shadow-black/10 group-hover:scale-110 transition-transform duration-300">
              <ClipboardList className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Average Grade */}
        <div className="card relative overflow-hidden group hover:border-slate-700/80 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Nota Media</p>
              <p className={`mt-2 text-3xl font-bold tracking-tight ${averageGrade != null ? gradeColor(averageGrade) : 'text-slate-500'}`}>
                {averageGrade != null ? formatGrade(averageGrade) : 'N/A'}
              </p>
              <p className="mt-1 text-xs text-slate-500">Puntuación sobre 10</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-black/10 group-hover:scale-110 transition-transform duration-300">
              <GraduationCap className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Messages count */}
        <div className="card relative overflow-hidden group hover:border-slate-700/80 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-400">Mensajes privados</p>
              <p className="mt-2 text-3xl font-bold tracking-tight text-white">{privateMessages}</p>
              <p className="mt-1 text-xs text-slate-500">Recibidos del profesor</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-black/10 group-hover:scale-110 transition-transform duration-300">
              <MessagesSquare className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-5">
        {/* Left Side: Pending Cuestionarios CTA & Info */}
        <div className="card md:col-span-2 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand-400" />
              Estado Académico
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              Tienes{' '}
              <strong className="text-slate-200">
                {pendingQuizzesCount} {pendingQuizzesCount === 1 ? 'cuestionario pendiente' : 'cuestionarios pendientes'}
              </strong>{' '}
              por completar. Recuerda que cada cuestionario solo puede ser respondido una vez.
            </p>
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-xs text-slate-500 space-y-2">
              <p className="font-semibold text-slate-400">Instrucciones rápidas:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Selecciona un cuestionario de la lista.</li>
                <li>Responde todas las preguntas con atención.</li>
                <li>Al enviar, recibirás tu nota final sobre 10 de inmediato.</li>
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-850/80">
            <Link href="/student/quizzes" className="btn-primary w-full justify-center">
              Ver cuestionarios disponibles
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Right Side: Announcements board */}
        <div className="card md:col-span-3 space-y-6">
          <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-emerald-400" />
            Tablón de Anuncios
          </h2>

          {announcements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
              <Megaphone className="h-8 w-8 text-slate-700 mb-2" />
              <p className="text-sm">No hay avisos del profesor en este momento.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="p-4 rounded-xl border border-emerald-500/10 bg-emerald-500/5 text-sm space-y-2"
                >
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold text-emerald-400">
                      Prof. {ann.sender.username}
                    </span>
                    <span>{formatDateTime(ann.createdAt)}</span>
                  </div>
                  <p className="text-slate-350 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
