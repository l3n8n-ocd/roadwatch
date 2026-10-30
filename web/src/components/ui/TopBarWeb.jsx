import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import IconButton from './IconButton';
import Logo from './Logo';
import { cx } from '../../lib/cx';

// Staff top bar (Figma 105:665). Desktop (lg and up): 72 px, breadcrumb on the left.
// Responsive (below lg): 64 px with a menu button that opens the sidebar drawer, then the Logo.
// breadcrumbs: [{ label, to? }] (the last one is the current page).
// children: the right-hand actions (theme switch, user menu, Log out...).
export default function TopBarWeb({ breadcrumbs = [], onOpenMenu, menuOpen = false, homeTo = '/', children, className = '', ...rest }) {
  return (
    <header
      {...rest}
      className={cx(
        'flex h-16 items-center gap-2 border-b border-border-subtle bg-surface-white px-2 lg:h-18 lg:gap-3 lg:px-10',
        className,
      )}
    >
      {onOpenMenu && (
        <IconButton
          icon="menu"
          label="Open menu"
          aria-expanded={menuOpen}
          onClick={onOpenMenu}
          className="lg:hidden"
        />
      )}
      <Link to={homeTo} className="rounded-rw-md lg:hidden">
        {/* Below 420 px only the emblem tile shows, so an officer's bell and avatar still fit at 390 px. */}
        <Logo className="max-[419px]:[&>span:last-child]:hidden" />
      </Link>

      <nav aria-label="Breadcrumb" className="hidden min-w-0 lg:block">
        <ol className="flex items-center gap-2 type-body-sm text-text-muted">
          {breadcrumbs.map((crumb, i) => {
            const last = i === breadcrumbs.length - 1;
            return (
              <Fragment key={`${crumb.label}-${i}`}>
                {i > 0 && (
                  <li aria-hidden="true" className="px-1">
                    /
                  </li>
                )}
                <li className="truncate">
                  {crumb.to && !last ? (
                    <Link to={crumb.to} className="rounded-rw-sm text-text-muted underline-offset-2 hover:underline">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span aria-current={last ? 'page' : undefined}>{crumb.label}</span>
                  )}
                </li>
              </Fragment>
            );
          })}
        </ol>
      </nav>

      <div className="flex-1" />
      {children}
    </header>
  );
}
