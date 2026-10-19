import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Button from './Button';
import IconButton from './IconButton';
import Logo from './Logo';
import ThemeSwitch from './ThemeSwitch';
import { cx } from '../../lib/cx';

// Signed-in header for public reporters on web (Figma 228:1396), 80 px, no sidebar.
// Links: Report an accident, My reports, Notifications (aria-current on the active one).
// Right: Light/Dark switch, bell (links to Notifications), user menu, divider, Log out.
// Below 1024 px the links collapse behind a menu button.
// userMenu: the <UserMenu> element. onLogout: the Log out action. unread: notification count.
const LINKS = [
  { to: '/report', label: 'Report an accident' },
  { to: '/my-reports', label: 'My reports' },
  { to: '/notifications', label: 'Notifications' },
];

function linkClasses({ isActive }) {
  return cx(
    'flex h-11 items-center rounded-rw-sm px-3 whitespace-nowrap text-text-primary no-underline transition-colors hover:bg-surface-light-gray',
    isActive ? 'bg-surface-navy-subtle type-label hover:bg-surface-navy-subtle' : 'type-body',
  );
}

export default function TopBarReporter({ userMenu, onLogout, unread = 0, className = '' }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  // Close the collapsed menu after navigating.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Escape closes the collapsed menu.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (event) => event.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <header className={cx('relative border-b border-border-subtle bg-surface-white', className)}>
      <div className="mx-auto flex h-16 items-center gap-2 px-2 sm:px-4 lg:h-20 lg:gap-6 lg:px-16">
        <IconButton
          icon={menuOpen ? 'x' : 'menu'}
          label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="reporter-nav-panel"
          onClick={() => setMenuOpen((v) => !v)}
          className="lg:hidden"
        />
        <Link to="/my-reports" className="rounded-rw-md">
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex gap-2">
            {LINKS.map((link) => (
              <li key={link.to}>
                <NavLink to={link.to} className={linkClasses}>
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex-1" />
        <ThemeSwitch className="max-sm:hidden" />
        <IconButton icon="bell" label="Notifications" to="/notifications" badge={unread} className="max-sm:hidden" />
        {userMenu}
        <span aria-hidden="true" className="hidden h-8 w-px bg-border-subtle lg:block" />
        <span className="hidden lg:flex">
          <Button variant="secondary" icon="log-out" onClick={onLogout}>
            Log out
          </Button>
        </span>
      </div>

      {/* Collapsed navigation (below 1024 px). */}
      {menuOpen && (
        <div
          id="reporter-nav-panel"
          className="absolute inset-x-0 top-full z-[1500] border-b border-border-subtle bg-surface-white px-4 pb-4 shadow-rw-md lg:hidden"
        >
          <nav aria-label="Main">
            <ul className="flex flex-col gap-1 pt-2">
              {LINKS.map((link) => (
                <li key={link.to}>
                  <NavLink to={link.to} className={linkClasses}>
                    {link.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-3 flex items-center gap-3 border-t border-border-subtle pt-3">
            <ThemeSwitch className="sm:hidden" />
            <div className="flex-1" />
            <Button variant="secondary" icon="log-out" onClick={onLogout}>
              Log out
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
