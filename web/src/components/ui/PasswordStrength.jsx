import { checkPassword } from '../../lib/passwordStrength';
import { cx } from '../../lib/cx';

// Password strength meter (Figma Components "Password strength" 422:4211, #44): 4 segments, the level
// word and one tip, under every field that sets a new password. Saving needs Strong. The segments are
// decorative; the level word is always shown, so the level never depends on color alone.
const LOOK = {
  empty: { segments: 0, bar: '', word: '' },
  weak: { segments: 1, bar: 'bg-brand-danger', word: 'text-text-danger' },
  fair: { segments: 2, bar: 'bg-brand-amber', word: 'text-text-primary' },
  good: { segments: 3, bar: 'bg-brand-blue', word: 'text-text-blue' },
  strong: { segments: 4, bar: 'bg-brand-success', word: 'text-text-success' },
};
const WORD = { weak: 'Weak', fair: 'Fair', good: 'Good', strong: 'Strong' };

export default function PasswordStrength({ id, password, person, className = '' }) {
  const { level, tip } = checkPassword(password, person);
  const look = LOOK[level];
  return (
    <div id={id} className={cx('flex w-full flex-col gap-1.5', className)}>
      <div aria-hidden="true" className="flex w-full gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cx(
              'h-1 flex-1 rounded-[2px] transition-colors duration-200 motion-reduce:transition-none',
              i < look.segments ? look.bar : 'bg-border-subtle',
            )}
          />
        ))}
      </div>
      <p aria-live="polite" className="flex items-start gap-1.5 type-body-sm text-text-muted">
        <span className="sr-only">Password strength: </span>
        {WORD[level] && <span className={cx('shrink-0 type-label', look.word)}>{WORD[level]}</span>}
        <span>{tip}</span>
      </p>
    </div>
  );
}
