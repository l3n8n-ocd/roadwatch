import Icon from './Icon';
import { cx } from '../../lib/cx';

// Shared frame for Text field, Select, Date time field and Textarea (Figma 97:178 and siblings):
// visible label row (with "Required"/"Optional"), the control, then a helper or error row.
// The error replaces the helper and is linked with aria-describedby by the field components.

export default function Field({
  id,
  label,
  required = false,
  optional = false,
  helper,
  error,
  disabled = false,
  className = '',
  children,
}) {
  const message = error || helper;
  return (
    <div className={cx('flex w-full flex-col gap-2', className)}>
      <div className={cx('flex items-center gap-2', disabled ? 'text-text-muted' : 'text-text-primary')}>
        <label htmlFor={id} className="min-w-0 flex-1 type-label">
          {label}
        </label>
        {(required || optional) && (
          <span className={cx('type-caption', !disabled && 'text-text-muted')}>
            {required ? 'Required' : 'Optional'}
          </span>
        )}
      </div>
      {children}
      {message && (
        <p
          id={`${id}-message`}
          className={cx('flex items-start gap-2 type-body-sm', error ? 'text-text-danger' : 'text-text-muted')}
        >
          <Icon name={error ? 'alert-circle' : 'info'} size={16} className="mt-0.5" />
          <span>{message}</span>
        </p>
      )}
    </div>
  );
}
