import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CircleMarker, Tooltip as MapTooltip, useMap } from 'react-leaflet';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  Button,
  DataTable,
  EmptyState,
  FullScreenMap,
  MapView,
  RecordBadge,
  ReportCard,
  StatCard,
  StatusChip,
} from '../../components/ui';
import { dashboard } from '../../api/endpoints';
import useServerError from '../../lib/useServerError';
import { prefersReducedMotion } from '../../lib/motion';
import { formatDateTime, reportCode } from '../../lib/format';

// W2 Administrator dashboard (Figma 123:108, dark 166:4256).
// Data: GET /dashboard/stats → cards, by_type, trend (last 30 days), hotspots, map_points, recent.
// Every chart has a text alternative: the trend has a summary sentence and a "View as table"
// toggle, the type bars are plain text plus bars, and the map has the "Top locations" list.

const numberFmt = new Intl.NumberFormat('en-US');
const shortDateFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
const longDateFmt = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });
const timeFmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });

const card = 'rounded-rw-md border border-border-subtle bg-surface-white p-6';
const linkButton =
  'inline-flex min-h-11 items-center type-label text-text-blue underline underline-offset-2 hover:no-underline rounded-rw-sm';

// "2026-10-17" for a local Date (the API's accident_date uses this format).
function dayKey(date) {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}

// Parse "YYYY-MM-DD" as a local date (new Date("2026-10-17") would be UTC midnight).
function parseDay(key) {
  return new Date(`${key}T00:00:00`);
}

// The API only returns days that had reports; fill the 30-day window with zeros.
function buildTrend(trendRows = []) {
  const counts = new Map(trendRows.map((row) => [String(row.accident_date).slice(0, 10), row.count]));
  const days = [];
  for (let i = 29; i >= 0; i -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const key = dayKey(date);
    days.push({ key, label: shortDateFmt.format(date), count: counts.get(key) || 0 });
  }
  return days;
}

function trendSummary(days) {
  const total = days.reduce((sum, d) => sum + d.count, 0);
  if (total === 0) return 'No reports in the last 30 days.';
  const peak = days.reduce((best, d) => (d.count > best.count ? d : best), days[0]);
  const average = (total / days.length).toFixed(1);
  const today = days[days.length - 1].count;
  return `${numberFmt.format(total)} reports in 30 days, about ${average} a day. Peak: ${peak.count} on ${peak.label}. Today: ${today}.`;
}

// Group map points that are within about 100 m, so each circle shows how many reports it holds.
function groupPoints(points = []) {
  const groups = new Map();
  points.forEach((p) => {
    const lat = Number(p.latitude);
    const lng = Number(p.longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;
    const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
    const group = groups.get(key) || { key, lat, lng, count: 0, location: p.accident_location };
    group.count += 1;
    groups.set(key, group);
  });
  return [...groups.values()];
}

// Zooms the map so every hotspot is visible.
function FitToPoints({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) map.setView([points[0].lat, points[0].lng], 14);
    else map.fitBounds(points.map((p) => [p.lat, p.lng]), { padding: [40, 40], maxZoom: 15 });
  }, [map, points]);
  return null;
}

function TrendTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-rw-sm border border-border-subtle bg-surface-white px-3 py-2 shadow-rw-md">
      <p className="type-label text-text-primary">{longDateFmt.format(parseDay(point.key))}</p>
      <p className="type-body-sm text-text-primary">
        {point.count} {point.count === 1 ? 'report' : 'reports'}
      </p>
    </div>
  );
}

// Only the last point (today) gets a marker, as in the Figma plot.
function TodayDot({ cx, cy, index, lastIndex }) {
  if (index !== lastIndex) return <g key={index} />;
  return <circle key={index} cx={cx} cy={cy} r={5} fill="var(--rw-brand-navy)" />;
}

