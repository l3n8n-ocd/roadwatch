import { useId, useState } from 'react';
import Icon from './Icon';
import TextField from './TextField';

// Password input with the eye button (Figma Text field, "Show password toggle", #45).
// One button per field, icon only, named "Show password" / "Hide password"; the password stays shown
// until the button is pressed again (no auto-hide). Takes the same props as TextField.
export default function PasswordField({ id, icon = 'lock', disabled = false, ...props }) {
  const autoId = useId();
  const fieldId = id || autoId;
  const [shown, setShown] = useState(false);
  return (
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
}
