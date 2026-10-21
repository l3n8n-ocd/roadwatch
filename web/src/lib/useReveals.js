import { DUR, EASE, MQ, gsap, onEnter, reveal, useGSAP, useRefreshOnResize } from './motion';

// Scroll reveals for public pages (spec P5, P12 and the generic part of P4-P11). Mark elements with:
//   data-reveal        fade and rise when 20% visible
//   data-reveal-list   its children fade and rise one after another (max 8 staggered)
//   data-reveal-left   its children slide in from the left one after another
//   data-heading-bar   a short amber bar that draws from the left under a heading
//   data-pop           scales from 80% (avatars, icons)
// Reduced motion: every one of these becomes a 200 ms fade.
export default function useReveals(rootRef, deps = []) {
  useRefreshOnResize(rootRef);
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add({ motion: MQ.motion, reduce: MQ.reduce }, ({ conditions }) => {
        const reduce = conditions.reduce;
        const q = gsap.utils.selector(rootRef);
        q('[data-reveal]').forEach((el) => reveal(el, { trigger: el, reduce }));
        q('[data-reveal-list]').forEach((list) => reveal(list.children, { trigger: list, reduce }));
        q('[data-reveal-left]').forEach((list) =>
          gsap.fromTo(list.children, { opacity: 0, x: reduce ? 0 : -24 }, {
            opacity: 1,
            x: 0,
            duration: reduce ? 0.2 : DUR.medium,
            ease: EASE.enter,
            stagger: reduce ? 0 : 0.07,
            scrollTrigger: onEnter(list),
          }),
        );
        q('[data-heading-bar]').forEach((bar) =>
          gsap.fromTo(bar, { scaleX: reduce ? 1 : 0, opacity: reduce ? 0 : 1 }, {
            scaleX: 1,
            opacity: 1,
            transformOrigin: 'left center',
            duration: reduce ? 0.2 : DUR.medium,
            ease: EASE.enter,
            delay: reduce ? 0 : 0.15,
            scrollTrigger: onEnter(bar),
          }),
        );
        q('[data-pop]').forEach((el) =>
          gsap.fromTo(el, { scale: reduce ? 1 : 0.8, opacity: 0 }, {
            scale: 1,
            opacity: 1,
            duration: reduce ? 0.2 : DUR.medium,
            ease: EASE.enter,
            scrollTrigger: onEnter(el),
          }),
        );
      });
      return () => mm.revert();
    },
    { scope: rootRef, dependencies: deps },
  );
}
