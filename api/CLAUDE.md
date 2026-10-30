# api/CLAUDE.md

API conventions. Project-wide rules stay in the root `CLAUDE.md`. Endpoint contract: `docs/API.md`.

- CommonJS, Express, Sequelize. Layers: `routes/` (URLs, validation, role checks) then `controllers/` (HTTP) then `services/` (business rules) then `models/`.
- Tables come ONLY from `database/schema.sql`. Models in `src/models/index.js` mirror it exactly. Do not add columns, enum values or tables without approval (root CLAUDE.md section 18).
- Constants (roles, 8 statuses, injury values) live in `src/config/constants.js`. Do not retype them elsewhere.
- Every status change goes through `services/statusService.js` (history + audit + notification in one transaction).
- v1.2.0 (DECISIONS #49, #50): priority rule in `services/priorityService.js` (keep the migration's SQL CASE in step);
  nearby on-duty officers in `services/dispatchService.js` (duty, alerts, respond with a row lock, confirm/reject on
  scene, `dispatchSummaries` for staff responses); admin settings in `services/settingsService.js` (`app_settings`).
  Reporter responses never include `priority`, `priority_source` or `dispatch` (`reportService.serialize`).
- Schema changes for an existing database go in `database/migrations/` and `scripts/migrate.js` (`npm run migrate`).
- Validation is zod in `routes/schemas.js`. Role checks use `allowRoles(...)` in `routes/index.js`. The user is re-loaded from the database on every request (deactivation is immediate).
- Return `{ success, data }` or throw `HttpError(status, message)`.
- New passwords must be Strong (#44): call `assertStrongPassword(password, { name, email }, field)` from `utils/passwordStrength.js` in any endpoint that sets one. Keep the web and Dart copies in step.
- Tests: `npm test`. Database tests run only with `RUN_DB_TESTS=true` and a local DB (never Aiven; the test refuses non-local hosts).
- Never print or commit values from `.env`.
