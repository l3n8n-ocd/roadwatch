-- Roles and accident types. Run this after schema.sql, against the same database (no USE line on purpose).
-- Safe to run more than once (INSERT IGNORE).

INSERT IGNORE INTO roles (role_name) VALUES ('Reporter'), ('Administrator'), ('Traffic Officer');

INSERT IGNORE INTO accident_types (type_name) VALUES
  ('Collision'), ('Hit-and-run'), ('Vehicle rollover'), ('Pedestrian accident'), ('Other');

-- Default settings (v1.2.0): nearby officers within 5 km are alerted (#57).
INSERT IGNORE INTO app_settings (setting_key, setting_value) VALUES ('alert_range_km', '5');

-- Accounts: the first Administrator is created with `npm run seed:admin` in /api (password hashed with bcrypt).
-- The Administrator then creates Traffic Officer accounts inside the system. Reporters self-register.
