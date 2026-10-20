import { useId } from 'react';
import Icon from './Icon';
import Field from './Field';
import { bareControlClasses, controlBoxClasses, describedBy } from './fieldStyles';

// Text input (Figma 97:178). Value text is 16 px so mobile browsers do not zoom.
// Extra props (value, onChange, type, autoComplete...) go to the <input>.
export default function TextField({
  id,
  label,
  icon,
  required = false,
  optional = false,
  helper,
  error,
  disabled = false,
  className = '',
  trailing,
  ...inputProps
}) {
  const autoId = useId();
  const fieldId = id || autoId;
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
      <div className={`${controlBoxClasses({ error, disabled })} h-12`}>
        {icon && <Icon name={icon} size={20} />}
        <input
          id={fieldId}
          required={required}
          disabled={disabled}
          className={bareControlClasses}
          {...describedBy(fieldId, { helper, error })}
          {...inputProps}
        />
        {trailing}
      </div>
    </Field>
  );
}
