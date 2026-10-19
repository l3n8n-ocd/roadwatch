import { cx } from '../../lib/cx';

// Class helpers shared by the field components (see Field.jsx).

// Box around the actual <input>/<select>/<textarea>. The 2 px focus/error border is drawn with an
// inset shadow so the layout does not shift by 1 px.
export function controlBoxClasses({ error, disabled }) {
  return cx(
    'flex w-full items-center gap-3 rounded-rw-md border px-4 transition-shadow',
    disabled
      ? 'border-border-subtle bg-surface-navy-subtle text-text-muted'
      : error
        ? 'border-border-danger bg-surface-white text-text-primary shadow-[inset_0_0_0_1px_var(--rw-border-danger)]'
        : 'border-border-control bg-surface-white text-text-primary',
    !disabled &&
      'focus-within:border-border-focus focus-within:shadow-[inset_0_0_0_1px_var(--rw-border-focus),var(--rw-shadow-focus)]',
  );
}

// The native control itself: no own border or ring (the box above shows them).
export const bareControlClasses =
  'min-w-0 flex-1 bg-transparent type-body text-inherit outline-none placeholder:text-text-muted ' +
  'focus-visible:shadow-none disabled:cursor-not-allowed';

// aria props every field control needs.
export function describedBy(id, { helper, error }) {
  return {
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error || helper ? `${id}-message` : undefined,
  };
}
