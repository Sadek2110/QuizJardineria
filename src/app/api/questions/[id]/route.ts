import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json, requireRole, handleRoute, HttpError } from '@/lib/api';
import { validateQuestionInput } from '@/lib/questions';

async function getOwnedQuestion(questionId: string, professorId: string) {
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: { quiz: true, options: true },
  });
  if (!question || question.quiz.professorId !== professorId) {
    throw new HttpError(404, 'Pregunta no encontrada.');
  }
  return question;
}

// PUT /api/questions/[id] — update text and options (in-place merge to keep
// existing answer references intact where possible).
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  return handleRoute(async () => {
    const session = await requireRole('PROFESSOR');
    const existing = await getOwnedQuestion(params.id, session.sub);

    const { text, options } = validateQuestionInput(await req.json().catch(() => null));

    const incomingIds = new Set(options.filter((o) => o.id).map((o) => o.id as string));
    const toDelete = existing.options.filter((o) => !incomingIds.has(o.id)).map((o) => o.id);

    await prisma.$transaction(async (tx) => {
      await tx.question.update({ where: { id: params.id }, data: { text } });

      if (toDelete.length) {
        await tx.option.deleteMany({ where: { id: { in: toDelete } } });
      }

      for (const opt of options) {
        if (opt.id && existing.options.some((e) => e.id === opt.id)) {
          await tx.option.update({
            where: { id: opt.id },
            data: { text: opt.text, isCorrect: opt.isCorrect },
          });
        } else {
          await tx.option.create({
            data: { text: opt.text, isCorrect: opt.isCorrect, questionId: params.id },
          });
        }
      }
    });

    const question = await prisma.question.findUnique({
      where: { id: params.id },
      include: { options: true },
    });
    return json({ question });
  });
}

// DELETE /api/questions/[id]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  return handleRoute(async () => {
    const session = await requireRole('PROFESSOR');
    await getOwnedQuestion(params.id, session.sub);
    await prisma.question.delete({ where: { id: params.id } });
    return json({ ok: true });
  });
}
