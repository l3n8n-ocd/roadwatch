import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button, Emblem, Icon, IconButton, Logo, ThemeSwitch } from '../components/ui';
import { publicApi } from '../api/endpoints';
import { useAuth } from '../context/AuthContext';
import { APK_URL, homePathFor } from '../lib/constants';
import { cx } from '../lib/cx';
import { ON_DARK_FOCUS, WRAP } from '../lib/publicStyles';
import { DUR, gsap, useGSAP } from '../lib/motion';

// Public shell (Figma W0 header 137:4096 and footer 138:4345, also on W10 About, W11 404, W12 500).
// Section links point at the landing sections ("/#faq"); About is its own page (/about, #40).
// The landing page scrolls to the hash itself, because client-side links do not.

const PUBLIC_NAV = [
  { label: 'How it works', hash: 'how-it-works' },
  { label: 'Public updates', hash: 'public-updates' },
  { label: 'Safety tips', hash: 'safety-tips' },
  { label: 'About', to: '/about' },
  { label: 'FAQ', hash: 'faq' },
];

function navTarget(item) {
  return item.to || { pathname: '/', hash: `#${item.hash}` };
}

function navLinkClasses(current) {
  return cx(
    'flex h-11 items-center rounded-rw-sm px-3 type-label whitespace-nowrap no-underline hover:bg-surface-light-gray',
    current ? 'text-text-blue underline underline-offset-4' : 'text-text-primary',
  );
}

function NavLinks({ pathname, onNavigate, className }) {
  return (
    <ul className={className}>
      {PUBLIC_NAV.map((item) => {
        const current = item.to === pathname;
        return (
          <li key={item.label}>
            <Link
              to={navTarget(item)}
              aria-current={current ? 'page' : undefined}
              className={navLinkClasses(current)}
              onClick={onNavigate}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function PublicHeader() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Escape closes the small-screen menu; so does moving to another page.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (event) => event.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);
  useEffect(() => setMenuOpen(false), [pathname]);

  // P3: once the page has scrolled 80 px, the sticky header gains a shadow and shrinks to 64 px.
  const [compact, setCompact] = useState(false);
  // A plain scroll listener: scroll-trigger refreshes briefly reset the scroll position while measuring.
  useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={cx(
        'sticky top-0 z-[1200] border-b border-border-subtle bg-surface-white transition-shadow duration-250 motion-reduce:transition-none',
        compact && 'shadow-rw-sm',
      )}
    >
      <div
        className={cx(
          'mx-auto flex h-16 max-w-[1440px] items-center gap-2 px-2 transition-[height] duration-250 lg:gap-8 lg:px-16 motion-reduce:transition-none',
          compact ? 'lg:h-16' : 'lg:h-20',
        )}
      >
        <IconButton
          icon={menuOpen ? 'x' : 'menu'}
          label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="public-menu"
          onClick={() => setMenuOpen((open) => !open)}
          className="size-12 lg:hidden"
        />
        <Link to="/" className="rounded-rw-md">
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden flex-1 justify-center lg:flex">
          <NavLinks pathname={pathname} className="flex gap-2" />
        </nav>
        <div className="flex-1 lg:hidden" />
        <ThemeSwitch />
        {/* A signed-in administrator gets a link back to the dashboard. */}
        {user && (
          <Button to={homePathFor(user.role)} variant="secondary" className="max-lg:hidden">
            Open dashboard
          </Button>
        )}
        {/* Wrapper: Button always sets inline-flex, so hide the wrapper on small screens. */}
        <span className="hidden lg:flex">
          <Button href={APK_URL} icon="download">
            Get the app
          </Button>
        </span>
      </div>

      {menuOpen && (
        <div
          id="public-menu"
          className="absolute inset-x-0 top-full z-[1500] border-b border-border-subtle bg-surface-white px-4 pb-4 shadow-rw-md lg:hidden"
        >
          <nav aria-label="Main">
            <NavLinks pathname={pathname} onNavigate={() => setMenuOpen(false)} className="flex flex-col gap-1 pt-2" />
          </nav>
          {user && (
            <Button to={homePathFor(user.role)} variant="secondary" fullWidth className="mt-3 h-12">
              Open dashboard
            </Button>
          )}
          <Button href={APK_URL} icon="download" fullWidth className="mt-3 h-12">
            Download the Android app
          </Button>
        </div>
      )}
    </header>
  );
}

export function PublicFooter() {
  const [hasVideo, setHasVideo] = useState(false);

  // "Watch the video" appears once PROMO_VIDEO_URL is set on the API (#48); it opens the landing's video section.
  useEffect(() => {
    let cancelled = false;
    publicApi
      .appInfo()
      .then((info) => {
        if (!cancelled) setHasVideo(Boolean(info?.promoVideo?.url));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const footerLink = cx(
    'flex min-h-11 items-center rounded-rw-sm type-label text-text-inverse underline underline-offset-2',
    ON_DARK_FOCUS,
  );
  return (
    <footer className="bg-brand-navy px-4 py-12 sm:px-8 lg:px-16">
      <div className={cx(WRAP, 'flex flex-col gap-6')}>
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-8">
          <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
            <Emblem size={120} />
            <p className="type-body text-text-inverse-muted">Safer roads through responsible reporting.</p>
          </div>
          <nav aria-label="Footer" className="max-md:hidden">
            <ul className="flex flex-wrap gap-x-6">
              {PUBLIC_NAV.map((item) => (
                <li key={item.label}>
                  <Link to={navTarget(item)} className={footerLink}>
                    {item.label}
                  </Link>
                </li>
              ))}
              {hasVideo && (
                <li>
                  <Link to="/#video" className={footerLink}>
                    Watch the video
                  </Link>
                </li>
              )}
            </ul>
          </nav>
        </div>
        <hr className="border-0 border-t border-surface-navy-hover" />
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
          <p className="min-w-0 flex-1 type-body-sm text-text-inverse-muted">
            © 2026 RoadWatch · Map data © OpenStreetMap contributors
          </p>
          <Link
            to="/staff/sign-in"
            className={cx(
              'flex h-11 items-center gap-1.5 self-start rounded-rw-sm px-1 type-caption text-text-inverse-muted underline underline-offset-2',
              ON_DARK_FOCUS,
            )}
          >
            <Icon name="lock" size={14} />
            Staff sign-in
          </Link>
        </div>
      </div>
    </footer>
  );
}

// Skip link + header + main + footer for every public page.
export default function PublicLayout({ children, mainClassName = '' }) {
  const { pathname } = useLocation();
  const mainRef = useRef(null);

  // P15: the page content fades in on each route change; the header and footer stay put.
  useGSAP(() => gsap.from(mainRef.current, { opacity: 0, duration: DUR.short, ease: 'none' }), {
    dependencies: [pathname],
  });

  return (
    <div className="flex min-h-screen flex-col bg-surface-white">
      <a
        href="#main"
        className="sr-only z-[3000] rounded-rw-sm bg-surface-white px-4 py-2 type-label text-text-primary focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to main content
      </a>
      <PublicHeader />
      <main ref={mainRef} id="main" tabIndex={-1} className={cx('flex-1 focus-visible:shadow-none', mainClassName)}>
        {children}
      </main>
      <PublicFooter />
    </div>
  );
}
