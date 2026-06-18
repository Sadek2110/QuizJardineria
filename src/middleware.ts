import { NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/lib/jwt';

/**
 * Route protection with role-based access control.
 *  - /professor/*  -> only PROFESSOR
 *  - /student/*    -> only STUDENT
 *  - /auth/*       -> redirect already-authenticated users to their dashboard
 * Unauthenticated users are sent to /auth/login (with a callback target).
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);

  const dashboardFor = (role: string) =>
    role === 'PROFESSOR' ? '/professor' : '/student';

  // Authenticated users shouldn't see login/register.
  if (pathname.startsWith('/auth')) {
    if (session) {
      return NextResponse.redirect(new URL(dashboardFor(session.role), req.url));
    }
    return NextResponse.next();
  }

  const isProfessorArea = pathname.startsWith('/professor');
  const isStudentArea = pathname.startsWith('/student');

  if (!isProfessorArea && !isStudentArea) {
    return NextResponse.next();
  }

  if (!session) {
    const loginUrl = new URL('/auth/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isProfessorArea && session.role !== 'PROFESSOR') {
    return NextResponse.redirect(new URL('/student', req.url));
  }

  if (isStudentArea && session.role !== 'STUDENT') {
    return NextResponse.redirect(new URL('/professor', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/professor/:path*', '/student/:path*', '/auth/:path*'],
};
