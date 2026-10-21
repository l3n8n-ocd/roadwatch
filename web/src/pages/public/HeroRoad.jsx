import { useId } from 'react';

// Hero road-and-pin illustration (Figma 356:16116 desktop, 356:16123 at 390 px; motion P1 and P2).
// Decorative. The road and its amber centre line are revealed through a mask whose path GSAP draws
// (DrawSVG cannot draw a dashed stroke directly); the dashes slide while scrolling.
// Desktop: anchored so the pin lands 36 px left of the preview card (Figma: pin at x 900, card at 936).
// Below 1024 px: runs along the bottom of the hero and ends at the right edge.

// Teardrop pin, same shape as the map pins (40 x 48, tip at 20, 46).
function Pin({ x, y, scale }) {
  return (
    <g data-pin transform={`translate(${x - 20 * scale} ${y - 46 * scale}) scale(${scale})`}>
      <path
        d="M20 46C20 46 36 30.5 36 18C36 9.16 28.84 2 20 2C11.16 2 4 9.16 4 18C4 30.5 20 46 20 46Z"
        style={{ fill: 'var(--rw-brand-navy)', stroke: 'var(--rw-text-inverse)', strokeWidth: 2 }}
      />
      <circle cx="20" cy="18" r="7" style={{ fill: 'var(--rw-brand-amber)' }} />
    </g>
  );
}

function Road({ d, width, height, viewBox, tip, pinScale, band, dash, className }) {
  const maskId = useId();
  return (
    <svg
      data-road
      aria-hidden="true"
      focusable="false"
      width={width}
      height={height}
      viewBox={viewBox}
      fill="none"
      overflow="visible"
      className={className}
    >
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="-1200" y="-200" width="3600" height="600">
          <path data-road-mask d={d} stroke="#fff" strokeWidth={band + 8} strokeLinecap="round" />
        </mask>
      </defs>
      <g mask={`url(#${maskId})`}>
        <path d={d} strokeWidth={band} strokeLinecap="round" style={{ stroke: 'var(--rw-text-inverse)', opacity: 0.18 }} />
        <path
          data-road-dashes
          d={d}
          strokeWidth={dash[0]}
          strokeDasharray={`${dash[1]} ${dash[2]}`}
          strokeLinecap="round"
          style={{ stroke: 'var(--rw-brand-amber)' }}
        />
      </g>
      <ellipse data-pin-shadow cx={tip[0]} cy={tip[1] + 2} rx={12 * pinScale} ry={4 * pinScale} fill="#000" fillOpacity="0.35" />
      <Pin x={tip[0]} y={tip[1]} scale={pinScale} />
    </svg>
  );
}

export default function HeroRoad() {
  return (
    <>
      {/* Desktop (1024 px and up): starts off the left edge, ends beside the preview card. */}
      <Road
        d="M -400 160 C -120 156, 120 154, 300 152 C 580 116, 840 148, 1040 112 C 1140 94, 1190 80, 1220 72"
        width={1240}
        height={162}
        viewBox="0 0 1240 162"
        tip={[1220, 72]}
        pinScale={1}
        band={40}
        dash={[3, 14, 12]}
        className="pointer-events-none absolute right-[456px] bottom-[-80px] hidden lg:block"
      />
      {/* Phones and tablets: along the bottom of the hero, pin near the right edge. Offsets undo the
          hero's padding (bottom 72 px, sides 16 or 32 px), since this sits inside the content column. */}
      <Road
        d="M -800 78 C -300 70, -60 66, 0 66 C 100 56, 200 74, 290 60 C 320 56, 340 52, 352 48"
        width={390}
        height={80}
        viewBox="0 0 390 80"
        tip={[352, 48]}
        pinScale={0.7}
        band={28}
        dash={[2, 10, 9]}
        className="pointer-events-none absolute right-[-16px] bottom-[-72px] sm:right-[-32px] lg:hidden"
      />
    </>
  );
}
