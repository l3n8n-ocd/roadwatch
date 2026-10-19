import Icon from './Icon';
import { cx } from '../../lib/cx';

// Empty, no-results, error and "video coming soon" states (Figma 101:760):
// one 40 px icon in an 80 px circle, a title, a short explanation and an optional action
// (pass a <Button> as `action`). type sets the default icon and colors.
const TYPES = {
  'no-reports': { icon: 'inbox', circle: 'bg-surface-navy-subtle text-text-primary' },
  'no-results': { icon: 'search', circle: 'bg-surface-navy-subtle text-text-primary' },
  error: { icon: 'wifi-off', circle: 'bg-surface-danger-subtle text-text-danger' },
  video: { icon: 'play-circle', circle: 'bg-surface-navy-subtle text-text-primary' },
};

export default function EmptyState({ type = 'no-reports', icon, title, description, action, className = '' }) {
  const look = TYPES[type] || TYPES['no-reports'];
  return (
    <div
      role={type === 'error' ? 'alert' : undefined}
      className={cx('mx-auto flex w-full max-w-[328px] flex-col items-center gap-4 p-8 text-center', className)}
    >
      <span aria-hidden="true" className={cx('flex size-20 items-center justify-center rounded-full', look.circle)}>
        <Icon name={icon || look.icon} size={40} />
      </span>
      <h2 className="type-h3 text-text-primary">{title}</h2>
      {description && <p className="type-body text-text-muted">{description}</p>}
      {action}
    </div>
  );
}
