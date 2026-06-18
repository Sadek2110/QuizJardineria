import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { json, errorResponse, requireRole, handleRoute, HttpError } from '@/lib/api';
import { isValidEmail } from '@/lib/auth';
import { cacheDel } from '@/lib/redis';

async function getStudent(id: string) {
  const student = await prisma.user.findUnique({ where: { id } });
  if (!student || student.role !== 'STUDENT') {
    throw new HttpError(404, 'Alumno no encontrado.');
  }
  return student;
}

// GET /api/students/[id] — student detail with full attempt history.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  return handleRoute(async () => {
    const session = await requireRole('PROFESSOR');
    await getStudent(params.id);

    const student = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        attempts: {
          where: { quiz: { professorId: session.sub } },
          orderBy: { createdAt: 'desc' },
          include: { quiz: { select: { id: true, title: true } } },
        },
      },
    });

    return json({ student });
  });
}

// PUT /api/students/[id] — edit basic student data.
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  return handleRoute(async () => {
    await requireRole('PROFESSOR');
    await getStudent(params.id);

    const body = await req.json().catch(() => null);
    if (!body) return errorResponse('Cuerpo inválido.');

    const data: { username?: string; email?: string } = {};
    if (body.username !== undefined) {
      const username = String(body.username).trim();
      if (username.length < 3) return errorResponse('El nombre de usuario es demasiado corto.');
      data.username = username;
    }
    if (body.email !== undefined) {
      const email = String(body.email).trim().toLowerCase();
      if (!isValidEmail(email)) return errorResponse('Correo electrónico no válido.');
      data.email = email;
    }

    try {
      const student = await prisma.user.update({
        where: { id: params.id },
        data,
        select: { id: true, username: true, email: true, createdAt: true },
      });
      return json({ student });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        return errorResponse('Ese usuario o correo ya está en uso.', 409);
      }
      throw err;
    }
  });
}

// DELETE /api/students/[id]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  return handleRoute(async () => {
    const session = await requireRole('PROFESSOR');
    await getStudent(params.id);
    await prisma.user.delete({ where: { id: params.id } });
    await cacheDel(`prof:stats:${session.sub}`);
    return json({ ok: true });
  });
}
