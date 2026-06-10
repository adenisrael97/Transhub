'use client';

import { AlertTriangle, AlertCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title         = 'Confirm Action',
  message       = 'Are you sure you want to continue?',
  confirmLabel  = 'Confirm',
  cancelLabel   = 'Cancel',
  variant       = 'danger',
  loading       = false,
}) {
  const isDanger = variant === 'danger';
  const Icon = isDanger ? AlertCircle : AlertTriangle;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm" hideClose>
      <div className="text-center py-2">
        <div className={`w-14 h-14 mx-auto mb-4 rounded-full flex items-center justify-center ${isDanger ? 'bg-red-50' : 'bg-amber-50'}`}>
          <Icon size={28} className={isDanger ? 'text-[#DC2626]' : 'text-[#D97706]'} />
        </div>
        <p className="text-sm text-[#475569] leading-relaxed mb-6">{message}</p>
        <div className="flex gap-3">
          <Button fullWidth variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button fullWidth variant={variant} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
