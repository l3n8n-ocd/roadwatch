import { forwardRef } from 'react';
import Icon from './Icon';

// Row inside the user-menu dropdown (Figma 194:938): role="menuitem", 44 px tall.
// Hover = light gray; keyboard focus = Focus/ring. The icon is decorative.
const MenuItem = forwardRef(function MenuItem({ icon, trailing, onSelect, children, ...rest }, ref) {
  return (
    <button
      ref={ref}
      type="button"
      role="menuitem"
      tabIndex={-1}
      onClick={onSelect}
      className="flex h-11 w-full items-center gap-3 rounded-rw-sm px-3 text-left type-body text-text-primary hover:bg-surface-light-gray"
      {...rest}
    >
      {icon && <Icon name={icon} size={20} />}
      <span className="min-w-0 flex-1">{children}</span>
      {trailing && <span className="type-body-sm text-text-muted">{trailing}</span>}
    </button>
  );
});

export default MenuItem;
