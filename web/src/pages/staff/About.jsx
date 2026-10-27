import { useCallback, useEffect, useState } from 'react';
import { BuiltWith, Icon, Logo } from '../../components/ui';
import { publicApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import { TEAM } from '../../lib/team';

// W9 About (Figma 212:5577): product description, version, live server status (GET /health),
// privacy summary, team (photos, #48), Built with logos (#49) and credits. Opened from the user menu (#27);
// Administrators at /admin/about, Traffic Officers at /officer/about (#52).

// Shown as "1.1.0 (web) · Oct 2026". Update with each release tag (v*).
const APP_VERSION = '1.1.0';
const RELEASE_MONTH = 'Oct 2026';

const PRIVACY = [
  'Reporter contact details are visible only to the reporter, administrators and the officer assigned to the report.',
  'Every status change and important admin action is recorded in the audit trail. You can see your own entries in Action log.',
  'Passwords are stored hashed. RoadWatch never shows or emails them.',
  'Photos are stored on Cloudinary; only their links are kept in the database.',
];

const CREDITS = [
  ['Map data', '© OpenStreetMap contributors (ODbL)'],
  ['Icons', 'Lucide (ISC licence)'],
  ['Fonts', 'Poppins and Inter (SIL Open Font License)'],
];

const LICENCES = [
  { label: 'OpenStreetMap copyright and licence', href: 'https://www.openstreetmap.org/copyright' },
  { label: 'Lucide icons licence (ISC)', href: 'https://lucide.dev/license' },
  { label: 'SIL Open Font License 1.1', href: 'https://openfontlicense.org/' },
];

const card = 'flex flex-col gap-4 rounded-rw-md border border-border-subtle bg-surface-white p-4 sm:p-6';

function Fact({ label, children }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-[12px] bg-surface-light-gray px-4 py-3">
      <dt className="type-caption text-text-muted">{label}</dt>
      <dd className="flex items-center gap-2 type-label text-text-primary">{children}</dd>
    </div>
  );
}

function TermList({ items }) {
  return (
    <dl className="flex flex-col gap-3">
      {items.map(([term, value]) => (
        <div key={term} className="flex flex-col gap-1 text-text-primary sm:flex-row sm:gap-4">
          <dt className="type-label sm:w-24 sm:shrink-0">{term}</dt>
          <dd className="type-body">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export default function About() {
  const { user } = useAuth();
  const [server, setServer] = useState('checking'); // 'checking' | 'ok' | 'down'

  const check = useCallback(() => {
    let cancelled = false;
    setServer('checking');
    publicApi
      .health()
      .then((res) => {
        if (!cancelled) setServer(res?.status === 'ok' ? 'ok' : 'down');
      })
      .catch(() => {
        if (!cancelled) setServer('down');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => check(), [check]);

  return (
    <div className="flex flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
      <div className="flex flex-col gap-1">
        <h1 className="type-h1 text-text-primary">About RoadWatch</h1>
        <p className="type-body text-text-muted">
          What RoadWatch is, the version you are using, how data is handled, and who built it.
        </p>
      </div>

      <section aria-labelledby="product-title" className={card}>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
          <Logo className="self-start md:self-center" />
          <div className="flex min-w-0 flex-1 flex-col gap-1 text-text-primary">
            <h2 id="product-title" className="type-label">
              Web and Mobile-Based Road Accident Reporting System
            </h2>
            <p className="type-body">
              RoadWatch lets the public report road accidents with location and photos, and lets administrators and
              traffic officers verify, assign and close each report. Public submissions stay separate from officially
              verified accident records.
            </p>
          </div>
        </div>
        <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Fact label="Version">
            {APP_VERSION} (web) · {RELEASE_MONTH}
          </Fact>
          <Fact label="Server">
            <span aria-live="polite" className="flex flex-wrap items-center gap-2">
              {server === 'checking' && (
                <>
                  <Icon name="loader" size={18} className="animate-spin motion-reduce:animate-none" />
                  Checking…
                </>
              )}
              {server === 'ok' && (
                <span className="flex items-center gap-2 text-text-success">
                  <Icon name="check-circle" size={18} />
                  Connected
                </span>
              )}
              {server === 'down' && (
                <>
                  <span className="flex items-center gap-2 text-text-danger">
                    <Icon name="x-circle" size={18} />
                    Not reachable
                  </span>
                  <button type="button" onClick={check} className="inline-flex min-h-11 items-center text-text-blue underline">
                    Check again
                  </button>
                </>
              )}
            </span>
          </Fact>
          <Fact label="Signed in as">{user?.role || '—'}</Fact>
          <Fact label="Support">Via the user menu</Fact>
        </dl>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="privacy-title" className={card}>
          <h2 id="privacy-title" className="type-h3 text-text-primary">
            Privacy and data
          </h2>
          <ul className="flex flex-col gap-3">
            {PRIVACY.map((text) => (
              <li key={text} className="flex items-start gap-3 type-body text-text-primary">
                <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-brand-navy" />
                <span className="min-w-0 flex-1">{text}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="team-title" className={card}>
          <h2 id="team-title" className="type-h3 text-text-primary">
            The team
          </h2>
          <ul className="flex flex-col gap-3">
            {TEAM.map((member) => (
              <li key={member.name} className="flex items-center gap-3">
                <img src={member.photo} alt="" className="size-10 shrink-0 rounded-full bg-surface-navy-subtle object-cover" />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="type-label text-text-primary">{member.name}</span>
                  <span className="type-body-sm text-text-muted">{member.title}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="type-body-sm text-text-muted">The RoadWatch product team.</p>
        </section>

        <section aria-labelledby="built-title" className={`${card} lg:col-span-2`}>
          <h2 id="built-title" className="type-h3 text-text-primary">
            Built with
          </h2>
          <BuiltWith />
        </section>

        <section aria-labelledby="credits-title" className={`${card} lg:col-span-2`}>
          <h2 id="credits-title" className="type-h3 text-text-primary">
            Credits and licences
          </h2>
          <TermList items={CREDITS} />
          <details className="group">
            <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1 type-label text-text-blue underline [&::-webkit-details-marker]:hidden">
              View the open-source licences
              <Icon name="chevron-down" size={16} className="transition-transform group-open:rotate-180 motion-reduce:transition-none" />
            </summary>
            <ul className="mt-2 flex flex-col gap-2">
              {LICENCES.map((l) => (
                <li key={l.href}>
                  <a href={l.href} target="_blank" rel="noreferrer" className="type-body text-text-blue underline">
                    {l.label}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </details>
        </section>
      </div>
    </div>
  );
}
