import { redirect } from 'next/navigation';
import { BarChart3 } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { PageHeader } from '@/components/layout/DashboardShell';
import { EmptyState } from '@/components/ui/EmptyState';
import { GradesList } from './GradesList';

export const dynamic = 'force-dynamic';

export default async function StudentGradesPage() {
  const session = await getSession();
  if (!session || session.role !== 'STUDENT') {
    redirect('/auth/login');
  }

  const studentId = session.sub;

  // Fetch all quiz attempts for the current student along with all questions and answers detail.
  const attempts = await prisma.attempt.findMany({
    where: { studentId },
    orderBy: { createdAt: 'desc' },
    include: {
      quiz: {
        select: {
          id: true,
          title: true,
          description: true,
        },
      },
      answers: {
        include: {
          question: {
            include: {
              options: {
                orderBy: { text: 'asc' }, // Order options text alphabetically or as they are
              },
            },
          },
          option: {
            select: {
              id: true,
              text: true,
              isCorrect: true,
            },
          },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis Notas"
        description="Consulta las calificaciones obtenidas en tus cuestionarios y revisa los aciertos."
      />

      {attempts.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Aún no tienes notas"
          description="Completa tu primer cuestionario en la sección Cuestionarios para registrar tus calificaciones."
        />
      ) : (
        <GradesList attempts={attempts} />
      )}
    </div>
  );
}
