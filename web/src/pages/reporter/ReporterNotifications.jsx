import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, EmptyState, NotificationItem, Toast } from '../../components/ui';
import { notifications } from '../../api/endpoints';
import { STATUSES } from '../../lib/constants';
import { reportCode } from '../../lib/format';

// Reporter notifications (web). No web frame exists: the list follows the mobile Notifications
// frame (Figma 119:1759) and its empty state (119:1871). GET /notifications returns the newest 100.
// Selecting a row marks it read and opens the report; "Mark all as read" clears the rest.

const timeFmt = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
const dayFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });

// "5 min ago", "Today · 08:42", "Yesterday · 10:20", "Oct 15 · 14:05" (as in the Figma list).
function whenText(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  const minutes = Math.round((now - d) / 60000);
  if (minutes >= 0 && minutes < 60) return minutes <= 1 ? 'Just now' : `${minutes} min ago`;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dayDiff = Math.round((startOfToday - new Date(d.getFullYear(), d.getMonth(), d.getDate())) / 86400000);
  if (dayDiff === 0) return `Today · ${timeFmt.format(d)}`;
  if (dayDiff === 1) return `Yesterday · ${timeFmt.format(d)}`;
  return `${dayFmt.format(d)} · ${timeFmt.format(d)}`;
}

// "Your report #128 is now ..." -> "Your report RW-000128 is now ...".
function readableMessage(message = '') {
  return message.replace(/#(\d+)/g, (_, id) => reportCode(id));
}

// The notifications table has no status column; pick the icon from the message text.
function statusFromMessage(message = '') {
  const found = STATUSES.find((s) => message.includes(s));
  if (found) return found;
  if (/submitted|received/i.test(message)) return 'Submitted';
  if (/assigned/i.test(message)) return 'Assigned';
  return undefined;
}

export default function ReporterNotifications() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    notifications
      .list()
      .then((rows) => {
        if (!cancelled) setItems(Array.isArray(rows) ? rows : rows?.data || []);
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
  }, []);

  useEffect(() => load(), [load]);

  const unread = items.filter((n) => !n.is_read).length;

  const open = async (item) => {
    setActionError('');
    if (!item.is_read) {
      try {
        await notifications.read(item.notification_id);
        setItems((list) => list.map((n) => (n.notification_id === item.notification_id ? { ...n, is_read: true } : n)));
      } catch (err) {
        setActionError(`Could not mark it as read. ${err.message}`);
      }
    }
    if (item.report_id) navigate(`/my-reports/${item.report_id}`);
  };

  const markAll = async () => {
    setActionError('');
    setMarkingAll(true);
    try {
      await notifications.readAll();
      setItems((list) => list.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      setActionError(`Could not mark all as read. ${err.message}`);
    } finally {
      setMarkingAll(false);
    }
  };

  let content;
  if (loading) {
    content = (
      <div aria-busy="true" className="flex flex-col gap-3 p-4">
        <span className="sr-only">Loading notifications…</span>
        {[0, 1, 2].map((i) => (
          <div key={i} aria-hidden="true" className="flex animate-pulse items-start gap-3 motion-reduce:animate-none">
            <span className="size-10 shrink-0 rounded-full bg-surface-navy-subtle" />
            <span className="flex flex-1 flex-col gap-2">
              <span className="h-4 w-3/4 rounded-rw-sm bg-surface-navy-subtle" />
              <span className="h-3 w-24 rounded-rw-sm bg-surface-navy-subtle" />
            </span>
          </div>
        ))}
      </div>
    );
  } else if (error) {
    content = (
      <EmptyState
        type="error"
        title="Could not load notifications"
        description={error}
        action={
          <Button variant="secondary" icon="refresh" onClick={load}>
            Try again
          </Button>
        }
      />
    );
  } else if (items.length === 0) {
    content = (
      <EmptyState
        icon="bell"
        title="No notifications yet"
        description="Status changes on your reports will show up here."
      />
    );
  } else {
    content = (
      <>
        <div className="flex min-h-12 flex-wrap items-center justify-between gap-2 border-b border-border-subtle px-4">
          <p className="type-label text-text-primary" aria-live="polite">
            {unread} unread
          </p>
          {unread > 0 && (
            <button
              type="button"
              onClick={markAll}
              disabled={markingAll}
              className="inline-flex min-h-11 items-center type-label text-text-blue underline disabled:cursor-not-allowed disabled:text-text-muted"
            >
              {markingAll ? 'Marking…' : 'Mark all as read'}
            </button>
          )}
        </div>
        <ul aria-label="Notifications">
          {items.map((n) => (
            <NotificationItem
              key={n.notification_id}
              message={readableMessage(n.message)}
              time={whenText(n.created_at)}
              status={statusFromMessage(n.message)}
              read={Boolean(n.is_read)}
              onClick={() => open(n)}
            />
          ))}
        </ul>
      </>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-180 flex-col gap-6 px-4 pt-6 pb-16 sm:px-6 lg:pt-10">
      <div className="flex flex-col gap-1">
        <h1 className="type-h1 text-text-primary">Notifications</h1>
        <p className="type-body text-text-muted">Updates on your reports, newest first. Select one to open the report.</p>
      </div>
      {actionError && (
        <Toast type="error" onClose={() => setActionError('')} className="max-w-none shadow-none">
          {actionError}
        </Toast>
      )}
      <section aria-label="Notification list" className="overflow-hidden rounded-rw-md border border-border-subtle bg-surface-white">
        {content}
      </section>
    </div>
  );
}
