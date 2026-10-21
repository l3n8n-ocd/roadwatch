# CLAUDE.md: RoadWatch

Primary context file for Claude Code. Source of truth: the user's explicit decisions in the planning conversation (Oct 12-15, 2026). Last updated Oct 20, 2026 (professor's rulings: no anonymous reporting, Reporter and Officer mobile-only, Admin web-only; Brevo email API; project domain; API deploy moved to Phase 2).
Labels used below: **Confirmed** (user decided), **Recommended** (suggested, accepted or not yet rejected), **Pending** (needs a decision), **Unverified** (not checked by anyone).
Claude Code has not inspected the user's repo while this file was written. Always inspect the real files before relying on any path or detail here.

---

## 1. Project Identity and Overview

| Item | Value |
|---|---|
| Project | **RoadWatch**: Development of a Web and Mobile-Based Road Accident Reporting System |
| Course | IT 305 Advance Web Development, BSIT 3I-G1, Bulacan State University (College of Information and Communications Technology) |
| Type | Group project, 4 members, one functional web and mobile system |
| Build window | Oct 12-30, 2026 (system finished Oct 30) |
| Oct 30 | Demo and promotional video due (with the finished system) |
| Oct 31 - Nov 2 | Documentation (PPT user guide, contribution report) and submission |
| Submission | Nov 2, 2026 |
| Repo | Public GitHub repo, monorepo, owned by Lenon's personal account (**not created yet as of Oct 15**; setup steps are in `docs/SETUP-GUIDE.md`) |

