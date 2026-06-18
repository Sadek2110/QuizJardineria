'use client';

import { useState, useEffect } from 'react';
import { User, Key, Mail, Calendar, GraduationCap } from 'lucide-react';
import { PageHeader } from '@/components/layout/DashboardShell';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import { apiFetch } from '@/lib/client';
import { formatDate } from '@/lib/utils';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: 'PROFESSOR' | 'STUDENT';
  createdAt: string;
}

export default function StudentProfilePage() {
  const toast = useToast();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [username, setUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const data = await apiFetch<{ user: UserProfile }>('/api/profile');
      setUser(data.user);
      setUsername(data.user.username);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    if (username.trim().length < 3) {
      return toast.error('El nombre de usuario debe tener al menos 3 caracteres.');
    }
    setSavingProfile(true);
    try {
      const { user: updated } = await apiFetch<{ user: UserProfile }>('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({ username: username.trim() }),
      });
      setUser(updated);
      toast.success('Perfil actualizado correctamente.');
      // Reload page to refresh shell initials/session data
      window.location.reload();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) {
      return toast.error('La nueva contraseña debe tener al menos 6 caracteres.');
    }
    if (newPassword !== confirmPassword) {
      return toast.error('Las contraseñas nuevas no coinciden.');
    }
    setSavingPassword(true);
    try {
      await apiFetch('/api/profile', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      toast.success('Contraseña cambiada con éxito.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return (
      <div className="card space-y-4 animate-pulse">
        <div className="h-6 w-1/4 rounded bg-slate-800" />
        <div className="h-4 w-1/3 rounded bg-slate-800" />
        <div className="h-32 rounded bg-slate-800" />
      </div>
    );
  }

  const roleLabel = user?.role === 'PROFESSOR' ? 'Profesor' : 'Alumno';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mi Perfil"
        description="Gestiona la información de tu cuenta y opciones de seguridad."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info card */}
        <div className="card space-y-5 h-fit">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 font-bold text-white text-xl shadow-glow">
              {user ? user.username.slice(0, 2).toUpperCase() : ''}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{user?.username}</h2>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 px-2.5 py-0.5 text-xs text-brand-300 mt-1 font-semibold">
                <GraduationCap className="h-3.5 w-3.5" /> {roleLabel}
              </span>
            </div>
          </div>

          <div className="border-t border-slate-850/80 pt-4 space-y-3.5 text-sm">
            <div className="flex items-center gap-2.5 text-slate-400">
              <Mail className="h-4.5 w-4.5 text-slate-500" />
              <span className="truncate">{user?.email}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-400">
              <Calendar className="h-4.5 w-4.5 text-slate-500" />
              <span>Miembro desde el {user ? formatDate(user.createdAt) : ''}</span>
            </div>
          </div>
        </div>

        {/* Edit forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Edit username */}
          <div className="card space-y-4">
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <User className="h-4.5 w-4.5 text-brand-400" />
              Datos personales
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nombre de usuario">
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={savingProfile}
                  />
                </Field>
                <Field label="Correo electrónico (No modificable)" hint="El correo identifica tu cuenta de forma única.">
                  <Input
                    type="email"
                    value={user?.email || ''}
                    readOnly
                    disabled
                    className="opacity-50 select-none bg-slate-900 border-slate-800"
                  />
                </Field>
              </div>
              <div className="flex justify-end">
                <Button type="submit" loading={savingProfile}>
                  Guardar cambios
                </Button>
              </div>
            </form>
          </div>

          {/* Change password */}
          <div className="card space-y-4">
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              <Key className="h-4.5 w-4.5 text-violet-400" />
              Seguridad (Cambiar contraseña)
            </h3>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Contraseña actual">
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required={!!newPassword}
                    placeholder="••••••••"
                    disabled={savingPassword}
                  />
                </Field>
                <Field label="Nueva contraseña">
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required={!!currentPassword}
                    placeholder="Mínimo 6 caracteres"
                    disabled={savingPassword}
                  />
                </Field>
                <Field label="Confirmar nueva contraseña">
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required={!!newPassword}
                    placeholder="Confirmar..."
                    disabled={savingPassword}
                  />
                </Field>
              </div>
              <div className="flex justify-end">
                <Button type="submit" loading={savingPassword}>
                  Actualizar contraseña
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
