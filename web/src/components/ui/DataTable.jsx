import Icon from './Icon';
import { cx } from '../../lib/cx';

// Report table (Figma 101:401): navy-subtle header, 64 px rows, hover, selected and focus states.
//
// columns: [{ key, header, className?, render?(row) }]  (render defaults to row[key])
// onRowClick(row): makes every row focusable; Enter or Space opens it, and a chevron shows.
// selectedKey: the getRowKey(row) value of the selected row (aria-selected).
// caption: describes the table for screen readers (visually hidden).
export default function DataTable({
  columns,
  rows,
  getRowKey = (row) => row.id,
  onRowClick,
  selectedKey,
  caption,
  className = '',
}) {
  const clickable = Boolean(onRowClick);

  const handleKeyDown = (event, row) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onRowClick(row);
    }
  };

  return (
    <div className={cx('w-full overflow-x-auto', className)}>
      <table className="w-full border-separate border-spacing-0 text-left">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th
                key={col.key}
                scope="col"
                className={cx(
                  'h-11 bg-surface-navy-subtle px-4 type-label whitespace-nowrap text-text-primary',
                  i === 0 && 'rounded-l-rw-sm',
                  !clickable && i === columns.length - 1 && 'rounded-r-rw-sm',
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
            {clickable && (
              <th scope="col" className="w-11 rounded-r-rw-sm bg-surface-navy-subtle">
                <span className="sr-only">Open</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const key = getRowKey(row);
            const selected = selectedKey != null && key === selectedKey;
            return (
              <tr
                key={key}
                tabIndex={clickable ? 0 : undefined}
                aria-selected={selectedKey != null ? selected : undefined}
                onClick={clickable ? () => onRowClick(row) : undefined}
                onKeyDown={clickable ? (event) => handleKeyDown(event, row) : undefined}
                className={cx(
                  'type-body-sm text-text-primary transition-colors',
                  selected ? 'bg-surface-blue-subtle' : 'bg-surface-white',
                  clickable && 'cursor-pointer hover:bg-surface-light-gray',
                  // Table rows do not always paint box-shadow, so focus also gets an outline.
                  'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-border-focus',
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cx('h-16 border-b border-border-subtle px-4 py-2', col.className)}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
                {clickable && (
                  <td className="w-11 border-b border-border-subtle px-3">
                    <Icon name="chevron-right" size={20} />
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
