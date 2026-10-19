import { useCallback, useEffect, useId, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Button,
  ConfirmDialog,
  Dialog,
  EmptyState,
  Icon,
  IconButton,
  MapView,
  RecordBadge,
  Select,
  Skeleton,
  StatusChip,
  Textarea,
  Timeline,
  TimelineItem,
  Toast,
} from '../../components/ui';
import { admin, officer, users } from '../../api/endpoints';
import { ADMIN_STATUSES, INJURY_OPTIONS, OFFICER_STATUSES, ROLES } from '../../lib/constants';
import { formatDate, formatDateTime, reportCode } from '../../lib/format';
import { cx } from '../../lib/cx';

// W4 Report details (Figma 125:1372 admin, 126:2143 officer, 131:4011 at 390 px).
// mode="admin": verify / reject, then assign an officer (assigning is locked until Verified, #30).
// mode="officer": update investigation status and/or add official remarks.
// Below 1024 px the action panels move into dialogs opened from a bottom action bar.

// ---------- small helpers ----------

// "2026-10-17" -> local date (new Date('2026-10-17') would be UTC midnight).
function parseDay(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || ''));
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : value;
}

// "Rafael Santos" -> "R. Santos"
function shortName(name = '') {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0][0]}. ${parts[parts.length - 1]}` : name;
}

// Masked contact values (Figma: "Juan D. C.", "09•• ••• ••12", "ju••••@example.com").
function maskName(name = '') {
  const [first, ...rest] = name.trim().split(/\s+/);
  return [first, ...rest.map((p) => `${p[0]}.`)].join(' ');
}
function maskPhone(phone = '') {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 6) return '•••';
  return `${digits.slice(0, 2)}•• ••• ••${digits.slice(-2)}`;
}
function maskEmail(email = '') {
  const [local, domain] = email.split('@');
  return domain ? `${local.slice(0, 2)}••••@${domain}` : '••••';
}

function injuryLabel(value) {
  return INJURY_OPTIONS.find((o) => o.value === value)?.label || value || 'Unknown';
}

// Suggested next status for the admin select (the API decides what is allowed).
function suggestedAdminStatus(current) {
  if (current === 'Submitted') return 'Under Review';
  if (current === 'Under Review' || current === 'Additional Information Required') return 'Verified';
  return 'Verified';
}

// Who changed a status, as shown in the timeline ("Maria Cruz (Admin)", "Reporter").
function actorLabel(entry, report) {
  if (entry.changed_by_user_id === report.reporter_id) return 'Reporter';
  const name = entry.changedBy?.full_name || 'Staff';
  if (entry.changed_by_user_id === report.assigned_officer_id) return `${name} (Officer)`;
  return `${name} (Admin)`;
}

const CAN_REASSIGN_BLOCKED = ['Rejected', 'Resolved/Closed'];

// ---------- layout pieces ----------

function Card({ title, titleId, icon, action, className = '', children }) {
  return (
    <section
      aria-labelledby={titleId}
      className={cx(
        'flex min-w-0 flex-col gap-4 rounded-rw-md border border-border-subtle bg-surface-white p-6',
        className,
      )}
    >
      {(title || action) && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id={titleId} className="flex min-w-0 items-center gap-2 type-h3 text-text-primary">
            {icon && <Icon name={icon} size={20} />}
            {title}
          </h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

function Detail({ label, children, className = '' }) {
  return (
    <div className={cx('flex min-w-0 flex-col gap-1', className)}>
      <dt className="type-label text-text-muted">{label}</dt>
      <dd className="type-body break-words text-text-primary">{children}</dd>
    </div>
  );
}

// ---------- sections ----------

function HeaderCard({ report, mode }) {
  const officerName = report.assignedOfficer?.full_name;
  let extra = '';
  if (officerName) extra = ` · Assigned to Officer ${shortName(officerName)}`;
  else if (report.report_status === 'Verified') extra = ' · Verified, no officer assigned yet';

  return (
    <section
      aria-labelledby="report-title"
      className="flex flex-col gap-4 rounded-rw-md border border-border-subtle bg-surface-white p-6"
    >
      <p className="type-overline uppercase text-text-blue">
        {mode === 'officer' ? 'Report · Assigned to you' : 'Report'}
      </p>
      <h1 id="report-title" className="type-h1 break-words text-text-primary">
        {reportCode(report.report_id)}
        {report.accidentType?.type_name ? ` · ${report.accidentType.type_name}` : ''}
      </h1>
      <div className="flex flex-wrap items-center gap-2">
        <StatusChip status={report.report_status} />
        <RecordBadge type={report.record_type} />
      </div>
      <p className="type-body-sm text-text-muted">
        Submitted {formatDateTime(report.date_submitted)}
        {extra}
      </p>
    </section>
  );
}

function DetailsCard({ report }) {
  const coords =
    report.latitude != null && report.longitude != null
      ? `${Number(report.latitude).toFixed(4)}, ${Number(report.longitude).toFixed(4)}`
      : 'Not given';
  return (
    <Card title="Accident details" titleId="details-title">
      <dl className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-[repeat(2,minmax(0,220px))]">
        <Detail label="Accident date">{formatDate(parseDay(report.accident_date))}</Detail>
        <Detail label="Accident time">{String(report.accident_time || '').slice(0, 5)}</Detail>
        <Detail label="Accident type">{report.accidentType?.type_name || 'Not set'}</Detail>
        <Detail label="Injuries">{injuryLabel(report.injury_information)}</Detail>
        <Detail label="Vehicles involved">{report.vehicles_involved || 'Not given'}</Detail>
        <Detail label="Coordinates">{coords}</Detail>
      </dl>
      <dl>
        <Detail label="What happened">
          <span className="whitespace-pre-line">{report.accident_description}</span>
        </Detail>
      </dl>
    </Card>
  );
}

function LocationCard({ report }) {
  const hasPin = report.latitude != null && report.longitude != null;
  const lat = Number(report.latitude);
  const lng = Number(report.longitude);
  const osm = hasPin ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}` : null;
  return (
    <Card
      title="Location"
      titleId="location-title"
      action={
        osm && (
          <a
            href={osm}
            target="_blank"
            rel="noreferrer"
            className="type-label text-text-blue underline underline-offset-2"
          >
            Open in OpenStreetMap<span className="sr-only"> (opens in a new tab)</span>
          </a>
        )
      }
    >
      <p className="type-body break-words text-text-primary">
        {report.accident_location}
        {hasPin && ` · ${lat.toFixed(4)}, ${lng.toFixed(4)}`}
      </p>
      {hasPin ? (
        <MapView position={{ lat, lng }} label={`Map of the accident location: ${report.accident_location}`} />
      ) : (
        <p className="flex items-start gap-2 type-body-sm text-text-muted">
          <Icon name="info" size={16} className="mt-0.5" />
          No GPS pin was given. Use the location text above.
        </p>
      )}
    </Card>
  );
}

