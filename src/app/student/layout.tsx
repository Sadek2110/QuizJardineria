import { redirect } from 'next/navigation';
import {
  LayoutDashboard,
  ClipboardList,
  BarChart3,
  MessagesSquare,
  UserCog,
} from 'lucide-react';
import { getSession } from '@/lib/session';
import { DashboardShell, type NavItem } from '@/components/layout/DashboardShell';

const navItems: NavItem[] = [
  { href: '/student', label: 'Inicio', icon: LayoutDashboard, exact: true },
  { href: '/student/quizzes', label: 'Cuestionarios', icon: ClipboardList },
  { href: '/student/grades', label: 'Mis notas', icon: BarChart3 },
  { href: '/student/messages', label: 'Mensajes', icon: MessagesSquare },
  { href: '/student/profile', label: 'Perfil', icon: UserCog },
];

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/auth/login');
  if (session.role !== 'STUDENT') redirect('/professor');

  return (
    <DashboardShell navItems={navItems} user={session}>
      {children}
    </DashboardShell>
  );
}
