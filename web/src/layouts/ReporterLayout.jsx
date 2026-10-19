import { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Toast, TopBarReporter, UserMenu } from '../components/ui';
import { notifications } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { AboutDialog, ChangePasswordDialog, ContactSupportDialog, EditProfileDialog } from './AccountDialogs';

// Reporter web shell (Figma R5 232:6508): reporter top bar + page content. No sidebar.
// The user menu is the staff dropdown without Action log (Figma note on 228:1396).
export default function ReporterLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [unread, setUnread] = useState(0);
  const [dialog, setDialog] = useState(null); // 'profile' | 'password' | 'support' | 'about'
  const [toast, setToast] = useState('');

  // Unread count for the bell badge; refreshed on every page change.
  useEffect(() => {
    let cancelled = false;
    notifications
      .list()
      .then((data) => {
        if (!cancelled) setUnread(Number(data?.unread) || 0);
      })
      .catch(() => {
        // The badge is optional; the Notifications page shows its own error state.
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

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
      ],
    },
    {
      label: 'Help',
      items: [
        { key: 'support', label: 'Contact support', icon: 'mail', onSelect: () => setDialog('support') },
        { key: 'about', label: 'About', icon: 'info', onSelect: () => setDialog('about') },
      ],
    },
  ];

  const closeDialog = () => setDialog(null);

  return (
    <div className="flex min-h-screen flex-col bg-surface-light-gray">
      <a
        href="#main"
        className="sr-only z-[3000] rounded-rw-sm bg-surface-white px-4 py-2 type-label text-text-primary focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to main content
      </a>
      <TopBarReporter
        className="sticky top-0 z-[1100]"
        unread={unread}
        onLogout={handleLogout}
        userMenu={
          <>
            <UserMenu user={user} groups={menuGroups} className="hidden md:block" />
            <UserMenu user={user} groups={menuGroups} compact className="md:hidden" />
          </>
        }
      />
      <main id="main" tabIndex={-1} className="flex-1 focus-visible:shadow-none">
        <Outlet />
      </main>

      {dialog === 'profile' && <EditProfileDialog open onClose={closeDialog} onSaved={setToast} />}
      {dialog === 'password' && <ChangePasswordDialog open onClose={closeDialog} onSaved={setToast} />}
      {dialog === 'support' && <ContactSupportDialog open onClose={closeDialog} />}
      {dialog === 'about' && <AboutDialog open onClose={closeDialog} />}

      {toast && (
        <div className="fixed right-4 bottom-4 z-[2500]">
          <Toast type="success" title={toast} onClose={() => setToast('')} />
        </div>
      )}
    </div>
  );
}
