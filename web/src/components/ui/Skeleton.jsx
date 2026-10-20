import { cx } from '../../lib/cx';

// Loading placeholders (Figma 101:784). Decorative: put aria-busy="true" on the region that is
// loading and keep a visually hidden "Loading…" text there for screen readers.
// type: 'report-card' | 'table-row' | 'detail'.
function Block({ className }) {
  return <span className={cx('block rounded-rw-sm bg-surface-navy-subtle', className)} />;
}

export default function Skeleton({ type = 'report-card', className = '' }) {
  const pulse = 'animate-pulse motion-reduce:animate-none';

  if (type === 'table-row') {
    return (
      <div aria-hidden="true" className={cx('flex h-16 items-center gap-4 bg-surface-white px-4', pulse, className)}>
        <span className="flex flex-col gap-1.5">
          <Block className="h-3.5 w-24" />
          <Block className="h-3 w-30" />
        </span>
        <Block className="h-3.5 w-25" />
        <Block className="h-3.5 w-65 max-w-full" />
        <Block className="h-7 w-40 rounded-full" />
        <Block className="h-7 w-35 rounded-full" />
      </div>
    );
  }

  if (type === 'detail') {
    return (
      <div
        aria-hidden="true"
        className={cx(
          'flex w-full flex-col gap-4 rounded-rw-md border border-border-subtle bg-surface-white p-6',
          pulse,
          className,
        )}
      >
        <Block className="h-7 w-50" />
        <Block className="h-4 w-full" />
        <Block className="h-4 w-[89%]" />
        <Block className="h-40 w-full rounded-rw-md" />
      </div>
    );
  }

  return (
    <div
      aria-hidden="true"
      className={cx(
        'flex w-full flex-col gap-3 rounded-rw-md border border-border-subtle bg-surface-white p-4',
        pulse,
        className,
      )}
    >
      <span className="flex items-start justify-between gap-2">
        <Block className="h-4 w-22" />
        <Block className="h-8 w-28 rounded-full" />
      </span>
      <Block className="h-6 w-35" />
      <Block className="h-4 w-55 max-w-full" />
      <Block className="h-4 w-40" />
    </div>
  );
}