function TrendCard({ days }) {
  const [showTable, setShowTable] = useState(false);
  const max = Math.max(...days.map((d) => d.count));
  const top = Math.max(10, Math.ceil(max / 10) * 10);
  const ticks = [0, 7, 14, 21, 28].map((i) => days[i].key);

  return (
    <section data-guide="trend" aria-labelledby="trend-title" className={`flex min-w-0 flex-col gap-4 ${card}`}>
      <div className="flex flex-wrap items-center gap-4">
        <h2 id="trend-title" className="min-w-0 flex-1 type-h3 text-text-primary">
          Reports submitted, last 30 days
        </h2>
        <button
          type="button"
          aria-expanded={showTable}
          aria-controls="trend-table"
          onClick={() => setShowTable((v) => !v)}
          className={linkButton}
        >
          {showTable ? 'View as chart' : 'View as table'}
        </button>
      </div>
      <p className="type-body text-text-primary">{trendSummary(days)}</p>

      {showTable ? (
        <div id="trend-table" className="max-h-60 overflow-y-auto rounded-rw-sm border border-border-subtle">
          <table className="w-full text-left type-body-sm text-text-primary">
            <caption className="sr-only">Reports submitted per day, last 30 days</caption>
            <thead className="sticky top-0 bg-surface-navy-subtle">
              <tr>
                <th scope="col" className="px-4 py-2 type-label">Date</th>
                <th scope="col" className="px-4 py-2 text-right type-label">Reports</th>
              </tr>
            </thead>
            <tbody>
              {days.map((d) => (
                <tr key={d.key} className="border-t border-border-subtle">
                  <td className="px-4 py-2">{longDateFmt.format(parseDay(d.key))}</td>
                  <td className="px-4 py-2 text-right">{d.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <div className="h-57 w-full" role="img" aria-label="Line chart of reports per day. The sentence above and the table view give the same data.">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={days} margin={{ top: 8, right: 8, bottom: 0, left: -24 }} accessibilityLayer={false}>
                <CartesianGrid vertical={false} stroke="var(--rw-border-subtle)" />
                <XAxis
                  dataKey="key"
                  ticks={ticks}
                  interval={0}
                  tickFormatter={(key) => shortDateFmt.format(parseDay(key))}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--rw-text-muted)', fontSize: 12, fontWeight: 500 }}
                  tickMargin={10}
                />
                <YAxis
                  domain={[0, top]}
                  ticks={[0, top / 2, top]}
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: 'var(--rw-text-muted)', fontSize: 12, fontWeight: 500 }}
                />
                <Tooltip
                  content={<TrendTooltip />}
                  cursor={{ stroke: 'var(--rw-text-muted)', strokeWidth: 1, strokeDasharray: '4 4' }}
                  isAnimationActive={false}
                />
                <Line
                  type="linear"
                  dataKey="count"
                  stroke="var(--rw-brand-blue)"
                  strokeWidth={2}
                  dot={(props) => <TodayDot {...props} lastIndex={days.length - 1} />}
                  activeDot={{ r: 5, fill: 'var(--rw-brand-navy)', stroke: 'var(--rw-surface-white)', strokeWidth: 2 }}
                  // A2: the trend line draws left to right (off with reduce motion).
                  isAnimationActive={!prefersReducedMotion()}
                  animationDuration={600}
                  animationEasing="ease-out"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="type-caption text-text-muted">Hover a day to see its count, or use “View as table”.</p>
        </>
      )}
    </section>
  );
}

function TypeBars({ byType, total }) {
  const rows = [...byType].sort((a, b) => b.count - a.count);
  const max = Math.max(1, ...rows.map((r) => r.count));
  return (
    <section data-guide="types" aria-labelledby="types-title" className={`flex min-w-0 flex-col gap-4 ${card}`}>
      <h2 id="types-title" className="type-h3 text-text-primary">
        By accident type
      </h2>
      <p className="type-body-sm text-text-muted">All time, {numberFmt.format(total)} reports</p>
      {rows.length === 0 ? (
        <p className="type-body-sm text-text-primary">No reports yet.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {rows.map((row, index) => (
            <li key={row.type_name} className="flex flex-col gap-1.5">
              <span className="flex items-start justify-between gap-2 type-body-sm text-text-primary">
                <span>{row.type_name}</span>
                <span className="type-label">{numberFmt.format(row.count)}</span>
              </span>
              <span aria-hidden="true" className="flex h-3 w-full">
                {/* A2: bars grow from the left, one after another. */}
                <span
                  className="h-3 origin-left rounded-r-[4px] bg-brand-navy transition-transform duration-600 ease-out starting:scale-x-0 motion-reduce:transition-none"
                  style={{ width: `${(row.count / max) * 100}%`, transitionDelay: `${index * 50}ms` }}
                />
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function HotspotsCard({ hotspots, mapPoints }) {
  const [full, setFull] = useState(false);
  const groups = useMemo(() => groupPoints(mapPoints), [mapPoints]);
  const biggest = Math.max(1, ...groups.map((g) => g.count));
  const top = hotspots.slice(0, 5);
  const mapLabel = 'Map of accident hotspots. The Top locations list has the same data as text.';

  // The same circles in the card and in the full-screen map (#46, Figma 410:17303).
  const layers = (
    <>
      <FitToPoints points={groups} />
      {groups.map((g) => (
        <CircleMarker
          key={g.key}
          center={[g.lat, g.lng]}
          radius={8 + 20 * Math.sqrt(g.count / biggest)}
          pathOptions={{
            color: 'var(--rw-surface-white)',
            weight: 2,
            fillColor: 'var(--rw-brand-blue)',
            fillOpacity: 0.7,
          }}
        >
          <MapTooltip>
            {g.location}: {g.count} {g.count === 1 ? 'report' : 'reports'}
          </MapTooltip>
        </CircleMarker>
      ))}
    </>
  );

  const topLocations = (
    <div className="flex min-w-0 flex-col gap-3">
      <h3 className="type-label text-text-primary">Top locations</h3>
      {top.length === 0 ? (
        <p className="type-body-sm text-text-muted">No locations yet.</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {top.map((spot, i) => (
            <li key={spot.accident_location} className="flex items-center gap-3 type-body-sm text-text-primary">
              <span
                aria-hidden="true"
                className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-navy-subtle type-label"
              >
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">{spot.accident_location}</span>
              <span className="type-label whitespace-nowrap">
                {numberFmt.format(spot.count)} {spot.count === 1 ? 'report' : 'reports'}
              </span>
            </li>
          ))}
        </ol>
      )}
      <p className="type-caption text-text-muted">
        Circle size = number of reports at that spot. This list carries the same data as text.
      </p>
    </div>
  );

  return (
    <section data-guide="hotspots" aria-labelledby="hotspots-title" className={`flex flex-col gap-4 ${card}`}>
      <h2 id="hotspots-title" className="type-h3 text-text-primary">
        Accident hotspots
      </h2>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,560fr)_minmax(0,462fr)]">
        <MapView label={mapLabel} zoom={12} onExpand={() => setFull(true)}>
          {layers}
        </MapView>
        {topLocations}
      </div>
      <FullScreenMap open={full} onClose={() => setFull(false)} title="Accident hotspots" zoom={12} label={mapLabel} aside={topLocations}>
        {layers}
      </FullScreenMap>
    </section>
  );
}

function RecentReports({ rows }) {
  const navigate = useNavigate();
  const open = (row) => navigate(`/admin/reports/${row.report_id}`);
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

  return (
    <section data-guide="recent" aria-labelledby="recent-title" className={`flex flex-col gap-4 ${card}`}>
      <div className="flex flex-wrap items-center gap-4">
        <h2 id="recent-title" className="min-w-0 flex-1 type-h3 text-text-primary">
          Recent reports
        </h2>
        <Link to="/admin/reports" className={linkButton}>
          View all reports
        </Link>
      </div>
      {rows.length === 0 ? (
        <EmptyState type="no-reports" title="No reports yet" description="New reports from the public appear here." />
      ) : (
        <>
          <DataTable
            className="hidden md:block"
            caption="Five most recent reports. Select a row to open the report."
            columns={columns}
            rows={rows}
            getRowKey={(r) => r.report_id}
            onRowClick={open}
          />
          <ul className="flex flex-col gap-3 md:hidden">
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
        </>
      )}
    </section>
  );
}

// Grey placeholders shaped like the cards, charts and table while the stats load.
function DashboardSkeleton() {
  const block = 'rounded-rw-md border border-border-subtle bg-surface-white animate-pulse motion-reduce:animate-none';
  return (
    <div aria-hidden="true" className="flex flex-col gap-6">
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-45 p-6 ${block}`}>
            <span className="block h-4 w-24 rounded-rw-sm bg-surface-navy-subtle" />
            <span className="mt-8 block h-9 w-20 rounded-rw-sm bg-surface-navy-subtle" />
          </div>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,692fr)_minmax(0,380fr)]">
        <div className={`h-98 ${block}`} />
        <div className={`h-98 ${block}`} />
      </div>
      <div className={`h-103 ${block}`} />
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState(null);
  const raiseServerError = useServerError();

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    dashboard
      .stats()
      .then((data) => {
        setStats(data);
        setUpdatedAt(new Date());
      })
      .catch((err) => !raiseServerError(err) && setError(err.message))
      .finally(() => setLoading(false));
  }, [raiseServerError]);

  useEffect(() => {
    load();
  }, [load]);

  const days = useMemo(() => buildTrend(stats?.trend), [stats]);
  const cards = stats?.cards || {};

  return (
    <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h1 className="type-h1 text-text-primary">Dashboard</h1>
          <p className="type-body-sm text-text-muted" aria-live="polite">
            {updatedAt
              ? `${longDateFmt.format(updatedAt)} · updated ${timeFmt.format(updatedAt)}`
              : 'Loading the latest numbers…'}
          </p>
        </div>
        <Button variant="secondary" icon="refresh" onClick={load} disabled={loading} className="sm:w-46">
          {loading && stats ? 'Refreshing…' : 'Refresh'}
        </Button>
      </div>

      {error && !stats ? (
        <div className={card}>
          <EmptyState
            type="error"
            title="Could not load the dashboard"
            description={error}
            action={
              <Button variant="secondary" icon="refresh" onClick={load}>
                Try again
              </Button>
            }
          />
        </div>
      ) : !stats ? (
        <div aria-busy="true">
          <p className="sr-only">Loading dashboard…</p>
          <DashboardSkeleton />
        </div>
      ) : (
        <>
          {error && (
            <p role="alert" className="type-body-sm text-text-danger">
              Could not refresh: {error}
            </p>
          )}
          <section data-guide="stats" aria-label="Summary" className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard metric="total" label="Total reports" value={cards.total ?? 0} caption="All time" index={0} />
            <StatCard
              metric="pending"
              label="Pending"
              value={cards.pending ?? 0}
              index={1}
              caption="Submitted, Under Review, Info required"
            />
            <StatCard
              metric="verified"
              label="Verified"
              value={cards.verified ?? 0}
              index={2}
              caption="record_type = verified_record"
            />
            <StatCard metric="closed" label="Closed" value={cards.closed ?? 0} caption="Resolved/Closed" index={3} />
          </section>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,692fr)_minmax(0,380fr)]">
            <TrendCard days={days} />
            <TypeBars byType={stats.by_type || []} total={cards.total ?? 0} />
          </div>

          <HotspotsCard hotspots={stats.hotspots || []} mapPoints={stats.map_points || []} />

          <RecentReports rows={(stats.recent || []).slice(0, 5)} />
        </>
      )}
    </div>
  );
}
