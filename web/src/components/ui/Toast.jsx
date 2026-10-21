import Icon from './Icon';
import { cx } from '../../lib/cx';

// Toast / inline alert (Figma 101:708). type: 'success' | 'error' | 'info' | 'warning'.
// Errors are announced right away (role="alert"); the others politely (role="status").
const TYPES = {
  success: { icon: 'check-circle', accent: 'bg-brand-success', iconColor: 'text-text-success' },
  error: { icon: 'x-circle', accent: 'bg-brand-danger', iconColor: 'text-text-danger' },
  info: { icon: 'info', accent: 'bg-brand-blue', iconColor: 'text-text-blue' },
  warning: { icon: 'alert-triangle', accent: 'bg-brand-amber', iconColor: 'text-text-primary' },
};

export default function Toast({ type = 'info', title, children, onClose, className = '' }) {
  const look = TYPES[type] || TYPES.info;
  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={cx(
        'flex w-full max-w-[360px] items-start gap-3 overflow-hidden rounded-rw-md border border-border-subtle bg-surface-white pr-1 shadow-rw-lg',
        // A5: slides up 16 px and fades in (only fades with reduce motion).
        'transition-[opacity,translate] duration-250 ease-out starting:translate-y-4 starting:opacity-0 motion-reduce:starting:translate-y-0',
        className,
      )}
    >
      <span aria-hidden="true" className={cx('w-1 self-stretch', look.accent)} />
      <Icon name={look.icon} size={24} className={cx('mt-4', look.iconColor)} />
      <div className="flex min-w-0 flex-1 flex-col gap-1 py-4 type-body-sm text-text-primary">
        {title && <p className="type-label">{title}</p>}
        {children && <div>{children}</div>}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className="flex size-11 shrink-0 items-center justify-center rounded-full text-text-primary hover:bg-surface-navy-subtle"
        >
          <Icon name="x" size={20} />
        </button>
      )}
    </div>
  );
}
