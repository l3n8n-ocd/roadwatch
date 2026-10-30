import Icon from './Icon';
import { cx } from '../../lib/cx';
import { PRIORITY_META } from './priorityMeta';

// Report priority chip (Figma Components → Priority chip 527:4117, #54). Always icon + level text, never color alone.
// Screen readers hear "Priority: High". Staff only: reporters never see priority.
export default function PriorityChip({ priority, className = '' }) {
  const meta = PRIORITY_META[priority] || PRIORITY_META.Medium;
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
        <span className="sr-only">Priority: </span>
        {priority}
      </span>
    </span>
  );
}