function PhotoViewer({ report }) {
  const photos = report.photos || [];
  const [index, setIndex] = useState(0);
  const code = reportCode(report.report_id);
  const current = photos[Math.min(index, photos.length - 1)];
  const go = (step) => setIndex((i) => (i + step + photos.length) % photos.length);

  return (
    <Card
      title={`Photos (${photos.length})`}
      titleId="photos-title"
      action={
        photos.length > 0 && (
          <p aria-live="polite" className="type-label text-text-muted">
            Photo {index + 1} of {photos.length}
          </p>
        )
      }
    >
      {photos.length === 0 ? (
        <p className="type-body-sm text-text-muted">No photos were attached to this report.</p>
      ) : (
        <>
          <div className="flex h-56 items-center justify-center overflow-hidden rounded-rw-md bg-surface-navy-subtle sm:h-75">
            <img
              src={current.cloudinary_url}
              alt={`Photo ${index + 1} of ${photos.length} for ${code}`}
              className="size-full object-cover"
            />
          </div>
          {photos.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto p-1 sm:gap-3">
              <IconButton icon="chevron-left" label="Previous photo" onClick={() => go(-1)} />
              <ul className="flex gap-2 sm:gap-3">
                {photos.map((p, i) => (
                  <li key={p.photo_id || p.cloudinary_url}>
                    <button
                      type="button"
                      onClick={() => setIndex(i)}
                      aria-current={i === index ? 'true' : undefined}
                      aria-label={`Show photo ${i + 1}`}
                      className={cx(
                        'block h-11 w-14 overflow-hidden sm:h-18 sm:w-24 rounded-rw-sm bg-surface-navy-subtle',
                        i === index ? 'border-3 border-brand-navy' : 'opacity-80 hover:opacity-100',
                      )}
                    >
                      <img src={p.cloudinary_url} alt="" className="size-full object-cover" />
                    </button>
                  </li>
                ))}
              </ul>
              <IconButton icon="chevron-right" label="Next photo" onClick={() => go(1)} />
            </div>
          )}
        </>
      )}
    </Card>
  );
}

