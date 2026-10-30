import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import Button from './Button';
import IconButton from './IconButton';
import useFocusTrap from './useFocusTrap';

// Accessibility guide tour (#56, Figma W2 543:26679). A dimmed page, a focus ring around the part being explained,
// and a step card: "STEP 2 OF 6", title, text, Read aloud (optional, Web Speech API), Back / Next.
// Everything is text, so nothing depends on sound. Keyboard: Tab stays in the card, Esc closes, ← → change steps.
// steps: [{ target: data-guide key, title, text }]

const SPEEDS = [0.75, 1, 1.25];
const canSpeak = typeof window !== 'undefined' && 'speechSynthesis' in window;
const PREF_KEY = 'rw-guide-read-aloud';

function readPref() {
  try {
    return localStorage.getItem(PREF_KEY) === 'on';
  } catch {
    return false;
  }
}
function writePref(on) {
  try {
    localStorage.setItem(PREF_KEY, on ? 'on' : 'off');
  } catch {
    // Private windows can refuse storage; the guide still works.
  }
}

const CARD_WIDTH = 440;
const GAP = 16;

export default function GuideTour({ open, steps, onClose }) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState(null);
  const [reading, setReading] = useState(() => canSpeak && readPref());
  const [speed, setSpeed] = useState(1);
  const cardRef = useRef(null);
  const step = steps[index];

  useFocusTrap(cardRef, open, onClose);

  // Start from step 1 each time it opens.
  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  // Find the highlighted element (hidden elements, like the sidebar on a phone, have no box).
  const measure = useCallback(() => {
    const el = step && document.querySelector(`[data-guide="${step.target}"]`);
    const box = el?.getBoundingClientRect();
    setRect(box && box.width > 0 && box.height > 0 ? box : null);
  }, [step]);

  useLayoutEffect(() => {
    if (!open || !step) return undefined;
    const el = document.querySelector(`[data-guide="${step.target}"]`);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (el && el.getBoundingClientRect().height > 0) el.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
    measure();
    const timer = setTimeout(measure, 400); // after a smooth scroll
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [open, step, measure]);

  // Read aloud: speaks the current step; moving to another step reads that one too.
  useEffect(() => {
    if (!canSpeak) return undefined;
    window.speechSynthesis.cancel();
    if (open && reading && step) {
      const utterance = new SpeechSynthesisUtterance(`${step.title}. ${step.text}`);
      utterance.rate = speed;
      utterance.lang = 'en-PH';
      window.speechSynthesis.speak(utterance);
    }
    return () => window.speechSynthesis.cancel();
  }, [open, reading, step, speed]);

  // ← → change steps (not while typing).
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.target.closest?.('input, textarea, select')) return;
      if (event.key === 'ArrowRight') setIndex((i) => Math.min(i + 1, steps.length - 1));
      if (event.key === 'ArrowLeft') setIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, steps.length]);

  if (!open || !step) return null;

  const last = index === steps.length - 1;
  const toggleReading = () => {
    setReading((on) => {
      writePref(!on);
      return !on;
    });
  };

  // Card below the highlight when there is room, else above, else beside it (a tall part like the sidebar), else in
  // the bottom-right corner; centered when nothing is highlighted. Phones get a full-width card at the bottom.
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const CARD_HEIGHT = 380;
  let style;
  if (vw < 640) style = { left: 16, right: 16, bottom: 16 };
  else if (!rect) style = { left: Math.max(16, (vw - CARD_WIDTH) / 2), top: Math.max(16, vh / 2 - CARD_HEIGHT / 2), width: CARD_WIDTH };
  else {
    const left = Math.min(Math.max(16, rect.left + 24), vw - CARD_WIDTH - 16);
    const top = Math.max(16, Math.min(rect.top + 24, vh - CARD_HEIGHT - 16));
    if (vh - rect.bottom - GAP >= CARD_HEIGHT) style = { left, top: rect.bottom + GAP, width: CARD_WIDTH };
    else if (rect.top - GAP >= CARD_HEIGHT) style = { left, bottom: vh - rect.top + GAP, width: CARD_WIDTH };
    else if (vw - rect.right - GAP >= CARD_WIDTH + 16) style = { left: rect.right + GAP, top, width: CARD_WIDTH };
    else if (rect.left - GAP >= CARD_WIDTH + 16) style = { left: rect.left - GAP - CARD_WIDTH, top, width: CARD_WIDTH };
    else style = { right: 16, bottom: 16, width: CARD_WIDTH };
  }

  return (
    <div className="fixed inset-0 z-[2600]">
      {/* Decorative dimming; the highlight is a ring around the part of the page being explained. */}
      <div aria-hidden="true" className="absolute inset-0 bg-brand-navy/45" onClick={onClose} />
      {rect && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute rounded-[20px] border-[3px] border-border-focus bg-surface-white/10"
          style={{ left: rect.left - 8, top: rect.top - 8, width: rect.width + 16, height: rect.height + 16 }}
        />
      )}
      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guide-title"
        aria-describedby="guide-text"
        className="absolute flex max-h-[calc(100vh-32px)] flex-col gap-4 overflow-y-auto rounded-rw-md border border-border-subtle bg-surface-white p-6 shadow-rw-lg"
        style={style}
      >
        <div className="flex items-center gap-2">
          <p className="flex-1 type-overline uppercase text-text-muted" aria-live="polite">
            Step {index + 1} of {steps.length}
          </p>
          <IconButton icon="x" label="Close guide" onClick={onClose} />
        </div>
        <div aria-live="polite" className="flex flex-col gap-2">
          <h2 id="guide-title" className="type-h3 text-text-primary">
            {step.title}
          </h2>
          <p id="guide-text" className="type-body text-text-primary">
            {step.text}
          </p>
        </div>
        {canSpeak ? (
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" icon={reading ? 'pause' : 'volume'} aria-pressed={reading} onClick={toggleReading}>
              {reading ? 'Stop reading' : 'Read aloud'}
            </Button>
            <button
              type="button"
              onClick={() => setSpeed((s) => SPEEDS[(SPEEDS.indexOf(s) + 1) % SPEEDS.length])}
              className="min-h-11 rounded-rw-sm px-2 type-body-sm text-text-muted underline-offset-2 hover:underline"
              aria-label={`Reading speed ${speed}×. Change speed`}
            >
              Speed {speed}×
            </button>
          </div>
        ) : (
          <p className="type-body-sm text-text-muted">Read aloud isn’t available in this browser. The guide is all text.</p>
        )}
        <div className="flex gap-3">
          <Button variant="secondary" icon="chevron-left" disabled={index === 0} onClick={() => setIndex(index - 1)} className="min-w-0 flex-1">
            Back
          </Button>
          <Button icon={last ? 'check' : 'chevron-right'} onClick={() => (last ? onClose() : setIndex(index + 1))} className="min-w-0 flex-1" data-autofocus>
            {last ? 'Done' : 'Next'}
          </Button>
        </div>
        <p className="type-body-sm text-text-muted">
          Keyboard: Tab moves inside the guide, Esc closes it, ← → change steps. Everything in the guide is text; Read
          aloud is optional.
        </p>
      </div>
    </div>
  );
}
