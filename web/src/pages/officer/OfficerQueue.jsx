import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  DataTable,
  Dialog,
  EmptyState,
  Icon,
  PriorityChip,
  RecordBadge,
  ReportCard,
  Select,
  Skeleton,
  StatusChip,
  Switch,
  TextField,
} from '../../components/ui';
import { officer } from '../../api/endpoints';
import useServerError from '../../lib/useServerError';
import { formatDateTime, formatRelative, reportCode } from '../../lib/format';
import { PRIORITIES } from '../../components/ui/priorityMeta';
import { dispatchTag } from '../../lib/dispatch';
import useNearbyAlerts from './useNearbyAlerts';

// W5 Officer queue, the Traffic Officer web portal's home (#52; Figma: Default 465:18031, Empty 465:18076).
// GET /officer/reports returns only the reports assigned to the signed-in officer. An officer has few
// reports, so the page loads them once (up to 100) and searches, filters and counts in the browser.
// v1.2.0 (Figma 539:26111): Priority column and Sort by, Urgent first (#54); the On duty switch and the
// "Accident reported near you" alert with Respond / Not now (#57).

const OPEN_STATUSES = ['Assigned', 'In Progress', 'Additional Information Required'];
const isOpen = (report) => !['Resolved/Closed', 'Rejected'].includes(report.report_status);

const STATUS_OPTIONS = [
  { value: '', label: 'All open statuses' },
  ...OPEN_STATUSES.map((s) => ({ value: s, label: s })),
  { value: 'Resolved/Closed', label: 'Resolved/Closed' },
];

// Summary tiles: what needs the officer's attention.
const SUMMARIES = [
  { status: 'Assigned', title: 'Need a first visit', icon: 'user-check', tile: 'bg-surface-blue-subtle', iconColor: 'text-text-blue' },
  { status: 'In Progress', title: 'In progress', icon: 'clock', tile: 'bg-surface-amber-subtle', iconColor: 'text-text-primary' },
  {
    status: 'Additional Information Required',
    title: 'Waiting on reporter',
    icon: 'alert-triangle',
    tile: 'bg-brand-amber',
    iconColor: 'text-text-primary',
  },
];

const SORT_OPTIONS = [
  { value: 'priority', label: 'Priority (Urgent first)' },
  { value: 'oldest', label: 'Oldest first' },
];
const rank = (r) => PRIORITIES.indexOf(r.priority);
const byOldest = (a, b) => new Date(a.date_submitted) - new Date(b.date_submitted);
const SORTERS = { priority: (a, b) => rank(b) - rank(a) || byOldest(a, b), oldest: byOldest };

const card = 'rounded-rw-md border border-border-subtle bg-surface-white';

// On duty switch (#57): location is shared only while it is on.
function DutyCard({ duty }) {
  return (
    <div className={`flex items-center gap-3 p-4 ${card} md:w-[380px] md:shrink-0`}>
      <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-rw-sm bg-surface-navy-subtle">
        <Icon name="locate" size={20} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span id="duty-label" className="type-label text-text-primary">On duty</span>
        <span id="duty-help" className="type-body-sm text-text-muted">
          Nearby reports reach you while this is on. Your location is shared only while on duty.
        </span>
        {duty.error && (
          <span role="alert" className="type-body-sm text-text-danger">
            {duty.error}
          </span>
        )}
      </span>
      <Switch checked={duty.onDuty} disabled={duty.busy} onChange={duty.toggle} aria-labelledby="duty-label" aria-describedby="duty-help" />
    </div>
  );
}

// "Accident reported near you" (#57): the first of the alerted officers to respond takes the report.
function NearbyAlert({ alert, busy, onRespond, onDecline }) {
  return (
    <section
      aria-labelledby={`alert-${alert.report_id}`}
      aria-live="polite"
      className="flex min-w-0 flex-1 flex-col gap-3 rounded-rw-md bg-surface-amber-subtle p-5"
    >
      <div className="flex flex-wrap items-center gap-3">
        <h2 id={`alert-${alert.report_id}`} className="type-h3 text-text-primary">
          Accident reported near you
        </h2>
        <PriorityChip priority={alert.priority} />
        <span className="type-body-sm text-text-muted">Not yet verified</span>
      </div>
      <p className="type-body text-text-primary">
        {reportCode(alert.report_id)} · {alert.accident_type} · {alert.accident_location} · {alert.distance_km} km from you ·
        reported {formatRelative(alert.date_submitted).toLowerCase()}. The first of the alerted officers to respond takes it.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button icon="send" disabled={busy} onClick={() => onRespond(alert)}>
          {busy ? 'Responding…' : 'Respond'}
        </Button>
        <Button variant="secondary" disabled={busy} onClick={() => onDecline(alert)}>
          Not now
        </Button>
      </div>
    </section>
  );
}

