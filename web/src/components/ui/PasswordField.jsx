import { useId, useState } from 'react';
import Icon from './Icon';
import TextField from './TextField';
import PasswordStrength from './PasswordStrength';

// Password input with the eye button (Figma Text field, "Show password toggle", #45).
// One button per field, icon only, named "Show password" / "Hide password"; the password stays shown
// until the button is pressed again (no auto-hide). Takes the same props as TextField.
// showStrength adds the strength meter under a field that sets a new password (#44); person
// ({ name, email }) lets the meter flag a password that contains the account's name or email.
export default function PasswordField({ id, icon = 'lock', disabled = false, showStrength = false, person, ...props }) {
  const autoId = useId();
  const fieldId = id || autoId;
  const [shown, setShown] = useState(false);
  const strengthId = `${fieldId}-strength`;
  const describedBy = [(props.error || props.helper) && `${fieldId}-message`, showStrength && strengthId]
    .filter(Boolean)
    .join(' ');

  const field = (
    <TextField
      {...props}
      id={fieldId}
      icon={icon}
      disabled={disabled}
      type={shown ? 'text' : 'password'}
      // Browsers should not offer to autocorrect or capitalize a visible password.
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      aria-describedby={describedBy || undefined}
      trailing={
        <button
          type="button"
          aria-label={shown ? 'Hide password' : 'Show password'}
          aria-controls={fieldId}
          disabled={disabled}
          onClick={() => setShown((value) => !value)}
          className="-mr-2 flex size-11 shrink-0 items-center justify-center rounded-full text-text-primary hover:bg-surface-navy-subtle disabled:text-text-muted"
        >
          <Icon name={shown ? 'eye-off' : 'eye'} size={20} />
        </button>
      }
    />
  );
  if (!showStrength) return field;
  return (
    <div className="flex w-full flex-col gap-3">
      {field}
      <PasswordStrength id={strengthId} password={props.value} person={person} />
    </div>
  );
}
