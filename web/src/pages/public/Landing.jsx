import { Fragment, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import L from 'leaflet';
import { Marker, useMap } from 'react-leaflet';
import {
  Button,
  EmptyState,
  Icon,
  FullScreenMap,
  MapView,
  RecordBadge,
  Skeleton,
  StatusChip,
  Timeline,
  TimelineItem,
} from '../../components/ui';
import { publicApi } from '../../api/endpoints';
import PublicLayout from '../../layouts/PublicLayout';
import { APK_URL, HOTLINES, SUPPORT_EMAIL, SUPPORT_MAILTO } from '../../lib/constants';
import { formatDate } from '../../lib/format';
import { cx } from '../../lib/cx';
import { ON_DARK_FOCUS, SECTION, WRAP } from '../../lib/publicStyles';
import useReveals from '../../lib/useReveals';
import { DUR, EASE, MQ, countTo, gsap, onEnter, reveal, useGSAP } from '../../lib/motion';
import HeroRoad from './HeroRoad';
import useLandingMotion from './useLandingMotion';
import heroStreet from '../../assets/images/hero-street.jpg';
import pnpSeal from '../../assets/images/pnp-seal.png';
import bfpSeal from '../../assets/images/bfp-seal.png';

// W0 Public landing (Figma 137:4095, 390: 139:4275; #24, updated for #36 and #40). Browsing is public.
// Reporters and Traffic Officers use the Android app, so the calls to action download the APK.
// Header and footer live in PublicLayout; "Staff sign-in" in the footer leads to the Administrator sign-in.

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
  'Accident reporting from the Android app, with GPS location and photos',
  'GPS or manually selected accident location',
  'Photo evidence (up to 5 photos per upload)',
  'Status tracking with alerts at every change',
  'Review and management by authorized staff',
  'A clear line between public submissions and verified records',
];

// FAQ (#40), drafted from the real rules. Phones show the first FAQ_PREVIEW, then a "Show more" button.
const FAQ = [
  {
    q: 'Do I need an account to report an accident?',
    a: 'Yes. Reporting happens in the free RoadWatch Android app, where you create a reporter account. Browsing this website needs no account.',
  },
  {
    q: 'Someone is hurt. What should I do first?',
    a: 'Call 911 first. RoadWatch is not an emergency service, so report the accident once everyone is safe.',
  },
  {
    q: 'What goes into a report?',
    a: 'The date and time, the location (GPS or a pin on the map), the accident type, injury information and a short description. Photos are optional.',
  },
  {
    q: 'How do I know what happened to my report?',
    a: 'Open My reports in the app. Each report shows its status, from Submitted to Resolved/Closed, and you get a notification when it changes.',
  },
  {
    q: 'Who can see my name and phone number?',
    a: 'Only RoadWatch administrators and the traffic officer assigned to your report. Public road updates never show reporter details.',
  },
  {
    q: 'Public report or verified record: what is the difference?',
    a: 'Every new report starts as a public submission. It becomes a verified accident record only after an administrator checks it.',
  },
  {
    q: 'How do traffic officers get an account?',
    a: 'The RoadWatch administrator creates traffic officer accounts. Officers then sign in on the same Android app.',
  },
  { q: 'Is there an iPhone app?', a: 'Not yet. RoadWatch is a free Android app (APK) for now.' },
];
const FAQ_PREVIEW = 4;

// Stats bar (#40): live totals from GET /public/stats.
const STATS = [
  { key: 'reports_received', label: 'Reports received', icon: 'file-text' },
  { key: 'verified_records', label: 'Verified accident records', icon: 'shield-check' },
  { key: 'cases_resolved', label: 'Cases resolved', icon: 'check-circle' },
  { key: 'active_officers', label: 'Active traffic officers', icon: 'users' },
];

const HEADLINE = 'See an accident? Help make the road safer.';

export default function Landing() {
  const { hash, key } = useLocation();
  const rootRef = useRef(null);
  // Motion (#41): generic scroll reveals plus the landing's own sequences (hero, steps, FAQ...).
  useReveals(rootRef);
  useLandingMotion(rootRef);

  // Links such as "/#faq" (header, footer, other pages) scroll here once the section exists.
  // Sections below move down when the stats and road updates arrive, so line up again once they settle.
  useEffect(() => {
    if (!hash) return undefined;
    const scroll = () => document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView({ block: 'start' });
    scroll();
    const timer = setTimeout(scroll, 600);
    return () => clearTimeout(timer);
  }, [hash, key]);

  return (
    <PublicLayout>
      <div ref={rootRef}>
        <Hero />
        <StatsBar />
        <HowItWorks />
        <PublicUpdates />
        <SafetyTips />
        <About />
        <Faq />
        <ClosingCta />
      </div>
    </PublicLayout>
  );
}

