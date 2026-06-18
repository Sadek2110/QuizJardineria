'use client';

import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

export function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = 'max-w-lg',
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in-fast"
        onClick={onClose}
      />
      <div
        className={`relative z-10 w-full ${maxWidth} animate-scale-in rounded-2xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl`}
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-4 flex items-center justify-between">
          {title && <h3 className="text-lg font-semibold text-slate-100">{title}</h3>}
          <button
            onClick={onClose}
            className="ml-auto text-slate-500 transition-colors hover:text-slate-200"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = '¿Estás seguro?',
  description,
  confirmLabel = 'Confirmar',
  loading = false,
  danger = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  loading?: boolean;
  danger?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-md">
      {description && <p className="text-sm text-slate-400">{description}</p>}
      <div className="mt-6 flex justify-end gap-3">
        <button className="btn-secondary" onClick={onClose} disabled={loading}>
          Cancelar
        </button>
        <button
          className={danger ? 'btn-danger' : 'btn-primary'}
          onClick={onConfirm}
          disabled={loading}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
