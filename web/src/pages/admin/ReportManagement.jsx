import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Button,
  DataTable,
  DateTimeField,
  Dialog,
  EmptyState,
  IconButton,
  Pagination,
  RecordBadge,
  ReportCard,
  Select,
  Skeleton,
  StatusChip,
  TextField,
  Toast,
} from '../../components/ui';
import { downloadFile } from '../../api/client';
import { admin, lookups } from '../../api/endpoints';
import useServerError from '../../lib/useServerError';
import { RECORD_TYPES, STATUSES } from '../../lib/constants';
import { formatDate, formatDateTime, reportCode } from '../../lib/format';

// W3 Report management (Figma: Default 124:492, No results 124:1091, Loading 124:1321,
// Responsive 390 131:3837). GET /admin/reports with search and filters (FR-11).
// The filters live in the URL query string (?q=…&status=…&page=2), so a filtered list can be
// bookmarked, shared and restored with the browser Back button.

const PAGE_SIZE = 10;
const FILTER_KEYS = ['q', 'status', 'accident_type_id', 'record_type', 'location', 'date_from', 'date_to'];

const card = 'rounded-rw-md border border-border-subtle bg-surface-white';
const linkButton =
  'inline-flex min-h-11 items-center rounded-rw-sm type-label whitespace-nowrap text-text-blue underline underline-offset-2 hover:no-underline';

async function fetchReports(params) {
  const res = await admin.listPage(params);
  return { rows: res.data || [], pagination: res.pagination };
}

// "2026-10-01" → "Oct 1, 2026" without the UTC shift of new Date("2026-10-01").
const dayLabel = (value) => formatDate(`${value}T00:00:00`);

function dateRangeText(from, to) {
  if (from && to) return `${dayLabel(from)} – ${dayLabel(to)}`;
  if (from) return `from ${dayLabel(from)}`;
  if (to) return `until ${dayLabel(to)}`;
  return '';
}

// "Filters: “Hagonoy” · Collision · Oct 1 – Oct 17, 2026"
function describeFilters(filters, typeName) {
  const parts = [];
  if (filters.q) parts.push(`“${filters.q}”`);
  if (filters.status) parts.push(filters.status);
  if (filters.accident_type_id) parts.push(typeName || 'One accident type');
  if (filters.record_type) parts.push(RECORD_TYPES[filters.record_type]);
  if (filters.location) parts.push(`near “${filters.location}”`);
  const dates = dateRangeText(filters.date_from, filters.date_to);
  if (dates) parts.push(dates);
  return parts.join(' · ');
}

function noResultsText(filters) {
  if (!filters.q) return 'No report matches these filters. Try removing a filter or widening the date range.';
  const { date_from: from, date_to: to } = filters;
  let when = '';
  if (from && to) when = ` between ${dayLabel(from)} and ${dayLabel(to)}`;
  else if (from) when = ` since ${dayLabel(from)}`;
  else if (to) when = ` before ${dayLabel(to)}`;
  return `No report mentions “${filters.q}”${when}. Try a wider date range or check the spelling.`;
}

const STATUS_OPTIONS = [{ value: '', label: 'All statuses' }, ...STATUSES.map((s) => ({ value: s, label: s }))];
const RECORD_OPTIONS = [
  { value: '', label: 'All records' },
  ...Object.entries(RECORD_TYPES).map(([value, label]) => ({ value, label })),
];

// Status, type, record type, location and dates. Used in the desktop filter card and the
// mobile Filters dialog (same fields, #131:3837).
function FilterFields({ filters, setFilter, locationDraft, setLocationDraft, typeOptions, layout }) {
  return (
    <div
      className={
        layout === 'row' ? 'grid grid-cols-3 gap-4 xl:grid-cols-6' : 'flex flex-col gap-4'
      }
    >
      <Select
        label="Status"
        options={STATUS_OPTIONS}
        value={filters.status}
        onChange={(e) => setFilter('status', e.target.value)}
      />
      <Select
        label="Accident type"
        options={typeOptions}
        value={filters.accident_type_id}
        onChange={(e) => setFilter('accident_type_id', e.target.value)}
      />
      <Select
        label="Record type"
        options={RECORD_OPTIONS}
        value={filters.record_type}
        onChange={(e) => setFilter('record_type', e.target.value)}
      />
      <TextField
        label="Location"
        icon="map-pin"
        placeholder="e.g. Malolos"
        value={locationDraft}
        onChange={(e) => setLocationDraft(e.target.value)}
      />
      <DateTimeField
        label="From"
        value={filters.date_from}
        max={filters.date_to || undefined}
        onChange={(e) => setFilter('date_from', e.target.value)}
      />
      <DateTimeField
        label="To"
        value={filters.date_to}
        min={filters.date_from || undefined}
        onChange={(e) => setFilter('date_to', e.target.value)}
      />
    </div>
  );
}

