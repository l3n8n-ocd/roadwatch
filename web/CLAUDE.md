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
  context/             AuthContext (Administrator login with platform "web", logout), ThemeContext
  lib/constants.js     ROLES, STATUSES, ADMIN_STATUSES, INJURY_OPTIONS, HOTLINES, homePathFor(), APK_URL
  lib/format.js        formatDate, formatDateTime, reportCode (RW-000128)
  components/ui/       Figma Components page, one file per component (Button.jsx, StatusChip.jsx...)
  layouts/             StaffLayout (sidebar + top bar + user menu, Log out confirm), AccountDialogs,
                       PublicLayout (public header with Light/Dark switch + footer; landing, /about, 404, 500)
  components/ErrorBoundary.jsx  shows the 500 page (W12) when a page crashes
  lib/useServerError.js         a page's main request with a 5xx re-throws into the ErrorBoundary
  pages/<area>/        one file per screen; App.jsx holds every route
  assets/images/       emblem.png, hero-street.jpg, brand-panel.jpg, pnp-seal.png, bfp-seal.png
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
- Icons: `<Icon name="map-pin" size={20} />` from `components/ui/Icon.jsx` (56 Figma icons, `iconData.js`).
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

## Routes (#40)
- Public: `/` landing, `/about` (W10, Meet our team), `/500` (W12), `/staff/sign-in`; any unknown path shows 404 (W11).
- Administrator: `/admin...`, `/demo-video`, `/action-log`, `/admin/about` (W9, version and server status).
- Landing section links are `/#how-it-works`, `/#public-updates`, `/#safety-tips`, `/#faq`; Landing scrolls to the hash.
- Landing stats bar reads `GET /public/stats`. Support email: `SUPPORT_EMAIL` in `lib/constants.js`.

## Data and roles
- The web is for Administrators only (#36). Reporters and Traffic Officers use the Android app; their old
  web screens (R0-R6, W5, officer W4) were removed on Oct 20 and live on the Figma Archive page.
- Login sends `platform: "web"`. The API answers 403 `details.code = WRONG_PLATFORM` for other roles, shown
  as the "This account uses the mobile app" state with a link to `APK_URL` (`VITE_APK_URL`, default: latest
  GitHub release; switch to roadwatch-ph.me/app once the domain is live, #38).
- Roles are enforced by the API; `RequireRole` only routes.
- Reporter contact details only on screens the API returns them for (admin, assigned officer).
- Endpoints not built yet (public updates, edit profile, change password, action log, admin audit logs):
  call them through `endpoints.js` and show the designed empty/error state when they fail.
