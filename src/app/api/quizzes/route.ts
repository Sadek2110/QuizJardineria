import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json, errorResponse, requireRole, handleRoute } from '@/lib/api';
import { cacheDel } from '@/lib/redis';

// GET /api/quizzes — list quizzes owned by the current professor.
export async function GET() {
  return handleRoute(async () => {
    const session = await requireRole('PROFESSOR');
    const quizzes = await prisma.quiz.findMany({
      where: { professorId: session.sub },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { questions: true, attempts: true } },
      },
    });
    return json({ quizzes });
  });
}

// POST /api/quizzes — create a new quiz.
export async function POST(req: NextRequest) {
  return handleRoute(async () => {
    const session = await requireRole('PROFESSOR');
    const body = await req.json().catch(() => null);
    if (!body) return errorResponse('Cuerpo inválido.');

    const title = String(body.title ?? '').trim();
    const description = body.description ? String(body.description).trim() : null;
    const isActive = Boolean(body.isActive);

    if (title.length < 3) {
      return errorResponse('El título debe tener al menos 3 caracteres.');
    }

    const quiz = await prisma.quiz.create({
      data: { title, description, isActive, professorId: session.sub },
      include: { _count: { select: { questions: true, attempts: true } } },
    });

    await cacheDel(`prof:stats:${session.sub}`);
    return json({ quiz }, 201);
  });
}
