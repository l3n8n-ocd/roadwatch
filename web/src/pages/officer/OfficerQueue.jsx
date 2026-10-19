import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  DataTable,
  EmptyState,
  Icon,
  RecordBadge,
  ReportCard,
  Select,
  Skeleton,
  StatusChip,
  TextField,
} from '../../components/ui';
import { officer } from '../../api/endpoints';
import { formatDateTime, reportCode } from '../../lib/format';

// W5 Officer queue (Figma: Default 127:2467, Empty 127:2755). GET /officer/reports returns only
// the reports assigned to the signed-in officer (#21). An officer has few reports, so the page
// loads them once (up to 100) and searches, filters and counts in the browser.

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

const card = 'rounded-rw-md border border-border-subtle bg-surface-white';

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

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    officer
      .list({ limit: 100 })
      .then((list) => setReports(Array.isArray(list) ? list : []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Oldest first, so the longest-waiting report is on top.
  const openReports = useMemo(
    () =>
      reports
        .filter(isOpen)
        .sort((a, b) => new Date(a.date_submitted) - new Date(b.date_submitted)),
    [reports],
  );

  const visible = useMemo(() => {
    const base = status
      ? reports
          .filter((r) => r.report_status === status)
          .sort((a, b) => new Date(a.date_submitted) - new Date(b.date_submitted))
      : openReports;
    return base.filter((r) => matches(r, query.trim()));
  }, [reports, openReports, status, query]);

  const countOf = (s) => reports.filter((r) => r.report_status === s).length;
  const filtered = Boolean(query.trim() || status);
  const nothingAssigned = !loading && !error && openReports.length === 0 && !status;

  const countText = loading
    ? 'Loading your assigned reports…'
    : error
      ? 'Your assigned reports could not be loaded'
      : openReports.length === 0
        ? 'No open reports assigned to you'
        : `${openReports.length} open ${openReports.length === 1 ? 'report' : 'reports'} assigned to you, oldest first`;

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
    { key: 'type', header: 'Accident type', render: (r) => r.accidentType?.type_name },
    { key: 'location', header: 'Location', className: 'min-w-36', render: (r) => r.accident_location },
    { key: 'status', header: 'Status', render: (r) => <StatusChip status={r.report_status} /> },
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
          <section aria-label="Queue summary" className="grid gap-4 md:grid-cols-3 md:gap-6">
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
            onSubmit={(e) => e.preventDefault()}
            className="grid gap-4 md:grid-cols-[minmax(0,1fr)_280px]"
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
          </form>

          {/* Results */}
          <section aria-label="Results" aria-busy={loading}>
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
