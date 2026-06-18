'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Edit2,
  Trash2,
  Calendar,
  Activity,
  Award,
  ChevronRight,
  GraduationCap,
} from 'lucide-react';
import { PageHeader } from '@/components/layout/DashboardShell';
import { Button } from '@/components/ui/Button';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import { Field, Input } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { apiFetch } from '@/lib/client';
import { formatDate, formatDateTime, formatGrade, gradeColor, initials } from '@/lib/utils';

interface Student {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  attemptsCount: number;
  averageGrade: number | null;
}

interface AttemptDetail {
  id: string;
  score: number;
  correctAnswersCount: number;
  totalQuestionsCount: number;
  createdAt: string;
  quiz: {
    id: string;
    title: string;
  };
}

interface StudentDetail extends Student {
  attempts: AttemptDetail[];
}

export default function StudentsPage() {
  const toast = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Selected state
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentDetail, setStudentDetail] = useState<StudentDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Edit fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  async function fetchStudents() {
    try {
      const data = await apiFetch<{ students: Student[] }>('/api/students');
      setStudents(data.students);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // Load individual student details
  async function openDetail(student: Student) {
    setSelectedStudent(student);
    setIsDetailOpen(true);
    setLoadingDetail(true);
    setStudentDetail(null);
    try {
      const data = await apiFetch<{ student: StudentDetail }>(`/api/students/${student.id}`);
      setStudentDetail(data.student);
    } catch (err) {
      toast.error((err as Error).message);
      setIsDetailOpen(false);
    } finally {
      setLoadingDetail(false);
    }
  }

  // Open edit modal
  function openEdit(student: Student) {
    setSelectedStudent(student);
    setUsername(student.username);
    setEmail(student.email);
    setIsEditOpen(true);
  }

  // Submit student update
  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudent) return;
    setSubmitting(true);
    try {
      const { student } = await apiFetch<{ student: Student }>(`/api/students/${selectedStudent.id}`, {
        method: 'PUT',
        body: JSON.stringify({ username, email }),
      });
      // Update local student stats (preserve calculated count and grade)
      setStudents((prev) =>
        prev.map((s) =>
          s.id === student.id
            ? { ...s, username: student.username, email: student.email }
            : s
        )
      );
      toast.success('Datos del alumno actualizados.');
      setIsEditOpen(false);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  // Open delete modal
  function openDelete(student: Student) {
    setSelectedStudent(student);
    setIsDeleteOpen(true);
  }

  // Delete student account
  async function handleDelete() {
    if (!selectedStudent) return;
    setSubmitting(true);
    try {
      await apiFetch(`/api/students/${selectedStudent.id}`, { method: 'DELETE' });
      setStudents((prev) => prev.filter((s) => s.id !== selectedStudent.id));
      toast.success('Cuenta del alumno eliminada correctamente.');
      setIsDeleteOpen(false);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  // Filter students based on search query
  const filteredStudents = students.filter((s) => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;
    return s.username.toLowerCase().includes(query) || s.email.toLowerCase().includes(query);
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Alumnos"
        description="Gestiona las cuentas de los alumnos y consulta su rendimiento académico."
      />

      {/* Search Bar */}
      <div className="card p-4 flex items-center gap-3">
        <Search className="h-5 w-5 text-slate-500 shrink-0" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar alumno por nombre o correo electrónico..."
          className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 outline-none"
        />
      </div>

      {loading ? (
        <ListSkeleton rows={3} />
      ) : filteredStudents.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No se encontraron alumnos"
          description={
            searchQuery
              ? 'No hay alumnos registrados que coincidan con la búsqueda.'
              : 'Aún no se ha registrado ningún alumno en la plataforma.'
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredStudents.map((student) => (
            <div
              key={student.id}
              className="card flex flex-col justify-between hover:border-slate-700/80 group transition-all duration-300"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 font-bold text-white shadow-md">
                    {initials(student.username)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-semibold text-slate-100">
                      {student.username}
                    </h3>
                    <p className="truncate text-xs text-slate-500">{student.email}</p>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl border border-slate-800 bg-slate-900/30">
                  <div className="text-center border-r border-slate-800/80">
                    <p className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                      Intentos
                    </p>
                    <p className="text-lg font-bold text-slate-200 mt-0.5">
                      {student.attemptsCount}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                      Nota Media
                    </p>
                    <p className={`text-lg font-bold mt-0.5 ${student.averageGrade != null ? gradeColor(student.averageGrade) : 'text-slate-500'}`}>
                      {student.averageGrade != null ? formatGrade(student.averageGrade) : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Registrado el {formatDate(student.createdAt)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5 pt-3.5 border-t border-slate-800/60 flex items-center justify-between">
                <button
                  onClick={() => openDetail(student)}
                  className="flex items-center gap-1 text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors"
                >
                  Ver historial <ChevronRight className="h-3 w-3" />
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEdit(student)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700 bg-slate-850 hover:bg-slate-700 hover:text-slate-100 text-slate-400 transition-colors"
                    title="Editar alumno"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => openDelete(student)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-rose-950 bg-rose-950/20 text-rose-400 hover:bg-rose-600 hover:text-white transition-colors"
                    title="Eliminar alumno"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* STUDENT HISTORY DETAIL MODAL */}
      <Modal open={isDetailOpen} onClose={() => setIsDetailOpen(false)} title="Historial del Alumno" maxWidth="max-w-xl">
        {loadingDetail ? (
          <div className="flex items-center justify-center py-12">
            <ListSkeleton rows={2} />
          </div>
        ) : !studentDetail ? (
          <p className="text-sm text-slate-400 text-center py-6">Error al cargar detalles.</p>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-slate-300 font-bold text-base">
                {initials(studentDetail.username)}
              </div>
              <div>
                <h4 className="text-base font-semibold text-slate-100">{studentDetail.username}</h4>
                <p className="text-xs text-slate-500">{studentDetail.email}</p>
              </div>
            </div>

            <div className="space-y-3">
              <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="h-4 w-4" />
                Exámenes realizados ({studentDetail.attempts.length})
              </h5>

              {studentDetail.attempts.length === 0 ? (
                <p className="text-sm text-slate-500 py-3 text-center italic">
                  Este alumno aún no ha realizado ningún examen.
                </p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {studentDetail.attempts.map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-800/80 bg-slate-950/40 text-sm"
                    >
                      <div className="min-w-0 flex-1 mr-4">
                        <p className="font-semibold text-slate-200 truncate">{att.quiz.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{formatDateTime(att.createdAt)}</p>
                      </div>
                      <div className="text-right shrink-0 flex items-center gap-3">
                        <span className="text-xs text-slate-400">
                          {att.correctAnswersCount} / {att.totalQuestionsCount} aciertos
                        </span>
                        <span className={`inline-flex items-center justify-center font-bold px-2 py-0.5 rounded text-xs bg-slate-900 border border-slate-850 ${gradeColor(att.score)}`}>
                          {formatGrade(att.score)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex justify-end pt-2">
              <Button onClick={() => setIsDetailOpen(false)}>Cerrar</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* EDIT MODAL */}
      <Modal open={isEditOpen} onClose={() => setIsEditOpen(false)} title="Editar Alumno">
        <form onSubmit={handleEdit} className="space-y-4">
          <Field label="Nombre de usuario">
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={submitting}
            />
          </Field>
          <Field label="Correo electrónico">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={submitting}
            />
          </Field>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsEditOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" loading={submitting}>
              Guardar
            </Button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRM */}
      <ConfirmModal
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title="¿Eliminar alumno?"
        description={`¿Estás seguro de que deseas eliminar permanentemente la cuenta de "${selectedStudent?.username}"? Se perderá todo su historial de notas y respuestas de cuestionarios de forma definitiva.`}
        confirmLabel="Eliminar Alumno"
        loading={submitting}
        danger
      />
    </div>
  );
}
