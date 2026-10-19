import { useId, useRef } from 'react';
import Icon from './Icon';
import Field from './Field';
import { bareControlClasses, controlBoxClasses, describedBy } from './fieldStyles';
import { cx } from '../../lib/cx';

// Date or time field (Figma 97:411): a native <input type="date|time"> so typing and the
// browser picker both work. accident_date is YYYY-MM-DD, accident_time HH:MM (24 h).
// Pass max={today} to block future dates.
export default function DateTimeField({
  id,
  type = 'date',
  label,
  required = false,
  optional = false,
  helper,
  error,
  disabled = false,
  className = '',
  ...inputProps
}) {
  const autoId = useId();
  const fieldId = id || autoId;
  const inputRef = useRef(null);

  // The trailing icon opens the browser picker (keyboard users can type the value).
  const openPicker = () => {
    try {
      inputRef.current?.showPicker?.();
    } catch {
      inputRef.current?.focus();
    }
  };

  return (
    <Field
      id={fieldId}
      label={label}
      required={required}
      optional={optional}
      helper={helper}
      error={error}
      disabled={disabled}
      className={className}
    >
      <div className={cx(controlBoxClasses({ error, disabled }), 'h-12')}>
        <input
          ref={inputRef}
          id={fieldId}
          type={type}
          required={required}
          disabled={disabled}
          className={cx(
            bareControlClasses,
            '[&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-datetime-edit]:p-0',
          )}
          {...describedBy(fieldId, { helper, error })}
          {...inputProps}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-hidden="true"
          disabled={disabled}
          onClick={openPicker}
          className="flex shrink-0 items-center disabled:cursor-not-allowed"
        >
          <Icon name={type === 'time' ? 'clock' : 'calendar'} size={20} />
        </button>
      </div>
    </Field>
  );
}
