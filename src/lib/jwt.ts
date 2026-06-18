import { SignJWT, jwtVerify } from 'jose';

/**
 * Edge-safe JWT helpers (jose only — no Node APIs).
 * Used both by Next.js middleware (edge runtime) and server route handlers.
 */

export type UserRole = 'PROFESSOR' | 'STUDENT';

export interface SessionPayload {
  sub: string; // user id
  username: string;
  email: string;
  role: UserRole;
}

export const SESSION_COOKIE = 'quiz_session';
const TOKEN_TTL = '7d';
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      'JWT_SECRET is missing or too short. Set a strong random value in the environment.',
    );
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({
    username: payload.username,
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(getSecretKey());
}

export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (!payload.sub || (payload.role !== 'PROFESSOR' && payload.role !== 'STUDENT')) {
      return null;
    }
    return {
      sub: payload.sub,
      username: String(payload.username ?? ''),
      email: String(payload.email ?? ''),
      role: payload.role as UserRole,
    };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  path: '/',
  secure: process.env.NODE_ENV === 'production',
  maxAge: TOKEN_TTL_SECONDS,
};
