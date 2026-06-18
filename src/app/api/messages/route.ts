import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { json, errorResponse, requireUser, handleRoute } from '@/lib/api';

// GET /api/messages — inbox for the current user:
// general announcements + any message sent or received by me.
export async function GET() {
  return handleRoute(async () => {
    const session = await requireUser();

    const messages = await prisma.message.findMany({
      where: {
        OR: [{ type: 'GENERAL' }, { senderId: session.sub }, { receiverId: session.sub }],
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        sender: { select: { id: true, username: true, role: true } },
        receiver: { select: { id: true, username: true, role: true } },
      },
    });

    // Contacts available to compose to.
    const contacts = await prisma.user.findMany({
      where: { role: session.role === 'PROFESSOR' ? 'STUDENT' : 'PROFESSOR' },
      select: { id: true, username: true, email: true },
      orderBy: { username: 'asc' },
    });

    return json({ messages, contacts, currentUserId: session.sub });
  });
}

// POST /api/messages — send a message.
export async function POST(req: NextRequest) {
  return handleRoute(async () => {
    const session = await requireUser();
    const body = await req.json().catch(() => null);
    if (!body) return errorResponse('Cuerpo inválido.');

    const content = String(body.content ?? '').trim();
    if (content.length < 1) return errorResponse('El mensaje no puede estar vacío.');
    if (content.length > 2000) return errorResponse('El mensaje es demasiado largo.');

    const wantsGeneral = body.type === 'GENERAL';

    if (wantsGeneral) {
      if (session.role !== 'PROFESSOR') {
        return errorResponse('Solo el profesor puede enviar mensajes generales.', 403);
      }
      const message = await prisma.message.create({
        data: { content, type: 'GENERAL', senderId: session.sub, receiverId: null },
        include: {
          sender: { select: { id: true, username: true, role: true } },
          receiver: { select: { id: true, username: true, role: true } },
        },
      });
      return json({ message }, 201);
    }

    // INDIVIDUAL message — resolve and validate the receiver.
    let receiverId = body.receiverId ? String(body.receiverId) : null;

    if (session.role === 'STUDENT' && !receiverId) {
      // Default to a professor when the student doesn't pick one.
      const professor = await prisma.user.findFirst({ where: { role: 'PROFESSOR' } });
      receiverId = professor?.id ?? null;
    }

    if (!receiverId) return errorResponse('Selecciona un destinatario.');

    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) return errorResponse('El destinatario no existe.', 404);

    // Professors message students; students message professors.
    const expectedRole = session.role === 'PROFESSOR' ? 'STUDENT' : 'PROFESSOR';
    if (receiver.role !== expectedRole) {
      return errorResponse('Destinatario no válido.', 400);
    }

    const message = await prisma.message.create({
      data: { content, type: 'INDIVIDUAL', senderId: session.sub, receiverId },
      include: {
        sender: { select: { id: true, username: true, role: true } },
        receiver: { select: { id: true, username: true, role: true } },
      },
    });
    return json({ message }, 201);
  });
}
