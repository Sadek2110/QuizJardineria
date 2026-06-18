import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json, requireRole, handleRoute } from '@/lib/api';

// GET /api/grades — all attempts for the professor's quizzes.
// Optional filters: ?quizId= & ?studentId=
export async function GET(req: NextRequest) {
  return handleRoute(async () => {
    const session = await requireRole('PROFESSOR');
    const { searchParams } = new URL(req.url);
    const quizId = searchParams.get('quizId') ?? undefined;
    const studentId = searchParams.get('studentId') ?? undefined;

    const attempts = await prisma.attempt.findMany({
      where: {
        quiz: { professorId: session.sub },
        ...(quizId ? { quizId } : {}),
        ...(studentId ? { studentId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { id: true, username: true, email: true } },
        quiz: { select: { id: true, title: true } },
      },
    });

    // For the filter dropdown.
    const quizzes = await prisma.quiz.findMany({
      where: { professorId: session.sub },
      select: { id: true, title: true },
      orderBy: { createdAt: 'desc' },
    });

    return json({ attempts, quizzes });
  });
}
