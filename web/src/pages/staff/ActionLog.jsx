import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, EmptyState, Icon, Pagination, SegmentedControl, Select } from '../../components/ui';
import { admin, auth, users } from '../../api/endpoints';
import { ROLES } from '../../lib/constants';
import { cx } from '../../lib/cx';
import { reportCode } from '../../lib/format';

// W8 Action log (Figma: Default 210:5390, Empty 214:5677, All staff 245:6849), decision #27.
// My actions: GET /auth/me/activity. All staff (administrators only): GET /admin/audit-logs.
// Both endpoints are approved in design but NOT built yet, so a 404 shows a "not available yet"
// state. Proposed query: action, period (7d | 30d | 90d | all), user_id (All staff), page, limit.
// Rows are audit_logs entries: { log_id, user_id, action_taken, action_details, timestamp, user? }.

const PAGE_SIZE = 20;
const TIME_ZONE = 'Asia/Manila'; // Philippine Standard Time, as the page says

const ACTION_OPTIONS = [
  { value: '', label: 'All actions' },
  { value: 'report.status_changed', label: 'Status changes and assignments' },
  { value: 'user', label: 'User management' },
  { value: 'export', label: 'Exports' },
  { value: 'accident_type.created', label: 'Accident types' },
  { value: 'report.created', label: 'Reports submitted' },
  { value: 'auth.login', label: 'Sign-ins' },
];

const PERIOD_OPTIONS = [
  { value: '7d', label: 'Last 7 days' },
  { value: '30d', label: 'Last 30 days' },
  { value: '90d', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
];

const VIEW_OPTIONS = [
  { value: 'mine', label: 'My actions' },
  { value: 'all', label: 'All staff' },
];

const timeFmt = new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', hour12: false });
const dayFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: TIME_ZONE,
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});
const keyFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE }); // YYYY-MM-DD

function dayKey(date) {
  return keyFmt.format(date);
}

// "TODAY · SAT, OCT 17, 2026" (the overline style makes it upper case).
function dayLabel(key, sample) {
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86400000);
  const text = dayFmt.format(sample);
  if (key === dayKey(today)) return `Today · ${text}`;
  if (key === dayKey(yesterday)) return `Yesterday · ${text}`;
  return text;
}

function parseDetails(value) {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return { text: String(value) };
  }
}

const ROLE_SHORT = { [ROLES.ADMIN]: 'Admin', [ROLES.OFFICER]: 'Officer', [ROLES.REPORTER]: 'Reporter' };

// Turns one audit_logs row into what the table shows: icon, action label, details text, report id.
function describe(entry) {
  const d = parseDetails(entry.action_details);
  const who = d.target_name ? `${d.target_name}${d.role ? ` (${d.role})` : ''}` : 'The user';
  switch (entry.action_taken) {
    case 'report.status_changed': {
      const change = d.from && d.to ? `${d.from} → ${d.to}.` : `Status is now ${d.to || 'updated'}.`;
      if (d.to === 'Assigned')
        return { icon: 'user-check', label: 'Assigned officer', details: d.officer_name ? `Assigned to Officer ${d.officer_name}.` : change, reportId: d.report_id };
      if (d.to === 'Verified')
        return { icon: 'shield-check', label: 'Verified report', details: `${change} Record type is now verified_record.`, reportId: d.report_id };
      if (d.to === 'Rejected')
        return { icon: 'x-circle', label: 'Rejected report', details: d.reason ? `Reason: ${d.reason}` : change, reportId: d.report_id };
      if (d.to === 'Additional Information Required')
        return { icon: 'alert-circle', label: 'Requested information', details: change, reportId: d.report_id };
      return { icon: 'refresh', label: 'Changed status', details: change, reportId: d.report_id };
    }
    case 'report.created':
      return { icon: 'send', label: 'Submitted report', details: 'New public submission.', reportId: d.report_id };
    case 'report.photos_added':
      return { icon: 'camera', label: 'Added photos', details: `${d.count || 'New'} photo(s) added.`, reportId: d.report_id };
    case 'user.created':
      return { icon: 'users', label: 'Created user', details: `New ${d.role || 'staff'} account${d.target_name ? `: ${d.target_name}` : ''}.` };
    case 'user.role_changed':
      return { icon: 'sliders', label: 'Changed role', details: `${who}: role is now ${d.role || 'updated'}.` };
    case 'user.deactivated':
      return { icon: 'user-x', label: 'Deactivated user', details: `${who} can no longer sign in. Reports and history kept.` };
    case 'user.reactivated':
      return { icon: 'user-check', label: 'Reactivated user', details: `${who} can sign in again.` };
    case 'export.csv':
    case 'export.pdf':
      return { icon: 'download', label: 'Exported reports', details: `${entry.action_taken === 'export.csv' ? 'CSV' : 'PDF'} export.` };
    case 'accident_type.created':
      return { icon: 'plus', label: 'Added accident type', details: d.type_name ? `New type: ${d.type_name}.` : 'New accident type.' };
    case 'auth.login':
      return { icon: 'lock', label: 'Signed in', details: 'Signed in to RoadWatch.' };
    case 'account.registered':
      return { icon: 'user', label: 'Registered', details: 'Account created.' };
    default:
      return { icon: 'info', label: entry.action_taken || 'Action', details: d.text || '' };
  }
}

