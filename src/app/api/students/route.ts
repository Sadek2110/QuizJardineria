import { prisma } from '@/lib/prisma';
import { json, requireRole, handleRoute } from '@/lib/api';

// GET /api/students — list students with attempt counts / average grade
// (scoped to attempts on this professor's quizzes).
export async function GET() {
  return handleRoute(async () => {
    const session = await requireRole('PROFESSOR');

    const [students, grouped] = await Promise.all([
      prisma.user.findMany({
        where: { role: 'STUDENT' },
        select: { id: true, username: true, email: true, createdAt: true },
        orderBy: { username: 'asc' },
      }),
      prisma.attempt.groupBy({
        by: ['studentId'],
        where: { quiz: { professorId: session.sub } },
        _count: { _all: true },
        _avg: { score: true },
      }),
    ]);

    const byStudent = new Map(grouped.map((g) => [g.studentId, g]));

    const result = students.map((s) => {
      const agg = byStudent.get(s.id);
      return {
        ...s,
        attemptsCount: agg?._count._all ?? 0,
        averageGrade: agg?._avg.score != null ? Math.round(agg._avg.score * 100) / 100 : null,
      };
    });

    return json({ students: result });
  });
}
