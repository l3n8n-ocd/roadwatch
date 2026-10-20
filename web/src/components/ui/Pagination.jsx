import Icon from './Icon';
import { cx } from '../../lib/cx';

// Table pagination (Figma 106:954), following the API's page, limit, total and pages.
// Shows first, last, current +/- 1 and "…" gaps. Current page: navy + aria-current="page".
function pageList(page, pages) {
  const wanted = new Set([1, pages, page - 1, page, page + 1]);
  if (page <= 3) [2, 3].forEach((p) => wanted.add(p));
  const sorted = [...wanted].filter((p) => p >= 1 && p <= pages).sort((a, b) => a - b);
  const list = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) list.push(`gap-${p}`);
    list.push(p);
  });
  return list;
}

const square = 'flex size-11 shrink-0 items-center justify-center rounded-rw-sm type-label';

export default function Pagination({ page, pages, total, limit, onPageChange, itemLabel = 'reports', className = '' }) {
  if (!pages || pages < 1) return null;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <nav aria-label="Pagination" className={cx('flex flex-wrap items-center gap-2', className)}>
      <p className="min-w-0 flex-1 type-body-sm text-text-muted" aria-live="polite">
        Showing {from}–{to} of {total} {itemLabel}
      </p>
      <ul className="flex items-center gap-1">
        <li>
          <button
            type="button"
            aria-label="Previous page"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className={cx(square, 'text-text-primary hover:bg-surface-navy-subtle disabled:cursor-not-allowed disabled:text-text-muted disabled:hover:bg-transparent')}
          >
            <Icon name="chevron-left" size={20} />
          </button>
        </li>
        {pageList(page, pages).map((p) =>
          typeof p === 'string' ? (
            <li key={p} aria-hidden="true" className={cx(square, 'border border-border-subtle text-text-primary')}>
              …
            </li>
          ) : (
            <li key={p}>
              <button
                type="button"
                aria-label={`Page ${p}`}
                aria-current={p === page ? 'page' : undefined}
                onClick={() => onPageChange(p)}
                className={cx(
                  square,
                  p === page
                    ? 'bg-brand-navy text-text-inverse'
                    : 'border border-border-subtle text-text-primary hover:bg-surface-navy-subtle',
                )}
              >
                {p}
              </button>
            </li>
          ),
        )}
        <li>
          <button
            type="button"
            aria-label="Next page"
            disabled={page >= pages}
            onClick={() => onPageChange(page + 1)}
            className={cx(square, 'text-text-primary hover:bg-surface-navy-subtle disabled:cursor-not-allowed disabled:text-text-muted disabled:hover:bg-transparent')}
          >
            <Icon name="chevron-right" size={20} />
          </button>
        </li>
      </ul>
    </nav>
  );
}
