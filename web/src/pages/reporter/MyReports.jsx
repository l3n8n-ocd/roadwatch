import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Button,
  DataTable,
  EmptyState,
  Icon,
  Pagination,
  RecordBadge,
  Select,
  Skeleton,
  StatusChip,
} from '../../components/ui';
import { reports } from '../../api/endpoints';
import { RECORD_TYPES, STATUSES } from '../../lib/constants';
import { formatDate, reportCode } from '../../lib/format';

// R5 My reports (Figma 232:6508): GET /reports (only my reports) with a status filter and pages.
// Table from 768 px, report cards below. Filter and page live in the URL (?status=&page=).

const PAGE_SIZE = 10;
const STATUS_OPTIONS = [{ value: '', label: 'All statuses' }, ...STATUSES.map((s) => ({ value: s, label: s }))];

async function fetchMyReports(params) {
  const result = await reports.minePage(params); // { data, pagination }
  return { rows: result?.data || [], pagination: result?.pagination || null };
}

// "Oct 17, 2026 · 08:15" from accident_date (YYYY-MM-DD) and accident_time (HH:MM:SS).
function accidentWhen(report) {
  const date = report.accident_date ? formatDate(`${report.accident_date}T00:00:00`) : '';
  const time = report.accident_time ? String(report.accident_time).slice(0, 5) : '';
  return [date, time].filter(Boolean).join(' · ');
}

// Report card for narrow screens. Same look as the shared ReportCard (Figma 99:348), plus the
// record badge, because public submissions must stay distinguishable from verified records.
function MobileReportCard({ report }) {
  const code = reportCode(report.report_id);
  const title = report.accidentType?.type_name || 'Accident';
  return (
    <Link
      to={`/my-reports/${report.report_id}`}
      aria-label={`Report ${code}, ${title}, status ${report.report_status}, ${RECORD_TYPES[report.record_type] || ''}`}
      className="flex w-full flex-col gap-3 rounded-rw-md border border-border-subtle bg-surface-white p-4 text-text-primary no-underline shadow-rw-sm transition-colors hover:bg-surface-light-gray focus-visible:shadow-rw-focus"
    >
      <span className="flex flex-wrap items-center justify-between gap-2">
        <span className="type-label text-text-muted">{code}</span>
        <StatusChip status={report.report_status} />
      </span>
      <span className="flex items-center gap-2">
        <span className="min-w-0 flex-1 type-h3">{title}</span>
        <Icon name="chevron-right" size={20} />
      </span>
      <span className="flex items-center gap-2 type-body-sm text-text-muted">
        <Icon name="map-pin" size={16} className="text-text-primary" />
        <span className="min-w-0 flex-1">{report.accident_location}</span>
      </span>
      <span className="flex items-center gap-2 type-body-sm text-text-muted">
        <Icon name="calendar" size={16} className="text-text-primary" />
        <span className="min-w-0 flex-1">{accidentWhen(report)}</span>
      </span>
      <RecordBadge type={report.record_type} className="self-start" />
    </Link>
  );
}

const COLUMNS = [
  {
    key: 'report',
    header: 'Report',
    className: 'w-44',
    render: (r) => (
      <span className="flex flex-col gap-0.5">
        <span className="type-label whitespace-nowrap">{reportCode(r.report_id)}</span>
        <span className="whitespace-nowrap text-text-muted">{accidentWhen(r)}</span>
      </span>
    ),
  },
  { key: 'type', header: 'Accident type', className: 'w-36', render: (r) => r.accidentType?.type_name || '—' },
  { key: 'location', header: 'Location', render: (r) => <span className="line-clamp-2">{r.accident_location}</span> },
  { key: 'status', header: 'Status', className: 'w-68', render: (r) => <StatusChip status={r.report_status} /> },
  { key: 'record', header: 'Record', className: 'w-44', render: (r) => <RecordBadge type={r.record_type} /> },
];

