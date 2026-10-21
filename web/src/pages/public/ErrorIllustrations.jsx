import { useId, useRef } from 'react';
import { EASE, MQ, gsap, useGSAP } from '../../lib/motion';

// Decorative illustrations for the 404 (W11) and 500 (W12) pages, drawn from the Figma vectors.
// Colors come from theme variables, so they follow Light and Dark. Motion P13 and P14 (#41): short,
// plays once on load, nothing loops forever; with reduce motion they simply fade in.
const NAVY = 'var(--rw-brand-navy)';
const AMBER = 'var(--rw-brand-amber)';
const GROUND = 'var(--rw-border-subtle)';
const PAPER = 'var(--rw-surface-white)';
const BLUE = 'var(--rw-brand-blue)';

const svgProps = {
  viewBox: '0 0 240 180',
  fill: 'none',
  'aria-hidden': true,
  focusable: false,
  className: 'h-[150px] w-[200px] sm:h-[180px] sm:w-[240px]',
};

// Fades the whole drawing in, then runs `play` (only when motion is allowed).
function useIllustrationMotion(ref, play) {
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add({ motion: MQ.motion, reduce: MQ.reduce }, ({ conditions }) => {
        const tl = gsap.timeline({ defaults: { ease: EASE.enter } });
        tl.from(ref.current, { opacity: 0, duration: conditions.reduce ? 0.2 : 0.4 });
        if (!conditions.reduce) play(tl, gsap.utils.selector(ref));
      });
      return () => mm.revert();
    },
    { scope: ref },
  );
}

const DETOUR_PATH = 'M52 112 C58 132 78 142 92 146';

// A lost map pin and a detour sign with a question mark. P13: the dashed path draws from the pin to
// the road, then the sign swings twice and settles.
export function LostPinIllustration() {
  const ref = useRef(null);
  const maskId = useId();
  useIllustrationMotion(ref, (tl, q) => {
    tl.from(q('[data-detour-mask]'), { drawSVG: '0%', duration: 0.8 }, 0.2).to(
      q('[data-sign]'),
      { keyframes: { rotate: [0, 6, -4, 3, 0] }, duration: 1.2, ease: 'sine.inOut', svgOrigin: '171 86' },
      0.9,
    );
  });
  return (
    <svg ref={ref} {...svgProps}>
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="240" height="180">
          <path data-detour-mask d={DETOUR_PATH} stroke="#fff" strokeWidth="8" strokeLinecap="round" />
        </mask>
      </defs>
      <ellipse cx="120" cy="166" rx="104" ry="10" fill={GROUND} />
      <path d="M84 166 L108 70 H132 L156 166 Z" fill={GROUND} />
      <path d="M120 80 V90 M120 104 V118 M120 134 V154" stroke={PAPER} strokeWidth="4" strokeLinecap="round" />
      <rect x="168" y="70" width="6" height="96" rx="3" fill={NAVY} />
      <g data-sign>
        <path d="M171 18 L205 52 L171 86 L137 52 Z" fill={AMBER} stroke={NAVY} strokeWidth="4" strokeLinejoin="round" />
        <path d="M164 45 C164 36 178 36 178 45 C178 51 171 52 171 58" stroke={NAVY} strokeWidth="4" strokeLinecap="round" />
        <circle cx="171" cy="66" r="3" fill={NAVY} />
      </g>
      <path
        d={DETOUR_PATH}
        mask={`url(#${maskId})`}
        stroke={BLUE}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="4 7"
      />
      <path
        d="M52 58 C42 58 34 66 34 76 C34 90 52 106 52 106 C52 106 70 90 70 76 C70 66 62 58 52 58 Z"
        fill={PAPER}
        stroke={BLUE}
        strokeWidth="3"
      />
      <circle cx="52" cy="76" r="6" fill={BLUE} />
    </svg>
  );
}

// A sleeping server with an unplugged, tangled cable. P14: the "z" letters float up and fade twice,
// then stop; the cable gives one small wiggle.
export function SleepingServerIllustration() {
  const ref = useRef(null);
  useIllustrationMotion(ref, (tl, q) => {
    tl.fromTo(
      q('[data-z]'),
      { y: 6, opacity: 0 },
      { y: -6, opacity: 1, duration: 0.9, ease: 'sine.out', stagger: 0.3, repeat: 1, repeatDelay: 0.2 },
      0.3,
    ).to(
      q('[data-cable]'),
      { keyframes: { rotate: [0, -3, 3, 0] }, duration: 0.6, ease: 'sine.inOut', svgOrigin: '164 146' },
      0.5,
    );
  });
  return (
    <svg ref={ref} {...svgProps}>
      <ellipse cx="120" cy="166" rx="104" ry="10" fill={GROUND} />
      <rect x="76" y="40" width="88" height="120" rx="12" fill={PAPER} stroke={NAVY} strokeWidth="4" />
      <rect x="88" y="54" width="64" height="22" rx="4" fill={GROUND} />
      <rect x="88" y="86" width="64" height="22" rx="4" fill={GROUND} />
      <rect x="88" y="118" width="64" height="22" rx="4" fill={GROUND} />
      <path d="M98 65 H110 M98 129 H110" stroke={NAVY} strokeWidth="3" strokeLinecap="round" />
      <circle cx="141" cy="65" r="4" fill={AMBER} />
      <circle cx="141" cy="129" r="4" fill={AMBER} />
      <path d="M100 95 Q105 101 110 95 M130 95 Q135 101 140 95" stroke={NAVY} strokeWidth="3" strokeLinecap="round" />
      <path data-z d="M172 32 H184 L172 46 H184" stroke={BLUE} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path data-z d="M192 12 H201 L192 23 H201" stroke={BLUE} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <g data-cable>
        <path
          d="M164 146 C186 146 196 128 184 120 C172 112 166 134 182 138 C200 142 208 152 200 160"
          stroke={NAVY}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <rect x="194" y="156" width="16" height="10" rx="2" fill={NAVY} />
      </g>
      <path d="M30 160 C40 150 52 164 64 154" stroke={BLUE} strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
