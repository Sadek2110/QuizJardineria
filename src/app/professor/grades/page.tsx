'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Filter, RotateCcw, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/DashboardShell';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { apiFetch } from '@/lib/client';
import { formatDateTime, formatGrade, gradeColor } from '@/lib/utils';

interface Attempt {
  id: string;
  score: number;
  correctAnswersCount: number;
  totalQuestionsCount: number;
  createdAt: string;
  student: {
    id: string;
    username: string;
    email: string;
  };
  quiz: {
    id: string;
    title: string;
  };
}

interface FilterQuiz {
  id: string;
  title: string;
}

export default function GradesPage() {
  const toast = useToast();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [quizzes, setQuizzes] = useState<FilterQuiz[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [searchStudent, setSearchStudent] = useState('');

  useEffect(() => {
    fetchGrades();
  }, [selectedQuizId]);

  async function fetchGrades() {
    setLoading(true);
    try {
      const url = selectedQuizId
        ? `/api/grades?quizId=${selectedQuizId}`
        : '/api/grades';
      const data = await apiFetch<{ attempts: Attempt[]; quizzes: FilterQuiz[] }>(url);
      setAttempts(data.attempts);
      setQuizzes(data.quizzes);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function resetFilters() {
    setSelectedQuizId('');
    setSearchStudent('');
  }

  // Filter local attempts list by student username/email
  const filteredAttempts = attempts.filter((att) => {
    if (!searchStudent.trim()) return true;
    const term = searchStudent.toLowerCase();
    return (
      att.student.username.toLowerCase().includes(term) ||
      att.student.email.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Historial de Notas"
        description="Revisa las calificaciones y respuestas detalladas de tus alumnos."
      />

      {/* Filters Bar */}
      <div className="card p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row">
          {/* Quiz Select Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Cuestionario
            </label>
            <div className="relative">
              <select
                value={selectedQuizId}
                onChange={(e) => setSelectedQuizId(e.target.value)}
                className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-brand-500"
              >
                <option value="">Todos los cuestionarios</option>
                {quizzes.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Student Search Filter */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Buscar alumno
            </label>
            <input
              type="text"
              value={searchStudent}
              onChange={(e) => setSearchStudent(e.target.value)}
              placeholder="Nombre de usuario o email..."
              className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* Clear Filters Button */}
        {(selectedQuizId || searchStudent) && (
          <button
            onClick={resetFilters}
            className="flex items-center justify-center gap-1.5 self-end md:self-end h-10 px-4 rounded-xl border border-slate-750 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Limpiar filtros
          </button>
        )}
      </div>

      {loading ? (
        <ListSkeleton rows={3} />
      ) : filteredAttempts.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Sin resultados"
          description={
            selectedQuizId || searchStudent
              ? 'No se encontraron entregas que coincidan con los filtros de búsqueda.'
              : 'Aún ningún alumno ha completado un cuestionario.'
          }
        />
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-semibold uppercase tracking-wider text-slate-400 bg-slate-900/30">
                  <th className="py-4 px-6 font-semibold">Alumno</th>
                  <th className="py-4 px-6 font-semibold">Cuestionario</th>
                  <th className="py-4 px-6 font-semibold text-center">Aciertos</th>
                  <th className="py-4 px-6 font-semibold text-center">Nota Final</th>
                  <th className="py-4 px-6 font-semibold text-right">Fecha de Entrega</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {filteredAttempts.map((att) => (
                  <tr key={att.id} className="group hover:bg-slate-900/10 transition-colors">
                    <td className="py-4 px-6 font-medium text-slate-200">
                      <div>
                        <p className="text-slate-200 font-semibold">{att.student.username}</p>
                        <p className="text-xs text-slate-500">{att.student.email}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-400 font-medium">
                      {att.quiz.title}
                    </td>
                    <td className="py-4 px-6 text-center text-slate-350">
                      {att.correctAnswersCount} / {att.totalQuestionsCount}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center justify-center font-bold px-3 py-1 rounded-lg text-sm bg-slate-950/80 border border-slate-850 ${gradeColor(att.score)}`}>
                        {formatGrade(att.score)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right text-xs text-slate-500 font-medium">
                      {formatDateTime(att.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
