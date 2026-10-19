import { useEffect, useId, useRef, useState } from 'react';
import Icon from './Icon';
import MenuItem from './MenuItem';
import { cx, initials } from '../../lib/cx';

// User menu trigger + dropdown (Figma 194:1134, top bar "User menu").
// user: { full_name, contact_email, role }.
// groups: [{ label: 'Account', items: [{ key, label, icon, onSelect }] }, ...]
// compact: avatar-only trigger (narrow screens).
// Keyboard: Enter/Space/ArrowDown open on the first item, ArrowUp on the last; Up/Down/Home/End
// move; Escape closes and returns focus to the trigger; Tab or an outside click closes.
export default function UserMenu({ user, groups, compact = false, className = '' }) {
  const [open, setOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(0);
  const wrapperRef = useRef(null);
  const triggerRef = useRef(null);
  const itemRefs = useRef([]);
  const menuId = useId();
  const triggerId = useId();

  const items = groups.flatMap((g) => g.items);
  const name = user?.full_name || 'Account';

  // Move DOM focus to the active item while open.
  useEffect(() => {
    if (open) itemRefs.current[focusIndex]?.focus();
  }, [open, focusIndex]);

  // Close on a click outside.
  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const openAt = (index) => {
    setFocusIndex(index);
    setOpen(true);
  };

  const close = (returnFocus = true) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  };

  const onTriggerKeyDown = (event) => {
    if (['ArrowDown', 'Enter', ' '].includes(event.key)) {
      event.preventDefault();
      openAt(0);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      openAt(items.length - 1);
    }
  };

  const onMenuKeyDown = (event) => {
    const last = items.length - 1;
    const moves = {
      ArrowDown: focusIndex === last ? 0 : focusIndex + 1,
      ArrowUp: focusIndex === 0 ? last : focusIndex - 1,
      Home: 0,
      End: last,
    };
    if (event.key in moves) {
      event.preventDefault();
      setFocusIndex(moves[event.key]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'Tab') {
      close(false);
    }
  };

  const select = (item) => {
    close();
    item.onSelect?.();
  };

  let itemIndex = -1;

  return (
    <div ref={wrapperRef} className={cx('relative', className)}>
      <button
        ref={triggerRef}
        id={triggerId}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={compact ? `Account menu for ${name}` : undefined}
        onClick={() => (open ? close(false) : openAt(0))}
        onKeyDown={onTriggerKeyDown}
        className={cx(
          'flex h-11 items-center gap-3 rounded-rw-md text-left transition-colors hover:bg-surface-light-gray',
          compact ? 'px-1' : 'px-2',
        )}
      >
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-navy-subtle type-label text-text-primary"
        >
          {initials(name)}
        </span>
        {!compact && (
          <>
            <span className="flex flex-col whitespace-nowrap">
              <span className="type-label text-text-primary">{name}</span>
              <span className="type-caption text-text-muted">{user?.role}</span>
            </span>
            <Icon name="chevron-down" size={20} className="text-text-primary" />
          </>
        )}
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          aria-labelledby={triggerId}
          onKeyDown={onMenuKeyDown}
          className={cx(
            'absolute top-[calc(100%+8px)] right-0 z-[1500] flex w-[296px] max-w-[calc(100vw-16px)] flex-col gap-1',
            'rounded-rw-md border border-border-subtle bg-surface-white p-2 shadow-rw-lg',
            'transition-opacity duration-150 starting:opacity-0 motion-reduce:transition-none',
          )}
        >
          {/* Account header (GET /api/auth/me). Not focusable: it is not an action. */}
          <div role="presentation" className="flex items-center gap-3 p-3">
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-navy type-label text-text-inverse"
            >
              {initials(name)}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate type-label text-text-primary">{name}</span>
              {user?.contact_email && (
                <span className="truncate type-body-sm text-text-muted">{user.contact_email}</span>
              )}
              {user?.role && <span className="type-caption text-text-blue">{user.role}</span>}
            </span>
          </div>
          {groups.map((group) => (
            <div key={group.label} role="group" aria-label={group.label} className="flex flex-col gap-1">
              <div aria-hidden="true" className="h-px bg-border-subtle" />
              <p aria-hidden="true" className="px-3 pt-2 pb-1 type-overline uppercase text-text-muted">
                {group.label}
              </p>
              {group.items.map((item) => {
                itemIndex += 1;
                const index = itemIndex;
                return (
                  <MenuItem
                    key={item.key}
                    ref={(el) => {
                      itemRefs.current[index] = el;
                    }}
                    icon={item.icon}
                    onSelect={() => select(item)}
                  >
                    {item.label}
                  </MenuItem>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
