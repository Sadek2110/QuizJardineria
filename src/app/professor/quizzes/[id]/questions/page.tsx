'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Edit2,
  Trash2,
  Check,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/DashboardShell';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Field, Input } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { apiFetch } from '@/lib/client';

interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface Question {
  id: string;
  text: string;
  order: number;
  options: Option[];
}

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  isActive: boolean;
  questions: Question[];
}

export default function QuestionsPage({ params }: { params: { id: string } }) {
  const toast = useToast();
  const quizId = params.id;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  // Question Form State
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState<Array<{ id?: string; text: string; isCorrect: boolean }>>([
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuizDetails();
  }, []);

  async function fetchQuizDetails() {
    try {
      const data = await apiFetch<{ quiz: Quiz }>(`/api/quizzes/${quizId}`);
      setQuiz(data.quiz);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // Add Option to form
  function addOption() {
    if (options.length >= 6) {
      return toast.info('Se permite un máximo de 6 opciones de respuesta.');
    }
    setOptions([...options, { text: '', isCorrect: false }]);
  }

  // Remove Option from form
  function removeOption(idx: number) {
    if (options.length <= 2) {
      return toast.error('Una pregunta debe tener al menos 2 opciones de respuesta.');
    }
    setOptions(options.filter((_, i) => i !== idx));
  }

  // Handle option change
  function updateOptionText(idx: number, val: string) {
    setOptions(
      options.map((opt, i) => (i === idx ? { ...opt, text: val } : opt))
    );
  }

  // Set the correct option
  function setCorrectOption(idx: number) {
    setOptions(
      options.map((opt, i) => ({ ...opt, isCorrect: i === idx }))
    );
  }

  // Open modal for Create
  function openCreate() {
    setSelectedQuestion(null);
    setQuestionText('');
    setOptions([
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ]);
    setIsOpen(true);
  }

  // Open modal for Edit
  function openEdit(q: Question) {
    setSelectedQuestion(q);
    setQuestionText(q.text);
    // Deep copy options
    setOptions(q.options.map((o) => ({ id: o.id, text: o.text, isCorrect: o.isCorrect })));
    setIsOpen(true);
  }

  // Form submit handler
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validations
    if (questionText.trim().length < 5) {
      return toast.error('El enunciado de la pregunta debe tener al menos 5 caracteres.');
    }
    if (options.some((o) => o.text.trim().length === 0)) {
      return toast.error('Todas las opciones de respuesta deben tener texto.');
    }
    const correctCount = options.filter((o) => o.isCorrect).length;
    if (correctCount !== 1) {
      return toast.error('Debes marcar exactamente una opción como correcta.');
    }

    setSubmitting(true);
    try {
      const payload = {
        text: questionText,
        options: options.map((o) => ({
          id: o.id,
          text: o.text.trim(),
          isCorrect: o.isCorrect,
        })),
      };

      if (selectedQuestion) {
        // Edit
        const { question: updated } = await apiFetch<{ question: Question }>(
          `/api/questions/${selectedQuestion.id}`,
          {
            method: 'PUT',
            body: JSON.stringify(payload),
          }
        );
        setQuiz((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            questions: prev.questions.map((q) => (q.id === updated.id ? updated : q)),
          };
        });
        toast.success('Pregunta actualizada correctamente.');
      } else {
        // Create
        const { question: created } = await apiFetch<{ question: Question }>(
          `/api/quizzes/${quizId}/questions`,
          {
            method: 'POST',
            body: JSON.stringify(payload),
          }
        );
        setQuiz((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            questions: [...prev.questions, created],
          };
        });
        toast.success('Pregunta añadida correctamente.');
      }
      setIsOpen(false);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  // Open delete confirm
  function openDelete(q: Question) {
    setSelectedQuestion(q);
    setIsDeleteOpen(true);
  }

  // Handle delete execution
  async function handleDelete() {
    if (!selectedQuestion) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/questions/${selectedQuestion.id}`, { method: 'DELETE' });
      setQuiz((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          questions: prev.questions.filter((q) => q.id !== selectedQuestion.id),
        };
      });
      toast.success('Pregunta eliminada.');
      setIsDeleteOpen(false);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/professor/quizzes"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-slate-900/40 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Cuestionarios / Preguntas</span>
          <h1 className="text-xl font-bold text-slate-100 leading-tight mt-0.5">
            {loading ? 'Cargando cuestionario...' : quiz?.title}
          </h1>
        </div>
      </div>

      {loading ? (
        <ListSkeleton rows={2} />
      ) : !quiz ? (
        <div className="card text-center py-10">
          <AlertCircle className="h-10 w-10 text-rose-500 mx-auto mb-3" />
          <p className="text-sm font-semibold">Error al cargar cuestionario.</p>
          <Link href="/professor/quizzes" className="text-brand-400 text-xs underline mt-2 inline-block">
            Volver a la lista
          </Link>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center flex-wrap gap-3">
            <p className="text-sm text-slate-400">
              Hay {quiz.questions.length} {quiz.questions.length === 1 ? 'pregunta redactada' : 'preguntas redactadas'} en total.
            </p>
            <Button onClick={openCreate} className="flex items-center gap-1.5">
              <Plus className="h-4.5 w-4.5" /> Añadir Pregunta
            </Button>
          </div>

          {quiz.questions.length === 0 ? (
            <EmptyState
              icon={HelpCircle}
              title="No hay preguntas"
              description="Añade preguntas de opción múltiple a este examen para que los alumnos puedan responder."
              action={
                <Button onClick={openCreate}>
                  Crear Pregunta
                </Button>
              }
            />
          ) : (
            <div className="grid gap-5">
              {quiz.questions.map((q, idx) => (
                <div key={q.id} className="card relative group hover:border-slate-700/80 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3 flex-1 min-w-0">
                      <div className="flex items-start gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-xs font-bold text-brand-300 border border-brand-500/20">
                          {idx + 1}
                        </span>
                        <h3 className="text-base font-semibold text-slate-200 pt-0.5">{q.text}</h3>
                      </div>

                      {/* Options List */}
                      <ul className="grid gap-2 pl-9 sm:grid-cols-2">
                        {q.options.map((opt) => (
                          <li
                            key={opt.id}
                            className={`flex items-start gap-2.5 rounded-xl border p-3 text-sm transition-colors ${
                              opt.isCorrect
                                ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                                : 'bg-slate-950/40 border-slate-800 text-slate-400'
                            }`}
                          >
                            <span
                              className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                                opt.isCorrect
                                  ? 'border-emerald-500 text-emerald-400 bg-emerald-500/10'
                                  : 'border-slate-700 text-transparent'
                              }`}
                            >
                              <Check className="h-3 w-3" />
                            </span>
                            <span className="break-words">{opt.text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-center">
                      <button
                        onClick={() => openEdit(q)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/50 text-slate-400 hover:text-slate-100 hover:bg-slate-750 transition-colors"
                        title="Editar pregunta"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openDelete(q)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-950 bg-rose-950/20 text-rose-400 hover:bg-rose-600 hover:text-white transition-colors"
                        title="Eliminar pregunta"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* CREATE & EDIT MODAL */}
      <Modal open={isOpen} onClose={() => setIsOpen(false)} title={selectedQuestion ? 'Editar Pregunta' : 'Añadir Pregunta'} maxWidth="max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Enunciado de la pregunta">
            <Input
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              placeholder="Ej: ¿Cuál es el puerto de comunicación HTTP estándar?"
              required
              disabled={submitting}
            />
          </Field>

          {/* Form Options Section */}
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-slate-300">Opciones de respuesta</label>
              <button
                type="button"
                onClick={addOption}
                className="text-xs font-semibold text-brand-400 hover:text-brand-300 flex items-center gap-1 transition-colors"
                disabled={submitting || options.length >= 6}
              >
                <Plus className="h-3.5 w-3.5" /> Añadir opción
              </button>
            </div>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {options.map((opt, index) => (
                <div key={index} className="flex items-center gap-2.5">
                  {/* Correct radio selector */}
                  <button
                    type="button"
                    onClick={() => setCorrectOption(index)}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-200 ${
                      opt.isCorrect
                        ? 'border-emerald-500 bg-emerald-500 text-white'
                        : 'border-slate-700 hover:border-slate-500 text-transparent bg-transparent'
                    }`}
                    title={opt.isCorrect ? 'Marcada como correcta' : 'Marcar como correcta'}
                    disabled={submitting}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>

                  {/* Text Input */}
                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) => updateOptionText(index, e.target.value)}
                    placeholder={`Opción ${index + 1}`}
                    className="flex-1 rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition-all duration-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30"
                    required
                    disabled={submitting}
                  />

                  {/* Remove option button */}
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="text-slate-500 hover:text-rose-400 disabled:opacity-40 p-1.5 transition-colors"
                    disabled={submitting || options.length <= 2}
                    title="Eliminar opción"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 p-3 rounded-xl border border-slate-800 bg-slate-950/40 text-[11px] text-slate-500">
            <AlertCircle className="h-4 w-4 shrink-0 text-slate-400" />
            <span>Haz clic en el círculo de check al lado de la respuesta para marcar la opción correcta. Sólo se permite una única opción verdadera.</span>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" loading={submitting}>
              {selectedQuestion ? 'Guardar' : 'Añadir'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRM */}
      <ConfirmModal
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="¿Eliminar pregunta?"
        description="Esta pregunta se eliminará de forma permanente de este cuestionario."
        confirmLabel="Eliminar"
        loading={submitting}
        danger
      />
    </div>
  );
}
