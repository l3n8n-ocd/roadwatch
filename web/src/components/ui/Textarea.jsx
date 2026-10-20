import { useId } from 'react';
import Field from './Field';
import { bareControlClasses, controlBoxClasses, describedBy } from './fieldStyles';
import { cx } from '../../lib/cx';

// Multiline text (Figma 97:566): accident_description, official_remarks, rejection_reason.
// Grows with its content up to about 6 lines, then scrolls.
// showCount: once something is typed, the helper becomes "N characters" (text, not color).
export default function Textarea({
  id,
  label,
  required = false,
  optional = false,
  helper,
  error,
  disabled = false,
  showCount = false,
  className = '',
  value,
  rows = 4,
  ...textareaProps
}) {
  const autoId = useId();
  const fieldId = id || autoId;
  const length = typeof value === 'string' ? value.length : 0;
  const message = showCount && length > 0 && !error ? `${length} characters` : helper;

  return (
    <Field
      id={fieldId}
      label={label}
      required={required}
      optional={optional}
      helper={message}
      error={error}
      disabled={disabled}
      className={className}
    >
      <div className={cx(controlBoxClasses({ error, disabled }), 'items-start py-3')}>
        <textarea
          id={fieldId}
          rows={rows}
          required={required}
          disabled={disabled}
          value={value}
          className={cx(bareControlClasses, 'min-h-[104px] max-h-[144px] resize-none [field-sizing:content]')}
          {...describedBy(fieldId, { helper: message, error })}
          {...textareaProps}
        />
      </div>
    </Field>
  );
}
