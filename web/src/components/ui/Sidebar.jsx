import Emblem from './Emblem';
import Icon from './Icon';
import SidebarItem from './SidebarItem';
import { ROLES } from '../../lib/constants';
import { cx } from '../../lib/cx';

// Role-based navy sidebar (Figma 105:1211), 264 px wide.
// pathname: the current route, used to mark the active item (none on Action log and About).
// showLogOut: only when the sidebar is the 390 px drawer (the top bar has Log out on desktop).
const SIDEBAR_ITEMS = {
  [ROLES.ADMIN]: [
    { to: '/admin', label: 'Dashboard', icon: 'dashboard', match: (p) => p === '/admin' },
    { to: '/admin/reports', label: 'Reports', icon: 'list', match: (p) => p.startsWith('/admin/reports') },
    { to: '/admin/users', label: 'Users & settings', icon: 'users', match: (p) => p.startsWith('/admin/users') },
    { to: '/admin/summaries', label: 'Summaries', icon: 'bar-chart', match: (p) => p.startsWith('/admin/summaries') },
    { to: '/demo-video', label: 'Demo video', icon: 'play-circle', match: (p) => p.startsWith('/demo-video') },
  ],
  [ROLES.OFFICER]: [
    { to: '/officer', label: 'Assigned to me', icon: 'list', match: (p) => p.startsWith('/officer') },
    { to: '/demo-video', label: 'Demo video', icon: 'play-circle', match: (p) => p.startsWith('/demo-video') },
  ],
};

const CONSOLE_NAME = {
  [ROLES.ADMIN]: 'Administrator console',
  [ROLES.OFFICER]: 'Traffic Officer console',
};

// Decorative background: road-safety icons at 7% opacity, tilted, repeating every 160 px.
const PATTERN_ICONS = [
  'car', 'file-text', 'alert-triangle', 'locate', 'map', 'car', 'file-text', 'alert-triangle',
  'bell', 'map', 'car', 'file-text', 'shield-check', 'bell', 'map', 'car',
  'user-check', 'shield-check', 'bell', 'map', 'map-pin', 'user-check', 'shield-check', 'bell',
  'clock', 'map-pin', 'user-check', 'shield-check', 'send', 'clock', 'map-pin', 'user-check',
  'camera', 'send', 'clock', 'map-pin', 'locate', 'camera', 'send', 'clock',
  'alert-triangle', 'locate', 'camera', 'send', 'file-text', 'alert-triangle', 'locate', 'camera',
];
const PATTERN_ROWS = 24; // enough for tall screens; the rail clips the rest

function BackgroundPattern() {
  const cells = [];
  for (let row = 0; row < PATTERN_ROWS; row += 1) {
    const odd = row % 2 === 1;
    const xs = odd ? [52, 118, 196, 262] : [10, 88, 154, 232];
    xs.forEach((x, col) => {
      const big = (row + col) % 2 === 0;
      cells.push({
        key: `${row}-${col}`,
        icon: PATTERN_ICONS[(row * 4 + col) % PATTERN_ICONS.length],
        x,
        y: 20 + row * 80 + (odd ? 10 : 0),
        size: big ? 36 : 28,
        rotate: col % 2 === 0 ? 12 : -10,
      });
    });
  }
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden text-text-inverse opacity-[0.07]">
      {cells.map((c) => (
        <span key={c.key} className="absolute" style={{ left: c.x, top: c.y, transform: `rotate(${c.rotate}deg)` }}>
          <Icon name={c.icon} size={c.size} />
        </span>
      ))}
    </div>
  );
}

export default function Sidebar({ role, pathname = '', showLogOut = false, onLogout, onNavigate, className = '' }) {
  const items = SIDEBAR_ITEMS[role] || [];
  return (
    <div className={cx('relative isolate flex h-full w-66 flex-col overflow-hidden bg-brand-navy', className)}>
      <BackgroundPattern />
      <div className="flex flex-col items-center gap-1 px-6 pt-4 pb-6">
        <Emblem size={136} />
        <p className="type-caption text-text-inverse-muted">{CONSOLE_NAME[role]}</p>
      </div>
      <nav aria-label="Main" className="flex flex-col gap-1 px-4">
        {items.map((item) => (
          <SidebarItem
            key={item.to}
            to={item.to}
            icon={item.icon}
            label={item.label}
            active={item.match(pathname)}
            onClick={onNavigate}
          />
        ))}
      </nav>
      <div className="flex-1" />
      <div className="flex flex-col gap-1 border-t border-surface-navy-hover px-4 py-6">
        {showLogOut && <SidebarItem icon="log-out" label="Log out" onClick={onLogout} />}
      </div>
    </div>
  );
}
