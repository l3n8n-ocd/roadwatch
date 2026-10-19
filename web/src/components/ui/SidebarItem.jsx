import { Link } from 'react-router-dom';
import Icon from './Icon';
import { cx } from '../../lib/cx';

// Sidebar nav item (Figma 105:701) on the navy rail.
// Default: muted label. Hover: navy-hover. Active: navy-hover + amber bar + bold label
// (aria-current="page"). Focus: amber on-dark ring.
// Pass `to` for a link, or `onClick` for an action (e.g. Log out in the drawer).
export default function SidebarItem({ to, icon, label, active = false, onClick }) {
  const classes = cx(
    'flex h-12 w-full items-center gap-3 rounded-rw-md px-4 text-left no-underline transition-colors',
    'hover:bg-surface-navy-hover hover:text-text-inverse focus-visible:shadow-(--rw-shadow-focus-on-dark)',
    active ? 'bg-surface-navy-hover type-button text-text-inverse' : 'type-body text-text-inverse-muted',
  );

  const content = (
    <>
      {active && <span aria-hidden="true" className="h-6 w-1 shrink-0 rounded-[2px] bg-brand-amber" />}
      <Icon name={icon} size={24} />
      <span className="min-w-0 flex-1">{label}</span>
    </>
  );

  if (to) {
    return (
      <Link to={to} onClick={onClick} aria-current={active ? 'page' : undefined} className={classes}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={classes}>
      {content}
    </button>
  );
}
