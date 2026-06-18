import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ClipboardList,
  Users,
  GraduationCap,
  Activity,
  ArrowRight,
  BookOpen,
  Calendar,
} from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { PageHeader } from '@/components/layout/DashboardShell';
import { formatDateTime, formatGrade, gradeColor } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function ProfessorDashboardPage() {
  const session = await getSession();
  if (!session || session.role !== 'PROFESSOR') {
    redirect('/auth/login');
  }

  // Fetch metrics and recent attempts in parallel
  const [totalQuizzes, activeQuizzes, totalStudents, attemptAgg, recentAttempts] =
    await Promise.all([
      prisma.quiz.count({ where: { professorId: session.sub } }),
      prisma.quiz.count({ where: { professorId: session.sub, isActive: true } }),
      prisma.user.count({ where: { role: 'STUDENT' } }),
      prisma.attempt.aggregate({
        where: { quiz: { professorId: session.sub } },
        _count: { _all: true },
        _avg: { score: true },
      }),
      prisma.attempt.findMany({
        where: { quiz: { professorId: session.sub } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          student: { select: { username: true, email: true } },
          quiz: { select: { title: true } },
        },
      }),
    ]);

  const averageGrade = attemptAgg._avg.score
    ? Math.round(attemptAgg._avg.score * 100) / 100
    : null;

  const stats = [
    {
      label: 'Cuestionarios',
      value: totalQuizzes,
      subtitle: `${activeQuizzes} activos`,
      icon: ClipboardList,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      label: 'Alumnos',
      value: totalStudents,
      subtitle: 'Registrados en total',
      icon: Users,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      label: 'Intentos',
      value: attemptAgg._count._all,
      subtitle: 'Exámenes completados',
      icon: Activity,
      color: 'from-violet-500 to-purple-600',
    },
    {
      label: 'Nota Media',
      value: averageGrade !== null ? formatGrade(averageGrade) : 'N/A',
      subtitle: 'Sobre 10 puntos',
      icon: GraduationCap,
      color: 'from-amber-500 to-orange-600',
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title={`¡Hola, ${session.username}!`}
        description="Aquí tienes un resumen de la actividad en tus cuestionarios y el rendimiento de tus alumnos."
      />

      {/* Stats Grid */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div key={idx} className="card relative overflow-hidden group hover:border-slate-700/80 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">{s.label}</p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-white">{s.value}</p>
                  <p className="mt-1 text-xs text-slate-500">{s.subtitle}</p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${s.color} text-white shadow-lg shadow-black/10 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-brand-500/20 to-transparent" />
            </div>
          );
        })}
      </div>

      {/* Details Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Attempts Table */}
        <div className="card lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <Activity className="h-5 w-5 text-brand-400" />
              Entregas recientes
            </h2>
            <Link
              href="/professor/grades"
              className="flex items-center gap-1.5 text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors"
            >
              Ver todas <ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {recentAttempts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-500 mb-3">
                <BookOpen className="h-5 w-5" />
              </div>
              <p className="text-sm text-slate-400">Aún no hay entregas de cuestionarios.</p>
              <p className="text-xs text-slate-500 mt-1">Los alumnos completados aparecerán aquí.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    <th className="pb-3 pr-4 font-semibold">Alumno</th>
                    <th className="pb-3 px-4 font-semibold">Cuestionario</th>
                    <th className="pb-3 px-4 font-semibold text-center">Nota</th>
                    <th className="pb-3 pl-4 font-semibold text-right">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm">
                  {recentAttempts.map((attempt) => (
                    <tr key={attempt.id} className="group hover:bg-slate-900/20">
                      <td className="py-3.5 pr-4 font-medium text-slate-200">
                        <div>
                          <p>{attempt.student.username}</p>
                          <p className="text-xs text-slate-500">{attempt.student.email}</p>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 max-w-[200px] truncate">
                        {attempt.quiz.title}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center justify-center font-bold px-2 py-0.5 rounded text-xs bg-slate-900/80 border border-slate-850 ${gradeColor(attempt.score)}`}>
                          {formatGrade(attempt.score)}
                        </span>
                      </td>
                      <td className="py-3.5 pl-4 text-right text-xs text-slate-500">
                        {formatDateTime(attempt.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Help Card */}
        <div className="card space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-violet-400" />
              Acciones rápidas
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed">
              ¿Listo para evaluar a tus estudiantes? Sigue estos sencillos pasos:
            </p>
            <ol className="text-xs text-slate-400 space-y-3 list-decimal list-inside">
              <li>Crea un cuestionario en <Link href="/professor/quizzes" className="text-brand-400 underline font-medium">Cuestionarios</Link>.</li>
              <li>Añade preguntas y define qué respuesta es correcta.</li>
              <li>Activa el cuestionario para que tus alumnos puedan verlo.</li>
              <li>Revisa los resultados aquí o en la sección de <Link href="/professor/grades" className="text-brand-400 underline font-medium">Notas</Link>.</li>
            </ol>
          </div>
          <div className="pt-4 border-t border-slate-800/80">
            <Link href="/professor/quizzes" className="btn-primary w-full justify-center text-xs">
              Gestionar cuestionarios
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
