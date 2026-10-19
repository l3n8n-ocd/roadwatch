import Icon from './Icon';
import { statusMeta } from './statusMeta';
import { cx } from '../../lib/cx';

// In-app notification row (Figma 106:902). Render inside a <ul>.
// status: picks the icon (same as the status chip). Unread rows are blue-subtle, bold, with a dot.
// onClick: e.g. mark as read and open the report.
export default function NotificationItem({ message, time, status, read = false, onClick, className = '' }) {
  const meta = statusMeta(status);
  return (
    <li className={cx('border-b border-border-subtle', className)}>
      <button
        type="button"
        onClick={onClick}
        className={cx(
          'flex w-full items-start gap-3 p-4 text-left transition-colors',
          read ? 'bg-surface-white hover:bg-surface-light-gray' : 'bg-surface-blue-subtle hover:bg-surface-navy-subtle',
        )}
      >
        <span
          aria-hidden="true"
          className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-surface-white"
        >
          <Icon name={meta.icon} size={20} className={meta.iconColor} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className={cx('text-text-primary', read ? 'type-body' : 'type-button')}>
            {!read && <span className="sr-only">Unread: </span>}
            {message}
          </span>
          {time && <span className="type-caption text-text-muted">{time}</span>}
        </span>
        {!read && <span aria-hidden="true" className="mt-1.5 size-3 shrink-0 rounded-full bg-brand-navy" />}
      </button>
    </li>
  );
}
