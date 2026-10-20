import { useId } from 'react';
import Icon from './Icon';
import Field from './Field';
import { bareControlClasses, controlBoxClasses, describedBy } from './fieldStyles';
import { cx } from '../../lib/cx';

// Select (Figma 97:279) as a styled native <select>, so the platform list, keyboard and screen
// reader support come for free. options: [{ value, label }] or pass <option> children.
export default function Select({
  id,
  label,
  options,
  placeholder,
  required = false,
  optional = false,
  helper,
  error,
  disabled = false,
  className = '',
  value,
  children,
  ...selectProps
}) {
  const autoId = useId();
  const fieldId = id || autoId;
  const empty = value === '' || value == null;
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
      <div className={cx(controlBoxClasses({ error, disabled }), 'relative h-12')}>
        <select
          id={fieldId}
          required={required}
          disabled={disabled}
          value={value}
          className={cx(
            bareControlClasses,
            'h-full cursor-pointer appearance-none pr-8',
            empty && placeholder && 'text-text-muted',
          )}
          {...describedBy(fieldId, { helper, error })}
          {...selectProps}
        >
          {placeholder && (
            <option value="" disabled={required}>
              {placeholder}
            </option>
          )}
          {options
            ? options.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))
            : children}
        </select>
        <Icon name="chevron-down" size={20} className="pointer-events-none absolute right-4" />
      </div>
    </Field>
  );
}