// "Page 1 of 13" with round previous/next buttons (390 px design).
function PageStepper({ page, pages, onPageChange }) {
  if (!pages || pages < 2) return null;
  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-2">
      <IconButton
        icon="chevron-left"
        label="Previous page"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="shadow-rw-sm"
      />
      <p className="type-label text-text-primary" aria-live="polite">
        Page {page} of {pages}
      </p>
      <IconButton
        icon="chevron-right"
        label="Next page"
        disabled={page >= pages}
        onClick={() => onPageChange(page + 1)}
        className="shadow-rw-sm"
      />
    </nav>
  );
}

export default function ReportManagement() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Current filters, read from the URL.
  const filters = useMemo(() => {
    const f = {};
    FILTER_KEYS.forEach((key) => {
      f[key] = searchParams.get(key) || '';
    });
    return f;
  }, [searchParams]);
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const activeCount = FILTER_KEYS.filter((key) => filters[key]).length;

  // Typing in Search or Location updates the URL after a short pause.
  const [qDraft, setQDraft] = useState(filters.q);
  const [locationDraft, setLocationDraft] = useState(filters.location);

  const [types, setTypes] = useState([]);
  const [result, setResult] = useState({ rows: [], pagination: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [dialog, setDialog] = useState(null); // 'filters' | 'export' (390 px)
  const [exporting, setExporting] = useState('');
  const [exportError, setExportError] = useState('');

  // Changing any filter goes back to page 1. Starts from the address bar (not the
  // searchParams of this render), so two quick changes never undo each other.
  const updateParams = (changes) => {
    const next = new URLSearchParams(window.location.search);
    Object.entries(changes).forEach(([key, value]) => {
      if (value) next.set(key, value);
      else next.delete(key);
    });
    if (!('page' in changes)) next.delete('page');
    setSearchParams(next, { replace: !('page' in changes) });
  };
  const setFilter = (key, value) => updateParams({ [key]: value });

  const clearFilters = () => {
    setQDraft('');
    setLocationDraft('');
    setSearchParams({});
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const q = qDraft.trim();
      const location = locationDraft.trim();
      if (q !== filters.q || location !== filters.location) updateParams({ q, location });
    }, 400);
    return () => clearTimeout(timer);
    // updateParams is recreated each render; the drafts are what matter here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qDraft, locationDraft]);

  useEffect(() => {
    lookups
      .accidentTypes()
      .then((list) => setTypes(list || []))
      .catch(() => setTypes([]));
  }, []);

  // Load the page of reports whenever the URL (filters or page) changes. A 5xx shows the 500 page.
  const raiseServerError = useServerError();
  const queryString = searchParams.toString();
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    const params = { limit: PAGE_SIZE, page };
    FILTER_KEYS.forEach((key) => {
      if (filters[key]) params[key] = filters[key];
    });
    fetchReports(params)
      .then((data) => !cancelled && setResult(data))
      .catch((err) => !cancelled && !raiseServerError(err) && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // queryString captures filters and page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString, reloadKey]);

  const typeOptions = [
    { value: '', label: 'All types' },
    ...types.map((t) => ({ value: String(t.type_id), label: t.type_name })),
  ];
  const typeName = types.find((t) => String(t.type_id) === filters.accident_type_id)?.type_name;

  const exportFile = async (format) => {
    setExporting(format);
    setExportError('');
    const params = {};
    FILTER_KEYS.forEach((key) => {
      if (filters[key]) params[key] = filters[key];
    });
    try {
      await downloadFile(`/exports/reports.${format}`, params, `roadwatch-reports.${format}`);
      setDialog(null);
    } catch {
      setExportError(`Could not export the ${format.toUpperCase()} file. Please try again.`);
    } finally {
      setExporting('');
    }
  };

  const goToPage = (p) => {
    updateParams({ page: p > 1 ? String(p) : '' });
    window.scrollTo({ top: 0 });
  };

  const { rows, pagination } = result;
  const total = pagination?.total ?? rows.length;
  const pages = pagination?.pages ?? 1;

  const countText = loading
    ? 'Loading reports…'
    : error
      ? 'Reports could not be loaded'
      : `${total.toLocaleString('en-US')} ${total === 1 ? 'report' : 'reports'} ${activeCount ? (total === 1 ? 'matches' : 'match') + ' these filters' : 'in total'}`;

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
    { key: 'location', header: 'Location', className: 'min-w-40', render: (r) => r.accident_location },
    { key: 'status', header: 'Status', render: (r) => <StatusChip status={r.report_status} /> },
    { key: 'record', header: 'Record', render: (r) => <RecordBadge type={r.record_type} /> },
  ];

  const openReport = (row) => navigate(`/admin/reports/${row.report_id}`);

  const emptyState = activeCount ? (
    <EmptyState
      type="no-results"
      title="No reports match these filters"
      description={noResultsText(filters)}
      action={
        <Button variant="secondary" onClick={clearFilters}>
          Clear filters
        </Button>
      }
    />
  ) : (
    <EmptyState type="no-reports" title="No reports yet" description="Reports from the public appear here." />
  );

  const errorState = (
    <EmptyState
      type="error"
      title="Could not load reports"
      description={error}
      action={
        <Button variant="secondary" icon="refresh" onClick={() => setReloadKey((k) => k + 1)}>
          Try again
        </Button>
      }
    />
  );

  return (
    <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      {/* Page header */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="type-h1 text-text-primary">Reports</h1>
          <p className="type-body text-text-muted" aria-live="polite">
            {countText}
          </p>
        </div>
        <div className="hidden gap-3 md:flex">
          <Button variant="secondary" icon="download" className="w-46" disabled={Boolean(exporting)} onClick={() => exportFile('csv')}>
            {exporting === 'csv' ? 'Exporting…' : 'Export CSV'}
          </Button>
          <Button variant="secondary" icon="download" className="w-46" disabled={Boolean(exporting)} onClick={() => exportFile('pdf')}>
            {exporting === 'pdf' ? 'Exporting…' : 'Export PDF'}
          </Button>
        </div>
      </div>

      {exportError && !dialog && (
        <Toast type="error" title={exportError} onClose={() => setExportError('')} className="max-w-none" />
      )}

      {/* Desktop and tablet: filter card (form, role=search) */}
      <form
        role="search"
        aria-label="Search and filter reports"
        onSubmit={(e) => {
          e.preventDefault();
          updateParams({ q: qDraft.trim(), location: locationDraft.trim() });
        }}
        className={`hidden flex-col gap-4 p-6 md:flex ${card}`}
      >
        <TextField
          label="Search"
          icon="search"
          type="search"
          placeholder="Report ID, location or description"
          value={qDraft}
          onChange={(e) => setQDraft(e.target.value)}
        />
        <FilterFields
          layout="row"
          filters={filters}
          setFilter={setFilter}
          locationDraft={locationDraft}
          setLocationDraft={setLocationDraft}
          typeOptions={typeOptions}
        />
        <div className="flex flex-wrap items-center gap-4">
          <p className="min-w-0 flex-1 type-body-sm text-text-primary">
            {activeCount ? `Filters: ${describeFilters(filters, typeName)}` : 'No filters applied'}
          </p>
          {activeCount > 0 && (
            <button type="button" onClick={clearFilters} className={linkButton}>
              Clear filters
            </button>
          )}
        </div>
      </form>

      {/* 390 px: search, then Filters (n) and Export buttons */}
      <form
        role="search"
        aria-label="Search reports"
        onSubmit={(e) => {
          e.preventDefault();
          updateParams({ q: qDraft.trim() });
        }}
        className="flex flex-col gap-4 md:hidden"
      >
        <TextField
          label="Search"
          icon="search"
          type="search"
          placeholder="Report ID, location or description"
          value={qDraft}
          onChange={(e) => setQDraft(e.target.value)}
        />
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" icon="sliders" onClick={() => setDialog('filters')} aria-haspopup="dialog">
            Filters{activeCount - (filters.q ? 1 : 0) > 0 ? ` (${activeCount - (filters.q ? 1 : 0)})` : ''}
          </Button>
          <Button variant="secondary" icon="download" onClick={() => setDialog('export')} aria-haspopup="dialog">
            Export
          </Button>
        </div>
      </form>

      {/* Results */}
      <section aria-label="Results" aria-busy={loading} className="flex flex-col gap-4">
        {loading && <p className="sr-only">Loading reports…</p>}

        {/* Desktop and tablet table */}
        <div className={`hidden overflow-hidden md:block ${card}`}>
          {error ? (
            errorState
          ) : (
            <>
              <DataTable
                caption="Reports. Select a row to open the report."
                columns={columns}
                rows={loading ? [] : rows}
                getRowKey={(r) => r.report_id}
                onRowClick={openReport}
              />
              {loading &&
                Array.from({ length: 6 }, (_, i) => (
                  <Skeleton key={i} type="table-row" className="border-b border-border-subtle" />
                ))}
              {!loading && rows.length === 0 && <div className="py-12">{emptyState}</div>}
              {!loading && rows.length > 0 && (
                <Pagination
                  className="px-6 py-4"
                  page={page}
                  pages={pages}
                  total={total}
                  limit={PAGE_SIZE}
                  onPageChange={goToPage}
                />
              )}
            </>
          )}
        </div>

        {/* 390 px card list */}
        <div className="flex flex-col gap-4 md:hidden">
          {error ? (
            <div className={card}>{errorState}</div>
          ) : loading ? (
            [0, 1, 2].map((i) => <Skeleton key={i} type="report-card" />)
          ) : rows.length === 0 ? (
            <div className={card}>{emptyState}</div>
          ) : (
            <>
              <ul className="flex flex-col gap-4">
                {rows.map((r) => (
                  <li key={r.report_id}>
                    <ReportCard
                      to={`/admin/reports/${r.report_id}`}
                      code={reportCode(r.report_id)}
                      title={r.accidentType?.type_name || 'Report'}
                      location={r.accident_location}
                      dateTime={formatDateTime(r.date_submitted)}
                      status={r.report_status}
                    />
                  </li>
                ))}
              </ul>
              <PageStepper page={page} pages={pages} onPageChange={goToPage} />
            </>
          )}
        </div>
      </section>

      {/* 390 px: the same filter fields in a dialog */}
      <Dialog
        open={dialog === 'filters'}
        onClose={() => setDialog(null)}
        title="Filters"
        description={activeCount ? `Filters: ${describeFilters(filters, typeName)}` : 'No filters applied'}
        actions={
          <>
            {activeCount > 0 && (
              <Button variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            )}
            <Button onClick={() => setDialog(null)}>Show {loading ? '' : `${total} `}results</Button>
          </>
        }
      >
        <FilterFields
          layout="stack"
          filters={filters}
          setFilter={setFilter}
          locationDraft={locationDraft}
          setLocationDraft={setLocationDraft}
          typeOptions={typeOptions}
        />
      </Dialog>

      <Dialog
        open={dialog === 'export'}
        onClose={() => setDialog(null)}
        title="Export reports"
        description="Download the reports that match the current filters."
        actions={
          <Button variant="secondary" onClick={() => setDialog(null)}>
            Cancel
          </Button>
        }
      >
        <div className="flex flex-col gap-3">
          {exportError && <Toast type="error" title={exportError} className="max-w-none" />}
          <Button variant="secondary" icon="download" fullWidth disabled={Boolean(exporting)} onClick={() => exportFile('csv')}>
            {exporting === 'csv' ? 'Exporting…' : 'Export CSV'}
          </Button>
          <Button variant="secondary" icon="download" fullWidth disabled={Boolean(exporting)} onClick={() => exportFile('pdf')}>
            {exporting === 'pdf' ? 'Exporting…' : 'Export PDF'}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
