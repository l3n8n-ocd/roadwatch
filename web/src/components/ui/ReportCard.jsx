import { Link } from 'react-router-dom';
import Icon from './Icon';
import StatusChip from './StatusChip';
import { cx } from '../../lib/cx';

// Report summary card (Figma 99:348): the whole card is one link.
// code = "RW-000128", title = accident type, dateTime = formatted date and time.
export default function ReportCard({ to, code, title, location, dateTime, status, className = '' }) {
  return (
    <Link
      to={to}
      aria-label={`Report ${code}, ${title}, status ${status}`}
      className={cx(
        'flex w-full flex-col gap-3 rounded-rw-md border border-border-subtle bg-surface-white p-4 text-text-primary no-underline',
        'shadow-rw-sm transition-colors hover:bg-surface-light-gray active:bg-surface-navy-subtle',
        'focus-visible:shadow-rw-focus',
        className,
      )}
    >
      <span className="flex flex-wrap items-center justify-between gap-2">
        <span className="type-label text-text-muted">{code}</span>
        <StatusChip status={status} />
      </span>
      <span className="flex items-center gap-2">
        <span className="min-w-0 flex-1 type-h3">{title}</span>
        <Icon name="chevron-right" size={20} />
      </span>
      {location && (
        <span className="flex items-center gap-2 type-body-sm text-text-muted">
          <Icon name="map-pin" size={16} className="text-text-primary" />
          <span className="min-w-0 flex-1">{location}</span>
        </span>
      )}
      {dateTime && (
        <span className="flex items-center gap-2 type-body-sm text-text-muted">
          <Icon name="calendar" size={16} className="text-text-primary" />
          <span className="min-w-0 flex-1">{dateTime}</span>
        </span>
      )}
    </Link>
  );
}