/* ---------- Hero ---------- */

function Hero() {
  return (
    <section
      data-hero
      aria-labelledby="hero-title"
      className="relative isolate overflow-hidden bg-brand-navy px-4 pt-10 pb-[72px] sm:px-8 lg:px-16 lg:py-20"
    >
      {/* Taller than the hero so the scroll parallax (P2) never shows an edge. */}
      <img
        data-hero-photo
        src={heroStreet}
        alt=""
        className="absolute inset-x-0 top-0 -z-10 h-[115%] w-full object-cover opacity-15"
      />
      <div className={cx(WRAP, 'relative flex items-center gap-16')}>
        <div className="flex min-w-0 flex-1 flex-col items-start gap-6">
          <p data-hero-fade className="type-overline text-text-accent uppercase">
            Safer roads start with you
          </p>
          {/* Words are wrapped so they can rise one after another (P1); the text reads as one heading. */}
          <h1 id="hero-title" className="type-display text-text-inverse lg:type-hero">
            {HEADLINE.split(' ').map((word, index) => (
              <Fragment key={index}>
                {index > 0 && ' '}
                <span data-hero-word className="inline-block">
                  {word}
                </span>
              </Fragment>
            ))}
          </h1>
          <p data-hero-fade className="type-body text-text-inverse-muted sm:type-body-lg">
            Report road accidents everywhere, with the location and photos, then follow every status change
            <span className="max-sm:hidden"> until a traffic officer closes the case</span>.
          </p>
          <div data-hero-fade className="flex w-full flex-col items-start gap-4 sm:w-auto sm:flex-row sm:items-center">
            <Button href={APK_URL} variant="secondary" icon="download" className="max-sm:h-12 max-sm:w-full">
              Download the Android app
            </Button>
            <a
              href="#how-it-works"
              className={cx('flex h-11 items-center rounded-rw-sm px-2 type-button text-text-inverse underline underline-offset-2 max-sm:px-0', ON_DARK_FOCUS)}
            >
              See how it works
            </a>
          </div>
          <p data-hero-fade className="type-body-sm text-text-inverse-muted max-sm:hidden">
            Free Android app (APK). Reporters and traffic officers use the app; this website is for browsing and for
            administrators.
          </p>
          <p
            data-hero-fade
            className="flex w-full items-center gap-3 rounded-rw-md bg-brand-amber px-4 py-3 type-label text-text-primary sm:w-auto"
          >
            <Icon name="alert-triangle" size={20} />
            <span>
              Someone hurt or in danger?{' '}
              <a href={HOTLINES.emergency.tel} className="rounded-rw-sm underline underline-offset-2">
                Call 911
              </a>{' '}
              first<span className="max-sm:hidden">, then report</span>.
            </span>
          </p>
          <p data-hero-fade className="type-body-sm text-text-inverse-muted max-sm:hidden">
            Browsing is open to everyone. Reporting and tracking happen in the RoadWatch mobile app with a free account.
          </p>
        </div>
        <ProductPreview />
        <HeroRoad />
      </div>
    </section>
  );
}

