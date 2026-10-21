import AnimatedNumber from './AnimatedNumber';
import Icon from './Icon';
import { cx } from '../../lib/cx';

// Dashboard metric card (Figma 99:431). metric picks the icon and its tile color.
// A numeric value counts up (A1); `index` staggers the card's entrance with its neighbours.
const METRICS = {
  total: { icon: 'file-text', tile: 'bg-surface-navy-subtle', iconColor: 'text-text-primary' },
  pending: { icon: 'clock', tile: 'bg-surface-amber-subtle', iconColor: 'text-text-primary' },
  verified: { icon: 'shield-check', tile: 'bg-surface-success-subtle', iconColor: 'text-text-success' },
  closed: { icon: 'check-circle', tile: 'bg-surface-blue-subtle', iconColor: 'text-text-blue' },
};

const numberFmt = new Intl.NumberFormat('en-US');

export default function StatCard({ metric = 'total', label, value, caption, index = 0, className = '' }) {
  const look = METRICS[metric] || METRICS.total;
  return (
    <div
      style={{ transitionDelay: `${index * 70}ms` }}
      className={cx(
        'flex flex-col gap-4 rounded-rw-md border border-border-subtle bg-surface-white p-6 shadow-rw-sm',
        'transition-[opacity,translate] duration-450 ease-[cubic-bezier(0.22,1,0.36,1)] starting:translate-y-4 starting:opacity-0',
        'motion-reduce:duration-200 motion-reduce:starting:translate-y-0',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <p className="min-w-0 flex-1 type-label text-text-primary">{label}</p>
        <span aria-hidden="true" className={cx('flex size-10 items-center justify-center rounded-rw-sm', look.tile)}>
          <Icon name={look.icon} size={20} className={look.iconColor} />
        </span>
      </div>
      <p className="type-stat text-text-primary">
        {typeof value === 'number' ? <AnimatedNumber value={value} format={(n) => numberFmt.format(Math.round(n))} /> : value}
      </p>
      {caption && <p className="type-caption text-text-muted">{caption}</p>}
    </div>
  );
}
