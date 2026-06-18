import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { hashPassword, isValidEmail } from '@/lib/auth';
import { signSession, SESSION_COOKIE, sessionCookieOptions } from '@/lib/jwt';
import { json, errorResponse, handleRoute } from '@/lib/api';

export async function POST(req: NextRequest) {
  return handleRoute(async () => {
    const body = await req.json().catch(() => null);
    if (!body) return errorResponse('Cuerpo de la petición inválido.');

    const username = String(body.username ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');
    const role = body.role === 'PROFESSOR' ? 'PROFESSOR' : 'STUDENT';

    if (username.length < 3) {
      return errorResponse('El nombre de usuario debe tener al menos 3 caracteres.');
    }
    if (!isValidEmail(email)) {
      return errorResponse('Introduce un correo electrónico válido.');
    }
    if (password.length < 6) {
      return errorResponse('La contraseña debe tener al menos 6 caracteres.');
    }

    try {
      const user = await prisma.user.create({
        data: {
          username,
          email,
          password: await hashPassword(password),
          role,
        },
        select: { id: true, username: true, email: true, role: true },
      });

      const token = await signSession({
        sub: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      });

      const res = json({ user }, 201);
      res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
      return res;
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const target = (err.meta?.target as string[] | undefined)?.join(', ') ?? '';
        const field = target.includes('email') ? 'correo electrónico' : 'nombre de usuario';
        return errorResponse(`Ese ${field} ya está registrado.`, 409);
      }
      throw err;
    }
  });
}
