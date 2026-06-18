import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { DashboardShell, type NavItem } from '@/components/layout/DashboardShell';

const navItems: NavItem[] = [
  { href: '/professor', label: 'Dashboard', icon: 'LayoutDashboard', exact: true },
  { href: '/professor/quizzes', label: 'Cuestionarios', icon: 'ClipboardList' },
  { href: '/professor/grades', label: 'Notas', icon: 'BarChart3' },
  { href: '/professor/students', label: 'Alumnos', icon: 'Users' },
  { href: '/professor/messages', label: 'Mensajes', icon: 'MessagesSquare' },
  { href: '/professor/profile', label: 'Perfil', icon: 'UserCog' },
];

export default async function ProfessorLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/auth/login');
  if (session.role !== 'PROFESSOR') redirect('/student');

  return (
    <DashboardShell navItems={navItems} user={session}>
      {children}
    </DashboardShell>
  );
}
