import { useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Button from './Button';
import Textarea from './Textarea';
import useFocusTrap from './useFocusTrap';

// Accessible modal (Figma 106:880): role="dialog", aria-modal, labelled by the title, focus
// trapped inside, Escape or the backdrop closes it, focus returns to the trigger.
// actions: the buttons row (right-aligned). children: body content (e.g. a form).
export default function Dialog({ open, onClose, title, description, children, actions, className = '' }) {
  const panelRef = useRef(null);
  const titleId = useId();
  const descriptionId = useId();
  useFocusTrap(panelRef, open, onClose);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-brand-navy/40"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={`relative flex max-h-full w-full max-w-[480px] flex-col gap-6 overflow-y-auto rounded-rw-md bg-surface-white p-6 shadow-rw-lg sm:p-8 ${className}`}
      >
        <div className="flex flex-col gap-2">
          <h2 id={titleId} className="type-h2 text-text-primary">
            {title}
          </h2>
          {description && (
            <p id={descriptionId} className="type-body text-text-muted">
              {description}
            </p>
          )}
        </div>
        {children}
        {actions && <div className="flex flex-wrap justify-end gap-3">{actions}</div>}
      </div>
    </div>,
    document.body,
  );
}

// Ready-made variants: tone="primary" (Confirm), tone="destructive" (Destructive), and
// reason={{ label, placeholder, minLength }} for "Reject with reason" (onConfirm gets the text).
// confirmIcon: optional icon name on the confirm button (Log out uses "log-out").
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  confirmIcon,
  cancelLabel = 'Cancel',
  tone = 'primary',
  reason,
  busy = false,
  error,
}) {
  const [text, setText] = useState('');
  const [touched, setTouched] = useState(false);
  const minLength = reason?.minLength ?? 10;
  const tooShort = reason && text.trim().length < minLength;
  const reasonError =
    touched && tooShort ? `Enter at least ${minLength} characters (${text.trim().length} so far).` : undefined;

  const close = () => {
    setText('');
    setTouched(false);
    onClose();
  };

  const confirm = () => {
    if (reason && tooShort) {
      setTouched(true);
      return;
    }
    onConfirm(reason ? text.trim() : undefined);
  };

  return (
    <Dialog
      open={open}
      onClose={close}
      title={title}
      description={description}
      actions={
        <>
          <Button variant="secondary" onClick={close} className="min-w-[184px] max-sm:flex-1 max-sm:min-w-0">
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'destructive' ? 'destructive' : 'primary'}
            icon={busy ? undefined : confirmIcon}
            onClick={confirm}
            disabled={busy}
            className="min-w-[184px] max-sm:flex-1 max-sm:min-w-0"
          >
            {busy ? 'Saving…' : confirmLabel}
          </Button>
        </>
      }
    >
      {reason && (
        <Textarea
          label={reason.label || 'Reason'}
          placeholder={reason.placeholder}
          required
          value={text}
          onChange={(event) => setText(event.target.value)}
          onBlur={() => setTouched(true)}
          helper={`Required. At least ${minLength} characters.`}
          error={reasonError}
          data-autofocus
        />
      )}
      {error && (
        <p role="alert" className="type-body-sm text-text-danger">
          {error}
        </p>
      )}
    </Dialog>
  );
}
