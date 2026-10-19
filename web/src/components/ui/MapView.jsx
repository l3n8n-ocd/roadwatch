import { useEffect, useState } from 'react';
import L from 'leaflet';
import { AttributionControl, MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import Icon from './Icon';
import { cx } from '../../lib/cx';

// Map (Figma 101:649) on OpenStreetMap tiles with react-leaflet.
//
// position: { lat, lng } or null (no pin). onChange(position): makes the map editable; clicking the
//   map or using "Use current location" places the pin. Without onChange the map is read-only.
// size: 'web' (320 px tall) or 'mobile' (280 px). children: extra layers (e.g. CircleMarkers).
// The map is never the only way to give a location: the coordinates are shown as text, and the
// accident_location text field stays on the form (Figma note).
const DEFAULT_CENTER = { lat: 14.8433, lng: 120.8114 }; // Malolos, Bulacan

// Navy teardrop pin with a white center, drawn with CSS variables so it follows the theme.
const PIN_ICON = L.divIcon({
  className: '',
  iconSize: [40, 48],
  iconAnchor: [20, 46],
  html: `<svg width="40" height="48" viewBox="0 0 40 48" aria-hidden="true" focusable="false">
    <path d="M20 46C20 46 36 30.5 36 18C36 9.16 28.84 2 20 2C11.16 2 4 9.16 4 18C4 30.5 20 46 20 46Z"
      style="fill: var(--rw-brand-navy); stroke: var(--rw-text-inverse); stroke-width: 2" />
    <circle cx="20" cy="18" r="6" style="fill: var(--rw-text-inverse)" />
  </svg>`,
});

function formatCoords(position) {
  return `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}`;
}

// Places the pin where the map is clicked.
function ClickToPlace({ onChange }) {
  useMapEvents({
    click(event) {
      onChange({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
}

const controlClasses =
  'flex size-11 items-center justify-center text-text-primary hover:bg-surface-light-gray';

export default function MapView({
  position = null,
  onChange,
  size = 'web',
  zoom,
  label = 'Accident location map',
  className = '',
  children,
}) {
  const [map, setMap] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState('');
  const editable = Boolean(onChange);
  const hasPin = Boolean(position);

  // Keep the pin in view when the position changes from outside (e.g. GPS).
  useEffect(() => {
    if (map && position) map.setView([position.lat, position.lng], Math.max(map.getZoom(), 15));
  }, [map, position]);

  const locate = () => {
    if (!navigator.geolocation) {
      setLocateError('This browser cannot share its location.');
      return;
    }
    setLocateError('');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (result) => {
        setLocating(false);
        const next = { lat: result.coords.latitude, lng: result.coords.longitude };
        if (editable) onChange(next);
        else map?.setView([next.lat, next.lng], 15);
      },
      () => {
        setLocating(false);
        setLocateError('Could not get your location. Tap the map instead.');
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  const center = position || DEFAULT_CENTER;

  return (
    <div className={cx('w-full', className)}>
      <div
        role="region"
        aria-label={label}
        className={cx(
          'relative isolate w-full overflow-hidden rounded-rw-md border border-border-subtle bg-surface-navy-subtle',
          size === 'mobile' ? 'h-70' : 'h-80',
          // Attribution must stay visible; style it like the Figma caption.
          '[&_.leaflet-control-attribution]:bg-surface-white [&_.leaflet-control-attribution]:px-2 [&_.leaflet-control-attribution]:py-1',
          '[&_.leaflet-control-attribution]:type-caption [&_.leaflet-control-attribution]:text-text-muted',
          '[&_.leaflet-control-attribution_a]:text-text-blue',
        )}
      >
        <MapContainer
          ref={setMap}
          center={[center.lat, center.lng]}
          zoom={zoom ?? (hasPin ? 15 : 13)}
          zoomControl={false}
          attributionControl={false}
          className="size-full"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <AttributionControl position="bottomright" prefix={false} />
          {editable && <ClickToPlace onChange={onChange} />}
          {hasPin && (
            <Marker
              position={[position.lat, position.lng]}
              icon={PIN_ICON}
              keyboard={false}
              draggable={editable}
              eventHandlers={
                editable
                  ? { dragend: (event) => onChange({ ...event.target.getLatLng() }) }
                  : undefined
              }
            />
          )}
          {children}
        </MapContainer>

        {/* Coordinates as text (the map's text alternative). */}
        {hasPin && (
          <p className="absolute top-3 left-3 z-[1000] flex items-center gap-2 rounded-rw-sm bg-surface-white px-3 py-2 type-label text-text-primary shadow-rw-sm">
            <Icon name="map-pin" size={16} />
            <span>
              <span className="sr-only">Pin at latitude, longitude: </span>
              {formatCoords(position)}
            </span>
          </p>
        )}

        {/* Zoom */}
        <div className="absolute top-3 right-3 z-[1000] flex flex-col overflow-hidden rounded-rw-sm bg-surface-white shadow-rw-sm">
          <button type="button" aria-label="Zoom in" className={controlClasses} onClick={() => map?.zoomIn()}>
            <Icon name="plus" size={20} />
          </button>
          <button type="button" aria-label="Zoom out" className={controlClasses} onClick={() => map?.zoomOut()}>
            <Icon name="minus" size={20} />
          </button>
        </div>

        {/* Use current location */}
        <button
          type="button"
          aria-label="Use current location"
          onClick={locate}
          className="absolute right-3 bottom-9 z-[1000] flex size-12 items-center justify-center rounded-full bg-surface-white text-text-blue shadow-rw-md hover:bg-surface-light-gray"
        >
          <Icon name="locate" size={24} />
        </button>

        {/* No pin yet: instruction chip. */}
        {editable && !hasPin && !locating && (
          <p className="pointer-events-none absolute top-1/2 left-1/2 z-[1000] flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full bg-brand-navy px-4 py-2 type-label whitespace-nowrap text-text-inverse shadow-rw-md">
            <Icon name="map-pin" size={16} />
            Tap the map to place a pin
          </p>
        )}

        {/* Locating card */}
        {locating && (
          <div
            role="status"
            className="absolute top-1/2 left-1/2 z-[1000] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2 rounded-rw-sm bg-surface-white px-4 py-3 type-label text-text-primary shadow-rw-md"
          >
            <Icon name="loader" size={20} className="animate-spin motion-reduce:animate-none" />
            Finding your location…
          </div>
        )}
      </div>

      {/* Text alternative for screen readers, and the error when locating fails. */}
      <p className="sr-only" aria-live="polite">
        {hasPin ? `Pin placed at ${formatCoords(position)}.` : 'No pin placed.'}
      </p>
      {locateError && (
        <p role="alert" className="mt-2 flex items-start gap-2 type-body-sm text-text-danger">
          <Icon name="alert-circle" size={16} className="mt-0.5" />
          {locateError}
        </p>
      )}
    </div>
  );
}
