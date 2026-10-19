import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Button,
  EmptyState,
  Icon,
  IconButton,
  RecordBadge,
  Skeleton,
  StatusChip,
  Timeline,
  TimelineItem,
  Toast,
} from '../../components/ui';
import { reports } from '../../api/endpoints';
import { INJURY_OPTIONS } from '../../lib/constants';
import { cx } from '../../lib/cx';
import { formatDate, formatDateTime, reportCode } from '../../lib/format';

// R6 Report tracking (Figma 232:6888): GET /reports/:id returns my report with photos and
// statusHistory. Official remarks show under the current status (as in the Figma timeline).
// Photos can be added again here (POST /reports/:id/photos) while the report is open, because
// the confirmation screen sends the reporter here when a photo upload failed.

const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_PER_UPLOAD = 5;
const MAX_PER_REPORT = 10;
const CLOSED = ['Resolved/Closed', 'Rejected'];

function accidentWhen(report) {
  const date = report.accident_date ? formatDate(`${report.accident_date}T00:00:00`) : '';
  const time = report.accident_time ? String(report.accident_time).slice(0, 5) : '';
  return [date, time].filter(Boolean).join(' · ');
}

function Detail({ label, children }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="type-label text-text-muted">{label}</dt>
      <dd className="type-body break-words text-text-primary">{children}</dd>
    </div>
  );
}

function PhotoViewer({ photos, code }) {
  const [index, setIndex] = useState(0);
  const current = Math.min(index, photos.length - 1);
  const photo = photos[current];
  const go = (next) => setIndex((next + photos.length) % photos.length);

  return (
    <>
      <div className="flex h-56 items-center justify-center overflow-hidden rounded-rw-md bg-surface-navy-subtle sm:h-75">
        <img
          src={photo.cloudinary_url}
          alt={`Photo ${current + 1} of ${photos.length} for report ${code}`}
          className="size-full object-contain"
        />
      </div>
      {photos.length > 1 && (
        <div className="flex items-center gap-3">
          <IconButton icon="chevron-left" label="Previous photo" onClick={() => go(current - 1)} />
          <ul aria-label="Photo thumbnails" className="flex min-w-0 shrink gap-3 overflow-x-auto p-1">
            {photos.map((p, i) => (
              <li key={p.photo_id} className="shrink-0">
                <button
                  type="button"
                  aria-label={`Show photo ${i + 1}`}
                  aria-current={i === current ? 'true' : undefined}
                  onClick={() => setIndex(i)}
                  className={cx(
                    'block h-18 w-24 overflow-hidden rounded-rw-sm bg-surface-navy-subtle',
                    i === current ? 'border-3 border-brand-navy' : 'border border-border-subtle',
                  )}
                >
                  <img src={p.cloudinary_url} alt="" className="size-full object-cover" />
                </button>
              </li>
            ))}
          </ul>
          <IconButton icon="chevron-right" label="Next photo" onClick={() => go(current + 1)} />
        </div>
      )}
    </>
  );
}

