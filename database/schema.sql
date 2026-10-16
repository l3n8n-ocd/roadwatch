-- RoadWatch schema (MySQL). Matches docs/erd/erd.png.
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
  date_submitted       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reports_reporter FOREIGN KEY (reporter_id)         REFERENCES users(user_id),
  CONSTRAINT fk_reports_officer  FOREIGN KEY (assigned_officer_id) REFERENCES users(user_id),
  CONSTRAINT fk_reports_type     FOREIGN KEY (accident_type_id)    REFERENCES accident_types(type_id),
  INDEX idx_reports_status (report_status),
  INDEX idx_reports_date (accident_date),
  INDEX idx_reports_record_type (record_type)
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