function ReporterCard({ report, mode }) {
  const [shown, setShown] = useState(false);
  const r = report.reporter;
  const rows = [
    { label: 'Name', value: r.full_name, masked: maskName(r.full_name) },
    { label: 'Mobile', value: r.contact_phone || 'Not given', masked: r.contact_phone ? maskPhone(r.contact_phone) : 'Not given' },
    { label: 'Email', value: r.contact_email, masked: maskEmail(r.contact_email) },
  ];
  return (
    <Card title="Reporter" titleId="reporter-title" icon="lock">
      <p className="type-body-sm text-text-muted">
        {mode === 'officer'
          ? 'You can see this because the report is assigned to you.'
          : 'Visible only to administrators and the officer assigned to this report.'}
      </p>
      <dl id="reporter-contact" className="flex flex-col gap-4">
        {rows.map((row) => (
          <div key={row.label} className="flex min-w-0 flex-col gap-0.5">
            <dt className="type-label text-text-muted">{row.label}</dt>
            <dd className="type-body break-words text-text-primary">
              {shown ? row.value : <span aria-label={`${row.label} hidden`}>{row.masked}</span>}
            </dd>
          </div>
        ))}
      </dl>
      <Button
        variant="secondary"
        icon="eye"
        fullWidth
        aria-controls="reporter-contact"
        aria-expanded={shown}
        onClick={() => setShown((s) => !s)}
      >
        {shown ? 'Hide contact details' : 'Show contact details'}
      </Button>
    </Card>
  );
}

function HistoryCard({ report }) {
  // Newest first; the API returns history in insertion order.
  const history = [...(report.statusHistory || [])].sort(
    (a, b) => new Date(b.changed_at) - new Date(a.changed_at) || b.history_id - a.history_id,
  );
  return (
    <Card title="Status history" titleId="history-title">
      {history.length === 0 ? (
        <p className="type-body-sm text-text-muted">No status changes yet.</p>
      ) : (
        <Timeline label="Status history, newest first">
          {history.map((entry, i) => {
            let remarks;
            if (i === 0 && report.official_remarks) remarks = report.official_remarks;
            else if (entry.previous_status == null && entry.new_status === 'Submitted') remarks = 'Report received.';
            return (
              <TimelineItem
                key={entry.history_id}
                status={entry.new_status}
                meta={`${formatDateTime(entry.changed_at)} · ${actorLabel(entry, report)}`}
                remarks={remarks}
                current={i === 0}
                last={i === history.length - 1}
              />
            );
          })}
        </Timeline>
      )}
    </Card>
  );
}

// ---------- action panels (shared by the desktop cards and the mobile dialogs) ----------