export default function ReportTracking() {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // { status, message }
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState(null); // { type, text }
  const fileInputRef = useRef(null);

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    reports
      .get(id)
      .then((data) => {
        if (!cancelled) setReport(data);
      })
      .catch((err) => {
        if (!cancelled) setError({ status: err.status, message: err.message });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => load(), [load]);

  const code = reportCode(id);
  const backLink = (
    <Link to="/my-reports" className="inline-flex min-h-11 items-center gap-2 self-start type-label text-text-blue underline">
      <Icon name="arrow-left" size={18} />
      Back to My reports
    </Link>
  );
  const shell = (children) => (
    <div className="mx-auto flex w-full max-w-280 flex-col gap-6 px-4 pt-4 pb-16 sm:px-6 lg:pt-8">{children}</div>
  );

  if (loading && !report) {
    return shell(
      <div aria-busy="true" className="flex flex-col gap-6">
        {backLink}
        <span className="sr-only">Loading report…</span>
        <Skeleton type="detail" />
        <Skeleton type="detail" />
      </div>,
    );
  }

  if (error && !report) {
    const notFound = error.status === 404;
    return shell(
      <>
        {backLink}
        <div className="rounded-rw-md border border-border-subtle bg-surface-white">
          <EmptyState
            type={notFound ? 'no-results' : 'error'}
            title={notFound ? 'Report not found' : 'Could not load this report'}
            description={notFound ? `${code} does not exist or is not one of your reports.` : error.message}
            action={
              notFound ? (
                <Button to="/my-reports" variant="secondary">
                  Go to My reports
                </Button>
              ) : (
                <Button variant="secondary" icon="refresh" onClick={load}>
                  Try again
                </Button>
              )
            }
          />
        </div>
      </>,
    );
  }

  const photos = report.photos || [];
  const history = [...(report.statusHistory || [])].sort(
    (a, b) => new Date(b.changed_at) - new Date(a.changed_at) || b.history_id - a.history_id,
  );
  const typeName = report.accidentType?.type_name || 'Accident';
  const injury = INJURY_OPTIONS.find((o) => o.value === report.injury_information)?.label || report.injury_information;
  const hasPin = report.latitude != null && report.longitude != null;
  const canAddPhotos = !CLOSED.includes(report.report_status) && photos.length < MAX_PER_REPORT;
  const who = (h) => (h.changed_by_user_id === report.reporter_id ? 'You' : h.changedBy?.full_name || 'Staff');

  const addPhotos = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;
    const room = Math.min(MAX_PER_UPLOAD, MAX_PER_REPORT - photos.length);
    const bad = files.find((f) => !PHOTO_TYPES.includes(f.type) || f.size > MAX_PHOTO_BYTES);
    if (bad) {
      setUploadMessage({ type: 'error', text: `${bad.name}: use JPG, PNG or WebP, 5 MB or less.` });
      return;
    }
    if (files.length > room) {
      setUploadMessage({ type: 'error', text: `You can add ${room} more ${room === 1 ? 'photo' : 'photos'} to this report.` });
      return;
    }
    setUploading(true);
    setUploadMessage(null);
    try {
      await reports.uploadPhotos(report.report_id, files);
      setUploadMessage({ type: 'success', text: `${files.length} ${files.length === 1 ? 'photo' : 'photos'} added.` });
      load();
    } catch (err) {
      setUploadMessage({ type: 'error', text: `Photos not added. ${err.message}` });
    } finally {
      setUploading(false);
    }
  };

  return shell(
    <>
      {backLink}
      <div className="flex flex-col gap-2">
        <h1 className="type-h1 text-text-primary">Report {code}</h1>
        <div className="flex flex-wrap gap-2">
          <StatusChip status={report.report_status} />
          <RecordBadge type={report.record_type} />
        </div>
        <p className="type-body text-text-muted">{[typeName, report.accident_location, accidentWhen(report)].join(' · ')}</p>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <section
            aria-labelledby="details-title"
            className="flex flex-col gap-4 rounded-rw-md border border-border-subtle bg-surface-white p-4 sm:p-6"
          >
            <h2 id="details-title" className="type-h3 text-text-primary">
              Accident details
            </h2>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-[repeat(2,minmax(0,220px))] sm:gap-x-6">
              <Detail label="Accident date">{formatDate(`${report.accident_date}T00:00:00`)}</Detail>
              <Detail label="Accident time">{String(report.accident_time || '').slice(0, 5)}</Detail>
              <Detail label="Accident type">{typeName}</Detail>
              <Detail label="Injuries">{injury}</Detail>
              <Detail label="Vehicles involved">{report.vehicles_involved || 'Not given'}</Detail>
              <Detail label="Coordinates">
                {hasPin ? `${Number(report.latitude).toFixed(4)}, ${Number(report.longitude).toFixed(4)}` : 'No pin placed'}
              </Detail>
              {report.assignedOfficer && <Detail label="Assigned officer">{report.assignedOfficer.full_name}</Detail>}
              <Detail label="Submitted">{formatDateTime(report.date_submitted)}</Detail>
            </dl>
            <dl>
              <Detail label="What happened">{report.accident_description}</Detail>
            </dl>
          </section>

          <section
            aria-labelledby="photos-title"
            className="flex flex-col gap-4 rounded-rw-md border border-border-subtle bg-surface-white p-4 sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="photos-title" className="type-h3 text-text-primary">
                Photos ({photos.length})
              </h2>
              {canAddPhotos && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={PHOTO_TYPES.join(',')}
                    multiple
                    className="sr-only"
                    tabIndex={-1}
                    aria-hidden="true"
                    onChange={addPhotos}
                  />
                  <Button
                    variant="secondary"
                    icon={uploading ? 'loader' : 'camera'}
                    disabled={uploading}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? 'Uploading…' : 'Add photos'}
                  </Button>
                </>
              )}
            </div>
            {photos.length > 0 ? (
              <PhotoViewer key={photos.length} photos={photos} code={code} />
            ) : (
              <p className="type-body text-text-muted">
                No photos were added to this report.
                {canAddPhotos ? ' JPG, PNG or WebP, 5 MB each.' : ''}
              </p>
            )}
            {uploadMessage && (
              <Toast type={uploadMessage.type} onClose={() => setUploadMessage(null)} className="max-w-none shadow-none">
                {uploadMessage.text}
              </Toast>
            )}
          </section>
        </div>

        <section
          aria-labelledby="history-title"
          className="flex flex-col gap-4 rounded-rw-md border border-border-subtle bg-surface-white p-4 sm:p-6 lg:w-95 lg:shrink-0"
        >
          <h2 id="history-title" className="type-h3 text-text-primary">
            Status history
          </h2>
          {history.length ? (
            <Timeline>
              {history.map((h, i) => (
                <TimelineItem
                  key={h.history_id}
                  status={h.new_status}
                  current={i === 0}
                  last={i === history.length - 1}
                  meta={`${formatDateTime(h.changed_at)} · ${who(h)}`}
                  remarks={i === 0 && report.official_remarks ? report.official_remarks : undefined}
                />
              ))}
            </Timeline>
          ) : (
            <p className="type-body text-text-muted">No status changes yet.</p>
          )}
        </section>
      </div>
    </>,
  );
}
