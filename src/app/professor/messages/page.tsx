'use client';

import { useState, useEffect } from 'react';
import { MessagesSquare, Send, Globe, MessageSquare, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/layout/DashboardShell';
import { Button } from '@/components/ui/Button';
import { Field, Textarea } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListSkeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { apiFetch } from '@/lib/client';
import { formatDateTime } from '@/lib/utils';

interface UserDetail {
  id: string;
  username: string;
  role: 'PROFESSOR' | 'STUDENT';
}

interface Message {
  id: string;
  content: string;
  type: 'GENERAL' | 'INDIVIDUAL';
  createdAt: string;
  sender: UserDetail;
  receiver: UserDetail | null;
}

interface Contact {
  id: string;
  username: string;
  email: string;
}

export default function ProfessorMessagesPage() {
  const toast = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [currentUserId, setCurrentUserId] = useState('');
  const [loading, setLoading] = useState(true);

  // Form State
  const [content, setContent] = useState('');
  const [msgType, setMsgType] = useState<'GENERAL' | 'INDIVIDUAL'>('GENERAL');
  const [selectedContactId, setSelectedContactId] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  async function fetchMessages() {
    try {
      const data = await apiFetch<{
        messages: Message[];
        contacts: Contact[];
        currentUserId: string;
      }>('/api/messages');
      setMessages(data.messages);
      setContacts(data.contacts);
      setCurrentUserId(data.currentUserId);
      if (data.contacts.length > 0) {
        setSelectedContactId(data.contacts[0].id);
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) {
      return toast.error('El mensaje no puede estar vacío.');
    }
    if (msgType === 'INDIVIDUAL' && !selectedContactId) {
      return toast.error('Debes seleccionar un destinatario.');
    }

    setSending(true);
    try {
      const { message } = await apiFetch<{ message: Message }>('/api/messages', {
        method: 'POST',
        body: JSON.stringify({
          content: content.trim(),
          type: msgType,
          receiverId: msgType === 'INDIVIDUAL' ? selectedContactId : null,
        }),
      });
      setMessages((prev) => [message, ...prev]);
      toast.success(
        msgType === 'GENERAL'
          ? 'Mensaje general enviado a todos los alumnos.'
          : 'Mensaje privado enviado.'
      );
      setContent('');
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mensajería"
        description="Envía avisos generales a toda la clase o comunícate en privado con tus alumnos."
      />

      <div className="grid gap-6 md:grid-cols-5">
        {/* Send Form */}
        <div className="card md:col-span-2 h-fit space-y-4">
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Send className="h-4.5 w-4.5 text-brand-400" />
            Redactar Mensaje
          </h2>

          <form onSubmit={handleSend} className="space-y-4">
            {/* Message Type Selector */}
            <div>
              <label className="label-base">Tipo de envío</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMsgType('GENERAL')}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 ${
                    msgType === 'GENERAL'
                      ? 'border-brand-500 bg-brand-500/10 text-brand-200 ring-2 ring-brand-500/20'
                      : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:bg-slate-800'
                  }`}
                  disabled={sending}
                >
                  <Globe className="h-4 w-4" /> General
                </button>
                <button
                  type="button"
                  onClick={() => setMsgType('INDIVIDUAL')}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 ${
                    msgType === 'INDIVIDUAL'
                      ? 'border-brand-500 bg-brand-500/10 text-brand-200 ring-2 ring-brand-500/20'
                      : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:bg-slate-800'
                  }`}
                  disabled={sending}
                >
                  <MessageSquare className="h-4 w-4" /> Privado
                </button>
              </div>
            </div>

            {/* Recipient Dropdown (Private only) */}
            {msgType === 'INDIVIDUAL' && (
              <div>
                <label htmlFor="studentSelect" className="label-base">
                  Destinatario (Alumno)
                </label>
                {contacts.length === 0 ? (
                  <div className="flex gap-2 p-3 rounded-xl border border-rose-950 bg-rose-950/20 text-xs text-rose-300">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>No hay alumnos registrados para enviarles mensajes.</span>
                  </div>
                ) : (
                  <select
                    id="studentSelect"
                    value={selectedContactId}
                    onChange={(e) => setSelectedContactId(e.target.value)}
                    className="w-full rounded-xl border border-slate-700/80 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-brand-500"
                    disabled={sending}
                  >
                    {contacts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.username} ({c.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Content Textarea */}
            <Field label="Mensaje">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Escribe tu mensaje aquí..."
                rows={5}
                required
                disabled={sending}
                maxLength={2000}
              />
            </Field>

            <Button
              type="submit"
              className="w-full justify-center"
              loading={sending}
              disabled={msgType === 'INDIVIDUAL' && contacts.length === 0}
            >
              Enviar Mensaje
            </Button>
          </form>
        </div>

        {/* Message Log */}
        <div className="card md:col-span-3 space-y-4 max-h-[580px] overflow-y-auto pr-1">
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <MessagesSquare className="h-4.5 w-4.5 text-violet-400" />
            Historial de Mensajes
          </h2>

          {loading ? (
            <ListSkeleton rows={3} />
          ) : messages.length === 0 ? (
            <EmptyState
              icon={MessagesSquare}
              title="No hay mensajes"
              description="Aún no se ha enviado ni recibido ningún mensaje en esta sección."
            />
          ) : (
            <div className="space-y-3">
              {messages.map((msg) => {
                const isSentByMe = msg.sender.id === currentUserId;
                const isGeneral = msg.type === 'GENERAL';

                return (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-2xl border text-sm transition-colors ${
                      isGeneral
                        ? 'bg-emerald-500/5 border-emerald-500/10'
                        : isSentByMe
                        ? 'bg-slate-900/60 border-slate-800'
                        : 'bg-brand-500/5 border-brand-500/10'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                      <div className="flex items-center gap-2 flex-wrap text-xs">
                        {isGeneral ? (
                          <span className="inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full border bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
                            <Globe className="h-3 w-3" /> General (Para todos)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-full border bg-indigo-500/10 border-indigo-500/20 text-indigo-400">
                            <MessageSquare className="h-3 w-3" /> Privado
                          </span>
                        )}
                        <span className="text-slate-500 font-semibold">•</span>
                        <span className="text-slate-400 font-medium">
                          {isSentByMe ? (
                            <>
                              Tú enviaste a{' '}
                              <span className="text-slate-300 font-semibold">
                                {isGeneral ? 'Todos' : msg.receiver?.username}
                              </span>
                            </>
                          ) : (
                            <>
                              De:{' '}
                              <span className="text-slate-300 font-semibold">
                                {msg.sender.username}
                              </span>
                            </>
                          )}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {formatDateTime(msg.createdAt)}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed break-words whitespace-pre-wrap">
                      {msg.content}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
