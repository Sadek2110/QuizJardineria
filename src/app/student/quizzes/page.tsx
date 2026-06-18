import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ClipboardList, Play, CheckCircle2, HelpCircle } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { PageHeader } from '@/components/layout/DashboardShell';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDate, formatGrade, gradeColor } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function StudentQuizzesPage() {
  const session = await getSession();
  if (!session || session.role !== 'STUDENT') {
    redirect('/auth/login');
  }

  const studentId = session.sub;

  // Fetch all active quizzes, including questions count and the current student's attempt (if any)
  const quizzes = await prisma.quiz.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { questions: true } },
      attempts: {
        where: { studentId },
        select: { id: true, score: true, createdAt: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cuestionarios Disponibles"
        description="Aquí tienes la lista de evaluaciones publicadas por el profesor. Recuerda que solo tienes un intento por cada una."
      />

      {quizzes.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No hay cuestionarios disponibles"
          description="El profesor aún no ha publicado ningún cuestionario activo."
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {quizzes.map((quiz) => {
            const hasAttempted = quiz.attempts.length > 0;
            const attempt = hasAttempted ? quiz.attempts[0] : null;

            return (
              <div
                key={quiz.id}
                className={`card flex flex-col justify-between group transition-all duration-300 ${
                  hasAttempted
                    ? 'border-slate-800/60 bg-slate-900/20 opacity-85 hover:border-slate-800'
                    : 'hover:border-slate-700 hover:scale-[1.01]'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <h3 className="text-base font-semibold text-slate-100 group-hover:text-white transition-colors">
                      {quiz.title}
                    </h3>
                    {hasAttempted && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full border bg-emerald-500/10 border-emerald-500/30 text-emerald-400">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Completado
                      </span>
                    )}
                  </div>

                  {quiz.description && (
                    <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">
                      {quiz.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2 text-xs text-slate-500 pt-1">
                    <HelpCircle className="h-4 w-4" />
                    <span>
                      {quiz._count.questions} {quiz._count.questions === 1 ? 'pregunta' : 'preguntas'}
                    </span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-850/60 flex items-center justify-between">
                  {hasAttempted && attempt ? (
                    <div className="flex items-center justify-between w-full">
                      <div className="text-left">
                        <p className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                          Tu Calificación
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Realizado el {formatDate(attempt.createdAt)}
                        </p>
                      </div>
                      <span className={`inline-flex items-center justify-center font-bold px-3 py-1 rounded-lg text-sm bg-slate-950 border border-slate-850 ${gradeColor(attempt.score)}`}>
                        {formatGrade(attempt.score)} / 10
                      </span>
                    </div>
                  ) : (
                    <>
                      <span className="text-xs text-brand-300 font-semibold">Pendiente de realizar</span>
                      <Link
                        href={`/student/quizzes/${quiz.id}/take`}
                        className="btn-primary px-3 py-2 text-xs font-bold flex items-center gap-1 shadow-sm"
                      >
                        Realizar cuestionario
                        <Play className="h-3.5 w-3.5 fill-current" />
                      </Link>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
