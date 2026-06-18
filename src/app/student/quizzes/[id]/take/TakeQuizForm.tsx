'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardList, Check, AlertCircle, HelpCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ConfirmModal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
import { apiFetch } from '@/lib/client';

interface QuizOption {
  id: string;
  text: string;
}

interface QuizQuestion {
  id: string;
  text: string;
  options: QuizOption[];
}

interface TakeQuizFormProps {
  quiz: {
    id: string;
    title: string;
    description: string | null;
    questions: QuizQuestion[];
  };
}

export function TakeQuizForm({ quiz }: TakeQuizFormProps) {
  const router = useRouter();
  const toast = useToast();

  // Selected option per questionId: { [qId]: optionId }
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Manage wizard steps if the user prefers, but listing them with progress tracker is extremely premium too.
  // Let's implement a clean top progress bar and list layout.
  const answeredCount = Object.keys(selections).length;
  const totalQuestions = quiz.questions.length;
  const progressPercent = Math.round((answeredCount / totalQuestions) * 100);

  function handleSelect(questionId: string, optionId: string) {
    if (submitting) return;
    setSelections((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  }

  function triggerSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (answeredCount < totalQuestions) {
      return toast.error('Por favor, responde a todas las preguntas antes de enviar.');
    }
    setIsConfirmOpen(true);
  }

  async function handleConfirmSubmit() {
    setIsConfirmOpen(false);
    setSubmitting(true);
    try {
      const answersPayload = Object.entries(selections).map(([questionId, optionId]) => ({
        questionId,
        optionId,
      }));

      await apiFetch(`/api/quizzes/${quiz.id}/attempt`, {
        method: 'POST',
        body: JSON.stringify({ answers: answersPayload }),
      });

      toast.success('¡Cuestionario completado y nota guardada!');
      router.push('/student/grades');
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Quiz Progress Header */}
      <div className="sticky top-0 z-20 card p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-brand-500/10 bg-slate-950/80 backdrop-blur-md">
        <div className="min-w-0 flex-1">
          <span className="text-[10px] uppercase font-bold text-brand-400 tracking-widest">Evaluación en progreso</span>
          <h2 className="text-base font-bold text-slate-100 truncate mt-0.5">{quiz.title}</h2>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <span className="text-xs font-semibold text-slate-400">Progreso: </span>
            <span className="text-xs font-bold text-brand-300">
              {answeredCount} / {totalQuestions}
            </span>
          </div>
          <div className="h-2 w-28 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-violet-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <form onSubmit={triggerSubmit} className="space-y-6">
        {/* Questions list */}
        <div className="grid gap-5">
          {quiz.questions.map((question, qIdx) => {
            const selectedOptId = selections[question.id];

            return (
              <div
                key={question.id}
                className={`card space-y-4 transition-all duration-200 border-slate-900 ${
                  selectedOptId ? 'border-brand-500/20 bg-slate-900/30' : 'hover:border-slate-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-xs font-bold text-brand-300 border border-brand-500/20 mt-0.5">
                    {qIdx + 1}
                  </span>
                  <h3 className="text-base font-semibold text-slate-200 leading-snug">
                    {question.text}
                  </h3>
                </div>

                {/* Options list */}
                <div className="grid gap-3 pl-9 sm:grid-cols-2">
                  {question.options.map((opt) => {
                    const isSelected = selectedOptId === opt.id;

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleSelect(question.id, opt.id)}
                        className={`flex items-start gap-3 rounded-xl border p-3.5 text-left text-sm transition-all duration-200 ${
                          isSelected
                            ? 'bg-brand-500/10 border-brand-500/40 text-brand-200 ring-2 ring-brand-500/10'
                            : 'bg-slate-950/40 border-slate-800/80 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                        disabled={submitting}
                      >
                        <span
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all ${
                            isSelected
                              ? 'border-brand-400 bg-brand-500/20 text-brand-400'
                              : 'border-slate-750 text-transparent'
                          }`}
                        >
                          <div className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-brand-400' : 'bg-transparent'}`} />
                        </span>
                        <span className="break-words font-medium">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit action */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-slate-900">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <AlertCircle className="h-4 w-4" />
            <span>Una vez enviado, no podrás modificar tus respuestas.</span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary flex-1 sm:flex-initial"
              disabled={submitting}
            >
              Cancelar
            </button>
            <Button
              type="submit"
              className="flex-1 sm:flex-initial justify-center"
              loading={submitting}
              disabled={answeredCount < totalQuestions}
            >
              Enviar Cuestionario
            </Button>
          </div>
        </div>
      </form>

      {/* CONFIRMATION MODAL */}
      <ConfirmModal
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmSubmit}
        title="¿Enviar respuestas?"
        description="Estás a punto de enviar tu cuestionario para calificación. Confirma si estás seguro de tus elecciones."
        confirmLabel="Sí, enviar ahora"
        loading={submitting}
      />
    </div>
  );
}
