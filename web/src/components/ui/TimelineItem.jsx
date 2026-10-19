import Icon from './Icon';
import { statusMeta } from './statusMeta';
import { cx } from '../../lib/cx';

// One report_status_history row (Figma 99:388). Render inside <Timeline> (an ordered list).
// current: the newest entry (navy node + "Current status" overline). last: hides the rail line.
export function Timeline({ label = 'Status history', className = '', children }) {
  return (
    <ol aria-label={label} className={cx('flex flex-col', className)}>
      {children}
    </ol>
  );
}

export default function TimelineItem({ status, meta, remarks, current = false, last = false }) {
  const { icon } = statusMeta(status);
  return (
    <li className="flex gap-4">
      <div aria-hidden="true" className="flex shrink-0 flex-col items-center self-stretch">
        <span
          className={cx(
            'flex size-8 shrink-0 items-center justify-center rounded-full',
            current ? 'bg-brand-navy text-text-inverse' : 'bg-surface-navy-subtle text-text-primary',
          )}
        >
          <Icon name={icon} size={16} />
        </span>
        {!last && <span className="w-0.5 flex-1 bg-border-subtle" />}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1 pb-6">
        {current && <p className="type-overline uppercase text-text-blue">Current status</p>}
        <p className="type-h3 text-text-primary">{status}</p>
        {meta && <p className="type-body-sm text-text-muted">{meta}</p>}
        {remarks && <p className="type-body-sm text-text-primary">{remarks}</p>}
      </div>
    </li>
  );
}
