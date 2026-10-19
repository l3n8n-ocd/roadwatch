import emblem from '../../assets/images/emblem.png';
import { cx } from '../../lib/cx';

// RoadWatch lockup (Figma 96:17): navy tile with the shield from the emblem + live wordmark.
// tone="light" for white surfaces, tone="dark" for navy surfaces ("Watch" turns amber).
export default function Logo({ tone = 'light', className = '' }) {
  const onDark = tone === 'dark';
  return (
    <span
      role="img"
      aria-label="RoadWatch"
      className={cx(
        'inline-flex items-center gap-3 rounded-rw-md p-2',
        onDark && 'bg-brand-navy',
        className,
      )}
    >
      {/* The tile crops the shield out of the full emblem artwork. */}
      <span aria-hidden="true" className="relative size-10 shrink-0 overflow-hidden rounded-rw-sm bg-brand-navy">
        <img
          src={emblem}
          alt=""
          className="absolute top-[-31.11%] left-[-60%] size-[222.22%] max-w-none"
        />
      </span>
      <span aria-hidden="true" className="font-heading text-[20px] leading-[26px] font-bold whitespace-nowrap">
        {onDark ? (
          <>
            <span className="text-text-inverse">Road</span>
            <span className="text-text-accent">Watch</span>
          </>
        ) : (
          <span className="text-text-primary">RoadWatch</span>
        )}
      </span>
    </span>
  );
}
