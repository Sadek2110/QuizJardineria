import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/session';
import { TakeQuizForm } from './TakeQuizForm';

export const dynamic = 'force-dynamic';

interface Props {
  params: {
    id: string;
  };
}

export default async function TakeQuizPage({ params }: Props) {
  const session = await getSession();
  if (!session || session.role !== 'STUDENT') {
    redirect('/auth/login');
  }

  const studentId = session.sub;
  const quizId = params.id;

  // 1. Check if student already has an attempt for this quiz.
  const existing = await prisma.attempt.findUnique({
    where: {
      studentId_quizId: { studentId, quizId },
    },
  });

  if (existing) {
    // Already attempted, redirect to grades page.
    redirect('/student/grades');
  }

  // 2. Fetch the quiz details and questions without the "isCorrect" flag to prevent cheating.
  const quiz = await prisma.quiz.findFirst({
    where: {
      id: quizId,
      isActive: true,
    },
    select: {
      id: true,
      title: true,
      description: true,
      questions: {
        orderBy: { order: 'asc' },
        select: {
          id: true,
          text: true,
          options: {
            select: {
              id: true,
              text: true,
            },
          },
        },
      },
    },
  });

  if (!quiz || quiz.questions.length === 0) {
    redirect('/student/quizzes');
  }

  return <TakeQuizForm quiz={quiz} />;
}
