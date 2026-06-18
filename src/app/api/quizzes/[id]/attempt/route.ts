import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json, errorResponse, requireRole, handleRoute, HttpError } from '@/lib/api';
import { acquireLock, releaseLock } from '@/lib/redis';

// POST /api/quizzes/[id]/attempt — Student submits a quiz attempt.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  return handleRoute(async () => {
    const session = await requireRole('STUDENT');
    const studentId = session.sub;
    const quizId = params.id;

    // Concurrency check: lock attempt creation for this student and quiz.
    const lockKey = `quiz:attempt:lock:${studentId}:${quizId}`;
    const acquired = await acquireLock(lockKey, 15000);
    if (!acquired) {
      throw new HttpError(429, 'Ya hay un envío en proceso para este cuestionario.');
    }

    try {
      // 1. Check if the attempt already exists.
      const existing = await prisma.attempt.findUnique({
        where: {
          studentId_quizId: { studentId, quizId },
        },
      });
      if (existing) {
        throw new HttpError(400, 'Ya has realizado este cuestionario.');
      }

      // 2. Load the quiz questions and correct answers.
      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId, isActive: true },
        include: {
          questions: {
            orderBy: { order: 'asc' },
            include: { options: true },
          },
        },
      });

      if (!quiz) {
        throw new HttpError(404, 'El cuestionario no existe o no está activo.');
      }

      const totalQuestions = quiz.questions.length;
      if (totalQuestions === 0) {
        throw new HttpError(400, 'Este cuestionario no tiene preguntas.');
      }

      // 3. Parse and validate the student answers payload.
      const body = await req.json().catch(() => null);
      if (!body || !Array.isArray(body.answers)) {
        throw new HttpError(400, 'Cuerpo de petición inválido. Se requiere un array de "answers".');
      }

      const studentAnswers = body.answers as Array<{ questionId: string; optionId: string }>;

      // 4. Calculate score.
      let correctCount = 0;
      const answersData: Array<{ questionId: string; optionId: string }> = [];

      for (const question of quiz.questions) {
        const studentAns = studentAnswers.find((sa) => sa.questionId === question.id);
        if (!studentAns) {
          throw new HttpError(400, `Falta la respuesta para la pregunta: "${question.text.slice(0, 30)}..."`);
        }

        const selectedOption = question.options.find((o) => o.id === studentAns.optionId);
        if (!selectedOption) {
          throw new HttpError(400, `Opción seleccionada inválida para la pregunta: "${question.text.slice(0, 30)}..."`);
        }

        if (selectedOption.isCorrect) {
          correctCount++;
        }

        answersData.push({
          questionId: question.id,
          optionId: selectedOption.id,
        });
      }

      // Final grade calculated out of 10, rounded to 2 decimals.
      const rawScore = (correctCount / totalQuestions) * 10;
      const finalScore = Math.round(rawScore * 100) / 100;

      // 5. Store Attempt and Answers inside a transaction.
      const attempt = await prisma.$transaction(async (tx) => {
        // Double-check inside the transaction to avoid race conditions.
        const doubleCheck = await tx.attempt.findUnique({
          where: {
            studentId_quizId: { studentId, quizId },
          },
        });
        if (doubleCheck) {
          throw new HttpError(400, 'Ya has realizado este cuestionario.');
        }

        return tx.attempt.create({
          data: {
            studentId,
            quizId,
            score: finalScore,
            correctAnswersCount: correctCount,
            totalQuestionsCount: totalQuestions,
            answers: {
              create: answersData,
            },
          },
          include: {
            quiz: { select: { title: true } },
          },
        });
      });

      return json({ attempt }, 201);
    } finally {
      await releaseLock(lockKey);
    }
  });
}
