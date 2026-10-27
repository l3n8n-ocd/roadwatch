# web/CLAUDE.md: RoadWatch web (React + Vite + Tailwind 4)

Project-wide rules live in the root `CLAUDE.md`. This file covers the web app only.

## Source of design
- Figma file `psx52NYL69RkycK7Z44EAb`, pages Foundations (90:2), Components (90:3), Web (90:5), Flows (90:6).
  Node IDs for every frame: `docs/ui-design/figma-index.md`.
- "Pauline draft" (page 0:1) is the low-fidelity prototype. Do not implement from it.
- Build each screen from `get_design_context` on its frame (match the screenshot), adapted to the
  components below. Do not paste absolute-positioned Figma output; use flex/grid.

## Commands
`npm run dev`, `npm run lint`, `npm run build` (CI runs lint then build). Env: `VITE_API_URL`.

## Structure
```
src/
  api/client.js        axios instance (unwraps { success, data }), token storage, downloadFile()
  api/endpoints.js     one function per docs/API.md endpoint ("not built yet" ones are marked)
  context/             AuthContext (staff login with platform "web" + expected role, logout), ThemeContext
  lib/constants.js     ROLES, STATUSES, ADMIN_STATUSES, INJURY_OPTIONS, HOTLINES, homePathFor(), APK_URL
  lib/format.js        formatDate, formatDateTime, formatRelative ("5 min ago"), reportCode (RW-000128)
  components/ui/       Figma Components page, one file per component (Button.jsx, StatusChip.jsx...)
  layouts/             StaffLayout (sidebar + top bar + user menu, Log out confirm), AccountDialogs,
                       NotificationsBell (officers only, #47: GET /notifications, mark read, open the report),
                       PublicLayout (public header with Light/Dark switch + footer; landing, /about, 404, 500)
  components/ErrorBoundary.jsx  shows the 500 page (W12) when a page crashes
  components/ui/VideoPlayer.jsx native <video controls> + Transcript (details); tone="dark" on the landing band (#48)
  lib/useServerError.js         a page's main request with a 5xx re-throws into the ErrorBoundary
  pages/<area>/        one file per screen; App.jsx holds every route
  assets/images/       emblem.png, hero-street.jpg, brand-panel.jpg, pnp-seal.png, bfp-seal.png, team/ (photos, lib/team.js)
  assets/logos/        Built with logos (#49; a "-dark" twin for one-color logos), listed in lib/builtWith.js, drawn by BuiltWith
  styles/tokens.css    generated from Figma variables (light + dark); styles/theme.css maps them to Tailwind
```

## Tokens and styling
- Colors are CSS variables named after the Figma variables: `--rw-<group>-<name>`
  (`--rw-brand-navy`, `--rw-text-muted`, `--rw-surface-white`, `--rw-border-subtle`...).
  Tailwind utilities exist for each: `bg-surface-white`, `text-text-primary`, `border-border-subtle`,
  `bg-brand-navy`, `text-text-danger`, etc. Never hard-code hex values; dark mode depends on the variables.
- Spacing `--rw-space-{4..64}`, radius `rounded-rw-sm` (8) / `rounded-rw-md` (16) / `rounded-full`,
  shadows `shadow-rw-sm|md|lg|focus`, sizes `--rw-size-touch-web` (44), `--rw-size-control-height` (48).
- Type styles are utilities: `type-hero`, `type-display`, `type-h1`, `type-h2`, `type-h3`, `type-stat`,
  `type-body-lg`, `type-body`, `type-body-sm`, `type-label`, `type-button`, `type-caption`, `type-overline`, `type-nav`.
- Icons: `<Icon name="map-pin" size={20} />` from `components/ui/Icon.jsx` (58 Figma icons, `iconData.js`).
  Figma asset URLs (www.figma.com) cannot be downloaded in this environment: use Icon and the files in
  `assets/images` instead.

## Accessibility (WCAG 2.1 AA, root CLAUDE.md section 10)
- Every field has a visible `<label>`; errors use `aria-invalid` + `aria-describedby`.
- Visible focus (global `:focus-visible` ring = Figma Focus/ring). Keyboard reachable menus and dialogs
  (Escape closes, focus returns to the trigger).