// The not-built endpoints may return a plain list or { data, pagination }.
function normalize(result) {
  if (Array.isArray(result)) return { rows: result, pagination: null };
  return { rows: result?.data || result?.rows || [], pagination: result?.pagination || null };
}

export default function ActionLog() {
  const [view, setView] = useState('mine');
  const [action, setAction] = useState('');
  const [period, setPeriod] = useState('30d');
  const [staffId, setStaffId] = useState('');
  const [page, setPage] = useState(1);
  const [staff, setStaff] = useState([]);
  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // { status, message }

  const allStaff = view === 'all';

  // Staff list for the "Staff member" filter (administrators only).
  useEffect(() => {
    if (!allStaff || staff.length) return;
    users
      .list()
      .then((list) => setStaff((Array.isArray(list) ? list : []).filter((u) => u.role !== ROLES.REPORTER)))
      .catch(() => {
        // The filter keeps "All staff" only.
      });
  }, [allStaff, staff.length]);

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const params = { period, page, limit: PAGE_SIZE };
    if (action) params.action = action;
    if (allStaff && staffId) params.user_id = staffId;
    (allStaff ? admin.auditLogs(params) : auth.myActivity(params))
      .then((result) => {
        if (cancelled) return;
        const data = normalize(result);
        setRows(data.rows);
        setPagination(data.pagination);
      })
      .catch((err) => {
        if (cancelled) return;
        setRows([]);
        setPagination(null);
        setError({ status: err.status, message: err.message });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [allStaff, action, period, staffId, page]);

  useEffect(() => load(), [load]);

  // Rows grouped by day (Philippine time), newest first.
  const groups = useMemo(() => {
    const sorted = [...rows].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const list = [];
    sorted.forEach((entry) => {
      const date = new Date(entry.timestamp);
      const key = Number.isNaN(date.getTime()) ? 'unknown' : dayKey(date);
      let group = list.find((g) => g.key === key);
      if (!group) {
        group = { key, label: key === 'unknown' ? 'Date unknown' : dayLabel(key, date), entries: [] };
        list.push(group);
      }
      group.entries.push(entry);
    });
    return list;
  }, [rows]);

  const changeFilter = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };
  const changeView = (next) => {
    setView(next);
    setPage(1);
  };

  const reportPath = (id) => `/admin/reports/${id}`;
  const filtered = Boolean(action) || period !== '30d' || Boolean(staffId);
  const columnCount = allStaff ? 5 : 4;
  const staffOptions = [
    { value: '', label: 'All staff' },
    ...staff.map((u) => ({ value: String(u.user_id), label: `${u.full_name} · ${ROLE_SHORT[u.role] || u.role}` })),
  ];

  let body;
  if (loading) {
    body = (
      <div aria-busy="true" className="flex flex-col gap-3 p-2">
        <span className="sr-only">Loading the action log…</span>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} aria-hidden="true" className="flex animate-pulse items-center gap-4 px-2 py-3 motion-reduce:animate-none">
            <span className="h-4 w-12 rounded-rw-sm bg-surface-navy-subtle" />
            <span className="h-4 w-32 rounded-rw-sm bg-surface-navy-subtle" />
            <span className="h-4 flex-1 rounded-rw-sm bg-surface-navy-subtle" />
          </div>
        ))}
      </div>
    );
  } else if (error && (error.status === 404 || error.status === 501)) {
    body = (
      <EmptyState
        icon="clock"
        title="Action log is not available yet"
        description="The server does not provide this view yet. Your actions are still recorded in the audit trail and will show here once it is ready."
        className="max-w-120!"
      />
    );
  } else if (error) {
    body = (
      <EmptyState
        type="error"
        title="Could not load the action log"
        description={error.message}
        className="max-w-120!"
        action={
          <Button variant="secondary" icon="refresh" onClick={load}>
            Try again
          </Button>
        }
      />
    );
  } else if (rows.length === 0) {
    body = (
      <EmptyState
        type={filtered ? 'no-results' : 'no-reports'}
        title={filtered ? 'No actions match these filters' : allStaff ? 'No staff actions yet' : 'No actions yet'}
        description={
          filtered
            ? 'Try another action type or a longer period.'
            : allStaff
              ? 'Staff actions such as status changes, assignments and exports appear here.'
              : "When you update a report's status or add official remarks, the entry appears here."
        }
        className="max-w-120!"
      />
    );
  } else {
    const cell = 'px-4 py-3 align-middle max-md:p-0';
    body = (
      <>
        <table className="w-full border-separate border-spacing-0 text-left text-text-primary">
          <caption className="sr-only">{allStaff ? 'All staff actions' : 'Your actions'}, grouped by day</caption>
          <thead className="max-md:sr-only">
            <tr className="type-label">
              <th scope="col" className="h-11 w-30 rounded-l-rw-sm bg-surface-light-gray px-4">
                When
              </th>
              {allStaff && (
                <th scope="col" className="h-11 w-52 bg-surface-light-gray px-4">
                  Staff
                </th>
              )}
              <th scope="col" className="h-11 w-60 bg-surface-light-gray px-4">
                Action
              </th>
              <th scope="col" className="h-11 bg-surface-light-gray px-4">
                Details
              </th>
              <th scope="col" className="h-11 w-35 rounded-r-rw-sm bg-surface-light-gray px-4">
                Report
              </th>
            </tr>
          </thead>
          {groups.map((group) => (
            <tbody key={group.key} className="max-md:block">
              <tr className="max-md:block">
                <th
                  scope="colgroup"
                  colSpan={columnCount}
                  className="px-4 pt-4 pb-2 type-overline uppercase text-text-muted max-md:block max-md:px-0"
                >
                  {group.label}
                </th>
              </tr>
              {group.entries.map((entry) => {
                const info = describe(entry);
                const date = new Date(entry.timestamp);
                return (
                  <tr
                    key={entry.log_id}
                    className="max-md:flex max-md:flex-col max-md:gap-1 max-md:border-b max-md:border-border-subtle max-md:py-3 [&>td]:border-b [&>td]:border-border-subtle max-md:[&>td]:border-0"
                  >
                    <td className={cx(cell, 'type-body md:h-15')}>
                      {Number.isNaN(date.getTime()) ? '—' : <time dateTime={date.toISOString()}>{timeFmt.format(date)}</time>}
                    </td>
                    {allStaff && (
                      <td className={cx(cell, 'type-body')}>
                        {entry.user?.full_name || `User ${entry.user_id}`}
                        {entry.user?.role ? ` · ${ROLE_SHORT[entry.user.role] || entry.user.role}` : ''}
                      </td>
                    )}
                    <td className={cell}>
                      <span className="flex items-center gap-2 type-label">
                        <Icon name={info.icon} size={18} />
                        {info.label}
                      </span>
                    </td>
                    <td className={cx(cell, 'type-body break-words')}>{info.details}</td>
                    <td className={cell}>
                      {info.reportId ? (
                        <Link to={reportPath(info.reportId)} className="inline-flex min-h-11 items-center type-label text-text-blue underline">
                          <span className="sr-only">Open report </span>
                          {reportCode(info.reportId)}
                        </Link>
                      ) : (
                        <span className="type-body-sm text-text-muted max-md:hidden">
                          <span aria-hidden="true">—</span>
                          <span className="sr-only">No report</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          ))}
        </table>
        {pagination && pagination.pages > 1 && (
          <Pagination
            page={pagination.page}
            pages={pagination.pages}
            total={pagination.total}
            limit={pagination.limit}
            itemLabel="actions"
            onPageChange={setPage}
          />
        )}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <div className="flex flex-col gap-1">
        <h1 className="type-h1 text-text-primary">Action log</h1>
        <p className="type-body text-text-muted">
          {allStaff
            ? 'Every staff action in RoadWatch, newest first (audit trail). Only administrators can see this view.'
            : 'Your own actions in RoadWatch, newest first. The log is read-only: entries cannot be edited or deleted.'}{' '}
          Times are in Philippine Standard Time.
        </p>
      </div>

      <SegmentedControl label="Show" options={VIEW_OPTIONS} value={view} onChange={changeView} className="self-start" />

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
        {allStaff && (
          <Select label="Staff member" options={staffOptions} value={staffId} onChange={changeFilter(setStaffId)} className="sm:w-60" />
        )}
        <Select label="Action type" options={ACTION_OPTIONS} value={action} onChange={changeFilter(setAction)} className="sm:w-80" />
        <Select label="Period" options={PERIOD_OPTIONS} value={period} onChange={changeFilter(setPeriod)} className="sm:w-60" />
      </div>

      <section
        aria-label={allStaff ? 'All staff actions' : 'Your actions'}
        className="flex flex-col gap-4 rounded-rw-md border border-border-subtle bg-surface-white p-4 sm:p-6"
      >
        {body}
      </section>
    </div>
  );
}
