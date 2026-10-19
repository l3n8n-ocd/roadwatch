import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  ConfirmDialog,
  DateTimeField,
  Icon,
  MapView,
  PhotoTile,
  Select,
  Stepper,
  TextField,
  Textarea,
  Toast,
} from '../../components/ui';
import { lookups, reports } from '../../api/endpoints';
import { INJURY_OPTIONS } from '../../lib/constants';
import { formatDate } from '../../lib/format';

// R1-R3 Report an accident (Figma: Details 231:5950, Location 231:6193, Photos 231:6369).
// One component for the three steps (/report/details|location|photos). The text fields are kept
// in sessionStorage so a refresh or the Back button does not lose them; photos stay in memory.
// Submit: POST /reports, then POST /reports/:id/photos (if any), then the confirmation (R4).

const STEPS = ['details', 'location', 'photos'];
const STEP_LABELS = ['Details', 'Location', 'Photos'];
const DRAFT_KEY = 'rw-report-draft';

const MAX_PHOTOS = 5;
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const EMPTY_DRAFT = {
  accident_type_id: '',
  injury_information: '',
  accident_date: '',
  accident_time: '',
  vehicles_involved: '',
  accident_description: '',
  accident_location: '',
  latitude: null,
  longitude: null,
  locationFromPin: false, // true while accident_location is the address looked up from the pin
};

function loadDraft() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || 'null');
    return saved ? { ...EMPTY_DRAFT, ...saved } : EMPTY_DRAFT;
  } catch {
    return EMPTY_DRAFT;
  }
}

function saveDraft(draft) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Storage blocked: the draft lives only in memory.
  }
}

function clearDraft() {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}

// Today in the browser's time zone, as YYYY-MM-DD (for max= on the date field).
function todayISO() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Field rules from root CLAUDE.md section 7 and the API schema (routes/schemas.js).
function validateDetails(d) {
  const errors = {};
  if (!d.accident_type_id) errors.accident_type_id = 'Choose the accident type.';
  if (!d.injury_information) errors.injury_information = 'Choose an option. Pick Unknown if you are not sure.';
  if (!d.accident_date) errors.accident_date = 'Enter the date of the accident.';
  else if (d.accident_date > todayISO()) errors.accident_date = 'The date cannot be in the future.';
  if (!d.accident_time) errors.accident_time = 'Enter the approximate time.';
  const description = d.accident_description.trim().length;
  if (description < 10) errors.accident_description = `Describe what happened in at least 10 characters (${description} so far).`;
  return errors;
}

function validateLocation(d) {
  const errors = {};
  const length = d.accident_location.trim().length;
  if (length < 3) errors.accident_location = 'Type the road, barangay or landmark (at least 3 characters).';
  return errors;
}

