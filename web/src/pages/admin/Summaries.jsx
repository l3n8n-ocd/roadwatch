import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  DataTable,
  DateTimeField,
  EmptyState,
  SegmentedControl,
  StatCard,
  StatusChip,
  Toast,
} from '../../components/ui';
import { downloadFile } from '../../api/client';
import { exportsApi } from '../../api/endpoints';
import { STATUSES } from '../../lib/constants';

// W7 Summaries & export (Figma 130:3413, export complete 130:3753).
// FR-12 period summaries (GET /exports/summary) and FR-15 CSV/PDF export of the same period.

const PERIODS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'annual', label: 'Annual' },
];
const PENDING = ['Submitted', 'Under Review', 'Additional Information Required'];
const PERIOD_WORD = { daily: 'day', weekly: 'week', monthly: 'month', annual: 'year' };

// Local "YYYY-MM-DD" for today, and back to a local Date (avoids UTC shifts).
function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function toDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}
const fmt = (options) => new Intl.DateTimeFormat('en-US', options);
const MONTH_DAY = fmt({ month: 'short', day: 'numeric' });
const FULL = fmt({ month: 'short', day: 'numeric', year: 'numeric' });
const MONTH_YEAR = fmt({ month: 'long', year: 'numeric' });
const GENERATED = fmt({ month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });

// "Oct 12 – 18, 2026", "Sep 29 – Oct 5, 2026", "Dec 29, 2025 – Jan 4, 2026"
function rangeLabel(from, to) {
  const a = toDate(from);
  const b = toDate(to);
  if (from === to) return FULL.format(a);
  if (a.getFullYear() !== b.getFullYear()) return `${FULL.format(a)} – ${FULL.format(b)}`;
  const end = a.getMonth() === b.getMonth() ? b.getDate() : MONTH_DAY.format(b);
  return `${MONTH_DAY.format(a)} – ${end}, ${b.getFullYear()}`;
}

function periodTitle(summary) {
  const { period, from, to } = summary;
  if (period === 'daily') return FULL.format(toDate(from));
  if (period === 'weekly') return `Week of ${rangeLabel(from, to)}`;
  if (period === 'monthly') return MONTH_YEAR.format(toDate(from));
  return String(toDate(from).getFullYear());
}

function countOf(rows, key, value) {
  return rows?.find((r) => r[key] === value)?.count || 0;
}

