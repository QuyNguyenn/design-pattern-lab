import { useEffect, useRef } from 'react';

export interface Confirmation {
  title: string;
  body: string;
  action: string;
  run: () => void;
  danger?: boolean;
}

interface ConfirmDialogProps {
  confirmation: Confirmation;
  onClose: () => void;
}

export function ConfirmDialog({ confirmation, onClose }: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.showModal();
    return () => {
      ref.current?.close();
      previous?.focus();
    };
  }, []);

  return (
    <dialog ref={ref} onCancel={onClose} aria-labelledby="confirm-title">
      <h2 id="confirm-title">{confirmation.title}</h2>
      <p>{confirmation.body}</p>
      <div className="dialog-actions">
        <button className="button secondary" autoFocus onClick={onClose}>
          Cancel
        </button>
        <button
          className={`button ${confirmation.danger ? 'danger' : 'primary'}`}
          onClick={() => {
            confirmation.run();
            onClose();
          }}
        >
          {confirmation.action}
        </button>
      </div>
    </dialog>
  );
}
