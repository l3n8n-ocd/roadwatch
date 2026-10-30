import { useEffect, useRef } from 'react';
import { cx } from '../../lib/cx';

// Underline tabs (v1.2.1, Figma W6 tabs 564:27407; phone 568:29575). WAI-ARIA tabs: one Tab stop, ← → Home End move
// and select (automatic activation). The selected tab is navy with an amber underline; the row scrolls sideways on
// phones instead of wrapping. tabs: [{ id, label }]; panels use id `${idPrefix}-panel-${id}` and aria-labelledby
// `${idPrefix}-tab-${id}` (tabPanelProps in lib/tabs.js).
export default function Tabs({ label, tabs, value, onChange, idPrefix, className = '', ...rest }) {
  const refs = useRef([]);
  const index = Math.max(
    0,
    tabs.findIndex((t) => t.id === value),
  );

  // On phones the row scrolls: keep the selected tab in view (also when the page opens on ?tab=...).
  useEffect(() => {
    const el = refs.current[index];
    const row = el?.closest('[data-tabs-scroll]');
    if (!el || !row) return;
    const left = el.offsetLeft - row.offsetLeft;
    if (left < row.scrollLeft || left + el.offsetWidth > row.scrollLeft + row.clientWidth) {
      row.scrollTo({ left: Math.max(0, left - 16) });
    }
  }, [index]);

  const select = (i) => {
    onChange(tabs[i].id);
    refs.current[i]?.focus();
  };

  const onKeyDown = (event) => {
    const last = tabs.length - 1;
    const next = { ArrowRight: index === last ? 0 : index + 1, ArrowLeft: index === 0 ? last : index - 1, Home: 0, End: last }[
      event.key
    ];
    if (next === undefined) return;
    event.preventDefault();
    select(next);
  };

  return (
    <div data-tabs-scroll className={cx('w-full min-w-0 overflow-x-auto border-b border-border-subtle', className)} {...rest}>
      <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className="flex w-max gap-7 pr-6 sm:gap-8">
        {tabs.map((tab, i) => {
          const selected = i === index;
          return (
            <button
              key={tab.id}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="tab"
              id={`${idPrefix}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${idPrefix}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab.id)}
              className={cx(
                'relative flex min-h-12 shrink-0 items-center px-1 type-body whitespace-nowrap transition-colors',
                selected ? 'font-semibold text-text-primary' : 'font-medium text-text-muted hover:text-text-primary',
              )}
            >
              {tab.label}
              <span
                aria-hidden="true"
                className={cx('absolute inset-x-0 bottom-0 h-[3px] rounded-full', selected ? 'bg-brand-amber' : 'bg-transparent')}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
