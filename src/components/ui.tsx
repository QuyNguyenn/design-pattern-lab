import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Language } from '../types.ts';

export interface Confirmation {
  title: string;
  body: string;
  action: string;
  run: () => void;
  danger?: boolean;
}

export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, ReactNode> = {
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    book: (
      <>
        <path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Z" />
        <path d="M12 5v15" />
      </>
    ),
    chart: (
      <>
        <path d="M4 3v17h17M9 16v-5M14 16V7M19 16V3" />
      </>
    ),
    settings: (
      <>
        <path d="M4 7h16M4 17h16" />
        <circle cx="9" cy="7" r="3" />
        <circle cx="16" cy="17" r="3" />
      </>
    ),
    arrow: <path d="M5 12h14m-6-6 6 6-6 6" />,
    shuffle: (
      <>
        <path d="m3 5 3 0c5 0 7 14 12 14h3m-4-4 4 4-4 3M3 19h3c2 0 3-3 4-5M14 9c1-3 2-4 4-4h3m-4-3 4 3-4 4" />
      </>
    ),
    bookmark: <path d="M6 3h12v18l-6-4-6 4V3Z" />,
    check: <path d="m5 12 4 4L19 6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    code: (
      <>
        <path d="m8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18" />
      </>
    ),
    reset: (
      <>
        <path d="M4 8a8 8 0 1 1-1 7M4 3v5h5" />
      </>
    ),
    target: (
      <>
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="1" />
      </>
    ),
    external: (
      <>
        <path d="M14 3h7v7m0-7L10 14M10 3H4v17h17v-6" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] ?? paths.grid}
    </svg>
  );
}
export function LanguageSwitch({
  value,
  onChange,
}: {
  value: Language;
  onChange: (language: Language) => void;
}) {
  return (
    <div className="segmented" role="group" aria-label="Code language">
      {(['typescript', 'java'] as const).map((lang) => (
        <button
          key={lang}
          aria-pressed={value === lang}
          className={value === lang ? 'selected' : ''}
          onClick={() => onChange(lang)}
        >
          {lang === 'java' ? 'Java' : 'TypeScript'}
        </button>
      ))}
    </div>
  );
}
export function Meter({ value, total }: { value: number; total: number }) {
  return (
    <div
      className="meter"
      role="progressbar"
      aria-label="Questions studied"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={value}
    >
      <span style={{ width: `${total ? (value / total) * 100 : 0}%` }} />
    </div>
  );
}
export function Stat({
  label,
  value,
  suffix,
  icon,
  note,
  onClick,
}: {
  label: string;
  value: string;
  suffix?: string;
  icon: string;
  note: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <div className="stat-top">
        <span>{label}</span>
        <Icon name={icon} size={18} />
      </div>
      <div className="stat-value">
        {value}
        <small>{suffix}</small>
      </div>
      <p>{note}</p>
    </>
  );
  return onClick ? (
    <button className="stat-card clickable" onClick={onClick}>
      {content}
    </button>
  ) : (
    <div className="stat-card">{content}</div>
  );
}
export function ModeCard({
  icon,
  tone,
  title,
  label,
  text,
  action,
  onClick,
}: {
  icon: string;
  tone: string;
  title: string;
  label: string;
  text: string;
  action: string;
  onClick: () => void;
}) {
  return (
    <article className="mode-card panel">
      <div className="mode-top">
        <span className={`mode-icon ${tone}`}>
          <Icon name={icon} size={23} />
        </span>
        <span>{label}</span>
      </div>
      <h3>{title}</h3>
      <p>{text}</p>
      <button className="text-button" onClick={onClick}>
        {action}
        <Icon name="arrow" size={17} />
      </button>
    </article>
  );
}

export function ConfirmDialog({
  confirmation,
  onClose,
}: {
  confirmation: Confirmation;
  onClose: () => void;
}) {
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
