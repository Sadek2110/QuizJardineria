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

export default function StudentMessagesPage() {
  const toast = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [professorContact, setProfessorContact] = useState<Contact | null>(null);
  const [currentUserId, setCurrentUserId] = useState('');
  const [loading, setLoading] = useState(true);

  // Tabs
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'INDIVIDUAL'>('GENERAL');

  // Form State
  const [content, setContent] = useState('');
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
      setCurrentUserId(data.currentUserId);
      if (data.contacts && data.contacts.length > 0) {
        setProfessorContact(data.contacts[0]); // First professor available
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

    setSending(true);
    try {
      const { message } = await apiFetch<{ message: Message }>('/api/messages', {
        method: 'POST',
        body: JSON.stringify({
          content: content.trim(),
          type: 'INDIVIDUAL',
          receiverId: professorContact?.id ?? null,
        }),
      });
      setMessages((prev) => [message, ...prev]);
      toast.success('Mensaje enviado al profesor.');
      setContent('');
      setActiveTab('INDIVIDUAL'); // Switch to private chat to see it
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setSending(false);
    }
  }

  // Filter messages based on tab selection
  const filteredMessages = messages.filter((msg) => msg.type === activeTab);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Buzón de Mensajes"
        description="Lee los comunicados oficiales del profesor o envíale mensajes privados para resolver tus dudas."
      />

      <div className="grid gap-6 md:grid-cols-5">
        {/* Send message form to Professor */}
        <div className="card md:col-span-2 h-fit space-y-4">
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            <Send className="h-4.5 w-4.5 text-brand-400" />
            Escribir al Profesor
          </h2>

          {!professorContact ? (
            <div className="flex gap-2.5 p-4 rounded-xl border border-rose-950 bg-rose-950/20 text-xs text-rose-300">
              <AlertCircle className="h-4.5 w-4.5 shrink-0" />
              <span>
                No se encuentra ningún profesor disponible en la plataforma para recibir mensajes.
              </span>
            </div>
          ) : (
            <form onSubmit={handleSend} className="space-y-4">
              <div className="text-xs text-slate-400">
                Tu mensaje se enviará a:{' '}
                <strong className="text-slate-200">
                  {professorContact.username} ({professorContact.email})
                </strong>
              </div>

              <Field label="Contenido del mensaje">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Hola profesor, tengo una duda respecto a..."
                  rows={6}
                  required
                  disabled={sending}
                  maxLength={2000}
                />
              </Field>

              <Button type="submit" className="w-full justify-center" loading={sending}>
                Enviar Mensaje Privado
              </Button>
            </form>
          )}
        </div>

        {/* Message Log tabs */}
        <div className="card md:col-span-3 space-y-4 max-h-[580px] overflow-y-auto pr-1">
          {/* Tabs Selector */}
          <div className="flex border-b border-slate-800">
            <button
              onClick={() => setActiveTab('GENERAL')}
              className={`flex-1 pb-3 text-sm font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-all duration-200 ${
                activeTab === 'GENERAL'
                  ? 'border-brand-500 text-brand-300'
                  : 'border-transparent text-slate-500 hover:text-slate-350'
              }`}
            >
              <Globe className="h-4.5 w-4.5" /> Avisos Generales
            </button>
            <button
              onClick={() => setActiveTab('INDIVIDUAL')}
              className={`flex-1 pb-3 text-sm font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-all duration-200 ${
                activeTab === 'INDIVIDUAL'
                  ? 'border-brand-500 text-brand-300'
                  : 'border-transparent text-slate-500 hover:text-slate-350'
              }`}
            >
              <MessageSquare className="h-4.5 w-4.5" /> Chat con Profesor
            </button>
          </div>

          {loading ? (
            <ListSkeleton rows={3} />
          ) : filteredMessages.length === 0 ? (
            <EmptyState
              icon={MessagesSquare}
              title={activeTab === 'GENERAL' ? 'Sin avisos generales' : 'Sin mensajes privados'}
              description={
                activeTab === 'GENERAL'
                  ? 'No hay avisos publicados para todos los alumnos en este momento.'
                  : 'Aún no has tenido conversaciones privadas con el profesor.'
              }
            />
          ) : (
            <div className="space-y-3 pt-2">
              {filteredMessages.map((msg) => {
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
                        <span className="text-slate-400 font-medium">
                          {isSentByMe ? (
                            <>Tú enviaste al Profesor</>
                          ) : (
                            <>
                              De:{' '}
                              <span className="text-slate-300 font-semibold">
                                {isGeneral ? `Prof. ${msg.sender.username}` : msg.sender.username}
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
