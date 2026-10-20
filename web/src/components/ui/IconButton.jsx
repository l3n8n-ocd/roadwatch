import { Link } from 'react-router-dom';
import Icon from './Icon';
import { cx } from '../../lib/cx';

// Icon-only button (Figma 96:261). `label` is required: it becomes the accessible name.
// tone="dark" sits on navy bars and uses the amber focus ring.
const TONES = {
  light:
    'bg-surface-white text-text-primary hover:bg-surface-navy-subtle aria-disabled:text-text-muted',
  dark:
    'bg-brand-navy text-text-inverse hover:bg-surface-navy-hover aria-disabled:text-text-inverse-muted ' +
    'focus-visible:shadow-(--rw-shadow-focus-on-dark)',
};

export default function IconButton({
  icon,
  label,
  tone = 'light',
  size = 'web',
  to,
  disabled = false,
  badge,
  type = 'button',
  className = '',
  onClick,
  ...rest
}) {
  const classes = cx(
    'relative inline-flex shrink-0 items-center justify-center rounded-full transition-colors',
    'aria-disabled:cursor-not-allowed aria-disabled:hover:bg-transparent',
    size === 'mobile' ? 'size-12' : 'size-11',
    TONES[tone],
    className,
  );

  const content = (
    <>
      <Icon name={icon} size={24} />
      {/* Optional count badge (e.g. unread notifications): amber fill, navy text. */}
      {badge ? (
        <span
          aria-hidden="true"
          className="absolute top-0.5 left-6 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-amber px-1.5 type-caption text-text-primary"
        >
          {badge > 99 ? '99+' : badge}
        </span>
      ) : null}
    </>
  );

  const name = badge ? `${label} (${badge} unread)` : label;

  if (to) {
    return (
      <Link to={to} aria-label={name} className={classes} {...rest}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      aria-label={name}
      aria-disabled={disabled || undefined}
      className={classes}
      onClick={(event) => (disabled ? event.preventDefault() : onClick?.(event))}
      {...rest}
    >
      {content}
    </button>
  );
}
