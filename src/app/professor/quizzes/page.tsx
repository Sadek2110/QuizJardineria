'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  Plus,
  Edit2,
  Trash2,
  ListCollapse,
  Play,
  Pause,
  AlertCircle,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/DashboardShell';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Field, Input, Textarea } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { apiFetch } from '@/lib/client';

interface Quiz {
  id: string;
  title: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  _count: {
    questions: number;
    attempts: number;
  };
}

export default function QuizzesPage() {
  const toast = useToast();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  async function fetchQuizzes() {
    try {
      const data = await apiFetch<{ quizzes: Quiz[] }>('/api/quizzes');
      setQuizzes(data.quizzes);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // Handle Quiz Creation
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 3) {
      return toast.error('El título debe tener al menos 3 caracteres.');
    }
    setSubmitting(true);
    try {
      const { quiz } = await apiFetch<{ quiz: Quiz }>('/api/quizzes', {
        method: 'POST',
        body: JSON.stringify({ title, description, isActive }),
      });
      setQuizzes((prev) => [quiz, ...prev]);
      toast.success('Cuestionario creado con éxito.');
      setIsCreateOpen(false);
      resetForm();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  // Open Edit Modal
  function openEdit(quiz: Quiz) {
    setSelectedQuiz(quiz);
    setTitle(quiz.title);
    setDescription(quiz.description ?? '');
    setIsActive(quiz.isActive);
    setIsEditOpen(true);
  }

  // Handle Quiz Edition
  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedQuiz) return;
    if (title.trim().length < 3) {
      return toast.error('El título debe tener al menos 3 caracteres.');
    }
    setSubmitting(true);
    try {
      const { quiz } = await apiFetch<{ quiz: Quiz }>(`/api/quizzes/${selectedQuiz.id}`, {
        method: 'PUT',
        body: JSON.stringify({ title, description, isActive }),
      });
      setQuizzes((prev) => prev.map((q) => (q.id === quiz.id ? quiz : q)));
      toast.success('Cuestionario actualizado.');
      setIsEditOpen(false);
      resetForm();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  // Toggle Quiz Active Status
  async function toggleActive(quiz: Quiz) {
    try {
      const { quiz: updated } = await apiFetch<{ quiz: Quiz }>(`/api/quizzes/${quiz.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !quiz.isActive }),
      });
      setQuizzes((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
      toast.success(updated.isActive ? 'Cuestionario activado.' : 'Cuestionario desactivado.');
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  // Open Delete Modal
  function openDelete(quiz: Quiz) {
    setSelectedQuiz(quiz);
    setIsDeleteOpen(true);
  }

  // Handle Quiz Deletion
  async function handleDelete() {
    if (!selectedQuiz) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/quizzes/${selectedQuiz.id}`, { method: 'DELETE' });
      setQuizzes((prev) => prev.filter((q) => q.id !== selectedQuiz.id));
      toast.success('Cuestionario eliminado.');
      setIsDeleteOpen(false);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setTitle('');
    setDescription('');
    setIsActive(false);
    setSelectedQuiz(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cuestionarios"
        description="Gestiona las evaluaciones disponibles en la plataforma."
        action={
          <Button onClick={() => { resetForm(); setIsCreateOpen(true); }} className="flex items-center gap-1.5">
            <Plus className="h-4.5 w-4.5" /> Nuevo Cuestionario
          </Button>
        }
      />

      {loading ? (
        <ListSkeleton rows={3} />
      ) : quizzes.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No hay cuestionarios"
          description="Comienza creando tu primer cuestionario para que tus estudiantes puedan evaluarse."
          action={
            <Button onClick={() => setIsCreateOpen(true)}>
              Crear Cuestionario
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between group hover:border-slate-700/80 transition-colors"
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h3 className="text-base font-semibold text-slate-100 truncate">{quiz.title}</h3>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                      quiz.isActive
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}
                  >
                    {quiz.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                {quiz.description && (
                  <p className="text-sm text-slate-400 max-w-2xl line-clamp-2">{quiz.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-slate-500 pt-1">
                  <span>{quiz._count.questions} {quiz._count.questions === 1 ? 'pregunta' : 'preguntas'}</span>
                  <span className="h-1 w-1 rounded-full bg-slate-700" />
                  <span>{quiz._count.attempts} {quiz._count.attempts === 1 ? 'intento' : 'intentos'}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center">
                {/* Active Toggle Button */}
                <button
                  onClick={() => toggleActive(quiz)}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${
                    quiz.isActive
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                      : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                  }`}
                  title={quiz.isActive ? 'Desactivar cuestionario' : 'Activar cuestionario'}
                >
                  {quiz.isActive ? <Pause className="h-4.5 w-4.5" /> : <Play className="h-4.5 w-4.5" />}
                </button>

                {/* Edit Questions Button */}
                <Link
                  href={`/professor/quizzes/${quiz.id}/questions`}
                  className="inline-flex h-9 px-3.5 items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/50 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-700"
                  title="Preguntas"
                >
                  <ListCollapse className="h-4 w-4 text-slate-400" />
                  Preguntas
                </Link>

                {/* Edit Config Button */}
                <button
                  onClick={() => openEdit(quiz)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/50 text-slate-400 hover:text-slate-100 hover:bg-slate-750 transition-colors"
                  title="Configuración"
                >
                  <Edit2 className="h-4 w-4" />
                </button>

                {/* Delete Button */}
                <button
                  onClick={() => openDelete(quiz)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-rose-950 bg-rose-950/20 text-rose-400 hover:bg-rose-600 hover:text-white transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      <Modal open={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Nuevo Cuestionario">
        <form onSubmit={handleCreate} className="space-y-4">
          <Field label="Título del cuestionario">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Fundamentos de Redes"
              required
              disabled={submitting}
            />
          </Field>
          <Field label="Descripción (opcional)">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Cuestionario sobre topologías, capas de red y protocolos..."
              rows={3}
              disabled={submitting}
            />
          </Field>
          <div className="flex items-center gap-2 py-1">
            <input
              type="checkbox"
              id="isActiveCreate"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-brand-500 focus:ring-brand-500/30"
              disabled={submitting}
            />
            <label htmlFor="isActiveCreate" className="text-sm font-medium text-slate-300 select-none cursor-pointer">
              Activar de inmediato
            </label>
          </div>
          {isActive && (
            <div className="flex gap-2 p-3 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs text-amber-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Para activar el cuestionario debe tener al menos una pregunta guardada previamente.</span>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsCreateOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" loading={submitting}>
              Crear
            </Button>
          </div>
        </form>
      </Modal>

      {/* EDIT MODAL */}
      <Modal open={isEditOpen} onClose={() => setIsEditOpen(false)} title="Editar Cuestionario">
        <form onSubmit={handleEdit} className="space-y-4">
          <Field label="Título del cuestionario">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={submitting}
            />
          </Field>
          <Field label="Descripción (opcional)">
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              disabled={submitting}
            />
          </Field>
          <div className="flex items-center gap-2 py-1">
            <input
              type="checkbox"
              id="isActiveEdit"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-700 bg-slate-900 text-brand-500 focus:ring-brand-500/30"
              disabled={submitting}
            />
            <label htmlFor="isActiveEdit" className="text-sm font-medium text-slate-300 select-none cursor-pointer">
              Activo
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsEditOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" loading={submitting}>
              Guardar Cambios
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRM */}
      <ConfirmModal
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="¿Eliminar cuestionario?"
        description={`Esta acción eliminará de forma permanente el cuestionario "${selectedQuiz?.title}" junto con todas sus preguntas, opciones y notas registradas de los alumnos.`}
        confirmLabel="Eliminar permanentemente"
        loading={submitting}
        danger
      />
    </div>
  );
}
