import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json, requireRole, handleRoute, HttpError } from '@/lib/api';
import { validateQuestionInput } from '@/lib/questions';

// POST /api/quizzes/[id]/questions — add a question with options to a quiz.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return handleRoute(async () => {
    const session = await requireRole('PROFESSOR');

    const quiz = await prisma.quiz.findUnique({ where: { id: params.id } });
    if (!quiz || quiz.professorId !== session.sub) {
      throw new HttpError(404, 'Cuestionario no encontrado.');
    }

    const { text, options } = validateQuestionInput(await req.json().catch(() => null));

    const last = await prisma.question.findFirst({
      where: { quizId: params.id },
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const question = await prisma.question.create({
      data: {
        text,
        quizId: params.id,
        order: (last?.order ?? -1) + 1,
        options: {
          create: options.map((o) => ({ text: o.text, isCorrect: o.isCorrect })),
        },
      },
      include: { options: true },
    });

    return json({ question }, 201);
  });
}
