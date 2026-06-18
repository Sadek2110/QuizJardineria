import { cookies } from 'next/headers';
import { SESSION_COOKIE, verifySession, type SessionPayload } from './jwt';

/**
 * Read and verify the current session from the request cookies.
 * Safe to call from Server Components and Route Handlers (Node runtime).
 */
export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifySession(token);
}

export type { SessionPayload };
