import { useRef } from 'react';
import { MQ, gsap, useGSAP } from '../../lib/motion';

// A number that counts up on first show and tweens from its old value when it changes
// (dashboard cards, spec A1). Screen readers get only the final value; with reduce motion
// the number simply changes.
export default function AnimatedNumber({ value, format = (n) => String(Math.round(n)), duration = 0.7 }) {
  const ref = useRef(null);
  const shown = useRef(0);

  useGSAP(
    () => {
      const el = ref.current;
      const from = shown.current;
      shown.current = value;
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        const state = { n: from };
        gsap.to(state, {
          n: value,
          duration,
          ease: 'power2.out',
          onUpdate: () => {
            el.textContent = format(state.n);
          },
        });
      });
      return () => mm.revert();
    },
    { dependencies: [value] },
  );

  return (
    <>
      <span ref={ref} aria-hidden="true" className="tabular-nums">
        {format(value)}
      </span>
      <span className="sr-only">{format(value)}</span>
    </>
  );
}
