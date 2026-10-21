import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { useGSAP } from '@gsap/react';
import { useEffect } from 'react';

// Motion tokens and helpers (decision #41, docs/ui-design/motion-spec.md). GSAP + ScrollTrigger on native
// scroll. Every effect goes through gsap.matchMedia: with prefers-reduced-motion it becomes a 200 ms fade.
gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin, useGSAP);

export const DUR = { micro: 0.15, short: 0.25, medium: 0.45, long: 0.7 };
export const EASE = { enter: 'power3.out', exit: 'power2.in', drop: 'back.out(1.6)' };
export const STAGGER = 0.07;
export const MAX_STAGGERED = 8;

// Media conditions shared by every animation.
export const MQ = {
  motion: '(prefers-reduced-motion: no-preference)',
  reduce: '(prefers-reduced-motion: reduce)',
  wide: '(min-width: 768px)',
};

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia?.(MQ.reduce).matches;
}

// Plays once when the trigger is 20% inside the viewport (spec: reveals never replay).
export function onEnter(trigger, start = 'top 80%') {
  return { trigger, start, once: true };
}

// Fade-and-rise reveal for one element or a list (stagger capped at 8 items).
// Reduced motion: a 200 ms fade with no movement.
export function reveal(targets, { trigger, reduce = false, y, stagger = STAGGER, delay = 0, start } = {}) {
  const items = gsap.utils.toArray(targets);
  if (!items.length) return null;
  const rise = y ?? (window.innerWidth < 768 ? 16 : 24);
  const each = items.length > MAX_STAGGERED ? (stagger * MAX_STAGGERED) / items.length : stagger;
  // fromTo with explicit end values: a plain from() can record 0 as its end value if a scroll-trigger
  // refresh happens while the element is still hidden.
  return gsap.fromTo(items, { opacity: 0, y: reduce ? 0 : rise }, {
    opacity: 1,
    y: 0,
    duration: reduce ? 0.2 : DUR.medium,
    ease: EASE.enter,
    stagger: reduce ? 0 : each,
    delay,
    scrollTrigger: trigger ? onEnter(trigger, start) : undefined,
  });
}

// Counts a number up (or from the previous value) and writes it with the given formatter.
export function countTo(el, to, { from = 0, duration = 1.2, format = (n) => String(Math.round(n)) } = {}) {
  const state = { value: from };
  return gsap.to(state, {
    value: to,
    duration,
    ease: 'power2.out',
    onUpdate: () => {
      el.textContent = format(state.value);
    },
  });
}

// Content that loads later (stats, road updates, fonts) moves sections down; recalculate every scroll
// trigger position when the page's height changes, so reveals never fire late or not at all.
export function useRefreshOnResize(ref) {
  useEffect(() => {
    if (!ref.current || typeof ResizeObserver === 'undefined') return undefined;
    let timer;
    const observer = new ResizeObserver(() => {
      clearTimeout(timer);
      timer = setTimeout(() => ScrollTrigger.refresh(), 100);
    });
    observer.observe(ref.current);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [ref]);
}

export { gsap, ScrollTrigger, useGSAP };
