import { prisma } from '@/lib/prisma';
import { json, requireUser, handleRoute } from '@/lib/api';

export async function GET() {
  return handleRoute(async () => {
    const session = await requireUser();
    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { id: true, username: true, email: true, role: true, createdAt: true },
    });
    if (!user) {
      const res = json({ error: 'Usuario no encontrado.' }, 401);
      res.cookies.set('quiz_session', '', { path: '/', maxAge: 0 });
      return res;
    }
    return json({ user });
  });
}
