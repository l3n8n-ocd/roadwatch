import { DUR, EASE, MQ, gsap, onEnter, useGSAP } from '../../lib/motion';

// Landing-only motion (decision #41, docs/ui-design/motion-spec.md; Figma page "Motion (#41)").
// Generic reveals (headings, lists, cards) come from useReveals; the stats count-up and the road
// updates live in their own sections because their data arrives later.
export default function useLandingMotion(rootRef) {
  useGSAP(
    () => {
      const q = gsap.utils.selector(rootRef);
      const mm = gsap.matchMedia();

      mm.add({ motion: MQ.motion, reduce: MQ.reduce, wide: MQ.wide }, ({ conditions }) => {
        const { reduce, wide } = conditions;

        // P1 hero, about 2.2 s on page load. Text and buttons are readable and usable from 300 ms.
        const roads = q('[data-road]').filter((svg) => svg.getBoundingClientRect().width > 0);
        const hero = gsap.timeline({ defaults: { ease: EASE.enter } });
        if (reduce) {
          hero.from(q('[data-hero-word], [data-hero-fade], [data-hero-card], [data-road]'), { opacity: 0, duration: 0.2 });
        } else {
          hero
            .from(q('[data-hero-fade]'), { opacity: 0, y: 12, duration: 0.3, stagger: 0.04 }, 0)
            .from(q('[data-hero-word]'), { opacity: 0, y: 24, duration: DUR.medium, stagger: 0.06 }, 0.3);
          roads.forEach((svg) => {
            const pin = svg.querySelector('[data-pin]');
            hero
              .from(svg.querySelector('[data-road-mask]'), { drawSVG: '0%', duration: 1.1 }, 0.3)
              .from(pin, { y: -60, opacity: 0, duration: 0.5, ease: EASE.drop }, 1.1)
              .from(svg.querySelector('[data-pin-shadow]'), { scale: 0, transformOrigin: '50% 50%', duration: 0.5 }, 1.1);
          });
          hero
            .from(q('[data-hero-card]'), { opacity: 0, y: 24, duration: DUR.medium }, 1.6)
            .from(q('[data-hero-card] li'), { opacity: 0, y: 16, duration: 0.35, stagger: 0.07 }, 1.75)
            .to(
              q('[data-hero-card] li:first-child > div > span:first-child'),
              { scale: 1.2, duration: 0.2, yoyo: true, repeat: 3, ease: 'sine.inOut' },
              2.1,
            );
        }

        // P2 hero while scrolling (768 px and up): slower photo and dashes that slide like a moving car.
        if (!reduce && wide) {
          const heroEl = q('[data-hero]')[0];
          const scrub = { trigger: heroEl, start: 'top top', end: 'bottom top', scrub: true };
          gsap.to(q('[data-hero-photo]'), { yPercent: 12, ease: 'none', scrollTrigger: scrub });
          gsap.to(q('[data-road-dashes]'), { strokeDashoffset: -260, ease: 'none', scrollTrigger: { ...scrub } });
        }

        // P6 how it works: the connector line draws with the scroll; each step number pops in.
        const steps = q('[data-steps]')[0];
        if (steps) {
          if (!reduce && wide) {
            gsap.from(q('[data-step-line]'), {
              scaleX: 0,
              transformOrigin: 'left center',
              ease: 'none',
              stagger: 0.5,
              scrollTrigger: { trigger: steps, start: 'top 75%', end: 'bottom 50%', scrub: true },
            });
          }
          gsap.fromTo(q('[data-step]'), { opacity: 0, y: reduce ? 0 : 16 }, {
            opacity: 1,
            y: 0,
            duration: reduce ? 0.2 : DUR.medium,
            ease: EASE.enter,
            stagger: reduce ? 0 : 0.25,
            scrollTrigger: onEnter(steps),
          });
          if (!reduce) {
            gsap.from(q('[data-step-dot]'), {
              scale: 0.6,
              duration: DUR.medium,
              ease: EASE.drop,
              stagger: 0.25,
              scrollTrigger: onEnter(steps),
            });
          }
        }

        // P8 the emergency card's phone icons ring twice to draw the eye to the numbers.
        const rings = q('[data-ring]');
        if (rings.length && !reduce) {
          gsap.fromTo(
            rings,
            { rotate: 0 },
            {
              keyframes: { rotate: [0, -8, 8, -8, 8, 0] },
              duration: 0.6,
              ease: 'sine.inOut',
              stagger: 0.05,
              delay: 0.4,
              repeat: 1,
              repeatDelay: 0.3,
              scrollTrigger: onEnter(rings[0].closest('aside')),
            },
          );
        }

        // P9 the six check icons draw their ticks one after another.
        const ticks = q('[data-ticks]')[0];
        if (ticks && !reduce) {
          gsap.from(q('[data-ticks] svg path'), {
            drawSVG: '0%',
            duration: 0.4,
            ease: EASE.enter,
            stagger: 0.06,
            scrollTrigger: onEnter(ticks),
          });
        }

        // P10 FAQ: question slides in from the right, a typing bubble shows for 400 ms, then the answer rises.
        // Pairs that enter together queue up, so the chat plays one exchange at a time (0.6 s apart).
        // With reduce motion they all fade in at once.
        let nextStart = 0;
        const queue = (tl) => {
          if (reduce) return tl.play();
          const now = gsap.ticker.time;
          nextStart = Math.max(now, nextStart);
          gsap.delayedCall(nextStart - now, () => tl.play());
          nextStart += 0.6;
          return tl;
        };
        q('[data-faq-pair]').forEach((pair) => {
          const question = pair.querySelector('[data-faq-q]');
          const typing = pair.querySelector('[data-faq-typing]');
          const answer = pair.querySelector('[data-faq-a]');
          const tl = gsap.timeline({ paused: true });
          gsap.timeline({ scrollTrigger: { ...onEnter(pair, 'top 85%'), onEnter: () => queue(tl) } });
          if (reduce) {
            tl.fromTo([question, answer], { opacity: 0 }, { opacity: 1, duration: 0.2 });
            return;
          }
          // Hidden until its turn; it leaves the row while the typing bubble shows beside the avatar.
          gsap.set(answer, { opacity: 0 });
          tl.set(answer, { display: 'none' })
            .fromTo(question, { opacity: 0, x: 24 }, { opacity: 1, x: 0, duration: DUR.short, ease: EASE.enter })
            .set(typing, { display: 'flex' })
            .from(typing, { opacity: 0, duration: 0.15 })
            .set(typing, { display: 'none' }, '+=0.25')
            .set(answer, { display: 'block' })
            .fromTo(answer, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: DUR.medium, ease: EASE.enter });
        });

        // P11 the QR placeholder's dashed border draws around the box.
        const qr = q('[data-qr]')[0];
        if (qr && !reduce) {
          gsap.from(qr, {
            clipPath: 'inset(0% 100% 100% 0%)',
            duration: 0.6,
            ease: EASE.enter,
            delay: 0.2,
            scrollTrigger: onEnter(qr),
          });
        }
      });

      return () => mm.revert();
    },
    { scope: rootRef },
  );
}
