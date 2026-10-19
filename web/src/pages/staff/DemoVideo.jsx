import { useCallback, useEffect, useState } from 'react';
import { Button, EmptyState, Icon } from '../../components/ui';
import { publicApi } from '../../api/endpoints';

// Demo video (Figma: Playing 127:2829, Coming soon 127:2974). The video lives on Cloudinary and
// GET /app-info returns its URL (DEMO_VIDEO_URL on Render); it is never bundled into the web app.
// A native <video controls> gives keyboard, captions (CC) and fullscreen support for free.
// captionsUrl and transcript are optional extra fields: they show once /app-info provides them.

export default function DemoVideo() {
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

  const url = info?.demoVideoUrl;

  let content;
  if (loading) {
    content = (
      <div aria-busy="true" className="w-full max-w-240">
        <span className="sr-only">Loading the demo video…</span>
        <div aria-hidden="true" className="aspect-video w-full animate-pulse rounded-rw-md bg-surface-navy-subtle motion-reduce:animate-none" />
      </div>
    );
  } else if (error) {
    content = (
      <div className="w-full rounded-rw-md border border-border-subtle bg-surface-white px-6 py-10">
        <EmptyState
          type="error"
          title="Could not load the video"
          description={error}
          action={
            <Button variant="secondary" icon="refresh" onClick={load}>
              Try again
            </Button>
          }
        />
      </div>
    );
  } else if (!url) {
    content = (
      <div className="w-full rounded-rw-md border border-border-subtle bg-surface-white px-6 py-10 sm:py-16">
        <EmptyState
          type="video"
          title="Video coming soon"
          description="The team will publish the RoadWatch demo video here before November 2."
        />
      </div>
    );
  } else {
    content = (
      <>
        <div className="w-full max-w-240 overflow-hidden rounded-rw-md bg-brand-navy">
          <video
            controls
            preload="metadata"
            src={url}
            className="aspect-video w-full bg-brand-navy"
            aria-label="RoadWatch demo video"
          >
            {info.captionsUrl && <track kind="captions" src={info.captionsUrl} srcLang="en" label="English" default />}
            Your browser cannot play this video. <a href={url}>Download the demo video</a>.
          </video>
        </div>
        <p className="flex max-w-240 items-start gap-2 type-body-sm text-text-muted">
          <Icon name="info" size={16} className="mt-0.5" />
          <span>
            {info.captionsUrl
              ? 'Turn on captions with the CC button in the player. Space plays or pauses; the arrow keys skip.'
              : 'Captions are being prepared with the final video. Space plays or pauses; the arrow keys skip.'}
          </span>
        </p>
        {info.transcript && (
          <details className="group w-full max-w-240 rounded-rw-md border border-border-subtle bg-surface-white p-6">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 [&::-webkit-details-marker]:hidden">
              <span className="min-w-0 flex-1 type-h3 text-text-primary">Transcript</span>
              <Icon name="chevron-down" size={20} className="transition-transform group-open:rotate-180 motion-reduce:transition-none" />
            </summary>
            <p className="mt-4 type-body whitespace-pre-line text-text-primary">{info.transcript}</p>
          </details>
        )}
      </>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <h1 className="type-h1 text-text-primary">Demo video</h1>
      {url && (
        <p className="max-w-240 type-body-lg text-text-muted">
          A walkthrough of RoadWatch: reporting on mobile, review and assignment on web, and the officer closing a case.
        </p>
      )}
      {content}
    </div>
  );
}
