import { ICONS } from './iconData';

// Outline icon from the Figma iconography set. Decorative by default; pass `label`
// when the icon carries meaning on its own.
export default function Icon({ name, size = 24, className = '', label, strokeWidth = 2 }) {
  const icon = ICONS[name];
  if (!icon) return null;
  const [viewBox, paths] = icon;
  return (
    <svg
      width={size}
      height={size}
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {paths.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
