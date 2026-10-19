import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { Marker, useMap } from 'react-leaflet';
import {
  Button,
  EmptyState,
  Emblem,
  Icon,
  IconButton,
  Logo,
  MapView,
  RecordBadge,
  Skeleton,
  StatusChip,
  Timeline,
  TimelineItem,
} from '../../components/ui';
import { publicApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { HOTLINES, ROLES, homePathFor } from '../../lib/constants';
import { formatDate } from '../../lib/format';
import { cx } from '../../lib/cx';
import heroStreet from '../../assets/images/hero-street.jpg';

// W0 Public landing (Figma 137:4095, 390: 139:4275; #24). Browsing is public; reporting and
// tracking need a reporter account (/report and /my-reports are guarded and send visitors to
// /sign-in). "Staff sign-in" in the footer is a discreet link to the staff role chooser (#28).

// Optional link to the release APK (GitHub Actions on tag v*). Hidden until it is set.
const APK_URL = import.meta.env.VITE_APK_URL;

const SECTIONS = [
  { id: 'how-it-works', label: 'How it works' },
  { id: 'public-updates', label: 'Public updates' },
  { id: 'safety-tips', label: 'Safety tips' },
  { id: 'about', label: 'About' },
];

const STEPS = [
  {
    icon: 'send',
    title: 'Submit a report',
    text: 'Describe the accident, pin the location on the map or use GPS, and attach up to 5 photos.',
  },
  {
    icon: 'shield-check',
    title: 'Report verification',
    text: 'An administrator reviews and verifies it, then assigns a traffic officer to follow it up.',
  },
  {
    icon: 'bell',
    title: 'Track progress',
    text: 'Every status change appears in your timeline and as a notification in the app.',
  },
];

const TIPS = [
  {
    icon: 'car',
    title: 'Observe speed limits',
    text: 'Adjust your speed to road and weather conditions, especially on wet roads in the rainy season.',
  },
  {
    icon: 'eye',
    title: 'Avoid distractions',
    text: 'Do not use a phone while driving. Pull over first if you need to report something.',
  },
  {
    icon: 'shield-check',
    title: 'Keep a safe distance',
    text: 'Leave enough room to react safely, around three seconds behind the vehicle ahead.',
  },
  {
    icon: 'alert-triangle',
    title: 'Stay safe near an incident',
    text: 'Keep away from moving traffic, switch on hazard lights, and call 911 when someone is hurt.',
  },
];

const SUPPORTS = [
  'Accident reporting from the web and the Android app',
  'GPS or manually selected accident location',
  'Photo evidence (up to 5 photos per upload)',
  'Status tracking with alerts at every change',
  'Review and management by authorized staff',
  'A clear line between public submissions and verified records',
];

// Shared layout classes: full-bleed section, content capped at the 1440 frame's inner width.
const SECTION = 'px-4 py-12 sm:px-8 lg:px-16 lg:py-20';
const WRAP = 'mx-auto w-full max-w-[1312px]';
// Links on navy use the amber focus ring (Figma Focus/ring on dark).
const ON_DARK_FOCUS = 'focus-visible:shadow-(--rw-shadow-focus-on-dark)';

export default function Landing() {
  const { user } = useAuth();
  const [demoVideoUrl, setDemoVideoUrl] = useState(null);

  // The demo video link in the footer appears once DEMO_VIDEO_URL is set on the API.
  useEffect(() => {
    let cancelled = false;
    publicApi
      .appInfo()
      .then((info) => {
        if (!cancelled) setDemoVideoUrl(info?.demoVideoUrl || null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-surface-white">
      <a
        href="#main"
        className="sr-only z-[3000] rounded-rw-sm bg-surface-white px-4 py-2 type-label text-text-primary focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to main content
      </a>
      <LandingHeader user={user} />
      <main id="main" tabIndex={-1} className="flex-1 focus-visible:shadow-none">
        <Hero />
        <HowItWorks />
        <PublicUpdates />
        <SafetyTips />
        <About />
        <ClosingCta />
      </main>
      <LandingFooter demoVideoUrl={demoVideoUrl} />
    </div>
  );
}

/* ---------- Header ---------- */

function sectionLinkClasses(extra = '') {
  return cx(
    'flex h-11 items-center rounded-rw-sm px-3 type-label whitespace-nowrap text-text-primary no-underline hover:bg-surface-light-gray',
    extra,
  );
}

function LandingHeader({ user }) {
  const [menuOpen, setMenuOpen] = useState(false);

  // Escape closes the small-screen menu.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (event) => event.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  // Signed-in visitors get a link back to their own area instead of "Log in".
  const account = user
    ? { to: homePathFor(user.role), label: user.role === ROLES.REPORTER ? 'My reports' : 'Open dashboard' }
    : { to: '/sign-in', label: 'Log in' };

  return (
    <header className="relative border-b border-border-subtle bg-surface-white">
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-2 px-2 lg:h-20 lg:gap-8 lg:px-16">
        <IconButton
          icon={menuOpen ? 'x' : 'menu'}
          label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="landing-menu"
          onClick={() => setMenuOpen((open) => !open)}
          className="size-12 lg:hidden"
        />
        <Link to="/" className="rounded-rw-md">
          <Logo />
        </Link>
        <nav aria-label="Sections" className="hidden flex-1 justify-center lg:flex">
          <ul className="flex gap-2">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`} className={sectionLinkClasses()}>
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex-1 lg:hidden" />
        <Button to={account.to} variant="secondary" className="max-lg:h-12 max-lg:px-4">
          {account.label}
        </Button>
        {/* Wrapper: Button always sets inline-flex, so hide the wrapper on small screens. */}
        <span className="hidden lg:flex">
          <Button to="/report" icon="alert-triangle">
            Report an accident
          </Button>
        </span>
      </div>

      {menuOpen && (
        <div
          id="landing-menu"
          className="absolute inset-x-0 top-full z-[1500] border-b border-border-subtle bg-surface-white px-4 pb-4 shadow-rw-md lg:hidden"
        >
          <nav aria-label="Sections">
            <ul className="flex flex-col gap-1 pt-2">
              {SECTIONS.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className={sectionLinkClasses()} onClick={() => setMenuOpen(false)}>
                    {section.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <Button to="/report" icon="alert-triangle" fullWidth className="mt-3 h-12">
            Report an accident
          </Button>
        </div>
      )}
    </header>
  );
}

/* ---------- Hero ---------- */

function Hero() {
  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden bg-brand-navy px-4 py-10 sm:px-8 lg:px-16 lg:py-20"
    >
      <img src={heroStreet} alt="" className="absolute inset-0 -z-10 size-full object-cover opacity-15" />
      <div className={cx(WRAP, 'flex items-center gap-16')}>
        <div className="flex min-w-0 flex-1 flex-col items-start gap-6">
          <p className="type-overline text-text-accent uppercase">Safer roads start with you</p>
          <h1 id="hero-title" className="type-display text-text-inverse lg:type-hero">
            See an accident? Help make the road safer.
          </h1>
          <p className="type-body text-text-inverse-muted sm:type-body-lg">
            Report road accidents everywhere, with the location and photos, then follow every status change
            <span className="max-sm:hidden"> until a traffic officer closes the case</span>.
          </p>
          <div className="flex w-full flex-col items-start gap-4 sm:w-auto sm:flex-row sm:items-center">
            <Button to="/report" variant="secondary" icon="alert-triangle" className="max-sm:h-12 max-sm:w-full">
              Report an accident
            </Button>
            <Link
              to="/my-reports"
              className={cx('flex h-11 items-center rounded-rw-sm px-2 type-button text-text-inverse underline underline-offset-2 max-sm:px-0', ON_DARK_FOCUS)}
            >
              Track my report
            </Link>
          </div>
          {APK_URL && (
            <a
              href={APK_URL}
              className={cx('flex min-h-11 items-center rounded-rw-sm type-label text-text-inverse underline underline-offset-2', ON_DARK_FOCUS)}
            >
              Get the Android app (APK)
            </a>
          )}
          <p className="flex w-full items-center gap-3 rounded-rw-md bg-brand-amber px-4 py-3 type-label text-text-primary sm:w-auto">
            <Icon name="alert-triangle" size={20} />
            <span>
              Someone hurt or in danger?{' '}
              <a href={HOTLINES.emergency.tel} className="rounded-rw-sm underline underline-offset-2">
                Call 911
              </a>{' '}
              first<span className="max-sm:hidden">, then report</span>.
            </span>
          </p>
          <p className="type-body-sm text-text-inverse-muted max-sm:hidden">
            Browsing is open to everyone. Reporting and tracking need a free account, so you can follow your report.
          </p>
        </div>
        <ProductPreview />
      </div>
    </section>
  );
}

// Decorative preview of what reporters see (hidden from assistive tech, Figma note).
function ProductPreview() {
  return (
    <div
      aria-hidden="true"
      className="hidden w-[440px] shrink-0 flex-col gap-4 rounded-rw-md bg-surface-white p-6 shadow-rw-lg lg:flex"
    >
      <p className="type-overline text-text-blue uppercase">What reporters see</p>
      <div className="flex flex-col gap-3 rounded-rw-md border border-border-subtle bg-surface-white p-4 text-text-primary shadow-rw-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="type-label text-text-muted">RW-000128</span>
          <StatusChip status="Assigned" />
        </div>
        <div className="flex items-center gap-2">
          <span className="min-w-0 flex-1 type-h3">Collision</span>
          <Icon name="chevron-right" size={20} />
        </div>
        <span className="flex items-center gap-2 type-body-sm text-text-muted">
          <Icon name="map-pin" size={16} className="text-text-primary" />
          MacArthur Hwy, Malolos
        </span>
        <span className="flex items-center gap-2 type-body-sm text-text-muted">
          <Icon name="calendar" size={16} className="text-text-primary" />
          Oct 17, 2026 · 08:15
        </span>
      </div>
      <Timeline>
        <TimelineItem
          status="Assigned"
          current
          meta="Today · 09:30 · Administrator"
          remarks="A traffic officer is on the way."
        />
        <TimelineItem status="Under Review" meta="Today · 09:02 · Administrator" />
        <TimelineItem status="Submitted" meta="Today · 08:42 · You" last />
      </Timeline>
    </div>
  );
}

/* ---------- How it works ---------- */

function SectionHeading({ id, title, children }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 id={id} className="type-h2 text-text-primary sm:type-h1">
        {title}
      </h2>
      {children && <p className="type-body text-text-muted sm:type-body-lg">{children}</p>}
    </div>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className={cx(SECTION, 'scroll-mt-4 bg-surface-light-gray')}>
      <div className={cx(WRAP, 'flex flex-col gap-6 lg:gap-10')}>
        <SectionHeading id="how-title" title="How RoadWatch works">
          Three steps from the roadside to a closed case.
        </SectionHeading>
        <ol className="grid gap-6 md:grid-cols-3 md:gap-0">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-4 md:flex-col md:pr-8">
              <div className="flex shrink-0 items-center md:w-full" aria-hidden="true">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-navy type-label text-text-inverse md:size-14 md:type-h2">
                  {index + 1}
                </span>
                {index < STEPS.length - 1 && <span className="hidden h-0.5 flex-1 bg-border-control md:block" />}
              </div>
              <div className="flex min-w-0 flex-col gap-1 md:gap-4">
                <h3 className="flex items-center gap-2 type-h3 text-text-primary">
                  <Icon name={step.icon} size={24} className="max-md:hidden" />
                  <span>
                    <span className="sr-only">Step {index + 1}: </span>
                    {step.title}
                  </span>
                </h3>
                <p className="type-body text-text-primary">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ---------- Public road updates (GET /public/updates, #23) ---------- */

// Pin for verified records: navy teardrop with an amber center, colored by theme variables.
const UPDATE_PIN = L.divIcon({
  className: '',
  iconSize: [32, 40],
  iconAnchor: [16, 38],
  html: `<svg width="32" height="40" viewBox="0 0 40 48" aria-hidden="true" focusable="false">
    <path d="M20 46C20 46 36 30.5 36 18C36 9.16 28.84 2 20 2C11.16 2 4 9.16 4 18C4 30.5 20 46 20 46Z"
      style="fill: var(--rw-brand-navy); stroke: var(--rw-text-inverse); stroke-width: 2" />
    <circle cx="20" cy="18" r="7" style="fill: var(--rw-brand-amber)" />
  </svg>`,
});

// Frames every pin on the map once the updates arrive.
function FitToPins({ points }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 1) map.setView(points[0], 14);
    else if (points.length > 1) map.fitBounds(points, { padding: [40, 40] });
  }, [map, points]);
  return null;
}

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia?.(query).matches ?? true);
  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return undefined;
    const onChange = () => setMatches(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return matches;
}

// The endpoint may answer with an array or { updates: [...] }.
function toList(data) {
  if (Array.isArray(data)) return data;
  return data?.updates || data?.items || [];
}

function typeName(update) {
  return update.accident_type?.type_name || update.accident_type || 'Accident';
}

function PublicUpdates() {
  const [state, setState] = useState({ status: 'loading', updates: [] });
  const [expanded, setExpanded] = useState(false);
  const wide = useMediaQuery('(min-width: 768px)');

  useEffect(() => {
    let cancelled = false;
    publicApi
      .updates()
      .then((data) => {
        if (!cancelled) setState({ status: 'ready', updates: toList(data) });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error', updates: [] });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const { status, updates } = state;
  const points = useMemo(
    () =>
      updates
        .filter((u) => u.latitude != null && u.longitude != null)
        .map((u) => [Number(u.latitude), Number(u.longitude)]),
    [updates],
  );
  // Small screens show two records and hide the map until "See all updates on the map".
  const showAll = wide || expanded;
  const visible = showAll ? updates : updates.slice(0, 2);
  const canExpand = !wide && (updates.length > 2 || points.length > 0);

  return (
    <section id="public-updates" aria-labelledby="updates-title" className={cx(SECTION, 'scroll-mt-4 bg-surface-white')}>
      <div className={cx(WRAP, 'flex flex-col gap-6 lg:gap-8')}>
        <SectionHeading id="updates-title" title="Public road updates">
          <span className="max-sm:hidden">
            Verified accident records from the last 7 days. Only verified records are shown here, never unverified
            public submissions or anyone&apos;s contact details.
          </span>
          <span className="sm:hidden">Verified records from the last 7 days. No contact details are ever shown.</span>
        </SectionHeading>

        {status === 'loading' && (
          <div aria-busy="true" className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <span className="sr-only">Loading public road updates…</span>
            <Skeleton />
            <Skeleton className="max-md:hidden" />
            <Skeleton className="max-lg:hidden" />
          </div>
        )}

        {status === 'error' && (
          <EmptyState
            icon="map"
            title="Road updates are not available yet"
            description="Verified accident records will appear here once they are published. You can still report an accident or track your reports."
          />
        )}

        {status === 'ready' && updates.length === 0 && (
          <EmptyState
            icon="shield-check"
            title="No verified records this week"
            description="No accident record was verified in the last 7 days."
          />
        )}

        {status === 'ready' && updates.length > 0 && (
          <div className="flex flex-col gap-4">
            <div className="grid items-start gap-6 lg:grid-cols-[560px_1fr] lg:gap-8">
              {showAll && points.length > 0 && (
                <MapView label="Map of verified road updates. The list of records carries the same information." zoom={12}>
                  {points.map((point, index) => (
                    <Marker key={`${point[0]}-${point[1]}-${index}`} position={point} icon={UPDATE_PIN} keyboard={false} />
                  ))}
                  <FitToPins points={points} />
                </MapView>
              )}
              <ul aria-label="Verified records" className={cx('flex flex-col gap-4', points.length === 0 && 'lg:col-span-2')}>
                {visible.map((update) => (
                  <li
                    key={update.report_id}
                    className="flex flex-col gap-2 rounded-rw-md border border-border-subtle bg-surface-white p-4 sm:p-5"
                  >
                    <div className="flex flex-wrap gap-2">
                      <RecordBadge type="verified_record" />
                      {update.report_status && <StatusChip status={update.report_status} />}
                    </div>
                    <h3 className="type-h3 text-text-primary">
                      {typeName(update)} · {update.accident_location}
                    </h3>
                    <p className="flex items-center gap-2 type-body-sm text-text-muted">
                      <Icon name="calendar" size={16} className="text-text-primary" />
                      <span>
                        <span className="sr-only">Accident date: </span>
                        {formatDate(update.accident_date)}
                      </span>
                    </p>
                  </li>
                ))}
              </ul>
            </div>
            {canExpand && (
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setExpanded((open) => !open)}
                className="flex min-h-11 items-center self-start rounded-rw-sm type-label text-text-blue underline underline-offset-2"
              >
                {expanded ? 'Show fewer updates' : 'See all updates on the map'}
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

/* ---------- Safety tips + emergency card ---------- */

function SafetyTips() {
  const onDarkLink = cx('rounded-rw-sm text-text-inverse underline underline-offset-2', ON_DARK_FOCUS);
  return (
    <section id="safety-tips" aria-labelledby="tips-title" className={cx(SECTION, 'scroll-mt-4 bg-surface-light-gray')}>
      <div className={cx(WRAP, 'grid items-start gap-8 lg:grid-cols-[1fr_420px] lg:gap-16')}>
        <div className="flex min-w-0 flex-col gap-4 lg:gap-8">
          <SectionHeading id="tips-title" title="Road safety tips">
            Road safety starts with awareness. Follow traffic rules, avoid distracted driving and keep a safe distance.
          </SectionHeading>
          <ul>
            {TIPS.map((tip) => (
              <li key={tip.title} className="flex items-start gap-4 border-b border-border-subtle py-4 sm:gap-5 sm:py-5">
                <span
                  aria-hidden="true"
                  className="flex size-12 shrink-0 items-center justify-center rounded-rw-md border border-border-subtle bg-surface-white text-text-primary"
                >
                  <Icon name={tip.icon} size={24} />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1 text-text-primary">
                  <h3 className="type-h3">{tip.title}</h3>
                  <p className="type-body">{tip.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <aside aria-labelledby="emergency-title" className="flex flex-col gap-4 rounded-rw-md bg-brand-navy p-6 sm:p-10">
          <p className="type-overline text-text-accent uppercase">In an emergency</p>
          <h3 id="emergency-title" className="type-h1 text-text-inverse">
            <a href={HOTLINES.emergency.tel} className={onDarkLink}>
              Call 911
            </a>
          </h3>
          <p className="type-body text-text-inverse-muted">
            Philippine National Emergency Hotline, free from any phone. Police (PNP):{' '}
            <a href={HOTLINES.pnp[0].tel} className={onDarkLink}>
              {HOTLINES.pnp[0].number}
            </a>{' '}
            · Fire (BFP):{' '}
            <a href={HOTLINES.bfp[0].tel} className={onDarkLink}>
              {HOTLINES.bfp[0].number}
            </a>
            . Get help first, then report the accident here.
          </p>
        </aside>
      </div>
    </section>
  );
}

/* ---------- About ---------- */

function About() {
  return (
    <section id="about" aria-labelledby="about-title" className={cx(SECTION, 'scroll-mt-4 bg-surface-white')}>
      <div className={cx(WRAP, 'grid items-start gap-8 lg:grid-cols-2 lg:gap-16')}>
        <div className="flex flex-col gap-4">
          <h2 id="about-title" className="type-h2 text-text-primary sm:type-h1">
            About RoadWatch
          </h2>
          <p className="type-body text-text-primary sm:type-body-lg">
            RoadWatch is a web and mobile road accident reporting system made by BSIT 3I-G1 students at Bulacan State
            University for IT 305 Advanced Web Development. It makes it easier for the public to submit accident
            information, and helps administrators and traffic officers review, verify and manage every report in one
            place.
          </p>
          <p className="type-body-sm text-text-muted">A student project. It does not replace official emergency services.</p>
        </div>
        <div className="flex flex-col gap-4 rounded-rw-md bg-surface-light-gray p-6 sm:p-8">
          <h3 className="type-h3 text-text-primary">What RoadWatch supports</h3>
          <ul className="flex flex-col gap-4">
            {SUPPORTS.map((item) => (
              <li key={item} className="flex items-center gap-3 type-body text-text-primary">
                <Icon name="check-circle" size={20} className="text-text-success" />
                <span className="min-w-0 flex-1">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* ---------- Closing call to action ---------- */

function ClosingCta() {
  return (
    <section aria-labelledby="cta-title" className="bg-surface-navy-subtle px-4 py-10 sm:px-8 lg:px-16 lg:py-14">
      <div className={cx(WRAP, 'flex flex-col gap-6 md:flex-row md:items-center md:gap-8')}>
        <div className="flex min-w-0 flex-1 flex-col gap-2 text-text-primary">
          <h2 id="cta-title" className="type-h2">
            Need to report an accident?
          </h2>
          <p className="type-body max-sm:hidden">
            Log in to open the report form and your report history. New here? Creating an account takes a minute.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-8">
          <Button to="/register" variant="secondary" className="max-sm:h-12">
            Create an account
          </Button>
          <Button to="/report" className="max-sm:h-12">
            Log in to report
          </Button>
        </div>
      </div>
    </section>
  );
}

/* ---------- Footer ---------- */

function LandingFooter({ demoVideoUrl }) {
  const footerLink = cx('flex min-h-11 items-center rounded-rw-sm type-label text-text-inverse underline underline-offset-2', ON_DARK_FOCUS);
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
              {SECTIONS.map((section) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className={footerLink}>
                    {section.label}
                  </a>
                </li>
              ))}
              {demoVideoUrl && (
                <li>
                  <a href={demoVideoUrl} target="_blank" rel="noreferrer" className={footerLink}>
                    Demo video<span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              )}
            </ul>
          </nav>
        </div>
        <hr className="border-0 border-t border-surface-navy-hover" />
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
          <p className="min-w-0 flex-1 type-body-sm text-text-inverse-muted">
            <span className="max-md:hidden">IT 305 · BSIT 3I-G1 · Bulacan State University · 2026 · </span>
            Map data © OpenStreetMap contributors
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
