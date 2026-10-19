import Icon from './Icon';
import { cx } from '../../lib/cx';

// Dashboard metric card (Figma 99:431). metric picks the icon and its tile color.
const METRICS = {
  total: { icon: 'file-text', tile: 'bg-surface-navy-subtle', iconColor: 'text-text-primary' },
  pending: { icon: 'clock', tile: 'bg-surface-amber-subtle', iconColor: 'text-text-primary' },
  verified: { icon: 'shield-check', tile: 'bg-surface-success-subtle', iconColor: 'text-text-success' },
  closed: { icon: 'check-circle', tile: 'bg-surface-blue-subtle', iconColor: 'text-text-blue' },
};

export default function StatCard({ metric = 'total', label, value, caption, className = '' }) {
  const look = METRICS[metric] || METRICS.total;
  return (
    <div
      className={cx(
        'flex flex-col gap-4 rounded-rw-md border border-border-subtle bg-surface-white p-6 shadow-rw-sm',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <p className="min-w-0 flex-1 type-label text-text-primary">{label}</p>
        <span aria-hidden="true" className={cx('flex size-10 items-center justify-center rounded-rw-sm', look.tile)}>
          <Icon name={look.icon} size={20} className={look.iconColor} />
        </span>
      </div>
      <p className="type-stat text-text-primary">{value}</p>
      {caption && <p className="type-caption text-text-muted">{caption}</p>}
    </div>
  );
}
