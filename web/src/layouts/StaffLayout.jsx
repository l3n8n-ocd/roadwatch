import { startTransition, useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Button, ConfirmDialog, Sidebar, ThemeSwitch, Toast, TopBarWeb, UserMenu, useFocusTrap } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { ROLES, homePathFor } from '../lib/constants';
import { reportCode } from '../lib/format';
import { DUR, gsap, useGSAP } from '../lib/motion';
import { ChangePasswordDialog, ContactSupportDialog, EditProfileDialog } from './AccountDialogs';

// Staff shell for Administrators and Traffic Officers (#52) (Figma W2 123:108, W5 465:18031): navy sidebar + top bar (breadcrumb, Light/Dark switch, user menu,
// Log out). Below 1024 px the sidebar becomes a drawer opened from the menu button (131:3837).

// Breadcrumb for the current route ("Reports / RW-000128", "Help / About").
function breadcrumbsFor(pathname) {
  const detail = pathname.match(/^\/admin\/reports\/(\d+)/);
  if (detail) return [{ label: 'Reports', to: '/admin/reports' }, { label: reportCode(detail[1]) }];
  const assigned = pathname.match(/^\/officer\/reports\/(\d+)/);
  if (assigned) return [{ label: 'Assigned to me', to: '/officer' }, { label: reportCode(assigned[1]) }];
  const pages = {
    '/admin': 'Dashboard',
    '/admin/reports': 'Reports',
    '/admin/users': 'Users & settings',
    '/admin/summaries': 'Summaries',
    '/officer': 'Assigned to me',
    '/demo-video': 'Demo video',
  };
  if (pathname === '/action-log') return [{ label: 'Account' }, { label: 'Action log' }];
  if (pathname === '/admin/about' || pathname === '/officer/about') return [{ label: 'Help' }, { label: 'About' }];
  return [{ label: pages[pathname] || 'RoadWatch' }];
}

export default function StaffLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const mainRef = useRef(null);

  // A6: the page content fades in on each route change; the sidebar and top bar stay put.
  useGSAP(() => gsap.from(mainRef.current, { opacity: 0, duration: DUR.short, ease: 'none' }), {
    dependencies: [pathname],
  });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dialog, setDialog] = useState(null); // 'profile' | 'password' | 'support' | 'logout'
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

  // Log out asks first (#40, Figma 347:36709); the drawer closes so the dialog is on top.
  const askLogout = () => {
    setDrawerOpen(false);
    setDialog('logout');
  };
  // Log out ends on the staff sign-in page (issue #41). One transition for both updates, so the route
  // guard never sees the signed-out user on an admin page and remembers it as the page to return to.
  const handleLogout = () => {
    setDialog(null);
    startTransition(() => {
      logout();
      navigate(user?.role === ROLES.OFFICER ? '/staff/sign-in/officer' : '/staff/sign-in/admin', { replace: true });
    });
  };

  const aboutPath = user?.role === ROLES.OFFICER ? '/officer/about' : '/admin/about';
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
        { key: 'about', label: 'About', icon: 'info', onSelect: () => navigate(aboutPath) },
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
              onLogout={askLogout}
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
            <Button variant="secondary" icon="log-out" onClick={askLogout}>
              Log out
            </Button>
          </span>
        </TopBarWeb>

        <main ref={mainRef} id="main" tabIndex={-1} className="flex-1 focus-visible:shadow-none">
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
      <ConfirmDialog
        open={dialog === 'logout'}
        onClose={closeDialog}
        onConfirm={handleLogout}
        title="Log out of RoadWatch?"
        description="You will need your email and password to sign in again. Anything you have not saved on this page will be lost."
        confirmLabel="Log out"
        confirmIcon="log-out"
      />

      {toast && (
        <div className="fixed right-4 bottom-4 z-[2500]">
          <Toast type="success" title={toast} onClose={() => setToast('')} />
        </div>
      )}
    </div>
  );
}
