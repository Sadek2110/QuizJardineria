import { prisma } from '@/lib/prisma';
import { json, requireRole, handleRoute } from '@/lib/api';
import { cacheGet, cacheSet } from '@/lib/redis';

interface ProfessorStats {
  totalQuizzes: number;
  activeQuizzes: number;
  totalStudents: number;
  totalAttempts: number;
  averageGrade: number | null;
}

// GET /api/professor/stats — dashboard metrics + recent submissions.
// Aggregations are cached in Redis with a short TTL.
export async function GET() {
  return handleRoute(async () => {
    const session = await requireRole('PROFESSOR');
    const cacheKey = `prof:stats:${session.sub}`;

    let stats = await cacheGet<ProfessorStats>(cacheKey);

    if (!stats) {
      const [totalQuizzes, activeQuizzes, totalStudents, attemptAgg] = await Promise.all([
        prisma.quiz.count({ where: { professorId: session.sub } }),
        prisma.quiz.count({ where: { professorId: session.sub, isActive: true } }),
        prisma.user.count({ where: { role: 'STUDENT' } }),
        prisma.attempt.aggregate({
          where: { quiz: { professorId: session.sub } },
          _count: { _all: true },
          _avg: { score: true },
        }),
      ]);

      stats = {
        totalQuizzes,
        activeQuizzes,
        totalStudents,
        totalAttempts: attemptAgg._count._all,
        averageGrade: attemptAgg._avg.score
          ? Math.round(attemptAgg._avg.score * 100) / 100
          : null,
      };
      await cacheSet(cacheKey, stats, 20);
    }

    // Recent submissions are not cached (cheap, ordered fetch).
    const recent = await prisma.attempt.findMany({
      where: { quiz: { professorId: session.sub } },
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: {
        student: { select: { username: true, email: true } },
        quiz: { select: { title: true } },
      },
    });

    return json({ stats, recent });
  });
}
