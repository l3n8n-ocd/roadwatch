import Icon from './Icon';
import { cx } from '../../lib/cx';

// reports.record_type badge (Figma 99:272). Square corners (8 px) so it never reads as a
// status chip. Verified record = solid navy + shield; Public submission = dashed outline + people.
export default function RecordBadge({ type, className = '' }) {
  const verified = type === 'verified_record';
  return (
    <span
      className={cx(
        'inline-flex h-8 shrink-0 items-center gap-2 rounded-rw-sm px-3 type-label whitespace-nowrap',
        verified
          ? 'bg-brand-navy text-text-inverse'
          : 'border-[1.5px] border-dashed border-brand-navy bg-surface-white text-text-primary',
        className,
      )}
    >
      <Icon name={verified ? 'shield-check' : 'users'} size={16} className={verified ? 'text-text-accent' : ''} />
      {verified ? 'Verified record' : 'Public submission'}
    </span>
  );
}
