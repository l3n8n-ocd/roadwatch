import { cx } from '../../lib/cx';

// Single-select radio for table rows (Figma Components → Radio 527:4123, Users & settings toolbar #55).
// A native input, so arrow keys move the selection inside the group; pair it with a visible row highlight.
export default function Radio({ checked, onChange, name, label, className = '' }) {
  return (
    <span className={cx('relative inline-flex h-11 w-11 items-center justify-center', className)}>
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        aria-label={label}
        className="peer absolute inset-0 cursor-pointer opacity-0"
      />
      <span
        aria-hidden="true"
        className={cx(
          'flex h-5 w-5 items-center justify-center rounded-full border-2 bg-surface-white peer-focus-visible:shadow-rw-focus',
          checked ? 'border-brand-navy' : 'border-border-control',
        )}
      >
        {checked && <span className="h-2.5 w-2.5 rounded-full bg-brand-navy" />}
      </span>
    </span>
  );
}
