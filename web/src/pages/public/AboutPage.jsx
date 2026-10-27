import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { BuiltWith, Icon } from '../../components/ui';
import PublicLayout from '../../layouts/PublicLayout';
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from '../../lib/constants';
import { cx } from '../../lib/cx';
import { SECTION, WRAP } from '../../lib/publicStyles';
import { TEAM } from '../../lib/team';
import useReveals from '../../lib/useReveals';

// W10 public About, Meet our team and Built with (Figma 345:15810, 390: 346:15885; #40, #48, #49). The staff
// console's About (version, server status) is a separate page (W9).

const SUPPORTS = [
  'Accident reporting from the Android app, with GPS location and photos',
  'GPS or manually selected accident location',
  'Photo evidence (up to 5 photos per upload)',
  'Status tracking with alerts at every change',
  'Review and management by authorized staff',
  'A clear line between public submissions and verified records',
];

export default function AboutPage() {
  const rootRef = useRef(null);
  useReveals(rootRef); // P12: reveals, team cards one after another, avatars scale in.
  return (
    <PublicLayout>
      <div ref={rootRef}>
        <section aria-labelledby="about-title" className={cx(SECTION, 'bg-surface-light-gray')}>
          <div data-reveal className={cx(WRAP, 'flex flex-col items-start gap-4')}>
            <Link
              to="/"
              className="flex min-h-12 items-center gap-2 rounded-rw-sm type-button text-text-blue underline underline-offset-2 sm:min-h-11"
            >
              <Icon name="arrow-left" size={20} />
              Back to home
            </Link>
            <p className="type-overline text-text-blue uppercase">About</p>
            <h1 id="about-title" className="type-display text-text-primary lg:type-hero">
              About RoadWatch
            </h1>
            <span data-heading-bar aria-hidden="true" className="block h-1 w-8 rounded-full bg-brand-amber" />
            <p className="max-w-[800px] type-body text-text-primary sm:type-body-lg">
              RoadWatch is a web and mobile road accident reporting system. The public reports accidents from the Android
              app with the location and photos, and administrators and traffic officers verify, assign and close every
              report.
            </p>
          </div>
        </section>

        <section aria-labelledby="why-title" className={cx(SECTION, 'bg-surface-white')}>
          <div className={cx(WRAP, 'grid items-start gap-8 lg:grid-cols-2 lg:gap-16')}>
            <div data-reveal className="flex flex-col gap-4">
              <h2 id="why-title" className="type-h2 text-text-primary sm:type-h1">
                Why we built it
              </h2>
              <span data-heading-bar aria-hidden="true" className="block h-1 w-8 rounded-full bg-brand-amber" />
              <p className="type-body text-text-primary sm:type-body-lg">
                Road accident reports often arrive late, by phone or social media, with no exact location. RoadWatch puts
                the details, the GPS location and photo evidence in one place, so each report can be checked and followed
                until the case is closed.
              </p>
              <p className="type-body-sm text-text-muted sm:type-body">
                Every new report starts as a public submission. It becomes a verified accident record only after an
                administrator checks it, and the public road updates show verified records only.
              </p>
              <p className="type-body-sm text-text-muted">
                RoadWatch does not replace official emergency services. In an emergency, call 911.
              </p>
            </div>
            <div data-reveal className="flex flex-col gap-4 rounded-rw-md bg-surface-light-gray p-6 sm:p-8">
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

        <section aria-labelledby="team-title" className={cx(SECTION, 'bg-surface-light-gray')}>
          <div className={cx(WRAP, 'flex flex-col gap-6 lg:gap-8')}>
            <div data-reveal className="flex flex-col gap-2">
              <h2 id="team-title" className="type-h2 text-text-primary sm:type-h1">
                Meet our team
              </h2>
              <span data-heading-bar aria-hidden="true" className="block h-1 w-8 rounded-full bg-brand-amber" />
              <p className="type-body text-text-muted sm:type-body-lg">
                RoadWatch is built and run by a four-person product team.
              </p>
            </div>
            <ul data-reveal-list className="grid gap-4 md:grid-cols-2 lg:gap-6">
              {TEAM.map((member) => (
                <li
                  key={member.name}
                  className="flex items-start gap-4 rounded-rw-md border border-border-subtle bg-surface-white p-4 shadow-rw-sm sm:gap-5 sm:p-6"
                >
                  <img
                    data-pop
                    src={member.photo}
                    alt={`Photo of ${member.name}`}
                    className="size-16 shrink-0 rounded-full bg-surface-navy-subtle object-cover sm:size-18"
                  />
                  <div className="flex min-w-0 flex-1 flex-col items-start gap-2">
                    <h3 className="type-h3 text-text-primary">{member.name}</h3>
                    <p className="rounded-full bg-surface-blue-subtle px-3 py-1 type-caption text-text-blue">{member.title}</p>
                    <p className="type-body text-text-muted max-sm:line-clamp-2">{member.bio}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="built-title" className={cx(SECTION, 'bg-surface-light-gray pt-0 sm:pt-0 lg:pt-0')}>
          <div className={cx(WRAP, 'flex flex-col gap-6 lg:gap-8')}>
            <div data-reveal className="flex flex-col gap-2">
              <h2 id="built-title" className="type-h2 text-text-primary sm:type-h1">
                Built with
              </h2>
              <span data-heading-bar aria-hidden="true" className="block h-1 w-8 rounded-full bg-brand-amber" />
              <p className="type-body text-text-muted sm:type-body-lg">The tools and services behind RoadWatch.</p>
            </div>
            <BuiltWith />
          </div>
        </section>

        <section aria-labelledby="contact-title" className="bg-surface-white px-4 py-10 sm:px-8 lg:px-16 lg:py-14">
          <div data-reveal className={cx(WRAP, 'flex flex-col gap-4 md:flex-row md:items-center md:gap-8')}>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <h2 id="contact-title" className="type-h2 text-text-primary">
                Questions about RoadWatch?
              </h2>
              <p className="type-body text-text-muted">Email the team. We usually reply within two working days.</p>
            </div>
            <a
              href={SUPPORT_MAILTO}
              className="flex min-h-12 items-center gap-2 self-start rounded-rw-sm type-button text-text-blue underline underline-offset-2 sm:min-h-11 md:self-center"
            >
              <Icon name="mail" size={20} />
              {SUPPORT_EMAIL}
            </a>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