// Decorative preview of what reporters see (hidden from assistive tech, Figma note).
function ProductPreview() {
  return (
    <div
      data-hero-card
      aria-hidden="true"
      className="relative z-10 hidden w-[440px] shrink-0 flex-col gap-4 rounded-rw-md bg-surface-white p-6 shadow-rw-lg lg:flex"
    >
      <p className="type-overline text-text-blue uppercase">What reporters see in the app</p>
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

/* ---------- Stats bar (GET /public/stats, #40) ---------- */

const numberFormat = new Intl.NumberFormat('en-PH');

function StatsBar() {
  const [state, setState] = useState({ status: 'loading', data: null });

  useEffect(() => {
    let cancelled = false;
    publicApi
      .stats()
      .then((data) => !cancelled && setState({ status: 'ready', data }))
      .catch(() => !cancelled && setState({ status: 'error', data: null }));
    return () => {
      cancelled = true;
    };
  }, []);

  const { status, data } = state;
  const sectionRef = useRef(null);

  // P4: count up to the live values once the bar is 20% visible (reduced motion: final values at once).
  useGSAP(
    () => {
      if (status !== 'ready') return;
      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        const q = gsap.utils.selector(sectionRef);
        q('[data-count]').forEach((el) => {
          const to = Number(el.dataset.count);
          el.textContent = numberFormat.format(0);
          const tween = countTo(el, to, { format: (n) => numberFormat.format(Math.round(n)) });
          tween.pause();
          gsap.from(el.closest('[data-stat]').querySelector('svg'), {
            scale: 0.8,
            opacity: 0.4,
            duration: DUR.medium,
            ease: EASE.enter,
            scrollTrigger: { ...onEnter(sectionRef.current, 'top 95%'), onEnter: () => tween.play() },
          });
        });
      });
      return () => mm.revert();
    },
    { scope: sectionRef, dependencies: [status] },
  );

  return (
    <section ref={sectionRef} aria-labelledby="stats-title" className="bg-surface-white px-4 py-8 sm:px-8 lg:px-16 lg:py-12">
      <div className={cx(WRAP, 'flex flex-col gap-3 lg:gap-4')}>
        <h2 id="stats-title" className="sr-only">
          RoadWatch in numbers
        </h2>
        <dl aria-busy={status === 'loading'} className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-6">
          {STATS.map((stat) => {
            const value = data?.[stat.key];
            return (
              <div key={stat.key} data-stat className="flex flex-col gap-2 rounded-rw-md bg-surface-light-gray p-4 lg:p-6">
                <Icon name={stat.icon} size={24} className="text-text-blue max-lg:size-5" />
                {/* Label first for screen readers; the number shows above it. */}
                <div className="flex flex-col-reverse gap-2">
                  <dt className="type-body-sm text-text-muted lg:type-body">{stat.label}</dt>
                  <dd className="type-display text-text-primary tabular-nums lg:type-stat">
                    {status === 'ready' && value != null ? (
                      <>
                        {/* The counting copy is hidden from screen readers; they read the final value. */}
                        <span aria-hidden="true" data-count={value}>
                          {numberFormat.format(value)}
                        </span>
                        <span className="sr-only">{numberFormat.format(value)}</span>
                      </>
                    ) : (
                      '—'
                    )}
                    {status === 'loading' && <span className="sr-only">Loading</span>}
                  </dd>
                </div>
              </div>
            );
          })}
        </dl>
        <p className="type-body-sm text-text-muted">
          {status === 'error'
            ? 'Live totals are not available right now.'
            : 'Live totals from the RoadWatch database, counted when the page loads. Verified records only; no personal details.'}
        </p>
      </div>
    </section>
  );
}

/* ---------- How it works ---------- */

