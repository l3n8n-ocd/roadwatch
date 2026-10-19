import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Button, Sidebar, ThemeSwitch, Toast, TopBarWeb, UserMenu, useFocusTrap } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { ROLES, homePathFor } from '../lib/constants';
import { reportCode } from '../lib/format';
import { ChangePasswordDialog, ContactSupportDialog, EditProfileDialog } from './AccountDialogs';

// Staff shell (Figma W2 123:108): navy sidebar + top bar (breadcrumb, Light/Dark switch, user menu,
// Log out). Below 1024 px the sidebar becomes a drawer opened from the menu button (131:3837).

// Breadcrumb for the current route ("Reports / RW-000128", "Help / About").
function breadcrumbsFor(pathname) {
  const detail = pathname.match(/^\/(admin|officer)\/reports\/(\d+)/);
  if (detail) {
    const admin = detail[1] === 'admin';
    return [
      { label: admin ? 'Reports' : 'Assigned to me', to: admin ? '/admin/reports' : '/officer' },
      { label: reportCode(detail[2]) },
    ];
  }
  const pages = {
    '/admin': 'Dashboard',
    '/admin/reports': 'Reports',
    '/admin/users': 'Users & settings',
    '/admin/summaries': 'Summaries',
    '/officer': 'Assigned to me',
    '/demo-video': 'Demo video',
  };
  if (pathname === '/action-log') return [{ label: 'Account' }, { label: 'Action log' }];
  if (pathname === '/about') return [{ label: 'Help' }, { label: 'About' }];
  return [{ label: pages[pathname] || 'RoadWatch' }];
}

export default function StaffLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dialog, setDialog] = useState(null); // 'profile' | 'password' | 'support'
  const [toast, setToast] = useState('');
  const drawerRef = useRef(null);

  useFocusTrap(drawerRef, drawerOpen, () => setDrawerOpen(false));

  // Close the drawer when the route changes; hide the toast after a few seconds.
  useEffect(() => setDrawerOpen(false), [pathname]);
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(''), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const menuGroups = [
    {
      label: 'Account',
      items: [
        { key: 'profile', label: 'Edit profile', icon: 'user', onSelect: () => setDialog('profile') },
        { key: 'password', label: 'Change password', icon: 'lock', onSelect: () => setDialog('password') },
        { key: 'log', label: 'Action log', icon: 'clock', onSelect: () => navigate('/action-log') },
      ],
    },
    {
      label: 'Help',
      items: [
        { key: 'support', label: 'Contact support', icon: 'mail', onSelect: () => setDialog('support') },
        { key: 'about', label: 'About', icon: 'info', onSelect: () => navigate('/about') },
      ],
    },
  ];

  const role = user?.role || ROLES.ADMIN;
  const closeDialog = () => setDialog(null);

  return (
    <div className="flex min-h-screen bg-surface-light-gray">
      <a
        href="#main"
        className="sr-only z-[3000] rounded-rw-sm bg-surface-white px-4 py-2 type-label text-text-primary focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to main content
      </a>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen shrink-0 lg:block">
        <Sidebar role={role} pathname={pathname} />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[2000] lg:hidden">
          <div aria-hidden="true" className="absolute inset-0 bg-brand-navy/40" onClick={() => setDrawerOpen(false)} />
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="relative h-full w-66 max-w-[85vw] shadow-rw-lg"
          >
            <Sidebar
              role={role}
              pathname={pathname}
              showLogOut
              onLogout={handleLogout}
              onNavigate={() => setDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBarWeb
          breadcrumbs={breadcrumbsFor(pathname)}
          onOpenMenu={() => setDrawerOpen(true)}
          menuOpen={drawerOpen}
          homeTo={homePathFor(role)}
          className="sticky top-0 z-[1100]"
        >
          <ThemeSwitch />
          {/* Full trigger on desktop, avatar only below lg (the drawer has Log out). */}
          <UserMenu user={user} groups={menuGroups} className="hidden lg:block" />
          <UserMenu user={user} groups={menuGroups} compact className="lg:hidden" />
          <span aria-hidden="true" className="hidden h-8 w-px bg-border-subtle lg:block" />
          <span className="hidden lg:flex">
            <Button variant="secondary" icon="log-out" onClick={handleLogout}>
              Log out
            </Button>
          </span>
        </TopBarWeb>

        <main id="main" tabIndex={-1} className="flex-1 focus-visible:shadow-none">
          <Outlet />
        </main>
      </div>

      {dialog === 'profile' && (
        <EditProfileDialog open onClose={closeDialog} onSaved={setToast} />
      )}
      {dialog === 'password' && (
        <ChangePasswordDialog open onClose={closeDialog} onSaved={setToast} />
      )}
      {dialog === 'support' && <ContactSupportDialog open onClose={closeDialog} />}

      {toast && (
        <div className="fixed right-4 bottom-4 z-[2500]">
          <Toast type="success" title={toast} onClose={() => setToast('')} />
        </div>
      )}
    </div>
  );
}
