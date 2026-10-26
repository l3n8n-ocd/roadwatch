import { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import Button from './Button';
import MapView from './MapView';
import useFocusTrap from './useFocusTrap';

// Full-screen map (#46; Figma W4 410:17163, W0 410:17216, W2 410:17303): a modal with a header
// (title + Close) and the map filling the window. `aside` is the text alternative shown beside the
// map (the list of records or Top locations); it moves under the map on small screens.
// Escape or Close shuts it and focus returns to the Expand button.
export default function FullScreenMap({ open, onClose, title, position = null, zoom, label, aside, children }) {
  const panelRef = useRef(null);
  const titleId = useId();
  useFocusTrap(panelRef, open, onClose);
  if (!open) return null;

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabIndex={-1}
      className="fixed inset-0 z-[2000] flex flex-col bg-surface-white transition-opacity duration-200 starting:opacity-0"
    >
      <div className="flex min-h-18 shrink-0 items-center justify-between gap-4 border-b border-border-subtle px-4 py-3 sm:px-8">
        <h2 id={titleId} className="min-w-0 type-h3 text-text-primary">
          {title}
        </h2>
        <Button variant="secondary" icon="x" onClick={onClose} data-autofocus className="shrink-0">
          Close
        </Button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="min-h-0 flex-1">
          <MapView size="fill" position={position} zoom={zoom} label={label}>
            {children}
          </MapView>
        </div>
        {aside && (
          <div className="max-h-[40vh] shrink-0 overflow-y-auto border-t border-border-subtle p-4 sm:p-6 lg:max-h-none lg:w-[400px] lg:border-t-0 lg:border-l">
            {aside}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