- Status chips always show the status text. Amber is a fill with navy text, never text on white.
  Body text navy; text-only colors `text-text-blue|success|danger`.
- Charts and maps get a text alternative or a data table. Images have alt text (decorative: `alt=""`).
- Touch targets at least 44 px. Respect `prefers-reduced-motion`.
- Password inputs use `PasswordField` (eye / eye-off, "Show password" / "Hide password", #45). Fields that set a new
  password add `showStrength` and `person` ({ name, email }) for the meter, and the form refuses `!isStrong(...)` with
  `NOT_STRONG` from `lib/passwordStrength.js` (#44; same rules as the API).
- Maps: pass `onExpand` to `MapView` and render `FullScreenMap` (title, Close/Esc, `aside` = the text alternative list);
  photos open in `PhotoViewerDialog` (always dark via `bg-dark-bg`, arrows, +/- zoom, Esc, no download; #46).

## Routes (#40)
- Public: `/` landing, `/about` (W10, Meet our team, Built with), `/500` (W12), `/staff/sign-in` (role chooser, #52),
  `/staff/sign-in/admin` and `/staff/sign-in/officer` (forms; copy in `pages/auth/staffForms.js`), `/staff/forgot-password`
  (#37: email, then code + new password, back to the form it came from with "Password changed"); any unknown path shows 404 (W11).
- Administrator: `/admin...`, `/admin/about` (W9, version and server status).
- Traffic Officer (#52): `/officer` (W5 Assigned to me), `/officer/reports/:id` (`ReportDetails mode="officer"`), `/officer/about`.
- Both staff roles: `/demo-video`, `/action-log` (the All staff view is admin-only).
- Landing section links are `/#how-it-works`, `/#public-updates`, `/#safety-tips`, `/#faq`; Landing scrolls to the hash.
- Videos (#48): `/demo-video` shows the Administrator and Traffic Officer clips from `GET /app-info` `demoVideos` (own role
  first, "Clip coming soon" without a URL); the landing "Watch the video" section (`/#video`, after How it works) and the
  footer link appear only when `promoVideo.url` is set. `/app` on Vercel redirects to the newest APK (`vercel.json`).
- Landing stats bar reads `GET /public/stats`. Support email: `SUPPORT_EMAIL` in `lib/constants.js`.

## Motion (#41, docs/ui-design/motion-spec.md)
- `lib/motion.js`: GSAP + ScrollTrigger + DrawSVG, tokens (`DUR`, `EASE`), `reveal()`, `countTo()`, `useRefreshOnResize()`.
  Everything goes through `gsap.matchMedia()`: reduced motion = 200 ms fades. Use `fromTo` with explicit end values.
- Public pages: `useReveals(ref)` handles `data-reveal`, `data-reveal-list`, `data-reveal-left`, `data-heading-bar`,
  `data-pop`; landing-only sequences live in `pages/public/useLandingMotion.js`; hero drawing in `HeroRoad.jsx`.
- Admin: CSS `starting:` entrances (rows, bars, dialogs, menus, toasts) and `AnimatedNumber`; no scroll effects.

## Data and roles
- The web is for staff: Administrators and, since Oct 27 (#52, DECISIONS #45), Traffic Officers (who can also use the app).
  Reporters use the Android app; the reporter web screens (R0-R6) stay on the Figma Archive page.
- Login sends `platform: "web"` and the role chosen on the chooser; a staff account on the other role's form is signed
  out again with "This is a ... account" (Figma 465:17972). The API answers 403 `details.code = WRONG_PLATFORM` for a
  Reporter, shown as the "This account uses the mobile app" state with a link to `APK_URL` (`VITE_APK_URL`, default:
  `roadwatch.apk` from the latest GitHub release, #22; switch to roadwatch-ph.me/app once the domain is live, #38).
- Roles are enforced by the API; `RequireRole` only routes.
- Officers see a notification bell in the top bar (assignment alerts; Figma top bar "Bell" property, panel 481:20505,
  empty 483:21192). Administrators get no in-app notifications, so their top bar has no bell (#47).
- Reporter contact details only on screens the API returns them for (admin, assigned officer).
- Public updates, edit profile, change password, action log and admin audit logs exist on the API since Oct 21
  (#23, #25, #27). Pages still show their designed empty/error state when a request fails.
