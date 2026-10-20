import Icon from './Icon';
import { useTheme } from '../../context/ThemeContext';
import { cx } from '../../lib/cx';

// Light/Dark switch for the web top bars (Figma 202:994), the only theme control on web.
// The knob shows the current theme (sun = Light, moon = Dark); 56 x 44 hit area.
export default function ThemeSwitch({ className = '' }) {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Dark mode"
      onClick={toggle}
      className={cx('group flex h-11 w-14 shrink-0 items-center rounded-full focus-visible:shadow-none', className)}
    >
      <span
        className={cx(
          'relative block h-8 w-14 rounded-full border transition-colors group-focus-visible:shadow-rw-focus',
          dark ? 'border-brand-blue bg-brand-blue text-text-inverse' : 'border-border-control bg-surface-light-gray text-text-muted',
        )}
      >
        <Icon name="sun" size={16} className="absolute top-[7px] left-[7px]" />
        <Icon name="moon" size={16} className="absolute top-[7px] left-[31px]" />
        <span
          aria-hidden="true"
          className={cx(
            'absolute top-[3px] flex size-6 items-center justify-center rounded-full bg-surface-white text-text-primary shadow-rw-sm',
            'transition-[left] duration-150 motion-reduce:transition-none',
            dark ? 'left-[27px]' : 'left-[3px] border border-border-control',
          )}
        >
          <Icon name={dark ? 'moon' : 'sun'} size={16} />
        </span>
      </span>
    </button>
  );
}
