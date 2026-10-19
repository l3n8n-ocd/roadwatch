import Icon from './Icon';
import { cx } from '../../lib/cx';

// Photo upload tile (Figma 101:443). state: 'empty' | 'uploading' | 'uploaded' | 'error'.
// empty: a button that calls onAdd (open the file picker there).
// uploading: progress 0-100. uploaded: src = thumbnail URL (Cloudinary or a local preview).
// error: message such as "Too large"; caption explains (e.g. "6.2 MB, max 5 MB").
export default function PhotoTile({
  state = 'empty',
  src,
  fileName = '',
  progress = 0,
  message,
  caption,
  onAdd,
  onRemove,
  className = '',
}) {
  const tileBase = 'relative flex size-26 flex-col items-center justify-center gap-1 overflow-hidden rounded-rw-md';
  let tile;

  if (state === 'empty') {
    tile = (
      <button
        type="button"
        onClick={onAdd}
        className={cx(
          tileBase,
          'border-[1.5px] border-dashed border-border-control bg-surface-white text-text-primary hover:bg-surface-light-gray',
        )}
      >
        <Icon name="camera" size={24} />
        <span className="type-label">{message || 'Add photo'}</span>
      </button>
    );
  } else if (state === 'uploading') {
    tile = (
      <div className={cx(tileBase, 'bg-surface-navy-subtle text-text-primary')}>
        <Icon name="image" size={24} />
        <div
          role="progressbar"
          aria-label={`Uploading ${fileName}`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          className="h-1.5 w-18 overflow-hidden rounded-full bg-surface-white"
        >
          <div className="h-full rounded-full bg-brand-navy" style={{ width: `${progress}%` }} />
        </div>
        <span aria-hidden="true" className="type-caption">
          {Math.round(progress)}%
        </span>
      </div>
    );
  } else if (state === 'error') {
    tile = (
      <div className={cx(tileBase, 'border-2 border-border-danger bg-surface-danger-subtle text-text-danger')}>
        <Icon name="alert-circle" size={24} />
        <span className="type-label">{message || 'Upload failed'}</span>
      </div>
    );
  } else {
    tile = (
      <div className={cx(tileBase, 'bg-linear-135 from-text-inverse-muted to-border-control')}>
        {src ? (
          <img src={src} alt={`Photo ${fileName}`} className="absolute inset-0 size-full object-cover" />
        ) : (
          <Icon name="image" size={28} className="text-text-inverse" />
        )}
        {onRemove && (
          // 48 px hit area around a 28 px navy circle.
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${fileName || 'photo'}`}
            className="group absolute top-0 right-0 flex size-12 items-center justify-center rounded-full"
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-brand-navy text-text-inverse group-hover:bg-surface-navy-hover">
              <Icon name="x" size={16} />
            </span>
          </button>
        )}
      </div>
    );
  }

  const captionText = caption ?? (state === 'empty' ? 'JPG, PNG, WebP' : fileName);

  return (
    <div className={cx('flex w-26 flex-col gap-2', className)}>
      {tile}
      {captionText && (
        <p className={cx('type-caption break-words', state === 'error' ? 'text-text-danger' : 'text-text-muted')}>
          {captionText}
        </p>
      )}
    </div>
  );
}
