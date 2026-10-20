import { Link } from 'react-router-dom';
import Icon from './Icon';
import { cx } from '../../lib/cx';

// Button (Figma 96:193). Hover, pressed, focus and disabled are real CSS states.
// Disabled keeps the label readable and focusable: it sets aria-disabled and ignores clicks.
const PRESSED = 'active:inset-shadow-[0_2px_4px_var(--rw-brand-navy)] active:inset-shadow-brand-navy/25';

const VARIANTS = {
  primary: cx('bg-brand-navy text-text-inverse hover:bg-surface-navy-hover active:bg-surface-navy-hover', PRESSED),
  secondary: cx(
    'border-2 border-brand-navy bg-surface-white text-text-primary hover:bg-surface-navy-subtle active:bg-surface-navy-subtle',
    PRESSED,
  ),
  destructive: cx(
    'border-2 border-brand-danger bg-surface-white text-text-danger hover:bg-surface-danger-subtle active:bg-surface-danger-subtle',
    PRESSED,
  ),
};

// Disabled look is the same for every variant (text/muted on navy-subtle, 5.8:1).
const DISABLED =
  'aria-disabled:cursor-not-allowed aria-disabled:bg-surface-navy-subtle aria-disabled:text-text-muted ' +
  'aria-disabled:border-border-subtle aria-disabled:inset-shadow-none';

const SIZES = {
  web: 'h-11', // 44 px touch target
  mobile: 'h-12', // 48 px
};

export default function Button({
  variant = 'primary',
  size = 'web',
  icon,
  type = 'button',
  as,
  to,
  href,
  disabled = false,
  fullWidth = false,
  className = '',
  onClick,
  children,
  ...rest
}) {
  // A display class passed in (e.g. "hidden sm:inline-flex") replaces the default inline-flex;
  // two display utilities on one element would otherwise fight and `hidden` could lose.
  const ownDisplay = /(^|\s)(hidden|flex|block|grid|inline-block|inline-flex)(\s|$)/.test(className);
  const classes = cx(
    !ownDisplay && 'inline-flex',
    'shrink-0 items-center justify-center gap-2 rounded-rw-md px-6 type-button whitespace-nowrap no-underline transition-colors',
    SIZES[size],
    VARIANTS[variant],
    DISABLED,
    fullWidth && 'w-full',
    className,
  );

  const content = (
    <>
      {icon && <Icon name={icon} size={20} />}
      {children}
    </>
  );

  const handleClick = (event) => {
    if (disabled) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  };

  const shared = { className: classes, onClick: handleClick, 'aria-disabled': disabled || undefined, ...rest };

  // Router link, plain link, or a custom component (as={Link} also works).
  if (to) {
    const Component = as || Link;
    return (
      <Component to={to} {...shared}>
        {content}
      </Component>
    );
  }
  if (href) {
    return (
      <a href={href} {...shared}>
        {content}
      </a>
    );
  }
  if (as) {
    const Component = as;
    return <Component {...shared}>{content}</Component>;
  }
  return (
    <button type={type} {...shared}>
      {content}
    </button>
  );
}