function Card({ titleId, title, children }) {
  return (
    <section
      aria-labelledby={titleId}
      className="flex min-w-0 flex-col gap-4 rounded-rw-md border border-border-subtle bg-surface-white p-6"
    >
      <h2 id={titleId} className="type-h3 text-text-primary">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function Summaries() {
  const [period, setPeriod] = useState('weekly');
  const [date, setDate] = useState(todayIso);
  const [summary, setSummary] = useState(null);
  const [generatedAt, setGeneratedAt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateError, setDateError] = useState('');
  const [toast, setToast] = useState(null);
  const [exporting, setExporting] = useState(null); // 'csv' | 'pdf'

  const load = useCallback((p, d) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      setDateError('Enter a date as YYYY-MM-DD.');
      return;
    }
    setDateError('');
    setLoading(true);
    setError(null);
    exportsApi
      .summary({ period: p, date: d })
      .then((data) => {
        setSummary(data);
        setGeneratedAt(new Date());
      })
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  // First load. Later loads come from the period control and "Show summary".
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => load(period, date), []);

  const changePeriod = (value) => {
    setPeriod(value);
    load(value, date);
  };

  const exportFile = async (kind) => {
    if (!summary) return;
    const filename = `roadwatch-reports-${summary.from}-to-${summary.to}.${kind}`;
    setExporting(kind);
    setToast(null);
    try {
      await downloadFile(`/exports/reports.${kind}`, { date_from: summary.from, date_to: summary.to }, filename);
      setToast({
        type: 'success',
        title: `reports.${kind} downloaded`,
        body: `${summary.total} ${summary.total === 1 ? 'report' : 'reports'} · ${rangeLabel(summary.from, summary.to)} · all statuses and types.`,
      });
    } catch (err) {
      setToast({
        type: 'error',
        title: `Could not download the ${kind.toUpperCase()} file`,
        body: err.response?.status === 401 ? 'Your session expired. Sign in again.' : 'Check your connection and try again.',
      });
    } finally {
      setExporting(null);
    }
  };

  const today = todayIso();
  const inProgress = summary && summary.from <= today && today <= summary.to;
  const pending = summary ? PENDING.reduce((sum, s) => sum + countOf(summary.by_status, 'report_status', s), 0) : 0;
  const statusRows = summary
    ? STATUSES.map((s) => ({ status: s, count: countOf(summary.by_status, 'report_status', s) }))
    : [];
  const typeRows = summary
    ? [...(summary.by_type || [])]
        .sort((a, b) => b.count - a.count)
        .map((t) => ({
          ...t,
          share: summary.total ? `${Math.round((t.count / summary.total) * 100)}%` : '0%',
        }))
    : [];

  return (
    <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <h1 className="type-h1 text-text-primary">Summaries and export</h1>

      {toast && (
        <Toast type={toast.type} title={toast.title} onClose={() => setToast(null)} className="max-w-[400px]">
          {toast.body}
        </Toast>
      )}

      <Card titleId="period-title" title="Period summary">
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            load(period, date);
          }}
          className="flex flex-wrap items-end gap-4"
        >
          <div className="flex w-full max-w-full flex-col gap-2 sm:w-auto">
            <p aria-hidden="true" className="type-label text-text-primary">
              Period
            </p>
            {/* 2 x 2 on phones so every option stays visible. */}
            <SegmentedControl
              label="Period"
              options={PERIODS}
              value={period}
              onChange={changePeriod}
              className="max-sm:grid max-sm:w-full max-sm:grid-cols-2"
            />
          </div>
          <DateTimeField
            label="Any date in the period"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            error={dateError}
            className="w-full sm:w-60"
          />
          <Button type="submit" icon="bar-chart" disabled={loading} className="max-sm:w-full">
            Show summary
          </Button>
        </form>

        <div aria-live="polite" aria-busy={loading} className="flex flex-col gap-4">
          {error ? (
            <EmptyState
              type="error"
              title="Could not load the summary"
              description={error.message}
              action={
                <Button icon="refresh" onClick={() => load(period, date)}>
                  Try again
                </Button>
              }
            />
          ) : !summary ? (
            <p className="type-body-sm text-text-muted">Loading summary…</p>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <h3 className="type-h2 text-text-primary">{periodTitle(summary)}</h3>
                <p className="type-body-sm text-text-muted">
                  Generated {generatedAt ? GENERATED.format(generatedAt) : ''} ·{' '}
                  {inProgress ? `${PERIOD_WORD[summary.period]} in progress` : `${PERIOD_WORD[summary.period]} complete`}
                  {loading && ' · updating…'}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  metric="total"
                  label="Reports submitted"
                  value={summary.total}
                  caption={rangeLabel(summary.from, summary.to)}
                />
                <StatCard
                  metric="verified"
                  label="Verified records"
                  value={summary.verified_records}
                  caption="record_type = verified_record"
                />
                <StatCard
                  metric="closed"
                  label="Resolved/Closed"
                  value={countOf(summary.by_status, 'report_status', 'Resolved/Closed')}
                  caption="Current status of these reports"
                />
                <StatCard
                  metric="pending"
                  label="Still pending"
                  value={pending}
                  caption="Submitted, Under Review, Info required"
                />
              </div>

              <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
                <div className="flex min-w-0 flex-col gap-2">
                  <h3 className="type-h3 text-text-primary">By status</h3>
                  <DataTable
                    caption={`Reports by status, ${periodTitle(summary)}`}
                    getRowKey={(r) => r.status}
                    rows={statusRows}
                    columns={[
                      { key: 'status', header: 'Status', render: (r) => <StatusChip status={r.status} /> },
                      { key: 'count', header: 'Reports', className: 'w-24 text-right type-label' },
                    ]}
                  />
                </div>
                <div className="flex min-w-0 flex-col gap-2">
                  <h3 className="type-h3 text-text-primary">By accident type</h3>
                  {typeRows.length === 0 ? (
                    <p className="type-body-sm text-text-muted">No reports in this period.</p>
                  ) : (
                    <DataTable
                      caption={`Reports by accident type, ${periodTitle(summary)}`}
                      getRowKey={(r) => r.type_name}
                      rows={typeRows}
                      columns={[
                        { key: 'type_name', header: 'Type', className: 'type-body' },
                        { key: 'count', header: 'Reports', className: 'w-24 text-right type-label' },
                        { key: 'share', header: 'Share', className: 'w-20 text-right text-text-muted' },
                      ]}
                    />
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </Card>

      <Card titleId="export-title" title="Export report data">
        <p className="type-body text-text-primary">
          {summary
            ? `Exports cover the period above: ${rangeLabel(summary.from, summary.to)} · all statuses · all accident types (${summary.total} ${summary.total === 1 ? 'report' : 'reports'}).`
            : 'Choose a period above to export its reports.'}
        </p>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button
            icon="download"
            onClick={() => exportFile('csv')}
            disabled={!summary || exporting != null}
            className="max-sm:flex-1"
          >
            {exporting === 'csv' ? 'Preparing…' : 'Download CSV'}
          </Button>
          <Button
            variant="secondary"
            icon="file-text"
            onClick={() => exportFile('pdf')}
            disabled={!summary || exporting != null}
            className="max-sm:flex-1"
          >
            {exporting === 'pdf' ? 'Preparing…' : 'Download PDF'}
          </Button>
          <Link
            to="/admin/reports"
            className="flex min-h-11 items-center type-label text-text-blue underline underline-offset-2 sm:ml-auto"
          >
            Change filters in Reports
          </Link>
        </div>
        <p className="type-body-sm text-text-muted">
          Files are requested with your login token and saved by the browser (a plain link cannot send the token).
        </p>
      </Card>
    </div>
  );
}
