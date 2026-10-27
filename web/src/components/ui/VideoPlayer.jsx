import Icon from './Icon';
import { cx } from '../../lib/cx';

// Video player with an optional transcript (#48; Figma: Demo video clip cards 492:21204, landing
// "Watch the video" 489:21200). A native <video controls> gives keyboard, captions and fullscreen for free;
// the captions are burned into the videos. tone="dark" is for the navy landing band.
export default function VideoPlayer({ src, label, transcript, tone = 'light', className = '' }) {
  const dark = tone === 'dark';
  return (
    <div className={cx('flex w-full flex-col gap-3', className)}>
      <div className={cx('w-full overflow-hidden rounded-rw-md bg-brand-navy', dark && 'border border-surface-navy-hover')}>
        <video controls preload="metadata" src={src} aria-label={label} className="aspect-video w-full bg-brand-navy">
          Your browser cannot play this video. <a href={src}>Download the video</a>.
        </video>
      </div>
      {transcript && (
        <details className="group">
          <summary
            className={cx(
              'flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-rw-sm [&::-webkit-details-marker]:hidden',
              dark ? 'text-text-inverse' : 'text-text-primary',
            )}
          >
            <span className="min-w-0 flex-1 type-label">Transcript</span>
            <Icon name="chevron-down" size={20} className="transition-transform group-open:rotate-180 motion-reduce:transition-none" />
          </summary>
          <p className={cx('mt-2 type-body', dark ? 'text-text-inverse-muted' : 'text-text-primary')}>{transcript}</p>
        </details>
      )}
    </div>
  );
}
