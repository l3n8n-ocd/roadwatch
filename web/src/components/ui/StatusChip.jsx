import Icon from './Icon';
import { statusMeta } from './statusMeta';
import { cx } from '../../lib/cx';

// report_status chip (Figma 99:257). Always icon + status text; not interactive.
// Screen readers hear "Status: <value>".
export default function StatusChip({ status, className = '' }) {
  const meta = statusMeta(status);
  return (
    <span
      className={cx(
        'inline-flex h-8 shrink-0 items-center gap-2 rounded-full px-3 type-label whitespace-nowrap text-text-primary',
        meta.chip,
        className,
      )}
    >
      <Icon name={meta.icon} size={16} className={meta.iconColor} />
      <span>
        <span className="sr-only">Status: </span>
        {status}
      </span>
    </span>
  );
}
