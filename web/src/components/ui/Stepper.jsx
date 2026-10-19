import { cx } from '../../lib/cx';

// Report form progress (Figma 106:1001): text first ("Step 2 of 3 · Location"), bars second.
export default function Stepper({ step, labels = ['Details', 'Location', 'Photos'], className = '' }) {
  const total = labels.length;
  return (
    <div className={cx('flex w-full flex-col gap-2', className)}>
      <p className="type-overline uppercase text-text-blue">
        Step {step} of {total} · {labels[step - 1]}
      </p>
      <div aria-hidden="true" className="flex gap-1">
        {labels.map((label, i) => (
          <span
            key={label}
            className={cx('h-1.5 flex-1 rounded-[3px]', i < step ? 'bg-brand-navy' : 'bg-surface-navy-subtle')}
          />
        ))}
      </div>
    </div>
  );
}
