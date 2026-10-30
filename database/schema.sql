-- RoadWatch schema (MySQL). Matches docs/erd/erd.png.
-- An existing database from before v1.2.0 is upgraded with `npm run migrate` in /api (database/migrations/).
-- This file has no CREATE DATABASE or USE line on purpose: it loads into whichever database you are connected to.
--   Aiven:  connect to `defaultdb` (the database Aiven gives you), then run this file.
--   Local:  run database/local-init.sql once, then run this file against `roadwatch`.

CREATE TABLE IF NOT EXISTS roles (
  role_id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role_name VARCHAR(30) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS users (
  user_id       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role_id       INT UNSIGNED NOT NULL,
  full_name     VARCHAR(100) NOT NULL,
  contact_email VARCHAR(120) NOT NULL UNIQUE,
  contact_phone VARCHAR(20) NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES roles(role_id)
);

CREATE TABLE IF NOT EXISTS accident_types (
  type_id   INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  type_name VARCHAR(60) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS reports (
  report_id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  reporter_id          INT UNSIGNED NOT NULL,
  assigned_officer_id  INT UNSIGNED NULL,
  accident_type_id     INT UNSIGNED NOT NULL,
  record_type          ENUM('public_submission','verified_record') NOT NULL DEFAULT 'public_submission',
  accident_date        DATE NOT NULL,
  accident_time        TIME NOT NULL,
  accident_location    VARCHAR(255) NOT NULL,
  latitude             DECIMAL(10,7) NULL,
  longitude            DECIMAL(10,7) NULL,
  vehicles_involved    VARCHAR(255) NULL,
  injury_information   ENUM('none','injuries','fatalities','unknown') NOT NULL DEFAULT 'unknown',
  accident_description TEXT NOT NULL,
  report_status        ENUM('Submitted','Under Review','Additional Information Required','Verified',
                            'Assigned','In Progress','Resolved/Closed','Rejected') NOT NULL DEFAULT 'Submitted',
  official_remarks     TEXT NULL,
  -- Priority (#54): set from the accident type and injuries ('auto'); an administrator can override it ('admin').
  priority             ENUM('Low','Medium','High','Urgent') NOT NULL DEFAULT 'Medium',
  priority_source      ENUM('auto','admin') NOT NULL DEFAULT 'auto',
  date_submitted       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reports_reporter FOREIGN KEY (reporter_id)         REFERENCES users(user_id),
  CONSTRAINT fk_reports_officer  FOREIGN KEY (assigned_officer_id) REFERENCES users(user_id),
  CONSTRAINT fk_reports_type     FOREIGN KEY (accident_type_id)    REFERENCES accident_types(type_id),
  INDEX idx_reports_status (report_status),
  INDEX idx_reports_date (accident_date),
  INDEX idx_reports_record_type (record_type),
  INDEX idx_reports_priority (priority)
);

CREATE TABLE IF NOT EXISTS report_photos (
  photo_id       INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  report_id      INT UNSIGNED NOT NULL,
  cloudinary_url VARCHAR(500) NOT NULL,
  uploaded_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_photos_report FOREIGN KEY (report_id) REFERENCES reports(report_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS report_status_history (
  history_id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  report_id          INT UNSIGNED NOT NULL,
  changed_by_user_id INT UNSIGNED NOT NULL,
  previous_status    VARCHAR(40) NULL,
  new_status         VARCHAR(40) NOT NULL,
  changed_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_history_report FOREIGN KEY (report_id) REFERENCES reports(report_id) ON DELETE CASCADE,
  CONSTRAINT fk_history_user   FOREIGN KEY (changed_by_user_id) REFERENCES users(user_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  notification_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         INT UNSIGNED NOT NULL,
  report_id       INT UNSIGNED NULL,
  message         VARCHAR(255) NOT NULL,
  is_read         TINYINT(1) NOT NULL DEFAULT 0,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notif_user   FOREIGN KEY (user_id)   REFERENCES users(user_id) ON DELETE CASCADE,
  CONSTRAINT fk_notif_report FOREIGN KEY (report_id) REFERENCES reports(report_id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  log_id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id        INT UNSIGNED NOT NULL,
  action_taken   VARCHAR(100) NOT NULL,
  action_details TEXT NULL,
  `timestamp`    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Nearby on-duty officers (#57). One row per Traffic Officer. The location is kept only while the officer is
-- on duty (latest point only) and cleared when they go off duty.
CREATE TABLE IF NOT EXISTS officer_status (
  officer_id          INT UNSIGNED PRIMARY KEY,
  is_on_duty          TINYINT(1) NOT NULL DEFAULT 0,
  latitude            DECIMAL(10,7) NULL,
  longitude           DECIMAL(10,7) NULL,
  location_updated_at TIMESTAMP NULL,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_officer_status_user FOREIGN KEY (officer_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Nearby-officer alerts for a new report (#57): up to 3 rows per report, one per alerted officer.
-- The first officer to respond takes the report; the others become 'taken'. outcome records what the
-- responding officer found on scene.
CREATE TABLE IF NOT EXISTS report_dispatch (
  dispatch_id     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  report_id       INT UNSIGNED NOT NULL,
  officer_id      INT UNSIGNED NOT NULL,
  distance_km     DECIMAL(6,2) NOT NULL,
  dispatch_status ENUM('alerted','responded','declined','taken','expired') NOT NULL DEFAULT 'alerted',
  outcome         ENUM('confirmed','rejected_on_scene') NULL,
  alerted_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  responded_at    TIMESTAMP NULL,
  outcome_at      TIMESTAMP NULL,
  CONSTRAINT fk_dispatch_report  FOREIGN KEY (report_id)  REFERENCES reports(report_id) ON DELETE CASCADE,
  CONSTRAINT fk_dispatch_officer FOREIGN KEY (officer_id) REFERENCES users(user_id),
  UNIQUE KEY uq_dispatch_report_officer (report_id, officer_id),
  INDEX idx_dispatch_officer_status (officer_id, dispatch_status)
);

-- Settings the administrator can change (Users & settings). v1.2.0: alert_range_km for #57.
CREATE TABLE IF NOT EXISTS app_settings (
  setting_key        VARCHAR(60) PRIMARY KEY,
  setting_value      VARCHAR(255) NOT NULL,
  updated_by_user_id INT UNSIGNED NULL,
  updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_settings_user FOREIGN KEY (updated_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);
