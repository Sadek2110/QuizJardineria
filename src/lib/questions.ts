import { HttpError } from './api';

export interface OptionInput {
  id?: string;
  text: string;
  isCorrect: boolean;
}

export interface QuestionInput {
  text: string;
  options: OptionInput[];
}

/**
 * Validate and normalize a question payload.
 * Rules: non-empty question text, at least 2 options, every option has text,
 * and EXACTLY one option is marked correct.
 */
export function validateQuestionInput(body: unknown): QuestionInput {
  if (!body || typeof body !== 'object') {
    throw new HttpError(400, 'Cuerpo inválido.');
  }
  const b = body as Record<string, unknown>;

  const text = String(b.text ?? '').trim();
  if (text.length < 1) {
    throw new HttpError(400, 'El enunciado de la pregunta no puede estar vacío.');
  }

  if (!Array.isArray(b.options)) {
    throw new HttpError(400, 'La pregunta debe incluir opciones de respuesta.');
  }

  const options: OptionInput[] = b.options.map((o) => {
    const opt = (o ?? {}) as Record<string, unknown>;
    return {
      id: opt.id ? String(opt.id) : undefined,
      text: String(opt.text ?? '').trim(),
      isCorrect: Boolean(opt.isCorrect),
    };
  });

  if (options.length < 2) {
    throw new HttpError(400, 'Añade al menos 2 opciones de respuesta.');
  }
  if (options.some((o) => o.text.length === 0)) {
    throw new HttpError(400, 'Todas las opciones deben tener texto.');
  }
  const correctCount = options.filter((o) => o.isCorrect).length;
  if (correctCount !== 1) {
    throw new HttpError(400, 'Debes marcar exactamente una opción como correcta.');
  }

  return { text, options };
}
