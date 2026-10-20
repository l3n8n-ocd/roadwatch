import Icon from './Icon';
import { cx } from '../../lib/cx';

// On/off switch (Figma 160:866). On = navy track + white knob with a check.
// Off = white track with a control border and a grey knob. Pass `label` (visible or not).
export default function Switch({ checked, onChange, label, disabled = false, className = '', ...rest }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cx(
        'group flex h-12 w-14 shrink-0 items-center justify-center rounded-full focus-visible:shadow-none disabled:cursor-not-allowed',
        className,
      )}
      {...rest}
    >
      <span
        className={cx(
          'relative block h-8 w-13 rounded-full transition-colors group-focus-visible:shadow-rw-focus',
          disabled
            ? 'bg-surface-navy-subtle'
            : checked
              ? 'bg-brand-navy'
              : 'border-2 border-border-control bg-surface-white',
        )}
      >
        <span
          aria-hidden="true"
          className={cx(
            'absolute flex size-6 items-center justify-center rounded-full transition-[left] duration-150 motion-reduce:transition-none',
            checked
              ? cx('top-1 left-6 bg-surface-white', disabled ? 'text-text-muted' : 'text-text-primary')
              : disabled
                ? 'top-1 left-1 bg-border-subtle'
                : 'top-0.5 left-0.5 bg-border-control',
          )}
        >
          {checked && <Icon name="check" size={16} />}
        </span>
      </span>
    </button>
  );
}
