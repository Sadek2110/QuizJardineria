import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json, errorResponse, requireRole, handleRoute, HttpError } from '@/lib/api';
import { cacheDel } from '@/lib/redis';

async function getOwnedQuiz(quizId: string, professorId: string) {
  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz || quiz.professorId !== professorId) {
    throw new HttpError(404, 'Cuestionario no encontrado.');
  }
  return quiz;
}

// GET /api/quizzes/[id] — full quiz with questions and options (owner only).
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  return handleRoute(async () => {
    const session = await requireRole('PROFESSOR');
    await getOwnedQuiz(params.id, session.sub);

    const quiz = await prisma.quiz.findUnique({
      where: { id: params.id },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: { options: true },
        },
        _count: { select: { attempts: true } },
      },
    });
    return json({ quiz });
  });
}

// PUT /api/quizzes/[id] — update fields.
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  return handleRoute(async () => {
    const session = await requireRole('PROFESSOR');
    await getOwnedQuiz(params.id, session.sub);

    const body = await req.json().catch(() => null);
    if (!body) return errorResponse('Cuerpo inválido.');

    const data: { title?: string; description?: string | null; isActive?: boolean } = {};
    if (body.title !== undefined) {
      const title = String(body.title).trim();
      if (title.length < 3) return errorResponse('El título debe tener al menos 3 caracteres.');
      data.title = title;
    }
    if (body.description !== undefined) {
      data.description = body.description ? String(body.description).trim() : null;
    }
    if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);

    const quiz = await prisma.quiz.update({
      where: { id: params.id },
      data,
      include: { _count: { select: { questions: true, attempts: true } } },
    });

    await cacheDel(`prof:stats:${session.sub}`);
    return json({ quiz });
  });
}

// PATCH /api/quizzes/[id] — quick active/inactive toggle.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  return handleRoute(async () => {
    const session = await requireRole('PROFESSOR');
    const current = await getOwnedQuiz(params.id, session.sub);

    const body = await req.json().catch(() => ({}));
    const isActive = body.isActive !== undefined ? Boolean(body.isActive) : !current.isActive;

    // Prevent activating a quiz with no questions.
    if (isActive) {
      const count = await prisma.question.count({ where: { quizId: params.id } });
      if (count === 0) {
        return errorResponse('Añade al menos una pregunta antes de activar el cuestionario.');
      }
    }

    const quiz = await prisma.quiz.update({
      where: { id: params.id },
      data: { isActive },
      include: { _count: { select: { questions: true, attempts: true } } },
    });

    await cacheDel(`prof:stats:${session.sub}`);
    return json({ quiz });
  });
}

// DELETE /api/quizzes/[id]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  return handleRoute(async () => {
    const session = await requireRole('PROFESSOR');
    await getOwnedQuiz(params.id, session.sub);
    await prisma.quiz.delete({ where: { id: params.id } });
    await cacheDel(`prof:stats:${session.sub}`);
    return json({ ok: true });
  });
}