function AssignForm({ report, officers, officersError, onSaved }) {
  const status = report.report_status;
  const assigned = report.assignedOfficer;
  const [reassigning, setReassigning] = useState(false);
  const [officerId, setOfficerId] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [busy, setBusy] = useState(false);
  const noteId = useId();

  // Workflow #30: assigning is locked until the report is Verified.
  const blocked = CAN_REASSIGN_BLOCKED.includes(status);
  const locked = !assigned && status !== 'Verified';

  if (assigned && !reassigning) {
    const when = [...(report.statusHistory || [])]
      .filter((h) => h.new_status === 'Assigned')
      .sort((a, b) => new Date(b.changed_at) - new Date(a.changed_at))[0];
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="type-body text-text-primary">
          Assigned to Officer {assigned.full_name}
          {when ? ` on ${formatDateTime(when.changed_at)}` : ''}.
        </p>
        {!blocked && (
          <Button variant="secondary" onClick={() => setReassigning(true)} className="min-w-[160px]">
            Reassign
          </Button>
        )}
      </div>
    );
  }

  const submit = async (event) => {
    event.preventDefault();
    if (locked || blocked) return;
    if (!officerId) {
      setError('Choose an officer.');
      return;
    }
    setBusy(true);
    setSaveError('');
    try {
      const updated = await admin.assign(report.report_id, {
        officer_id: Number(officerId),
        ...(note.trim() ? { remarks: note.trim() } : {}),
      });
      const name = officers.find((o) => String(o.user_id) === officerId)?.full_name || 'the officer';
      setReassigning(false);
      setOfficerId('');
      setNote('');
      onSaved(updated, {
        title: 'Officer assigned',
        body: `${reportCode(report.report_id)} is now Assigned to Officer ${name}. The reporter was notified.`,
      });
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const disabled = locked || blocked;
  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      {(locked || blocked) && (
        <p id={noteId} className="type-body-sm text-text-muted">
          {blocked
            ? `A ${status} report cannot be assigned.`
            : 'Verify the report first. You can assign an officer once it is Verified.'}
        </p>
      )}
      <Select
        label="Traffic officer"
        required
        disabled={disabled}
        placeholder="Choose an active officer"
        value={officerId}
        onChange={(e) => {
          setOfficerId(e.target.value);
          setError('');
        }}
        options={officers.map((o) => ({ value: String(o.user_id), label: o.full_name }))}
        helper={officersError || 'Only active Traffic Officers are listed.'}
        error={error}
      />
      <Textarea
        label="Note to officer"
        optional
        disabled={disabled}
        rows={3}
        placeholder="e.g. Please verify on site today."
        value={note}
        onChange={(e) => setNote(e.target.value)}
        helper="Saved to the status history."
      />
      {saveError && (
        <p role="alert" className="flex items-start gap-2 type-body-sm text-text-danger">
          <Icon name="alert-circle" size={16} className="mt-0.5" />
          {saveError}
        </p>
      )}
      <div className="flex flex-col gap-3">
        <Button
          type="submit"
          icon={disabled ? 'user' : 'user-check'}
          fullWidth
          disabled={disabled || busy}
          aria-describedby={disabled ? noteId : undefined}
        >
          {busy ? 'Assigning…' : 'Assign officer'}
        </Button>
        {reassigning && (
          <Button variant="secondary" fullWidth onClick={() => setReassigning(false)}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

function AdminStatusForm({ report, onSaved }) {
  const code = reportCode(report.report_id);
  const options = ADMIN_STATUSES.filter((s) => s !== 'Rejected');
  const [status, setStatus] = useState(suggestedAdminStatus(report.report_status));
  const [remarks, setRemarks] = useState('');
  const [dialog, setDialog] = useState(null); // 'verify' | 'reject'
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const save = async (body, toast) => {
    setBusy(true);
    setError('');
    try {
      const updated = await admin.setStatus(report.report_id, body);
      setDialog(null);
      setRemarks('');
      onSaved(updated, toast);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const withRemarks = (body) => (remarks.trim() ? { ...body, remarks: remarks.trim() } : body);

  const submit = (event) => {
    event.preventDefault();
    if (status === 'Verified') {
      setError('');
      setDialog('verify');
      return;
    }
    save(withRemarks({ status }), {
      title: 'Status updated',
      body: `${code} is now ${status}. The reporter was notified.`,
    });
  };

  return (
    <>
      <form noValidate onSubmit={submit} className="flex flex-col gap-4">
        <Select
          label="New status"
          required
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={options.map((s) => ({ value: s, label: s }))}
          helper="Choose Verified or Additional Information Required. Assign an officer after the report is Verified."
        />
        <Textarea
          label="Official remarks"
          optional
          rows={3}
          placeholder="e.g. Location confirmed with the Malolos traffic office."
          value={remarks}
          onChange={(e) => setRemarks(e.target.value)}
          helper="Shown to the reporter in their tracking screen."
        />
        {error && !dialog && (
          <p role="alert" className="flex items-start gap-2 type-body-sm text-text-danger">
            <Icon name="alert-circle" size={16} className="mt-0.5" />
            {error}
          </p>
        )}
        <div className="flex flex-col gap-3">
          <Button type="submit" fullWidth disabled={busy}>
            {busy && !dialog ? 'Saving…' : 'Save status'}
          </Button>
          <Button
            variant="destructive"
            icon="x-circle"
            fullWidth
            disabled={report.report_status === 'Rejected'}
            onClick={() => {
              setError('');
              setDialog('reject');
            }}
          >
            Reject report
          </Button>
        </div>
      </form>

      <ConfirmDialog
        open={dialog === 'verify'}
        onClose={() => setDialog(null)}
        title={`Mark ${code} as Verified?`}
        description="This turns the report into an official record (record_type = verified_record). The reporter gets a notification."
        confirmLabel="Mark as Verified"
        busy={busy}
        error={dialog === 'verify' ? error : undefined}
        onConfirm={() =>
          save(withRemarks({ status: 'Verified' }), {
            title: 'Report verified',
            body: `${code} is now a Verified record. The reporter was notified.`,
          })
        }
      />
      <ConfirmDialog
        open={dialog === 'reject'}
        onClose={() => setDialog(null)}
        title={`Reject report ${code}?`}
        description={'The reporter will see this reason. It is saved in official_remarks as "Rejected: <reason>" and in the audit log.'}
        confirmLabel="Reject report"
        tone="destructive"
        reason={{ label: 'Rejection reason', placeholder: 'e.g. Duplicate of RW-000127, same place and time.', minLength: 10 }}
        busy={busy}
        error={dialog === 'reject' ? error : undefined}
        onConfirm={(reason) =>
          save(
            { status: 'Rejected', rejection_reason: reason },
            { title: 'Report rejected', body: `${code} was rejected. The reporter can see the reason.` },
          )
        }
      />
    </>
  );
}

function OfficerForm({ report, onSaved }) {
  const current = report.report_status;
  const [status, setStatus] = useState(OFFICER_STATUSES.includes(current) ? current : '');
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const closed = current === 'Resolved/Closed' || current === 'Rejected';

  const submit = async (event) => {
    event.preventDefault();
    const changed = status && status !== current;
    if (!changed && !remarks.trim()) {
      setError('Choose a new status or write remarks.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const body = {};
      if (changed) body.status = status;
      if (remarks.trim()) body.remarks = remarks.trim();
      const updated = await officer.update(report.report_id, body);
      setRemarks('');
      onSaved(updated, {
        title: 'Update saved',
        body: changed
          ? `Status is now ${status}. The reporter and the admin were notified.`
          : 'Your remarks were saved to the report.',
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4">
      <Select
        label="Status"
        value={status}
        disabled={closed}
        placeholder={`Keep current (${current})`}
        onChange={(e) => {
          setStatus(e.target.value);
          setError('');
        }}
        options={OFFICER_STATUSES.map((s) => ({ value: s, label: s }))}
        helper="Officers can set In Progress, Additional Information Required and Resolved/Closed. Only an administrator verifies, assigns or rejects."
      />
      <Textarea
        label="Official remarks"
        optional
        rows={4}
        disabled={closed}
        placeholder="e.g. Spoke with both drivers on site."
        value={remarks}
        onChange={(e) => {
          setRemarks(e.target.value);
          setError('');
        }}
        error={error || undefined}
      />
      <Button type="submit" fullWidth disabled={busy || closed}>
        {busy ? 'Saving…' : 'Save update'}
      </Button>
      <p className="type-body-sm text-text-muted">
        {closed
          ? `This report is ${current}; no further updates are needed.`
          : 'Send a status, remarks, or both. Officers cannot verify, assign or reject.'}
      </p>
    </form>
  );
}

// ---------- page ----------

export default function ReportDetails({ mode = 'admin' }) {
  const { id } = useParams();
  const isAdmin = mode === 'admin';
  const [report, setReport] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [officers, setOfficers] = useState([]);
  const [officersError, setOfficersError] = useState('');
  const [toast, setToast] = useState(null);
  const [sheet, setSheet] = useState(null); // mobile dialog: 'assign' | 'status' | 'officer'

  const load = useCallback(() => {
    setLoadError(null);
    setReport(null);
    (isAdmin ? admin.get(id) : officer.get(id)).then(setReport).catch(setLoadError);
  }, [id, isAdmin]);

  useEffect(load, [load]);

  useEffect(() => {
    if (!isAdmin) return;
    users
      .list({ role: ROLES.OFFICER })
      .then((list) => setOfficers((list || []).filter((u) => u.is_active)))
      .catch(() => setOfficersError('Could not load the officer list. Reload the page to try again.'));
  }, [isAdmin]);

  const onSaved = (updated, message) => {
    setReport(updated);
    setSheet(null);
    setToast(message);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const backTo = isAdmin ? '/admin/reports' : '/officer';
  const backLabel = isAdmin ? 'Reports' : 'Assigned to me';

  const shell = (children) => (
    <div className="flex flex-col gap-6 px-4 py-6 pb-28 sm:px-6 lg:px-10 lg:py-8 lg:pb-8">
      <Link
        to={backTo}
        className="flex min-h-11 items-center gap-2 self-start type-label text-text-blue underline underline-offset-2 lg:hidden"
      >
        <Icon name="arrow-left" size={20} />
        {backLabel}
      </Link>
      {children}
    </div>
  );

  if (loadError) {
    const notFound = loadError.status === 404;
    return shell(
      <EmptyState
        type={notFound ? 'no-results' : 'error'}
        title={notFound ? 'Report not found' : 'Could not load this report'}
        description={
          notFound
            ? isAdmin
              ? 'It may have been removed, or the link is wrong.'
              : 'It is not assigned to you, or the link is wrong.'
            : loadError.message
        }
        action={
          notFound ? (
            <Button variant="secondary" to={backTo}>
              Back to {backLabel.toLowerCase()}
            </Button>
          ) : (
            <Button icon="refresh" onClick={load}>
              Try again
            </Button>
          )
        }
      />,
    );
  }

  if (!report) {
    return shell(
      <div aria-busy="true" className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <span className="sr-only">Loading report…</span>
        <Skeleton type="detail" />
        <Skeleton type="detail" />
      </div>,
    );
  }

  const showReporter = Boolean(report.reporter?.contact_email);

  const assignCard = (
    <Card title="Assign officer" titleId="assign-title">
      <AssignForm key={report.report_status} report={report} officers={officers} officersError={officersError} onSaved={onSaved} />
    </Card>
  );
  const statusCard = (
    <Card title="Update status" titleId="status-title">
      <AdminStatusForm key={report.report_status} report={report} onSaved={onSaved} />
    </Card>
  );
  const officerCard = (
    <Card title="Update investigation" titleId="officer-title">
      <OfficerForm key={report.report_status} report={report} onSaved={onSaved} />
    </Card>
  );

  return shell(
    <>
      {toast && (
        <Toast type="success" title={toast.title} onClose={() => setToast(null)} className="max-w-[400px]">
          {toast.body}
        </Toast>
      )}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* Main column */}
        <div className="flex min-w-0 flex-col gap-6">
          <HeaderCard report={report} mode={mode} />
          <DetailsCard report={report} />
          <LocationCard report={report} />
          <PhotoViewer key={report.report_id} report={report} />
        </div>

        {/* Side column: restricted reporter info, actions, history */}
        <div className="flex min-w-0 flex-col gap-6">
          {showReporter && <ReporterCard report={report} mode={mode} />}
          {/* Action panels inline from 1024 px; below that they open from the bottom bar. */}
          <div className="hidden flex-col gap-6 lg:flex">
            {isAdmin ? (
              <>
                {assignCard}
                {statusCard}
              </>
            ) : (
              officerCard
            )}
          </div>
          <HistoryCard report={report} />
        </div>
      </div>

      {/* Mobile action bar (Figma 131:4011) */}
      <div className="fixed inset-x-0 bottom-0 z-[1000] flex gap-3 border-t border-border-subtle bg-surface-white px-4 py-3 shadow-rw-lg lg:hidden">
        {isAdmin ? (
          <>
            <Button variant="secondary" icon="user-check" className="min-w-0 flex-1 px-3" onClick={() => setSheet('assign')}>
              Assign officer
            </Button>
            <Button icon="pencil" className="min-w-0 flex-1 px-3" onClick={() => setSheet('status')}>
              Update status
            </Button>
          </>
        ) : (
          <Button icon="pencil" fullWidth onClick={() => setSheet('officer')}>
            Update investigation
          </Button>
        )}
      </div>

      <Dialog open={sheet === 'assign'} onClose={() => setSheet(null)} title="Assign officer">
        <AssignForm key={report.report_status} report={report} officers={officers} officersError={officersError} onSaved={onSaved} />
        <Button variant="secondary" fullWidth onClick={() => setSheet(null)}>
          Close
        </Button>
      </Dialog>
      <Dialog open={sheet === 'status'} onClose={() => setSheet(null)} title="Update status">
        <AdminStatusForm key={report.report_status} report={report} onSaved={onSaved} />
        <Button variant="secondary" fullWidth onClick={() => setSheet(null)}>
          Close
        </Button>
      </Dialog>
      <Dialog open={sheet === 'officer'} onClose={() => setSheet(null)} title="Update investigation">
        <OfficerForm key={report.report_status} report={report} onSaved={onSaved} />
        <Button variant="secondary" fullWidth onClick={() => setSheet(null)}>
          Close
        </Button>
      </Dialog>
    </>,
  );
}