export default function MyReports() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const status = STATUSES.includes(searchParams.get('status')) ? searchParams.get('status') : '';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    fetchMyReports({ page, limit: PAGE_SIZE, ...(status ? { status } : {}) })
      .then((result) => {
        if (cancelled) return;
        setRows(result.rows);
        setPagination(result.pagination);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, status]);

  useEffect(() => load(), [load]);

  const setFilter = (next) => {
    const params = {};
    if (next.status) params.status = next.status;
    if (next.page && next.page > 1) params.page = String(next.page);
    setSearchParams(params);
  };

  const total = pagination?.total ?? rows.length;
  const subtitle = loading
    ? 'Loading your reports…'
    : `${total} ${total === 1 ? 'report' : 'reports'}${status ? ` with status ${status}` : ''}, newest first. Select a report to see its status history.`;

  let content;
  if (loading) {
    content = (
      <div aria-busy="true" className="flex flex-col gap-3">
        <span className="sr-only">Loading…</span>
        <div className="hidden overflow-hidden rounded-rw-md border border-border-subtle bg-surface-white md:block">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} type="table-row" className="border-b border-border-subtle" />
          ))}
        </div>
        <div className="flex flex-col gap-3 md:hidden">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} type="report-card" />
          ))}
        </div>
      </div>
    );
  } else if (error) {
    content = (
      <div className="rounded-rw-md border border-border-subtle bg-surface-white">
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
    );
  } else if (rows.length === 0) {
    content = (
      <div className="rounded-rw-md border border-border-subtle bg-surface-white">
        {status ? (
          <EmptyState
            type="no-results"
            title="No reports with this status"
            description={`None of your reports is ${status} right now.`}
            action={
              <Button variant="secondary" onClick={() => setFilter({})}>
                Show all statuses
              </Button>
            }
          />
        ) : (
          <EmptyState
            title="No reports yet"
            description="When you report an accident, it shows up here so you can follow its status."
            action={
              <Button to="/report/details" icon="plus">
                Report an accident
              </Button>
            }
          />
        )}
      </div>
    );
  } else {
    content = (
      <>
        <div className="hidden flex-col gap-4 rounded-rw-md border border-border-subtle bg-surface-white pb-6 md:flex">
          <DataTable
            caption="My reports"
            columns={COLUMNS}
            rows={rows}
            getRowKey={(r) => r.report_id}
            onRowClick={(r) => navigate(`/my-reports/${r.report_id}`)}
          />
          {pagination && pagination.pages > 1 && (
            <Pagination
              className="px-6"
              page={pagination.page}
              pages={pagination.pages}
              total={pagination.total}
              limit={pagination.limit}
              onPageChange={(p) => setFilter({ status, page: p })}
            />
          )}
        </div>
        <div className="flex flex-col gap-3 md:hidden">
          <ul aria-label="My reports" className="flex flex-col gap-3">
            {rows.map((r) => (
              <li key={r.report_id}>
                <MobileReportCard report={r} />
              </li>
            ))}
          </ul>
          {pagination && pagination.pages > 1 && (
            <Pagination
              page={pagination.page}
              pages={pagination.pages}
              total={pagination.total}
              limit={pagination.limit}
              onPageChange={(p) => setFilter({ status, page: p })}
            />
          )}
        </div>
      </>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-280 flex-col gap-6 px-4 pt-6 pb-16 sm:px-6 lg:pt-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="type-h1 text-text-primary">My reports</h1>
          <p className="type-body text-text-muted" aria-live="polite">
            {subtitle}
          </p>
        </div>
        <Button to="/report/details" icon="plus" className="max-sm:w-full">
          Report an accident
        </Button>
      </div>
      <Select
        label="Status"
        options={STATUS_OPTIONS}
        value={status}
        onChange={(event) => setFilter({ status: event.target.value })}
        className="sm:w-80"
      />
      {content}
    </div>
  );
}
