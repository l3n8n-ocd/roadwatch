import { useRef } from 'react';
import Icon from './Icon';
import { cx } from '../../lib/cx';

// Period picker (Figma 106:950) as a radio group: one Tab stop, arrow keys move the selection.
// options: [{ value, label }]. The selected segment is navy with a check.
export default function SegmentedControl({ label, options, value, onChange, className = '' }) {
  const refs = useRef([]);
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );

  const onKeyDown = (event) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const next = (index + step + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cx(
        'inline-flex max-w-full gap-1 overflow-x-auto rounded-rw-md border border-border-control bg-surface-white p-1',
        className,
      )}
    >
      {options.map((option, i) => {
        const selected = i === index;
        return (
          <button
            key={option.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(option.value)}
            className={cx(
              'flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-[12px] px-4 type-label whitespace-nowrap transition-colors',
              selected ? 'bg-brand-navy text-text-inverse' : 'text-text-primary hover:bg-surface-navy-subtle',
            )}
          >
            {selected && <Icon name="check" size={16} />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
