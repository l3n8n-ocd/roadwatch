import { Link } from 'react-router-dom';
import { Emblem, Icon, Logo } from '../../components/ui';
import brandPanel from '../../assets/images/brand-panel.jpg';

// Shared frame of the sign-in and register screens (Figma W1 121:5, R0 229:5883):
// navy brand panel with the street photo at 15% opacity, then the form card.
// Below 1024 px the panel becomes a short brand header (Figma 121:126).
//   title / subtitle: brand panel copy on wide screens.
//   mobileTitle: shorter headline for the brand header on small screens.
export default function AuthShell({ title, subtitle, mobileTitle, children }) {
  return (
    <main className="flex min-h-screen flex-col bg-surface-light-gray lg:flex-row">
      <div className="relative isolate flex shrink-0 flex-col gap-4 overflow-hidden bg-brand-navy p-6 lg:w-[600px] lg:justify-center lg:gap-8 lg:p-16">
        <img src={brandPanel} alt="" className="absolute inset-0 -z-10 size-full object-cover opacity-15" />
        {/* Wide screens: full emblem + headline. */}
        <Emblem size={176} className="hidden lg:block" />
        <p className="hidden type-display text-text-inverse lg:block">{title}</p>
        {subtitle && <p className="hidden type-body-lg text-text-inverse-muted lg:block">{subtitle}</p>}
        {/* Small screens: logo lockup + short headline. */}
        <Link to="/" className="self-start rounded-rw-md focus-visible:shadow-(--rw-shadow-focus-on-dark) lg:hidden">
          <Logo tone="dark" />
        </Link>
        <p className="type-h2 text-text-inverse lg:hidden">{mobileTitle || title}</p>
      </div>

      <div className="flex flex-1 flex-col items-center sm:justify-center sm:p-8">
        <div className="flex w-full flex-col gap-4 p-6 sm:w-[480px] sm:gap-5 sm:rounded-rw-md sm:bg-surface-white sm:p-10 sm:shadow-rw-md">
          {children}
        </div>
      </div>
    </main>
  );
}

// "Back to home" / "Choose a different role" link at the top of the card (44 px tall).
export function BackLink({ to, children }) {
  return (
    <Link
      to={to}
      className="inline-flex min-h-11 items-center gap-2 self-start rounded-rw-sm type-label text-text-blue underline underline-offset-2"
    >
      <Icon name="arrow-left" size={18} />
      {children}
    </Link>
  );
}

// Inline text link used in "New to RoadWatch? Create an account".
export function TextLink({ to, children, ...rest }) {
  return (
    <Link to={to} className="rounded-rw-sm type-label text-text-blue underline underline-offset-2" {...rest}>
      {children}
    </Link>
  );
}
