import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth';
import { signSession, SESSION_COOKIE, sessionCookieOptions } from '@/lib/jwt';
import { json, errorResponse, handleRoute } from '@/lib/api';

export async function POST(req: NextRequest) {
  return handleRoute(async () => {
    const body = await req.json().catch(() => null);
    if (!body) return errorResponse('Cuerpo de la petición inválido.');

    const identifier = String(body.email ?? body.identifier ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');

    if (!identifier || !password) {
      return errorResponse('Introduce tus credenciales.');
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });

    // Constant-ish response to avoid leaking which field was wrong.
    if (!user || !(await verifyPassword(password, user.password))) {
      return errorResponse('Credenciales incorrectas.', 401);
    }

    const token = await signSession({
      sub: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });

    const res = json({
      user: { id: user.id, username: user.username, email: user.email, role: user.role },
    });
    res.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return res;
  });
}
