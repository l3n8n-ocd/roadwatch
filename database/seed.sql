-- Roles and accident types. Run this after schema.sql, against the same database (no USE line on purpose).
-- Safe to run more than once (INSERT IGNORE).

INSERT IGNORE INTO roles (role_name) VALUES ('Reporter'), ('Administrator'), ('Traffic Officer');

INSERT IGNORE INTO accident_types (type_name) VALUES
  ('Collision'), ('Hit-and-run'), ('Vehicle rollover'), ('Pedestrian accident'), ('Other');

-- Accounts: the first Administrator is created with `npm run seed:admin` in /api (password hashed with bcrypt).
-- The Administrator then creates Traffic Officer accounts inside the system. Reporters self-register.