function formatBytes(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// OpenStreetMap Nominatim reverse lookup (clients call it directly, root CLAUDE.md section 4).
async function lookUpAddress({ lat, lng }, signal) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=18&lat=${lat}&lon=${lng}`;
  const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('lookup failed');
  const data = await res.json();
  return (data.display_name || '').slice(0, 255);
}

const TIPS = [
  { icon: 'phone', text: 'In an emergency, call 911 first.' },
  { icon: 'alert-triangle', text: 'Do not stop in live traffic to take photos.' },
  { icon: 'map-pin', text: 'GPS location and photos are optional.' },
  { icon: 'lock', text: 'Only administrators and the assigned officer see your contact details.' },
];

function TipsCard() {
  return (
    <aside
      aria-labelledby="tips-title"
      className="flex w-full flex-col gap-5 rounded-rw-md border border-border-subtle bg-surface-white p-6 sm:p-8 lg:w-90 lg:shrink-0"
    >
      <h2 id="tips-title" className="type-h3 text-text-primary">
        Before you start
      </h2>
      <ul className="flex flex-col gap-5">
        {TIPS.map((tip) => (
          <li key={tip.icon} className="flex items-start gap-3 type-body text-text-primary">
            <Icon name={tip.icon} size={20} className="mt-0.5" />
            <span className="min-w-0 flex-1">{tip.text}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default function ReportWizard() {
  const { step = 'details' } = useParams();
  const navigate = useNavigate();
  const [draft, setDraft] = useState(loadDraft);
  const [errors, setErrors] = useState({});
  const [types, setTypes] = useState([]);
  const [typesError, setTypesError] = useState('');
  const [photos, setPhotos] = useState([]); // [{ id, file, url }]
  const [rejected, setRejected] = useState([]); // [{ id, name, message, caption }]
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locateError, setLocateError] = useState('');
  const [lookingUp, setLookingUp] = useState(false);
  const headingRef = useRef(null);
  const fileInputRef = useRef(null);
  const photosRef = useRef(photos);
  const firstRender = useRef(true);

  const stepIndex = STEPS.indexOf(step);
  const position = draft.latitude != null && draft.longitude != null ? { lat: draft.latitude, lng: draft.longitude } : null;

  useEffect(() => saveDraft(draft), [draft]);

  // Accident types for the dropdown.
  useEffect(() => {
    let cancelled = false;
    lookups
      .accidentTypes()
      .then((rows) => {
        if (!cancelled) setTypes(Array.isArray(rows) ? rows : []);
      })
      .catch((err) => {
        if (!cancelled) setTypesError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Move focus to the step heading when the step changes (screen readers hear the new step).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setErrors({});
    headingRef.current?.focus();
  }, [step]);

  // Free the photo previews when leaving the page.
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.url)), []);

  // Look up the address for a new pin, unless the reporter typed their own location.
  useEffect(() => {
    if (!position || (draft.accident_location.trim() && !draft.locationFromPin)) return undefined;
    const controller = new AbortController();
    setLookingUp(true);
    lookUpAddress(position, controller.signal)
      .then((address) => {
        if (address) setDraft((d) => (d.locationFromPin || !d.accident_location.trim() ? { ...d, accident_location: address, locationFromPin: true } : d));
      })
      .catch(() => {
        // Lookup is a convenience; the reporter can type the location.
      })
      .finally(() => setLookingUp(false));
    return () => {
      controller.abort();
      setLookingUp(false);
    };
    // Only a new pin should trigger a lookup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.latitude, draft.longitude]);

  if (stepIndex === -1) return <Navigate to="/report/details" replace />;
  // Later steps need the earlier ones to be valid (e.g. after a refresh or a typed URL).
  if (stepIndex > 0 && Object.keys(validateDetails(draft)).length) return <Navigate to="/report/details" replace />;
  if (stepIndex > 1 && Object.keys(validateLocation(draft)).length) return <Navigate to="/report/location" replace />;

  const update = (field) => (event) => {
    const value = event.target.value;
    setDraft((d) => ({ ...d, [field]: value, ...(field === 'accident_location' ? { locationFromPin: false } : {}) }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const setPin = (next) => {
    setDraft((d) => ({
      ...d,
      latitude: next ? Number(next.lat.toFixed(7)) : null,
      longitude: next ? Number(next.lng.toFixed(7)) : null,
    }));
  };

  const locateMe = () => {
    if (!navigator.geolocation) {
      setLocateError('This browser cannot share its location. Tap the map instead.');
      return;
    }
    setLocateError('');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (result) => {
        setLocating(false);
        setPin({ lat: result.coords.latitude, lng: result.coords.longitude });
      },
      () => {
        setLocating(false);
        setLocateError('Could not get your location. Tap the map or type the location instead.');
      },
      { enableHighAccuracy: true, timeout: 15000 },
    );
  };

  // Shows errors and moves focus to the first invalid field.
  const showErrors = (found) => {
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) requestAnimationFrame(() => document.getElementById(`report-${first}`)?.focus());
  };

  const goNext = (event) => {
    event.preventDefault();
    const found = step === 'details' ? validateDetails(draft) : validateLocation(draft);
    if (Object.keys(found).length) {
      showErrors(found);
      return;
    }
    navigate(`/report/${STEPS[stepIndex + 1]}`);
  };

  const goBack = () => navigate(`/report/${STEPS[stepIndex - 1]}`);

  const isDirty = JSON.stringify({ ...draft, locationFromPin: false }) !== JSON.stringify(EMPTY_DRAFT) || photos.length > 0;
  const cancel = () => {
    if (isDirty) setConfirmCancel(true);
    else navigate('/my-reports');
  };
  const discard = () => {
    clearDraft();
    navigate('/my-reports');
  };

  // Photos: validate type and size in the browser (the API checks again).
  const addFiles = (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = ''; // allow picking the same file again
    const accepted = [];
    const refused = [];
    files.forEach((file, i) => {
      const id = `${Date.now()}-${i}-${file.name}`;
      if (!PHOTO_TYPES.includes(file.type)) {
        refused.push({ id, name: file.name, message: 'Wrong type', caption: `${file.name}: use JPG, PNG or WebP` });
      } else if (file.size > MAX_PHOTO_BYTES) {
        refused.push({ id, name: file.name, message: 'Too large', caption: `${formatBytes(file.size)}, max 5 MB` });
      } else if (photos.length + accepted.length >= MAX_PHOTOS) {
        refused.push({ id, name: file.name, message: 'Limit reached', caption: `${file.name}: only 5 photos` });
      } else {
        accepted.push({ id, file, url: URL.createObjectURL(file) });
      }
    });
    setPhotos((list) => [...list, ...accepted]);
    setRejected(refused);
  };

  const removePhoto = (id) => {
    setPhotos((list) => {
      const target = list.find((p) => p.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return list.filter((p) => p.id !== id);
    });
  };

  const submit = async () => {
    if (submitting) return;
    setSubmitError('');
    setSubmitting(true);
    const body = {
      accident_type_id: Number(draft.accident_type_id),
      accident_date: draft.accident_date,
      accident_time: draft.accident_time,
      accident_location: draft.accident_location.trim(),
      accident_description: draft.accident_description.trim(),
      injury_information: draft.injury_information,
    };
    if (draft.vehicles_involved.trim()) body.vehicles_involved = draft.vehicles_involved.trim();
    if (position) {
      body.latitude = draft.latitude;
      body.longitude = draft.longitude;
    }
    let report;
    try {
      report = await reports.create(body);
    } catch (err) {
      setSubmitting(false);
      const fields = err.details ? Object.keys(err.details).join(', ') : '';
      setSubmitError(fields ? `${err.message} (${fields})` : err.message);
      return;
    }
    // The report exists now; a failed photo upload must not lose it (Figma M5 "Photo upload failed").
    let photoFailed = 0;
    if (photos.length) {
      try {
        await reports.uploadPhotos(report.report_id, photos.map((p) => p.file));
      } catch {
        photoFailed = photos.length;
      }
    }
    clearDraft();
    navigate(`/report/submitted/${report.report_id}`, { replace: true, state: { report, photoFailed } });
  };

  const typeOptions = types.map((t) => ({ value: String(t.type_id), label: t.type_name }));
  const typeName = types.find((t) => String(t.type_id) === String(draft.accident_type_id))?.type_name || '';
  const injuryLabel = INJURY_OPTIONS.find((o) => o.value === draft.injury_information)?.label || '';
  const stepLabel = `Step ${stepIndex + 1} of 3 · ${STEP_LABELS[stepIndex]}`;
  const cardHeading = { details: 'Accident details', location: 'Where did it happen?', photos: 'Add photos (optional)' }[step];

  const actionsClass = 'flex flex-col-reverse gap-3 sm:flex-row sm:justify-end';
  const actionButton = 'sm:w-46';

  return (
    <div className="mx-auto flex w-full max-w-280 flex-col gap-6 px-4 pt-6 pb-16 sm:px-6 lg:pt-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="type-h1 text-text-primary">Report an accident</h1>
          {/* Repeats the stepper text, so it is hidden from screen readers and on small screens. */}
          <p aria-hidden="true" className="hidden type-body text-text-muted md:block">
            {stepLabel}
          </p>
        </div>
        <Stepper step={stepIndex + 1} labels={STEP_LABELS} className="md:w-82 md:shrink-0" />
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <form
          noValidate
          onSubmit={step === 'photos' ? (e) => e.preventDefault() : goNext}
          aria-labelledby="step-title"
          className="flex min-w-0 flex-1 flex-col gap-5 rounded-rw-md border border-border-subtle bg-surface-white p-4 sm:p-8"
        >
          <h2 id="step-title" ref={headingRef} tabIndex={-1} className="type-h3 text-text-primary focus-visible:shadow-none">
            {cardHeading}
          </h2>

          {step === 'details' && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  id="report-accident_type_id"
                  label="Accident type"
                  required
                  placeholder={types.length ? 'Select a type' : 'Loading types…'}
                  options={typeOptions}
                  value={draft.accident_type_id}
                  onChange={update('accident_type_id')}
                  error={errors.accident_type_id || (typesError ? `Could not load the types. ${typesError}` : undefined)}
                />
                <Select
                  id="report-injury_information"
                  label="Injuries"
                  required
                  placeholder="Select"
                  options={INJURY_OPTIONS}
                  value={draft.injury_information}
                  onChange={update('injury_information')}
                  helper="Choose Unknown if you are not sure."
                  error={errors.injury_information}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <DateTimeField
                  id="report-accident_date"
                  type="date"
                  label="Accident date"
                  required
                  max={todayISO()}
                  value={draft.accident_date}
                  onChange={update('accident_date')}
                  error={errors.accident_date}
                />
                <DateTimeField
                  id="report-accident_time"
                  type="time"
                  label="Accident time"
                  required
                  value={draft.accident_time}
                  onChange={update('accident_time')}
                  error={errors.accident_time}
                />
              </div>
              <TextField
                id="report-vehicles_involved"
                label="Vehicles involved"
                optional
                icon="car"
                maxLength={255}
                placeholder="e.g. 1 tricycle, 1 motorcycle"
                value={draft.vehicles_involved}
                onChange={update('vehicles_involved')}
                helper="Type and number of vehicles, if any."
              />
              <Textarea
                id="report-accident_description"
                label="What happened?"
                required
                showCount
                maxLength={10000}
                placeholder="Describe the accident, the road and traffic conditions."
                value={draft.accident_description}
                onChange={update('accident_description')}
                helper="At least 10 characters."
                error={errors.accident_description}
              />
              <div className={actionsClass}>
                <Button variant="secondary" onClick={cancel} className={actionButton}>
                  Cancel
                </Button>
                <Button type="submit" icon="chevron-right" className={actionButton}>
                  Next: Location
                </Button>
              </div>
            </>
          )}

          {step === 'location' && (
            <>
              <p className="type-body text-text-muted">
                Drop a pin on the map or use your current location. You can also type the road, barangay or landmark.
              </p>
              <div className="flex flex-col gap-2">
                <Button variant="secondary" icon="locate" onClick={locateMe} disabled={locating} className="self-start max-sm:w-full">
                  {locating ? 'Finding your location…' : 'Use my current location'}
                </Button>
                {locateError && (
                  <p role="alert" className="flex items-start gap-2 type-body-sm text-text-danger">
                    <Icon name="alert-circle" size={16} className="mt-0.5" />
                    {locateError}
                  </p>
                )}
              </div>
              <MapView position={position} onChange={setPin} label="Accident location map. Click to place a pin." />
              <TextField
                id="report-accident_location"
                label="Accident location"
                required
                icon="map-pin"
                maxLength={255}
                autoComplete="off"
                placeholder="e.g. MacArthur Hwy cor. Paseo del Congreso, Malolos"
                value={draft.accident_location}
                onChange={update('accident_location')}
                helper={
                  lookingUp
                    ? 'Looking up the address for the pin…'
                    : draft.locationFromPin
                      ? 'Filled from the pin (OpenStreetMap). Edit if needed.'
                      : 'Road, barangay or landmark.'
                }
                error={errors.accident_location}
              />
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <p className="type-body text-text-primary">
                  {position
                    ? `Lat ${draft.latitude.toFixed(4)} · Long ${draft.longitude.toFixed(4)}`
                    : 'No pin placed. GPS location is optional.'}
                </p>
                {position && (
                  <button
                    type="button"
                    onClick={() => setPin(null)}
                    className="inline-flex min-h-11 items-center type-label text-text-blue underline"
                  >
                    Remove pin
                  </button>
                )}
              </div>
              <div className={actionsClass}>
                <Button variant="secondary" icon="arrow-left" onClick={goBack} className={actionButton}>
                  Back
                </Button>
                <Button type="submit" icon="chevron-right" className={actionButton}>
                  Next: Photos
                </Button>
              </div>
            </>
          )}

          {step === 'photos' && (
            <>
              <p className="type-body text-text-muted">
                Up to 5 photos, JPG, PNG or WebP, 5 MB each. Remove any photo before you submit.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept={PHOTO_TYPES.join(',')}
                multiple
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
                onChange={addFiles}
              />
              <ul aria-label="Photos" className="flex flex-wrap gap-4">
                {photos.map((photo) => (
                  <li key={photo.id}>
                    <PhotoTile
                      state="uploaded"
                      src={photo.url}
                      fileName={photo.file.name}
                      onRemove={submitting ? undefined : () => removePhoto(photo.id)}
                    />
                  </li>
                ))}
                {rejected.map((item) => (
                  <li key={item.id}>
                    <PhotoTile state="error" message={item.message} caption={item.caption} />
                  </li>
                ))}
                {photos.length < MAX_PHOTOS && !submitting && (
                  <li>
                    <PhotoTile state="empty" onAdd={() => fileInputRef.current?.click()} />
                  </li>
                )}
              </ul>
              <p className="type-body-sm text-text-muted" aria-live="polite">
                {photos.length} of {MAX_PHOTOS} photos added
                {rejected.length ? `. ${rejected.length} not added: ${rejected.map((r) => r.caption).join('; ')}.` : ''}
              </p>

              <div className="flex flex-col gap-2 rounded-[12px] bg-surface-light-gray p-4 text-text-primary">
                <p className="type-label">Check before you submit</p>
                <p className="type-body">
                  {[typeName, formatDate(`${draft.accident_date}T00:00:00`), draft.accident_time, injuryLabel]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                <p className="type-body break-words">
                  {draft.accident_location}
                  {position ? ' (pin placed)' : ''}
                </p>
                {draft.vehicles_involved.trim() && <p className="type-body">{draft.vehicles_involved}</p>}
              </div>

              {submitError && (
                <Toast type="error" title="The report was not sent" className="max-w-none shadow-none">
                  {submitError} Your answers are kept; try again.
                </Toast>
              )}

              <div className={actionsClass}>
                <Button variant="secondary" icon="arrow-left" onClick={goBack} disabled={submitting} className={actionButton}>
                  Back
                </Button>
                <Button icon="send" onClick={submit} disabled={submitting} className={actionButton}>
                  {submitting ? 'Sending…' : 'Submit report'}
                </Button>
              </div>
            </>
          )}
        </form>
        <TipsCard />
      </div>

      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={discard}
        tone="destructive"
        title="Discard this report?"
        description="Your answers on this form will be deleted. Nothing has been sent yet."
        confirmLabel="Discard report"
        cancelLabel="Keep editing"
      />
    </div>
  );
}