// Matches the report code (RW-000128 or 128), location or accident type.
function matches(report, query) {
  if (!query) return true;
  const text = [reportCode(report.report_id), String(report.report_id), report.accident_location, report.accidentType?.type_name]
    .join(' ')
    .toLowerCase();
  return text.includes(query.toLowerCase());
}

export default function OfficerQueue() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('priority');
  const [responding, setResponding] = useState(null);
  const [taken, setTaken] = useState(null); // { alert, name } for the "Already taken" dialog
  const [respondError, setRespondError] = useState('');
  const duty = useNearbyAlerts();
  const raiseServerError = useServerError();

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    officer
      .list({ limit: 100 })
      .then((list) => setReports(Array.isArray(list) ? list : []))
      .catch((err) => !raiseServerError(err) && setError(err.message))
      .finally(() => setLoading(false));
  }, [raiseServerError]);

  useEffect(() => {
    load();
  }, [load]);

  // Urgent first (then oldest), or oldest first, so the report that needs the officer most is on top.
  const openReports = useMemo(() => reports.filter(isOpen).sort(SORTERS[sort]), [reports, sort]);

  const visible = useMemo(() => {
    const base = status ? reports.filter((r) => r.report_status === status).sort(SORTERS[sort]) : openReports;
    return base.filter((r) => matches(r, query.trim()));
  }, [reports, openReports, status, query, sort]);

  const respond = async (alert) => {
    setResponding(alert.report_id);
    setRespondError('');
    try {
      await officer.respond(alert.report_id);
      navigate(`/officer/reports/${alert.report_id}`);
    } catch (err) {
      duty.dismiss(alert.report_id);
      if (err.details?.code === 'ALREADY_TAKEN') setTaken({ alert, name: err.details.responder_name || 'Another officer' });
      else setRespondError(err.message);
    } finally {
      setResponding(null);
    }
  };
  const decline = (alert) => {
    duty.dismiss(alert.report_id);
    officer.decline(alert.report_id).catch(() => {});
  };

  const countOf = (s) => reports.filter((r) => r.report_status === s).length;
  const filtered = Boolean(query.trim() || status);
  const nothingAssigned = !loading && !error && openReports.length === 0 && !status;

  const countText = loading
    ? 'Loading your assigned reports…'
    : error
      ? 'Your assigned reports could not be loaded'
      : openReports.length === 0
        ? 'No open reports assigned to you'
        : `${openReports.length} open ${openReports.length === 1 ? 'report' : 'reports'} assigned to you · ${sort === 'priority' ? 'Urgent first' : 'oldest first'}`;

  const columns = [
    {
      key: 'report',
      header: 'Report',
      render: (r) => (
        <span className="flex flex-col whitespace-nowrap">
          <span className="type-label">{reportCode(r.report_id)}</span>
          <span className="text-text-muted">{formatDateTime(r.date_submitted)}</span>
        </span>
      ),
    },
    { key: 'priority', header: 'Priority', render: (r) => <PriorityChip priority={r.priority} /> },
    { key: 'type', header: 'Accident type', render: (r) => r.accidentType?.type_name },
    { key: 'location', header: 'Location', className: 'min-w-36', render: (r) => r.accident_location },
    {
      key: 'status',
      header: 'Status',
      render: (r) => {
        const tag = dispatchTag(r);
        return (
          <span className="flex flex-col items-start gap-1">
            <StatusChip status={r.report_status} />
            {tag && <span className={`type-body-sm ${tag.tone}`}>{tag.text}</span>}
          </span>
        );
      },
    },
    { key: 'record', header: 'Record', render: (r) => <RecordBadge type={r.record_type} /> },
  ];

  const clearFilters = () => {
    setQuery('');
    setStatus('');
  };

  return (
    <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <div className="flex flex-col gap-1">
        <h1 className="type-h1 text-text-primary">Assigned to me</h1>
        <p className="type-body text-text-muted" aria-live="polite">
          {countText}
        </p>
      </div>

      {/* On duty + nearby alerts (#57) */}
      <div data-guide="duty" className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
        <DutyCard duty={duty} />
        {duty.alerts.slice(0, 1).map((a) => (
          <NearbyAlert key={a.report_id} alert={a} busy={responding === a.report_id} onRespond={respond} onDecline={decline} />
        ))}
      </div>
      {respondError && (
        <p role="alert" className="type-body-sm text-text-danger">
          {respondError}
        </p>
      )}
      <Dialog
        open={Boolean(taken)}
        onClose={() => setTaken(null)}
        title="Already taken"
        actions={<Button onClick={() => setTaken(null)}>OK</Button>}
      >
        {taken && (
          <p className="type-body text-text-primary">
            {taken.name} responded first to {reportCode(taken.alert.report_id)} ({taken.alert.accident_type},{' '}
            {taken.alert.distance_km} km away). It’s no longer waiting for you.
          </p>
        )}
      </Dialog>

      {error ? (
        <div className={card}>
          <EmptyState
            type="error"
            title="Could not load your reports"
            description={error}
            action={
              <Button variant="secondary" icon="refresh" onClick={load}>
                Try again
              </Button>
            }
          />
        </div>
      ) : nothingAssigned ? (
        <div className={`py-10 ${card}`}>
          <EmptyState
            type="no-reports"
            title="Nothing assigned to you right now"
            description="New assignments from the administrator appear here, and you also get an alert."
          />
        </div>
      ) : (
        <>
          {/* Queue summary */}
          <section data-guide="queue-summary" aria-label="Queue summary" className="grid gap-4 md:grid-cols-3 md:gap-6">
            {SUMMARIES.map((s) => (
              <div key={s.status} className={`flex items-center gap-3 p-6 ${card}`}>
                <span aria-hidden="true" className={`flex size-10 shrink-0 items-center justify-center rounded-rw-sm ${s.tile}`}>
                  <Icon name={s.icon} size={20} className={s.iconColor} />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="type-label text-text-primary">{s.title}</span>
                  <span className="type-caption text-text-muted">Status: {s.status}</span>
                </span>
                <span className="type-h2 text-text-primary">
                  {loading ? <span className="sr-only">Loading</span> : countOf(s.status)}
                </span>
              </div>
            ))}
          </section>

          {/* Filters */}
          <form
            role="search"
            aria-label="Search your assigned reports"
            data-guide="queue-filters"
            onSubmit={(e) => e.preventDefault()}
            className="grid gap-4 md:grid-cols-[minmax(0,1fr)_240px_240px]"
          >
            <TextField
              label="Search"
              icon="search"
              type="search"
              placeholder="Report ID or location"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <Select label="Status" options={STATUS_OPTIONS} value={status} onChange={(e) => setStatus(e.target.value)} />
            <Select label="Sort by" options={SORT_OPTIONS} value={sort} onChange={(e) => setSort(e.target.value)} />
          </form>

          {/* Results */}
          <section data-guide="queue" aria-label="Results" aria-busy={loading}>
            {loading && <p className="sr-only">Loading reports…</p>}

            <div className={`hidden flex-col gap-4 px-6 pt-px pb-6 md:flex ${card}`}>
              <DataTable
                caption="Reports assigned to you. Select a row to open the report."
                columns={columns}
                rows={loading ? [] : visible}
                getRowKey={(r) => r.report_id}
                onRowClick={(r) => navigate(`/officer/reports/${r.report_id}`)}
              />
              {loading && [0, 1, 2, 3].map((i) => <Skeleton key={i} type="table-row" className="-mt-4" />)}
              {!loading && visible.length === 0 && (
                <EmptyState
                  type="no-results"
                  title="No assigned reports match"
                  description="Try another status or check the spelling."
                  action={
                    filtered && (
                      <Button variant="secondary" onClick={clearFilters}>
                        Clear filters
                      </Button>
                    )
                  }
                />
              )}
              {!loading && visible.length > 0 && (
                <p className="type-body-sm text-text-muted">
                  Showing {visible.length} of {status ? countOf(status) : openReports.length} · only reports assigned to
                  you are listed
                </p>
              )}
            </div>

            {/* 390 px card list */}
            <div className="flex flex-col gap-4 md:hidden">
              {loading ? (
                [0, 1, 2].map((i) => <Skeleton key={i} type="report-card" />)
              ) : visible.length === 0 ? (
                <div className={card}>
                  <EmptyState
                    type="no-results"
                    title="No assigned reports match"
                    description="Try another status or check the spelling."
                    action={
                      filtered && (
                        <Button variant="secondary" onClick={clearFilters}>
                          Clear filters
                        </Button>
                      )
                    }
                  />
                </div>
              ) : (
                <>
                  <ul className="flex flex-col gap-4">
                    {visible.map((r) => (
                      <li key={r.report_id}>
                        <ReportCard
                          to={`/officer/reports/${r.report_id}`}
                          code={reportCode(r.report_id)}
                          title={r.accidentType?.type_name || 'Report'}
                          location={r.accident_location}
                          dateTime={formatDateTime(r.date_submitted)}
                          status={r.report_status}
                          priority={r.priority}
                          note={dispatchTag(r)}
                        />
                      </li>
                    ))}
                  </ul>
                  <p className="type-body-sm text-text-muted">
                    Showing {visible.length} of {status ? countOf(status) : openReports.length} · only reports assigned
                    to you are listed
                  </p>
                </>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
