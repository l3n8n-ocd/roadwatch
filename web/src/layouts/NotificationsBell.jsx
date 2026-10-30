import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Icon, IconButton } from '../components/ui';
import { notifications as notificationsApi } from '../api/endpoints';
import { cx } from '../lib/cx';
import { formatRelative } from '../lib/format';

// Officer notification bell (Traffic Officer console only; Figma top bar "Bell" property, panel
// W5/Overlay/Notifications open 481:20505, empty 483:21192). Administrators get no in-app notifications,
// so their top bar has no bell. GET /notifications lists the newest 100 (assignment alerts for officers).
// Selecting an alert marks it read and opens the report; "Mark all as read" clears the count.
// Escape, the bell or a click outside closes the panel; focus returns to the bell.
const REFRESH_MS = 60000;

export default function NotificationsBell({ className = '' }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [error, setError] = useState(false);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const bellRef = useRef(null);
  const panelRef = useRef(null);
  const panelId = useId();
  const titleId = useId();

  const load = useCallback(() => {
    notificationsApi
      .list()
      .then((list) => {
        setItems(Array.isArray(list) ? list : []);
        setError(false);
      })
      .catch(() => setError(true));
  }, []);

  // Load now, then every minute so new assignments show up without a reload.
  useEffect(() => {
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) bellRef.current?.focus();
  }, []);

  // Close on a click outside.
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) close(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open, close]);

  // Focus the panel when it opens, so screen readers announce it.
  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  const toggle = () => {
    if (open) {
      close(false);
      return;
    }
    load();
    setOpen(true);
  };

  const unread = items.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    setItems((list) => list.map((n) => ({ ...n, is_read: true })));
    try {
      await notificationsApi.readAll();
    } catch {
      load();
    }
  };

  const openItem = async (item) => {
    close(false);
    if (!item.is_read) {
      setItems((list) => list.map((n) => (n.notification_id === item.notification_id ? { ...n, is_read: true } : n)));
      notificationsApi.read(item.notification_id).catch(load);
    }
    if (item.report_id) navigate(`/officer/reports/${item.report_id}`);
  };

  return (
    <div ref={wrapperRef} className={cx('relative', className)}>
      <IconButton
        ref={bellRef}
        icon="bell"
        label="Notifications"
        badge={unread}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={toggle}
      />

      {open && (
        <div
          ref={panelRef}
          id={panelId}
          role="dialog"
          aria-labelledby={titleId}
          tabIndex={-1}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              close();
            }
          }}
          className={cx(
            'absolute top-[calc(100%+12px)] right-0 z-[1500] flex w-[380px] max-w-[calc(100vw-16px)] flex-col gap-1',
            'rounded-rw-md border border-border-subtle bg-surface-white p-2 shadow-rw-lg focus-visible:shadow-rw-lg',
            'transition-[opacity,translate] duration-150 starting:-translate-y-1 starting:opacity-0 motion-reduce:starting:translate-y-0',
          )}
        >
          <div className="flex items-center gap-2 px-3 py-1">
            <h2 id={titleId} className="min-w-0 flex-1 type-h3 text-text-primary">
              Notifications
            </h2>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="inline-flex min-h-11 items-center rounded-rw-sm type-label text-text-blue underline underline-offset-2"
              >
                Mark all as read
              </button>
            )}
          </div>

          {error && items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-4 py-6 text-center">
              <p className="type-body-sm text-text-muted">Could not load your notifications.</p>
              <Button variant="secondary" icon="refresh" onClick={load}>
                Try again
              </Button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
              <span aria-hidden="true" className="flex size-14 items-center justify-center rounded-full bg-surface-navy-subtle">
                <Icon name="bell" size={24} className="text-text-primary" />
              </span>
              <p className="type-label text-text-primary">No notifications yet</p>
              <p className="type-body-sm text-text-muted">New assignments from the administrator appear here.</p>
            </div>
          ) : (
            <>
              <div aria-hidden="true" className="h-px bg-border-subtle" />
              <ul className="flex max-h-[60vh] flex-col gap-1 overflow-y-auto">
                {items.map((item) => (
                  <li key={item.notification_id}>
                    <button
                      type="button"
                      onClick={() => openItem(item)}
                      className={cx(
                        'flex w-full items-start gap-3 rounded-rw-sm p-4 text-left transition-colors',
                        item.is_read ? 'hover:bg-surface-light-gray' : 'bg-surface-blue-subtle hover:bg-surface-navy-subtle',
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cx(
                          'flex size-10 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-surface-white',
                          item.is_read ? 'text-text-success' : 'text-text-blue',
                        )}
                      >
                        <Icon name="user-check" size={20} />
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className={cx('type-body text-text-primary', !item.is_read && 'font-semibold')}>
                          {item.message}
                        </span>
                        <span className="type-caption text-text-muted">{formatRelative(item.created_at)}</span>
                      </span>
                      {!item.is_read && (
                        <span className="mt-2 flex shrink-0 items-center">
                          <span aria-hidden="true" className="size-2.5 rounded-full bg-brand-navy" />
                          <span className="sr-only">Unread</span>
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
              <div aria-hidden="true" className="h-px bg-border-subtle" />
              <p className="px-3 py-2 type-body-sm text-text-muted">
                Alerts for reports assigned to you. Select one to open the report.
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