**Problem:** road accident reporting is slow and disorganized. The system lets the public report accidents (details, GPS location, photos) from the mobile app and track status, while administrators (web dashboard) and traffic officers (mobile app) verify, assign, manage and report on records. The course text says "website or mobile app" for reporters; the professor ruled Reporter and Traffic Officer mobile-only and Administrator web-only (`docs/DECISIONS.md` #36).

**Team (all confirmed)**

| Member | Role | Owns |
|---|---|---|
| Lenon Adriano | Project Leader, Front-End (Mobile), **sole repo committer** | `mobile/`, CI, repo, final submission |
| Pauline Lapuz | QA Testing (Web and Mobile), Front-End (Web) | `web/`, test plan |
| Carl Ernest Santos | Back-End and Database | `api/`, `database/`, deployment |
| Princess Lorellyn Isip | Documentation Lead | `docs/`, PPT guide, video, contribution report |

**Required deliverables (from the course):** (1) one functional web and mobile system, (2) complete source code, (3) database files or schema, (4) documentation: PPT user guide, video presentation, individual contribution report.

**Grading:** Functionality and completeness 30%, application of advanced web development concepts 20%, UI/UX 15%, database design and integration 10%, documentation 10%, presentation and demo 10%, individual participation and contribution 5%.

---

## 2. Objectives and Scope

Objectives (from the course description): web and mobile reporting; quick digital report form; GPS or manual map location; photo evidence; authority verification and management; report status tracking; centralized database; statistics to identify accident-prone areas; public-authority communication; secure authentication and access control.

**In scope:** everything in section 7 (FR-01 to FR-15), the three roles, web dashboard (Administrator), Flutter app (Reporter and Traffic Officer), deployment, demo video inside the apps, user deactivation.
**Out of scope (Confirmed):** SMS and push notifications, Firebase, anonymous reporting (professor: not required, #35), email verification, Play Store release (APK only), reporter or officer screens on the web, administrator screens on mobile (#36).

---

## 3. Core Development Principles

1. The login-required flow, stack and architecture below are decided. Do not substitute alternatives.
2. Prefer the simplest implementation that satisfies the requirement. The deadline is tight and the team is new to this stack.
3. Never cut: login, report submission, status tracking, admin review. Cut order if time runs short: dashboard map, then charts, then PDF export.
4. Feature freeze on Oct 30 (proposed internal target: no new features after Oct 27).
5. Each member must be able to explain the system, so keep code readable.
6. Repo and database setup are behind the original tracker dates (see section 16). Prioritize unblocking Carl and the foundation steps first.

---

## 4. Technology Stack and Version Constraints

| Layer | Choice | Status |
|---|---|---|
| Web | React + Vite + Tailwind CSS. Suggested: react-router-dom, axios, Recharts, leaflet and react-leaflet. Motion: GSAP + ScrollTrigger (#41, spec in `docs/ui-design/motion-spec.md`) | Confirmed (libraries Recommended; GSAP Confirmed Oct 20) |
| Mobile | Flutter + Dart. Suggested: dio, flutter_map, latlong2, geolocator, image_picker, flutter_secure_storage, provider, video_player | Confirmed (packages Recommended) |
| API | Node.js (>= 22 in `api/package.json`) + Express | Confirmed |
| Validation and security libs | zod, helmet, cors, bcrypt, jsonwebtoken, multer | In starter `package.json` |
| ORM | **Sequelize** (already in starter dependencies). Do not add Prisma | Confirmed |
| Database | MySQL. Host: **Aiven managed MySQL (TLS)**. Local MySQL optional for dev | Confirmed |
| API hosting | **Render** (free web service, sleeps when idle). Blueprint `render.yaml` at the repo root (Node 22, Singapore, `rootDir: api`, health `/api/health`, auto-deploy from `main`); service on Lenon's Render account, operated with Carl (#39); steps in `docs/SETUP-GUIDE.md` Part F. **Live since Oct 20: `https://roadwatch-api-gnky.onrender.com`** (health: `/api/health`) | Confirmed |
| Web hosting | Vercel (Lenon's account; root folder `web`, env `VITE_API_URL=https://roadwatch-api-gnky.onrender.com/api`). **Live since Oct 20: `https://roadwatch-theta.vercel.app`**, also listed in Render's `CLIENT_ORIGIN` | Confirmed Oct 20 |
| Domain | Namecheap `.me` from the GitHub Student Developer Pack, claimed by Lenon (DNS). Used for the email sender, the web app, `api.` on Render and the APK link. Name: `roadwatch-ph.me` (#38) | Confirmed Oct 20 |
| Mobile delivery | Release APK built by GitHub Actions on tag `v*` | Recommended |
| Photos | Cloudinary (store only the URL in `report_photos`) | Confirmed |
| Maps | OpenStreetMap via Leaflet (web) and flutter_map (mobile); Nominatim for address lookup | Confirmed |
| Email | **Brevo transactional email API over HTTPS** (`MAIL_PROVIDER=brevo`, `BREVO_API_KEY`), called with Node's built-in `fetch`. Render's free tier blocks SMTP ports, so Gmail SMTP cannot be used once deployed (#37). Sender on the project domain with SPF/DKIM/DMARC. `MAIL_PROVIDER=log` for local dev and tests. Not implemented yet (Carl, Phase 3); `mailer.js` still has the old Nodemailer SMTP/Resend code, which will be removed | Confirmed Oct 20 |
| Exports | pdfkit (PDF), json2csv (CSV) | Recommended |
| Auth | Own JWT with role middleware | Confirmed |
| CI/CD | GitHub Actions (`api-ci`, `web-ci`, `mobile-ci`); Render and Vercel auto-deploy from `main` | Confirmed |
| Design | Figma for UI/UX (course IT 304W) | Confirmed |

**Rejected, do not reintroduce without approval:** Firebase (all services), Firestore or NoSQL, Prisma, Railway, Google Maps, TiDB Cloud, Gmail SMTP on Render (blocked), React-Bootstrap (Tailwind chosen), SMS and push notifications.

**Environment notes:** development machines include Windows (use Git Bash for `scripts/commit-as.sh`). Node 20 was initially suggested, then replaced by Node >= 22 because Node 20 is end of life.

---

## 5. System Architecture

```
Flutter app (Reporter, Officer) ─┐
                                 ├─► REST API (Express + Sequelize, JWT, role middleware) ─► MySQL (Aiven, TLS)
React web (landing, Admin) ──────┘        ├─► Cloudinary (photos)
                                          ├─► Brevo email API (HTTPS)
                                          └─► PDF/CSV export
Clients ─► OpenStreetMap tiles and Nominatim directly
```

- One REST API serves both clients. JWT access tokens, roles: `reporter`, `admin`, `officer`. Platforms (#36): `reporter` and `officer` sign in on mobile only, `admin` on web only; each app sends `platform` (`web` or `mobile`) at login and the API answers 403 `WRONG_PLATFORM` for the wrong one (API, web and mobile done Oct 20; the mobile app still turns officers away until the officer screens ship in Phase 3).
- Photos are uploaded through the API (multer) to Cloudinary; only URLs go to MySQL.
- The demo video is uploaded to Cloudinary. Both clients read its URL from `GET /api/app-info` (`DEMO_VIDEO_URL` env var on Render). Do not bundle the video into `web/public` or Flutter assets.
- Render's free tier sleeps when idle. Warm the API before demos, recordings and grading.

**API groups (implemented Oct 16 from Carl's backend; contract in `docs/API.md`):**
`/api/auth` (register is public and always creates a Reporter, ignoring any client role; login rejects inactive users), `/api/reports` (create, my reports, track), `/api/admin/reports` (filter, verify, assign, status), `/api/officer/reports` (assigned, remarks, status), `POST /api/users` (admin only, creates Traffic Officers), user role change and deactivate or reactivate (admin only), `/api/dashboard/stats`, `/api/exports`, `/api/app-info`, `GET /api/public/stats` (public totals for the landing, #40).
**Approved Oct 17, not implemented yet:** update own profile (e.g. `PATCH /api/auth/me`) and change own password, for mobile Settings (`docs/DECISIONS.md` #25); `GET /api/public/updates` (public, read-only, verified records only, no reporter fields; see `docs/DECISIONS.md` #23). It feeds the "Public road updates" section of the public web landing page (#24).

---

## 6. Repository Structure

Source: `roadwatch-starter.zip` produced in the planning conversation. The user's repo is **not created yet**, so this is the intended structure, not an inspected one. Check with `ls` first once it exists.

```
roadwatch/
├── .github/   workflows: api-ci.yml, web-ci.yml, mobile-ci.yml; pull_request_template.md; CODEOWNERS (commented out)
├── api/       Express API: server.js, src/{app.js,config,controllers,middleware,models,routes,services,utils}, scripts/seed-admin.js, tests/, .env.example
├── web/       React + Vite + Tailwind. NOT generated in the starter, see web/SETUP.md
├── mobile/    Flutter. NOT generated in the starter, see mobile/SETUP.md
├── database/  schema.sql, seed.sql, local-init.sql   (at repo ROOT, confirmed)
├── docs/      erd/, architecture/, ui-design/, user-guide/, video/, contributions/, DECISIONS.md, SETUP-GUIDE.md, github-issues.md
├── scripts/   commit-as.sh, members.conf, create-issues.sh
└── .gitignore, .gitattributes (Git LFS for *.mp4), .editorconfig, README.md
```

CI workflows skip themselves until `package.json` or `pubspec.yaml` exists in their folder.

---

## 7. Functional Requirements (from the course description)

| ID | Requirement | Description |
|---|---|---|
| FR-01 | User Registration | Create an account with required information |
| FR-02 | User Login | Secure login and logout |
| FR-03 | Accident Reporting | Submit a report with accident details |
| FR-04 | Location Capture | GPS coordinates or manually selected location |
| FR-05 | Evidence Upload | Attach photos and permitted files |
| FR-06 | Report Tracking | Reporters view status of their reports |
| FR-07 | Report Management | Authorized personnel view, review, edit, manage reports |
| FR-08 | Report Verification | Verify reports, flag incomplete or duplicate submissions |
| FR-09 | Notifications | Notify users on submission confirmation and status changes (email only, confirmed) |
| FR-10 | Dashboard | Admins view statistics and report summaries |
| FR-11 | Search and Filtering | By date, location, status, accident type |
| FR-12 | Report Generation | Daily, weekly, monthly, annual summaries |
| FR-13 | User Management | Admins manage accounts and roles (includes deactivate and reactivate) |
| FR-14 | Audit Trail | Record important administrative actions and status changes |
| FR-15 | Data Export | Export permitted reports to PDF or CSV |

**Report fields:** Report ID (system generated), reporter name and contact, accident date and time (required), location text (required), GPS lat/long (optional), accident type (required), vehicles involved (where applicable), injury information (required, includes an Unknown option), description (required), photos (optional), status, date submitted (automatic), assigned officer (if assigned), official remarks (optional).

**Statuses (all 8 confirmed):** Submitted, Under Review, Additional Information Required, Verified, Assigned, In Progress, Resolved/Closed, Rejected (with a recorded reason). **Order (Confirmed Oct 19, course workflow):** the administrator verifies before assigning an officer; officers set In Progress, Additional Information Required and Resolved/Closed (`docs/DECISIONS.md` #30; API change pending for Carl).

**Hard rule from the course:** the system must clearly distinguish a public-submitted report from an officially verified accident record (`reports.record_type`: `public_submission` vs `verified_record`).

**Validation rules (Confirmed):** registration needs full name, unique email, password minimum 8 characters, optional phone. No email verification. Registration always creates the Reporter role. Deactivated users cannot log in, and their reports, history and audit logs stay intact.

---

## 8. User Roles and Permissions

| Role | Can do |
|---|---|
| Reporter (Public User) | Register, log in, submit reports with location and photos, view own history, track status, receive notifications |
| Administrator | Manage user accounts and roles (create officers, change roles, deactivate or reactivate), review and validate reports, assign reports to officers, manage accident categories and settings, monitor activity, generate and export reports, view dashboard |
| Traffic Officer | View assigned reports, verify information, update investigation and response status, add official remarks, record actions taken |

Platforms (Confirmed Oct 20, professor, #36): Reporter and Traffic Officer use the mobile app only; Administrator uses the web dashboard only. One Flutter app serves both mobile roles (home chosen by role).

Account creation (Confirmed): the first Administrator is created with `npm run seed:admin` (reads `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` from `.env`). Administrators then create Traffic Officers inside the system (`POST /api/users`, admin only). Reporters self-register. Reporter personal information shown in the web UI must have access restrictions (course UI spec). An administrator must not be able to deactivate their own account.

---

## 9. Database and Data Management

Schema file: `database/schema.sql` (MySQL, matches `docs/erd/` **except** the approved `is_active` change below). Column types were **proposed during planning** (the course gave none), not mandated.

| Table | Columns (type, notes) |
|---|---|
| roles | role_id PK, role_name VARCHAR(30) unique |
| users | user_id PK, role_id FK, full_name VARCHAR(100), contact_email VARCHAR(120) unique, contact_phone VARCHAR(20) NULL, password_hash VARCHAR(255), **is_active TINYINT(1) NOT NULL DEFAULT 1**, created_at |
| accident_types | type_id PK, type_name VARCHAR(60) unique |
| reports | report_id PK, reporter_id FK (NOT NULL), assigned_officer_id FK NULL, accident_type_id FK, record_type ENUM, accident_date DATE, accident_time TIME, accident_location VARCHAR(255), latitude/longitude DECIMAL(10,7) NULL, vehicles_involved VARCHAR(255) NULL, injury_information ENUM(none, injuries, fatalities, unknown), accident_description TEXT, report_status ENUM(8 statuses), official_remarks TEXT NULL, date_submitted |
| report_photos | photo_id PK, report_id FK (cascade), cloudinary_url VARCHAR(500), uploaded_at |
| report_status_history | history_id PK, report_id FK, changed_by_user_id FK, previous_status NULL, new_status, changed_at |
| notifications | notification_id PK, user_id FK, report_id FK NULL, message, is_read TINYINT(1), created_at |
| audit_logs | log_id PK, user_id FK, action_taken, action_details TEXT NULL, timestamp |

Relationships: roles 1-* users; users 1-* reports (as reporter) and 1-* reports (as assigned officer, optional); accident_types 1-* reports; reports 1-* photos, status history, notifications; users 1-* status history, notifications, audit_logs.

Seed data (`database/seed.sql`): roles Reporter, Administrator, Traffic Officer; accident types Collision, Hit-and-run, Vehicle rollover, Pedestrian accident, Other.

Rules: every status change writes a `report_status_history` row; important admin actions (including deactivate and reactivate) and status changes write `audit_logs`; setting a report to Verified sets `record_type = verified_record`. Do not change tables or columns without approval, because the ERD and the course deliverables depend on them. The `is_active` addition is the only approved change so far.

**Loading the SQL:** `schema.sql` and `seed.sql` contain no `CREATE DATABASE` or `USE` line, so they load into whichever database you are connected to. Aiven: connect to `defaultdb` and run `schema.sql` then `seed.sql`. Local MySQL: run `database/local-init.sql` once (creates `roadwatch`), then run both files against `roadwatch`. Both files are safe to re-run. Aiven is **not created yet**.

`users.is_active` is now in `database/schema.sql` and `docs/erd/` (starter v2). Verified by loading into a local MariaDB 10.11 test server (not MySQL 8, not Aiven).

---

## 10. UI/UX and Design Guidelines

- **Responsive and accessibility target (Confirmed): fully responsive web and WCAG 2.1 AA.** This means labels on all form fields, visible keyboard focus, full keyboard navigation, alt text on images, status never shown by color alone (chips need text), minimum touch targets, and sufficient color contrast. Plan extra testing time (Pauline). On mobile, follow Flutter semantics labels and sufficient text scaling.
- Palette (Confirmed, navy and white): navy `#0B2545`, accent blue `#4A7FB5`, amber `#F2A900` (warnings, pending), success `#2E9E6B`, danger `#D64545`, light gray `#F4F6F9`, white.
- **Contrast (Confirmed Oct 17, WCAG formula):** amber on white 2.0:1, accent blue on white 4.2:1, danger on white 4.4:1 and success on white 3.4:1 all fail for normal text. Rules: body text is navy (15.4:1 on white); amber is a fill with navy text on it (7.7:1), or text on navy only; no normal-size text on accent blue or danger fills. Approved text-only variants (Pauline, Oct 17): `text/blue #2F6296` (6.35:1), `text/success #1F6F4A` (6.12:1), `text/danger #B42B2B` (6.32:1). Brand colors stay for fills, icons and large shapes. Full pair table: Figma → Foundations → Contrast checks (`docs/ui-design/figma-index.md`).
- **Themes (Confirmed Oct 17):** Light and Dark on web and mobile, default follows the system (`docs/DECISIONS.md` #26). Dark values and their contrast table are in Figma → Foundations. Mobile bottom nav: Home, My reports, Notifications, Settings; the Demo Video screen opens from Settings (#25). The web opens on a public landing page (#24). Staff web top bar: a Light/Dark switch, then the user menu, which opens a dropdown (account, Edit profile, Change password, Action log, Contact support, About); Log out is a separate button beside it (#27). The Action log endpoints (own actions; admin-only all staff) are approved in design, not built.
- Type: Poppins Bold headings, Inter body. 8-pt spacing grid, 16 px radius, soft shadows.
- Status chips are colored per status and always include the status text. Keep one consistent title, status-chip position and navigation across screens.
- **Mobile screens (course spec plus plan):** M0 login/register; M1 home with prominent "Report an Accident"; M2 accident details form; M3 GPS and map location; M4 camera/photo upload; M5 submission confirmation with Report ID; M6 report tracking and history; notifications; Demo Video screen. **Officer (added Oct 20, #36, to design in Figma first):** assigned reports list, report details with actions (In Progress, Additional Information Required, Resolved/Closed, remarks), Open in Maps, Notifications, Settings.
- **Web screens (Administrator only, #36):** public landing page with road updates, hotlines and a Download the app (APK) button; W1 Administrator sign-in (the role chooser #28 and reporter screens R0-R6 #29 are superseded and move to a Figma "Archive" page; W5 officer queue too); W2 admin dashboard (summary cards: total, pending, verified, closed; trend chart; type chart; map; recent reports); W3 report management (search, filters, table); W4 report details (info, map, photo viewer, restricted reporter info, assign officer, status and remarks, Verified/Public badge); W5 officer queue; W6 users and settings (create officer, change role, deactivate or reactivate); W7 reports and export; Demo Video page; W8 Action log and W9 About (from the user menu, #27).
- Charts and the map need text alternatives or data tables to meet AA.

---

## 11. Security and Privacy Requirements

- Hash passwords with bcrypt. JWT for auth. Enforce role checks on every protected endpoint server side, never only in the UI.
- Login and token verification must reject deactivated users (`is_active = 0`).
- The register endpoint must ignore any role sent by the client. Only admins may create officers, change roles or deactivate users.
- Validate all input (zod). Use parameterized queries or the ORM. Restrict file uploads (type and size).
- Use helmet and cors. The plan also lists `express-rate-limit`, which is **not yet** in `package.json`.
- **The repo is public.** Never commit `.env`, API keys, DB passwords, JWT secret, Gmail app password, Resend or Cloudinary keys, the Aiven CA file, or any real credential. Use placeholders in docs. `.env` is git-ignored; `*.pem`, `*.key` and `*.crt` are git-ignored in starter v2.
- Contact details of reporters must have access restrictions in the UI.
- An audit trail is required (FR-14).

---

## 12. Coding Standards and Conventions

- `.editorconfig`: UTF-8, LF line endings, 2-space indent.
- Commit message prefixes: `feat`, `fix`, `docs`, `chore`, optionally scoped like `feat(api): ...`.
- Node: CommonJS is used in the starter (`require`). Match it unless told otherwise.
- Keep routes, controllers, services and middleware separated as in the `api/src` folders. Use Sequelize models in `api/src/models`.
- API paths are prefixed with `/api`. Return JSON errors with a consistent shape.
- Reuse existing files and naming. Do not reorganize folders without approval.

---

## 13. Development Environment and Setup

- Tools: Git, Node >= 22, a MySQL client (Workbench, DBeaver or CLI), Flutter SDK, Android tooling for APK.
- **API:** `cd api`, copy `.env.example` to `.env`, fill values, `npm install`, `npm run dev`.
- **Aiven TLS:** set `DB_SSL=true` and either `DB_SSL_CA` (certificate text with `\n`) or `DB_SSL_CA_PATH`. `src/config/dbConfig.js` builds the connection settings.
- **Email (target, #37):** `MAIL_PROVIDER=brevo`, `BREVO_API_KEY` (Brevo → SMTP & API → API keys; Render env only), `MAIL_FROM` (an address on the project domain verified in Brevo). Until Carl's change lands, `mailer.js` still reads the old SMTP settings.
- **Web:** not generated yet. Run once: `cd web && npm create vite@latest . -- --template react`, then install deps and Tailwind per `web/SETUP.md`. Env: `VITE_API_URL=http://localhost:5000/api`.
- **Mobile:** not generated yet. Run once: `cd mobile && flutter create . --org com.roadwatch --project-name roadwatch_mobile`, then add packages per `mobile/SETUP.md`.
- Env variable names live in `api/.env.example` (PORT, CLIENT_ORIGIN, DB_*, JWT_*, ADMIN_*, CLOUDINARY_URL, MAIL_PROVIDER, MAIL_FROM, RESEND_API_KEY, SMTP_*, DEMO_VIDEO_URL). Never put real values in the repo.

---

## 14. Essential Commands

| Where | Command | Notes |
|---|---|---|
| api | `npm run dev` | Node watch mode |
| api | `npm start` | `node server.js`, default port 5000 |
| api | `npm test` | `node --test` (auto-discovers `tests/*.test.js`) |
| api | `npm run lint` | placeholder echo only, no linter configured |
| api | `npm run seed:admin` | creates the first Administrator from `.env` |
| api | `npm run check:db` | connects with `.env` DB settings, prints table count, seed counts and whether `users.is_active` exists |
| web | `npm run dev`, `npm run build`, `npm run lint` | after Vite is generated |
| mobile | `flutter pub get`, `flutter analyze`, `flutter run`, `flutter build apk --release` | after Flutter is generated |
| repo | `bash scripts/commit-as.sh <member> "<message>" [paths]` | commits on behalf of a member (Git Bash) |
| repo | `bash scripts/create-issues.sh` | creates GitHub labels, milestones and 30 issues once; needs `gh` (same text in `docs/github-issues.md`) |

Health checks: `GET /api/health` returns `{"status":"ok","service":"roadwatch-api"}`; `GET /api/app-info` returns `{"demoVideoUrl": ...}`.

---

## 15. Testing and Quality Assurance

- Automated API tests: 18 (JWT guard, health/app-info, login platform validation, and a 13-step database flow covering register, roles, the login platform check, report lifecycle, officer scoping, deactivation, notifications, dashboard, exports, upload validation). All 18 passed on Oct 20 on Node 22 + local MariaDB 10.11 (the dashboard step also checks `GET /public/stats`, #40). The database flow only runs with `RUN_DB_TESTS=true` and a local database; CI runs it against a MySQL 8 service. Passed on Node 22 + MariaDB 10.11, not yet on the user's repo or MySQL 8.
- Pauline owns a manual test plan: one test case per FR-01 to FR-15 (steps, expected, actual, pass/fail), executed on the deployed system around Oct 29. Add accessibility checks for the WCAG AA target (keyboard-only pass, contrast check, screen-reader labels, phone-width layout).
- CI runs lint, test and build per folder on PRs and pushes to `dev` and `main`.
- `seed-admin.js`, `mailer.js` and `dbConfig.js` were syntax-checked only. They have **not** been run against a real database or SMTP service.
- Always report tests you could not run.

---

## 16. Current Implementation Status

**Delivered as planning artifacts (not application features):** ERD (DOT, Mermaid, PNG, SVG), architecture diagram, starter repo zip, GitHub issues checklist and `create-issues.sh`, Canva kickoff and tracker decks, decisions log.

**Starter code that exists (inside the zip only):** Express app with `/api/health` and `/api/app-info`; `dbConfig.js`; `mailer.js`; `seed-admin.js`; `schema.sql`; `seed.sql`; CI workflows; `commit-as.sh`. Starter v2 also adds `local-init.sql`, `check-db.js`, `create-issues.sh` and `docs/SETUP-GUIDE.md`.

**Implemented in `api/` (Oct 16, merged from Carl's `roadwatch_backend`, aligned to the approved schema):** auth (register/login/me, JWT, role middleware), Sequelize models, reporter endpoints (submit, my reports, tracking, photo upload code), admin and officer endpoints, user management (create officer, role, deactivate/reactivate), notifications (in-app + email code), dashboard stats, period summaries, CSV/PDF export, rate limiting, input validation. 16 automated tests pass on a local MariaDB 10.11 database.
**Verified only locally:** everything above ran against local MariaDB, including TLS (`DB_SSL=true` with a CA file) and `seed:admin`. **Not verified:** Aiven itself, Cloudinary upload, Gmail SMTP, Render deployment.
**Implemented Oct 19 from the Figma high-fidelity prototype (Foundations, Components, Mobile, Web, Flows; DECISIONS #33):**
- `web/`: React + Vite + Tailwind 4 app with every Web frame (W0-W9, Demo video), light/dark tokens generated from Figma, component library, role-guarded routes. `npm run lint` and `npm run build` pass; every route was smoke-tested in Chromium at 1440 and 390 px with a **mocked** API. **Oct 20 (#36):** Administrator only; the reporter screens (R0-R6), officer queue and officer view were removed, sign-in sends `platform: "web"` and shows the mobile-only-account state, and the landing calls to action download the APK (smoke-tested again with a mocked API, lint and build pass).
- `mobile/`: Flutter (Android) app with every Mobile frame (M0-M6, Notifications, Settings and its sub-screens). Reporters only. `flutter analyze` clean, `flutter test` passes (widget tests with a fake API).
**Not verified:** either app against the real API, map tiles and Nominatim (blocked in the build environment), camera/GPS on a device, the release APK (no Android SDK in the build environment).
**Deployment (Oct 20):** API on Render at `https://roadwatch-api-gnky.onrender.com` (Blueprint `render.yaml`, Part F; `/api/health` answers, reported by Lenon) and web on Vercel at `https://roadwatch-theta.vercel.app`, both deploying from `main`. Not yet checked end to end: admin sign-in on the live site, a reporter submitting from a phone, Cloudinary uploads (the build environment cannot reach either host). **Prototype revisions #40 (Oct 20, coded):** web landing (Light/Dark switch, live stats bar from `GET /api/public/stats`, full hotlines card, FAQ chat, QR placeholder), public `/about` with Meet our team, 404 and 500 pages (error boundary + 5xx on a page's main request), admin About at `/admin/about`, log-out confirmation (web and mobile), Register note. Verified with lint, build, a Playwright smoke test on a mocked API (1440 and 390, dark mode), 18/18 API tests on local MariaDB, and `flutter analyze` + `flutter test`; not yet checked on the live site. **Motion #41 (Oct 21, coded):** GSAP + ScrollTrigger on the public web pages (road-and-pin hero, parallax, sticky shrinking header, count-ups, reveals, FAQ chat), subtle admin motion (count-ups, chart draw, CSS entrances), Flutter motion helpers (`rw_motion.dart`: entrances, pulses, shared-axis page transitions, press scale, pin drop); reduce motion gives short fades everywhere. Verified with lint, build, Playwright (1440/390, reduced motion) and `flutter test` (29 pass); not yet seen on a real phone. Endpoints the UI already calls but the API lacks: `GET /public/updates`, `PATCH /auth/me`, change password, `GET /auth/me/activity`, `GET /admin/audit-logs` (screens show their designed unavailable state).

**Setup status (Confirmed by the user, Oct 15, 22:35):**
- GitHub repo: **not created yet**, so the starter zip has not been pushed and `members.conf` is not filled.
- Aiven MySQL: **not created yet**, so the schema and seed are not loaded.
- Schedule impact: the tracker's Oct 14-15 foundation steps (repo, Aiven, API skeleton) are behind. Oct 16 milestone is at risk. Do these first, in order: create repo, create Aiven and load schema (with `is_active`), run API skeleton and `/api/health`.
- GitHub issues: not created (they require the repo first).

---

## 17. Known Issues and Technical Debt (remaining items are to-do)

- Fixed in starter v2 (Oct 16): `*.pem` ignored, `api/scripts/check-db.js` added (`npm run check:db`), `is_active` added to schema and ERD, Gmail SMTP defaults in `.env.example` and `mailer.js`. Verified locally only; confirm they exist in the real repo.
- Carl's pasted `.env` held real Aiven and Cloudinary credentials (Oct 16): rotated (confirmed Oct 20). Revoke the Gmail app password once Brevo works.
- Render's free tier sleeps when idle. The Aiven free plan limits were not verified in the conversation.
- Git LFS: the user relies on 1 GB free storage. Bandwidth limits and "Download ZIP" behavior (LFS pointers only) are unverified. Submit the MP4 as a separate file too.
- An earlier starter had `npm test` set to `node --test tests/`, which fails on Node 22. It was fixed to `node --test`. If an old copy exists, update it.
- WCAG AA contrast of the palette was checked on Oct 17 (see section 10); the approved text variants must also be used in code.
- Course document inconsistencies: duplicated section numbers ("5"), section listed as 3H/3I/3J vs 3I G1/G2 (resolved: BSIT 3I-G1).

---

## 18. Explicit Restrictions and Prohibited Changes

Do not do the following without the user's approval:

1. Change the stack, database host, hosting approach, email approach or notification channels (see section 4).
2. Add Firebase, Prisma, SMS, push notifications or email verification.
3. Allow anonymous reporting or make `reports.reporter_id` nullable.
4. Change table names, columns or relationships in `database/schema.sql` or the ERD. The only approved change is adding `users.is_active`.
5. Move `database/` into `api/`.
6. Bundle the demo video inside `web/public` or Flutter assets.
7. Squash-merge `dev` into `main` (it removes member authorship). Use merge commits.
8. Rewrite, amend, rebase or force-push history.
9. Commit secrets, `.env` files or certificates.
10. Make commits under a member's identity on your own initiative. Lenon is the only committer. Member work is committed with `scripts/commit-as.sh` using each member's no-reply email so credit stays correct.
11. Add new features after the freeze (target Oct 30).
12. Run `scripts/create-issues.sh` more than once.

---

## 19. Pending Tasks and Priorities

**Open decisions (only these remain)**
- **Domain:** `roadwatch-ph.me` (Namecheap `.me`, Lenon); availability not checked yet (#38).
- **Column types and ENUM values:** proposed during planning. Carl may finalize them when loading the schema; tell Lenon so the ERD stays in sync.
- **Aiven free-plan limits:** not verified.

**Decided on Oct 15:** Sequelize, Render, `is_active` for deactivation, full responsive and WCAG AA target (Gmail SMTP was replaced by the Brevo API on Oct 20).
**Decided on Oct 20:** anonymous reporting not required (#35); Reporter and Officer mobile-only, Administrator web-only (#36); Brevo email API (#37); Namecheap `.me` domain (#38); Phase 2 (Oct 21) = core only: Render deploy (Blueprint), platform check, web admin-only, reporter on mobile seen by admin on web; officer app, Brevo and endpoints #23/#25/#27/#30 in Phase 3; Figma Archive and officer frames now (#39).

**Immediate next steps (in order)**
Follow `docs/SETUP-GUIDE.md` (Parts A to D, with troubleshooting).
1. Lenon: create the public repo, fill `members.conf` with no-reply emails, push `main` and `dev`, protect `main`, block squash merges, run `scripts/create-issues.sh` once, run the author test.
2. Carl: create Aiven MySQL, load `schema.sql` then `seed.sql` into `defaultdb`, run `npm test`, `npm run check:db` and `/api/health` in `api/`.
3. Lenon: verify Carl's evidence, commit his files with `commit-as.sh`, close the matching issues.
4. Re-plan the milestone dates if needed. Oct 16 foundation target is today.

**Build order (30-step tracker; owners and dates are Recommended internal checkpoints, fixed dates are Oct 12, Oct 30, Nov 2)**

| Phase / milestone | Work | Main owners |
|---|---|---|
| 0 Prep (Oct 13-14) | Kickoff, members.conf with no-reply emails, DECISIONS.md | Lenon, Princess |
| 1 Foundation (by Oct 16, at risk) | Public repo, Aiven MySQL with schema and seed, API skeleton, Figma wireframes, generate Vite and Flutter projects, professor question | Lenon, Carl, Pauline, Princess |
| 2 Core flow (by Oct 21) | Register/login/JWT/roles/admin seed, report submission and Cloudinary upload, mobile register/login/report form, web login/list/details, start test plan | Carl, Lenon, Pauline |
| 3 Workflows (by Oct 26) | Admin/officer endpoints and user management (incl. deactivate), web admin pages, mobile tracking and notifications, email via Nodemailer + Gmail SMTP, dashboard and exports, demo video feature | Carl, Pauline, Lenon |
| 4 Deploy and test (by Oct 30) | Deploy API to Render, Aiven and web to Vercel; record and publish the demo and promotional video (MP4, every member speaks; Cloudinary, Git LFS, `DEMO_VIDEO_URL`); APK from tag; full test plan including accessibility checks; bug fixes only; freeze and tag | Carl, All, Lenon, Pauline |
| 5 Docs (Oct 31-Nov 2) | PPT guide, contribution report, final submission check | Princess, Lenon |

Done-when targets: Oct 16 the DB has 8 tables and API health passes; Oct 21 a reporter submits on mobile and an admin sees it on web; Oct 26 the full lifecycle works and emails send.

**Video (Confirmed):** due **Oct 30** (Confirmed Oct 20: tracker step 20 in Phase 4, owner All; `docs/DECISIONS.md` #34). MP4, any length (Documentation Lead decides), covering technologies, demo, database and architecture, and challenges; every member participates. Stored at `docs/video/roadwatch-demo.mp4` (Git LFS) and shown inside web and mobile via `/api/app-info`.

---

## 20. Instructions for Claude Code

**Before changing anything**
- Inspect the existing files first (`ls`, read the relevant folder, check `package.json`, `database/schema.sql`, `docs/DECISIONS.md`). Do not assume this file is up to date with the repo.
- Understand the current architecture and reuse existing components, functions, naming and dependencies. Avoid rewrites, duplicate implementations and unrelated edits.
- Preserve working functionality while adding requirements.

**While implementing**
- Follow the stack and restrictions above. Validate inputs, handle errors with proper HTTP status codes, and enforce authorization on the server.
- Apply security best practices to auth, database access and configuration. Use placeholders for secrets and never print or commit real values.
- Build UI to the WCAG AA target in section 10.
- Implement only what is asked. Keep changes small and reviewable.

**Verification and honesty**
- Test relevant changes (`npm test`, build, lint, run the endpoint). State exactly what you ran and the result, and list tests you could not run (for example anything needing Aiven, Cloudinary, Gmail SMTP or a device).
- Never claim a feature works unless it is implemented and verified. Do not describe planned work as done.

**Ask or explain first when**
- An unresolved decision affects architecture or behavior (anonymous reporting).
- A change would touch the schema (beyond `is_active`), auth model, stack or any restriction in section 18. Explain the change and wait for approval.

**Git and docs**
- Do not run `git commit` or `git push` unless the user asks. If asked to commit work for a teammate, use `scripts/commit-as.sh`.
- Update `docs/DECISIONS.md` and this file when a decision or requirement changes. Update `docs/contributions/handoff-log.csv` only through `commit-as.sh`.

**Nested files:** `api/CLAUDE.md`, `web/CLAUDE.md` and `mobile/CLAUDE.md` exist. Suggested, not yet created: `database/CLAUDE.md` (schema rules, migration policy). Keep the root file as the single source for project-wide decisions. Create them only once real code exists in those folders.

---

## Remaining Gaps (summary)

| Item | State |
|---|---|
| Anonymous vs login reporting | Closed Oct 20: not required, login stays (#35) |
| Palette contrast for WCAG AA | Checked Oct 17; text variants approved (section 10) |
| Column types, ENUM values, nullable choices | Proposed during planning, not course-mandated |
| Aiven free-plan limits | Not verified |
| Git LFS bandwidth and ZIP behavior | Not verified |
| Repo, Aiven, members.conf, GitHub issues | Not created yet (confirmed) |
| `is_active`, `*.pem`, `check-db.js` | Added in starter v2; unverified in the user's real repo |
