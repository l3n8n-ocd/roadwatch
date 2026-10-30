import { useCallback, useEffect, useState } from 'react';
import { Button, EmptyState, Icon, VideoPlayer } from '../../components/ui';
import { publicApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../lib/constants';
import { cx } from '../../lib/cx';

// Demo video (#48; Figma: Administrator view 492:21204, Traffic Officer view 492:21788, clip coming soon 493:48058).
// One 30-second clip per web role, the viewer's own role first. The clips live on Cloudinary and
// GET /app-info returns their URLs and transcripts; they are never bundled into the web app.
// The Reporter clip is in the Android app only.
const CLIPS = {
  admin: {
    role: ROLES.ADMIN,
    title: 'Review, verify and assign a report',
    description: 'Open a new report, check the photos and map, verify it, then assign a traffic officer.',
  },
  officer: {
    role: ROLES.OFFICER,
    title: 'Work a case from your queue',
    description: 'Open an assigned report, set it to In Progress, add remarks, then mark it Resolved/Closed.',
  },
};

export default function DemoVideo() {
  const { user } = useAuth();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    publicApi
      .appInfo()
      .then((data) => {
        if (!cancelled) setInfo(data || {});
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

  const order = user?.role === ROLES.OFFICER ? ['officer', 'admin'] : ['admin', 'officer'];

  let content;
  if (error) {
    content = (
      <div className="w-full rounded-rw-md border border-border-subtle bg-surface-white px-6 py-10">
        <EmptyState
          type="error"
          title="Could not load the videos"
          description={error}
          action={
            <Button variant="secondary" icon="refresh" onClick={load}>
              Try again
            </Button>
          }
        />
      </div>
    );
  } else {
    content = (
      <div aria-busy={loading || undefined} className="grid w-full items-start gap-6 lg:grid-cols-2">
        {loading && <span className="sr-only">Loading the demo videos…</span>}
        {order.map((key) => (
          <ClipCard key={key} clip={CLIPS[key]} video={info?.demoVideos?.[key]} mine={CLIPS[key].role === user?.role} loading={loading} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <h1 className="type-h1 text-text-primary">Demo video</h1>
      <p className="max-w-240 type-body-lg text-text-muted">
        Short clips, 30 seconds each, for the two roles that use the web. Your role comes first. The Android app has the
        Reporter clip.
      </p>
      {content}
    </div>
  );
}

function Tag({ children, amber = false }) {
  return (
    <span
      className={cx(
        'inline-flex items-center rounded-full px-2.5 py-1 type-caption text-text-primary',
        amber ? 'bg-brand-amber' : 'bg-surface-navy-subtle',
      )}
    >
      {children}
    </span>
  );
}

function ClipCard({ clip, video, mine, loading }) {
  return (
    <article
      aria-labelledby={`clip-${clip.role}`}
      className="flex min-w-0 flex-col gap-4 rounded-rw-md border border-border-subtle bg-surface-white p-6"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Tag>{clip.role}</Tag>
        {mine && <Tag amber>Your role</Tag>}
        <span className="type-body-sm text-text-muted">30 seconds</span>
      </div>
      <h2 id={`clip-${clip.role}`} className="type-h3 text-text-primary">
        {clip.title}
      </h2>
      <p className="type-body text-text-muted">{clip.description}</p>
      {loading ? (
        <div aria-hidden="true" className="aspect-video w-full animate-pulse rounded-rw-md bg-surface-navy-subtle motion-reduce:animate-none" />
      ) : video?.url ? (
        <VideoPlayer src={video.url} label={`${clip.role} demo, 30 seconds`} transcript={video.transcript} />
      ) : (
        <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-rw-md bg-surface-navy-subtle p-4 text-center">
          <Icon name="play-circle" size={32} className="text-text-primary" />
          <p className="type-label text-text-primary">Clip coming soon</p>
          <p className="type-body-sm text-text-muted">The team publishes it before November&nbsp;2.</p>
        </div>
      )}
    </article>
  );
}
