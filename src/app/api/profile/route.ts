import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { json, errorResponse, requireUser, handleRoute } from '@/lib/api';
import { hashPassword, verifyPassword } from '@/lib/auth';
import { signSession, SESSION_COOKIE, sessionCookieOptions } from '@/lib/jwt';

// GET /api/profile
export async function GET() {
  return handleRoute(async () => {
    const session = await requireUser();
    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { id: true, username: true, email: true, role: true, createdAt: true },
    });
    return json({ user });
  });
}

// PUT /api/profile — update username and/or password.
// Email stays read-only (it identifies the account).
export async function PUT(req: NextRequest) {
  return handleRoute(async () => {
    const session = await requireUser();
    const body = await req.json().catch(() => null);
    if (!body) return errorResponse('Cuerpo inválido.');

    const user = await prisma.user.findUnique({ where: { id: session.sub } });
    if (!user) return errorResponse('Usuario no encontrado.', 404);

    const data: { username?: string; password?: string } = {};

    if (body.username !== undefined) {
      const username = String(body.username).trim();
      if (username.length < 3) return errorResponse('El nombre de usuario es demasiado corto.');
      data.username = username;
    }

    if (body.newPassword) {
      const newPassword = String(body.newPassword);
      if (newPassword.length < 6) {
        return errorResponse('La nueva contraseña debe tener al menos 6 caracteres.');
      }
      const currentPassword = String(body.currentPassword ?? '');
      if (!(await verifyPassword(currentPassword, user.password))) {
        return errorResponse('La contraseña actual no es correcta.', 400);
      }
      data.password = await hashPassword(newPassword);
    }

    if (Object.keys(data).length === 0) {
      return errorResponse('No hay cambios que guardar.');
    }

    try {
      const updated = await prisma.user.update({
        where: { id: session.sub },
        data,
        select: { id: true, username: true, email: true, role: true, createdAt: true },
      });

      // If username changed, refresh the session token so it stays in sync.
      const res = json({ user: updated });
      if (data.username) {
        const token = await signSession({
          sub: updated.id,
          username: updated.username,
          email: updated.email,
          role: updated.role,
        });
        res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
      }
      return res;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        return errorResponse('Ese nombre de usuario ya está en uso.', 409);
      }
      throw err;
    }
  });
}
