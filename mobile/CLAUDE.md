# mobile/CLAUDE.md: RoadWatch mobile (Flutter, Android)

Project-wide rules live in the root `CLAUDE.md`. This file covers the Flutter app only.
One app for **Reporters** and (from Phase 3) **Traffic Officers**; Administrators use the web (#36).
Login sends `platform: "mobile"`: the API answers 403 `WRONG_PLATFORM` for Administrators (shown as
"Use the RoadWatch website"). Officers pass the API check but the app keeps no token for them until the
officer screens (Figma O1-O6, Flow C) are built; see `AuthFailure.officerAccount`.

## Source of design
- Figma file `psx52NYL69RkycK7Z44EAb`: Foundations (90:2), Components (90:3), **Mobile (90:4)**, Flows (90:6).
  Node IDs for every frame: `docs/ui-design/figma-index.md`. Each placeholder screen names its frames.
- Build each screen from `get_design_context` on its frame (React/Tailwind output: translate to
  Flutter with the widgets below; never paste absolute positions). Figma asset URLs cannot be
  downloaded here: use `RwIcon` and `assets/images`.
- Pauline's draft page (0:1) is low fidelity. Do not implement from it.

## Commands
```bash
export PATH=/opt/flutter/bin:$PATH        # in this environment
flutter pub get
flutter analyze                          # must report no issues
flutter test                             # test/smoke_test.dart
flutter run --dart-define=API_URL=http://10.0.2.2:5000/api      # emulator -> local API (default)
flutter build apk --release --dart-define=API_URL=https://roadwatch-api-gnky.onrender.com/api
```
`dart format` uses `page_width: 110` (analysis_options.yaml).

## Structure
```
lib/
  main.dart, app.dart        providers, light/dark themes, reduce motion, auth-driven navigation
  routes.dart                Routes.* names + onGenerateRoute (private routes fall back to login)
  core/config.dart           API_URL dart-define, timeouts (Render free tier wakes slowly)
  core/constants.dart        Roles, Statuses (8), injuryOptions, RecordTypes, PhotoRules, Hotlines, RwImages
                             (mirrors web/src/lib/constants.js)
  core/format.dart           formatDate, formatDateTime, formatAccidentDateTime, formatRelative, reportCode
  core/api/                  ApiClient (dio, Bearer token, unwraps {success,data}, ApiException),
                             RoadWatchApi (one method per endpoint), models.dart, token_storage.dart
  core/state/                AuthProvider, SettingsProvider, NotificationsProvider
  core/services/             LocationService (geolocator)
  core/theme/tokens.dart     GENERATED from Figma variables: RwColors (light/dark), RwSpace, RwRadius,
                             RwSize, RwType, RwShadow. Do not hand-edit hex values.
  core/theme/app_theme.dart  Material 3 ThemeData for both modes
  core/widgets/              Figma components (import widgets.dart)
  features/<area>/           one file per screen; features/report/report_draft.dart holds the 3-step form
assets/icons/                56 Figma icons as SVG (stroke recolored by RwIcon)
assets/images/               emblem.png, hero-street.jpg, pnp-seal.png, bfp-seal.png
assets/fonts/                Inter 400/500/600, Poppins 700 (bundled TTF, OFL)
```

## Widgets (lib/core/widgets)
`RwButton` (primary/secondary/destructive, 48 px, `icon`, `loading`), `RwIconButton` (needs
`semanticLabel`, light/dark tone, `badgeCount`), `RwTextField` / `RwTextarea`, `RwSelect<T>`,
`RwDateTimeField.date/.time` (YYYY-MM-DD, HH:MM), `RwStatusChip`, `RwRecordBadge`, `RwReportCard`
(`.fromReport`), `RwTimelineItem`, `RwPhotoTile`, `RwMap` (OSM + attribution; pin / no pin /
`locating`), `RwToast` + `showRwToast`, `RwEmptyState` (`.noReports/.noResults/.error/.videoComingSoon`),
`RwSkeleton*`, `RwTopBar.home/.inner`, `RwBottomNav` + `RwTab`, `RwNotificationItem`, `RwStepper`,
`RwSwitch`, `RwSettingsRow` (`.navigation/.toggle/.info/.destructive`), `RwDialog` +
`showRwConfirmDialog`, `RwLogo`, `RwPressable` (base for anything tappable, scales to 98% when pressed).
Motion (#41): `RwMotion` tokens, `RwEntrance` (+ `.listItem`, 40 ms stagger, max 8), `RwPulse` (stops after N),
`RwDrawIn`, `RwSharedAxisPageTransitionsBuilder` (app.dart). All respect `disableAnimations` (short fades).

## Rules
- Colors only through `RwColors.of(context)`; text styles from `RwType`; spacing `RwSpace`.
  Never hard-code hex values (dark mode depends on the tokens).
- Body text `textPrimary`; amber is a fill (navy text on it), never text on white; text-only
  colors `textBlue/textSuccess/textDanger`.
- Accessibility (WCAG 2.1 AA): every field has a visible label; every icon-only control has a
  `semanticLabel`; touch targets at least 48; status never by color alone (chips show text);
  map and images have text alternatives; honour Reduce motion (`MediaQuery.disableAnimationsOf`).
- Tabs live in `HomeShell` (switch with `HomeShell.selectTab`); other screens are pushed with
  `Navigator.pushNamed(context, Routes.x, arguments: ...)`.
- API errors: catch `ApiException` and show `e.message` (friendly); field errors via `e.fieldError(name)`
  (e.g. a wrong current password on Change password).
- Tracking shows the actor's role, never staff names. Photos upload after the report is created.
- Do not bundle the demo video; read `demoVideoUrl` from `GET /api/app-info`.