function SectionHeading({ id, title, children }) {
  return (
    <div data-reveal className="flex flex-col gap-2">
      <h2 id={id} className="type-h2 text-text-primary sm:type-h1">
        {title}
      </h2>
      <span data-heading-bar aria-hidden="true" className="block h-1 w-8 rounded-full bg-brand-amber" />
      {children && <p className="type-body text-text-muted sm:type-body-lg">{children}</p>}
    </div>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-title" className={cx(SECTION, 'scroll-mt-20 bg-surface-light-gray')}>
      <div className={cx(WRAP, 'flex flex-col gap-6 lg:gap-10')}>
        <SectionHeading id="how-title" title="How RoadWatch works">
          Three steps from the roadside to a closed case.
        </SectionHeading>
        <ol data-steps className="grid gap-6 md:grid-cols-3 md:gap-0">
          {STEPS.map((step, index) => (
            <li key={step.title} data-step className="flex gap-4 md:flex-col md:pr-8">
              <div className="flex shrink-0 items-center md:w-full" aria-hidden="true">
                <span
                  data-step-dot
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-navy type-label text-text-inverse md:size-14 md:type-h2"
                >
                  {index + 1}
                </span>
                {index < STEPS.length - 1 && <span data-step-line className="hidden h-0.5 flex-1 bg-border-control md:block" />}
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
  const [fullMap, setFullMap] = useState(false); // #46, Figma 410:17216
  const wide = useMediaQuery('(min-width: 768px)');
  const sectionRef = useRef(null);

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
  const mapLabel = 'Map of verified road updates. The list of records carries the same information.';
  const pins = (
    <>
      {points.map((point, index) => (
        <Marker key={`${point[0]}-${point[1]}-${index}`} position={point} icon={UPDATE_PIN} keyboard={false} />
      ))}
      <FitToPins points={points} />
    </>
  );

  // The record cards: under the section map, and beside the full-screen map as its text alternative.
  const renderUpdates = (items, className, dataAttr = 'data-update-full-list') => (
    <ul {...{ [dataAttr]: true }} aria-label="Verified records" className={className}>
      {items.map((update) => (
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
  );

  const visible = showAll ? updates : updates.slice(0, 2);
  const canExpand = !wide && (updates.length > 2 || points.length > 0);

  // P7: once records arrive, the map fades in, its pins drop one after another and the cards rise.
  useGSAP(
    () => {
      if (status !== 'ready' || updates.length === 0) return;
      const mm = gsap.matchMedia();
      mm.add({ motion: MQ.motion, reduce: MQ.reduce }, ({ conditions }) => {
        const q = gsap.utils.selector(sectionRef);
        const reduce = conditions.reduce;
        const list = q('[data-update-list]')[0];
        reveal(list?.children || [], { trigger: list, reduce });
        const map = q('[data-update-map]')[0];
        if (!map) return;
        reveal(map, { trigger: map, reduce });
        if (!reduce) {
          gsap.from(q('.leaflet-marker-icon svg'), {
            y: -16,
            opacity: 0,
            duration: 0.4,
            ease: EASE.drop,
            stagger: 0.07,
            delay: 0.2,
            scrollTrigger: onEnter(map),
          });
        }
      });
      return () => mm.revert();
    },
    { scope: sectionRef, dependencies: [status, showAll, updates.length] },
  );

  return (
    <section ref={sectionRef} id="public-updates" aria-labelledby="updates-title" className={cx(SECTION, 'scroll-mt-20 bg-surface-white')}>
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
            description="Verified accident records will appear here once they are published. You can still report an accident in the RoadWatch Android app."
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
                <div data-update-map>
                  <MapView label={mapLabel} zoom={12} onExpand={() => setFullMap(true)}>
                    {pins}
                  </MapView>
                  <FullScreenMap
                    open={fullMap}
                    onClose={() => setFullMap(false)}
                    title="Public road updates · verified records, last 7 days"
                    zoom={12}
                    label={mapLabel}
                    aside={renderUpdates(updates, 'flex flex-col gap-4')}
                  >
                    {pins}
                  </FullScreenMap>
                </div>
              )}
              {renderUpdates(visible, cx('flex flex-col gap-4', points.length === 0 && 'lg:col-span-2'), 'data-update-list')}
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
  return (
    <section id="safety-tips" aria-labelledby="tips-title" className={cx(SECTION, 'scroll-mt-20 bg-surface-light-gray')}>
      <div className={cx(WRAP, 'grid items-start gap-8 lg:grid-cols-[1fr_420px] lg:gap-16')}>
        <div className="flex min-w-0 flex-col gap-4 lg:gap-8">
          <SectionHeading id="tips-title" title="Road safety tips">
            Road safety starts with awareness. Follow traffic rules, avoid distracted driving and keep a safe distance.
          </SectionHeading>
          <ul data-reveal-left>
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

        <EmergencyCard />
      </div>
    </section>
  );
}

// Emergency card (#31, #40): 911 first, then every PNP and BFP line with their seals, as on mobile.
const AGENCIES = [
  { code: 'PNP', name: 'Philippine National Police', seal: pnpSeal, lines: HOTLINES.pnp },
  { code: 'BFP', name: 'Bureau of Fire Protection', seal: bfpSeal, lines: HOTLINES.bfp },
];

function EmergencyCard() {
  const onDarkLink = cx('rounded-rw-sm text-text-inverse underline underline-offset-2', ON_DARK_FOCUS);
  return (
    <aside data-reveal aria-labelledby="emergency-title" className="flex flex-col gap-3 rounded-rw-md bg-brand-navy p-6 sm:gap-4 sm:p-10">
      <p className="type-overline text-text-accent uppercase">In an emergency</p>
      <h3 id="emergency-title" className="type-h1 text-text-inverse">
        <a href={HOTLINES.emergency.tel} className={onDarkLink}>
          Call 911
        </a>
      </h3>
      <p className="type-body text-text-inverse-muted">
        Philippine National Emergency Hotline. Free from any phone, 24/7. Get help first, then report.
      </p>
      <hr className="border-0 border-t border-surface-navy-hover" />
      {AGENCIES.map((agency) => (
        <div key={agency.code} className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <img src={agency.seal} alt={`${agency.name} seal`} className="size-10 shrink-0 object-contain" />
            <p className="flex flex-col">
              <span className="type-label text-text-inverse">{agency.code}</span>
              <span className="type-body-sm text-text-inverse-muted">{agency.name}</span>
            </p>
          </div>
          <ul aria-label={`${agency.code} hotlines`}>
            {agency.lines.map((line) => (
              <li key={line.number}>
                <a
                  href={line.tel}
                  className={cx('flex min-h-12 items-center gap-3 rounded-rw-sm text-text-inverse sm:min-h-11', ON_DARK_FOCUS)}
                >
                  <span data-ring className="inline-flex">
                    <Icon name="phone" size={18} />
                  </span>
                  <span className="type-body underline underline-offset-2">
                    <span className="sr-only">Call {agency.code} </span>
                    {line.number}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </aside>
  );
}

/* ---------- About ---------- */

function About() {
  return (
    <section id="about" aria-labelledby="about-title" className={cx(SECTION, 'scroll-mt-20 bg-surface-white')}>
      <div className={cx(WRAP, 'grid items-start gap-8 lg:grid-cols-2 lg:gap-16')}>
        <div data-reveal className="flex flex-col gap-4">
          <h2 id="about-title" className="type-h2 text-text-primary sm:type-h1">
            About RoadWatch
          </h2>
          <span data-heading-bar aria-hidden="true" className="block h-1 w-8 rounded-full bg-brand-amber" />
          <p className="type-body text-text-primary sm:type-body-lg">
            RoadWatch is a web and mobile road accident reporting system made by BSIT 3I-G1 students at Bulacan State
            University for IT 305 Advanced Web Development. It makes it easier for the public to submit accident
            information, and helps administrators and traffic officers review, verify and manage every report in one
            place.
          </p>
          <p className="type-body-sm text-text-muted">A student project. It does not replace official emergency services.</p>
          <Link
            to="/about"
            className="flex min-h-12 items-center gap-2 self-start rounded-rw-sm type-button text-text-blue underline underline-offset-2 sm:min-h-11"
          >
            Meet the team behind RoadWatch
            <Icon name="chevron-right" size={20} />
          </Link>
        </div>
        <div data-reveal className="flex flex-col gap-4 rounded-rw-md bg-surface-light-gray p-6 sm:p-8">
          <h3 className="type-h3 text-text-primary">What RoadWatch supports</h3>
          <ul data-ticks className="flex flex-col gap-4">
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

/* ---------- FAQ (#40): a chat-style list; semantically a <dl> of questions and answers ---------- */

function Faq() {
  const [expanded, setExpanded] = useState(false);
  const listId = useId();
  const hidden = FAQ.length - FAQ_PREVIEW;
  const listRef = useRef(null);

  // Phones: "Show more" reveals the next questions with the same fade and rise (P10).
  useGSAP(
    () => {
      if (!expanded) return;
      reveal(gsap.utils.selector(listRef)('[data-faq-extra]'), { reduce: window.matchMedia(MQ.reduce).matches });
    },
    { scope: listRef, dependencies: [expanded] },
  );
  return (
    <section id="faq" aria-labelledby="faq-title" className={cx(SECTION, 'scroll-mt-20 bg-surface-light-gray')}>
      <div className={cx(WRAP, 'grid items-start gap-4 lg:grid-cols-[400px_1fr] lg:gap-16')}>
        <div data-reveal className="flex flex-col gap-4">
          <p className="type-overline text-text-blue uppercase">FAQ</p>
          <h2 id="faq-title" className="type-h2 text-text-primary sm:type-h1">
            Questions, answered
          </h2>
          <span data-heading-bar aria-hidden="true" className="block h-1 w-8 rounded-full bg-brand-amber" />
          <p className="type-body text-text-muted sm:type-body-lg">
            Quick answers about reporting, tracking and privacy.
            <span className="max-lg:hidden"> Still stuck? Email the RoadWatch team.</span>
          </p>
          <SupportLink className="max-lg:hidden" />
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 rounded-rw-md bg-surface-white p-4 shadow-rw-sm sm:p-8">
          <dl ref={listRef} id={listId} className="flex flex-col gap-4">
            {FAQ.map((item, index) => (
              <div
                key={item.q}
                data-faq-pair
                data-faq-extra={index >= FAQ_PREVIEW || undefined}
                className={cx('flex flex-col gap-2', !expanded && index >= FAQ_PREVIEW && 'max-md:hidden')}
              >
                <dt className="flex justify-end">
                  <span data-faq-q className="max-w-[488px] rounded-rw-md rounded-br-[4px] bg-brand-navy px-4 py-3 type-body text-text-inverse">
                    {item.q}
                  </span>
                </dt>
                <dd className="flex items-end gap-2">
                  <span
                    aria-hidden="true"
                    className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-navy type-caption text-text-inverse"
                  >
                    RW
                  </span>
                  {/* "Typing" bubble shown for 400 ms before the answer (P10); decorative. */}
                  <span
                    data-faq-typing
                    aria-hidden="true"
                    className="hidden items-center gap-1.5 rounded-rw-md rounded-tl-[4px] bg-surface-light-gray px-4 py-4"
                  >
                    <span className="size-2 rounded-full bg-text-muted" />
                    <span className="size-2 rounded-full bg-text-muted opacity-60" />
                    <span className="size-2 rounded-full bg-text-muted opacity-30" />
                  </span>
                  <span data-faq-a className="max-w-[600px] rounded-rw-md rounded-tl-[4px] bg-surface-light-gray px-4 py-3 type-body text-text-primary">
                    {item.a}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
            {hidden > 0 && (
              <div className="md:hidden">
                <Button
                  variant="secondary"
                  size="mobile"
                  fullWidth
                  aria-expanded={expanded}
                  aria-controls={listId}
                  onClick={() => setExpanded((open) => !open)}
                >
                  {expanded ? 'Show fewer questions' : `Show ${hidden} more questions`}
                </Button>
              </div>
            )}
          </div>
          <SupportLink className="lg:hidden" />
        </div>
      </div>
    </section>
  );
}

function SupportLink({ className = '' }) {
  return (
    <a
      href={SUPPORT_MAILTO}
      className={cx(
        'flex min-h-12 items-center gap-2 self-start rounded-rw-sm type-button text-text-blue underline underline-offset-2 sm:min-h-11',
        className,
      )}
    >
      <Icon name="mail" size={20} />
      {SUPPORT_EMAIL}
    </a>
  );
}

/* ---------- Closing call to action ---------- */

function ClosingCta() {
  return (
    <section aria-labelledby="cta-title" className="bg-surface-navy-subtle px-4 py-10 sm:px-8 lg:px-16 lg:py-14">
      <div className={cx(WRAP, 'flex flex-col gap-6 md:flex-row md:items-center md:gap-8')}>
        <div data-reveal className="flex min-w-0 flex-1 flex-col gap-2 text-text-primary">
          <h2 id="cta-title" className="type-h2">
            Need to report an accident?
          </h2>
          <p className="type-body max-sm:hidden">
            Reporting and tracking happen in the RoadWatch Android app. Install it, create a free account, and send a
            report in about two minutes.
          </p>
        </div>
        <div data-reveal className="flex items-center gap-6">
          <Button href={APK_URL} icon="download" className="max-sm:h-12 max-sm:w-full">
            Download the Android app
          </Button>
          {/* QR placeholder (#40), wider screens only: a phone cannot scan its own screen. It is a
              placeholder until the download address is final (#38), so it is hidden from screen readers. */}
          <div aria-hidden="true" className="hidden items-center gap-6 md:flex">
            <span className="type-body-sm text-text-muted">or</span>
            <div className="flex flex-col items-center gap-2">
              <div data-qr className="flex size-28 items-center justify-center rounded-rw-sm border-2 border-dashed border-border-control bg-surface-white type-caption text-text-muted">
                QR code
              </div>
              <span className="type-caption text-text-primary">Scan to download</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
