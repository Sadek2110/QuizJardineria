import { NextResponse } from 'next/server';
import { getSession } from './session';
import type { SessionPayload, UserRole } from './jwt';

/** Error type that route handlers can throw and `handleRoute` turns into a response. */
export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function json<T>(data: T, status = 200): NextResponse {
  return NextResponse.json(data, { status });
}

export function errorResponse(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/** Ensure a user is authenticated. Throws HttpError(401) otherwise. */
export async function requireUser(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new HttpError(401, 'No autenticado.');
  return session;
}

/** Ensure the authenticated user has a specific role. */
export async function requireRole(role: UserRole): Promise<SessionPayload> {
  const session = await requireUser();
  if (session.role !== role) throw new HttpError(403, 'No tienes permisos para esta acción.');
  return session;
}

/**
 * Wrap a route handler so thrown HttpErrors and unexpected errors are
 * converted into clean JSON responses.
 */
export function handleRoute(
  fn: () => Promise<NextResponse>,
): Promise<NextResponse> {
  return fn().catch((err: unknown) => {
    if (err instanceof HttpError) {
      return errorResponse(err.message, err.status);
    }
    console.error('[api] Unhandled error:', err);
    return errorResponse('Error interno del servidor.', 500);
  });
}
