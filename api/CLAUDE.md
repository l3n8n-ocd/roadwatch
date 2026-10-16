# api/CLAUDE.md

API conventions. Project-wide rules stay in the root `CLAUDE.md`. Endpoint contract: `docs/API.md`.

- CommonJS, Express, Sequelize. Layers: `routes/` (URLs, validation, role checks) then `controllers/` (HTTP) then `services/` (business rules) then `models/`.
- Tables come ONLY from `database/schema.sql`. Models in `src/models/index.js` mirror it exactly. Do not add columns, enum values or tables without approval (root CLAUDE.md section 18).
- Constants (roles, 8 statuses, injury values) live in `src/config/constants.js`. Do not retype them elsewhere.
- Every status change goes through `services/statusService.js` (history + audit + notification in one transaction).
- Validation is zod in `routes/schemas.js`. Role checks use `allowRoles(...)` in `routes/index.js`. The user is re-loaded from the database on every request (deactivation is immediate).
- Return `{ success, data }` or throw `HttpError(status, message)`.
- Tests: `npm test`. Database tests run only with `RUN_DB_TESTS=true` and a local DB (never Aiven; the test refuses non-local hosts).
- Never print or commit values from `.env`.
