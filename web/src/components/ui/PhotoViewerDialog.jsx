import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import IconButton from './IconButton';
import useFocusTrap from './useFocusTrap';
import { formatDateTime } from '../../lib/format';

// Full-screen photo viewer (#46, Figma W4/Overlay/Photo viewer 410:17126): every photo of a report,
// uncropped, with "Photo 2 of 3", previous/next (buttons, arrow keys or a swipe), zoom (+/- buttons or
// keys) and Close (button or Escape). No download button (DECISIONS #43). Always dark, in both themes.
const ZOOM_STEPS = [1, 1.5, 2, 3, 4];

export default function PhotoViewerDialog({ open, onClose, photos, index, onIndexChange, reportLabel }) {
  const panelRef = useRef(null);
  const titleId = useId();
  const touchX = useRef(null);
  const [zoomStep, setZoomStep] = useState(0);
  useFocusTrap(panelRef, open, onClose);

  const count = photos.length;
  const go = (step) => {
    setZoomStep(0);
    onIndexChange((index + step + count) % count);
  };
  const zoomBy = (step) => setZoomStep((z) => Math.min(ZOOM_STEPS.length - 1, Math.max(0, z + step)));

  // Arrow keys and +/- work anywhere in the viewer (Escape is handled by the focus trap).
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'ArrowLeft' && count > 1) go(-1);
      else if (event.key === 'ArrowRight' && count > 1) go(1);
      else if (event.key === '+' || event.key === '=') zoomBy(1);
      else if (event.key === '-' || event.key === '_') zoomBy(-1);
      else return;
      event.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!open || count === 0) return null;
  const photo = photos[Math.min(index, count - 1)];
  const zoom = ZOOM_STEPS[zoomStep];
  const counter = `Photo ${index + 1} of ${count}`;

  const onTouchStart = (event) => {
    touchX.current = event.touches.length === 1 && zoom === 1 ? event.touches[0].clientX : null;
  };
  const onTouchEnd = (event) => {
    if (touchX.current == null || count < 2) return;
    const dx = event.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    touchX.current = null;
  };

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      className="fixed inset-0 z-[2000] flex flex-col bg-dark-bg text-text-inverse transition-opacity duration-200 starting:opacity-0"
    >
      <div className="flex shrink-0 items-center justify-between gap-4 px-4 py-3 sm:px-8 sm:py-6">
        <h2 id={titleId} aria-live="polite" className="type-button">
          {counter}
          {reportLabel && ` · ${reportLabel}`}
        </h2>
        <IconButton icon="x" label="Close photo viewer" tone="dark" onClick={onClose} data-autofocus />
      </div>

      <div className="flex min-h-0 flex-1 items-center gap-2 px-2 sm:gap-6 sm:px-6 lg:px-16">
        {count > 1 && <IconButton icon="chevron-left" label="Previous photo" tone="dark" onClick={() => go(-1)} />}
        <div
          className={`flex min-h-0 min-w-0 flex-1 self-stretch ${zoom > 1 ? 'overflow-auto' : 'items-center justify-center overflow-hidden'}`}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <img
            key={photo.cloudinary_url}
            src={photo.cloudinary_url}
            alt={`${counter}${reportLabel ? ` of ${reportLabel}` : ''}`}
            draggable={false}
            className={zoom > 1 ? 'm-auto max-w-none' : 'max-h-full max-w-full object-contain'}
            style={zoom > 1 ? { width: `${zoom * 100}%` } : undefined}
          />
        </div>
        {count > 1 && <IconButton icon="chevron-right" label="Next photo" tone="dark" onClick={() => go(1)} />}
      </div>

      <div className="flex shrink-0 flex-col items-center gap-2 px-4 py-4 sm:py-6">
        <div className="flex items-center gap-3">
          <IconButton icon="minus" label="Zoom out" tone="dark" disabled={zoomStep === 0} onClick={() => zoomBy(-1)} />
          <span aria-live="polite" className="min-w-12 text-center type-label">
            <span className="sr-only">Zoom </span>
            {Math.round(zoom * 100)}%
          </span>
          <IconButton
            icon="plus"
            label="Zoom in"
            tone="dark"
            disabled={zoomStep === ZOOM_STEPS.length - 1}
            onClick={() => zoomBy(1)}
          />
        </div>
        {photo.uploaded_at && <p className="type-body-sm">Added {formatDateTime(photo.uploaded_at)}</p>}
        <p className="type-body-sm text-text-inverse-muted max-sm:hidden">← → next photo · + − zoom · Esc closes</p>
        <p className="type-body-sm text-text-inverse-muted sm:hidden">Swipe for the next photo.</p>
      </div>
    </div>,
    document.body,
  );
}
