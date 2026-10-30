-- RoadWatch v1.2.0 migration (DECISIONS #49, #50): report priority (#54), nearby on-duty officers (#57) and
-- admin settings. For a database created before v1.2.0 (Aiven). A new database gets all of this from
-- schema.sql and seed.sql instead.
-- Run it with `npm run migrate` in /api, which skips the steps that are already done, so it is safe to re-run.
-- Running this file directly in a SQL client also works once (the ALTER TABLE fails if the columns exist).

ALTER TABLE reports
  ADD COLUMN priority ENUM('Low','Medium','High','Urgent') NOT NULL DEFAULT 'Medium' AFTER official_remarks,
  ADD COLUMN priority_source ENUM('auto','admin') NOT NULL DEFAULT 'auto' AFTER priority,
  ADD INDEX idx_reports_priority (priority);

-- Existing reports get their automatic priority: the accident type sets the base, injuries raise it
-- (same rule as api/src/services/priorityService.js).
UPDATE reports r
JOIN accident_types t ON t.type_id = r.accident_type_id
SET r.priority = CASE
    WHEN r.injury_information = 'fatalities' THEN 'Urgent'
    WHEN t.type_name IN ('Pedestrian accident', 'Hit-and-run', 'Vehicle rollover') THEN 'High'
    WHEN r.injury_information = 'injuries' THEN 'High'
    WHEN t.type_name = 'Collision' OR r.injury_information = 'unknown' THEN 'Medium'
    ELSE 'Low'
  END,
  r.priority_source = 'auto';

CREATE TABLE IF NOT EXISTS officer_status (
  officer_id          INT UNSIGNED PRIMARY KEY,
  is_on_duty          TINYINT(1) NOT NULL DEFAULT 0,
  latitude            DECIMAL(10,7) NULL,
  longitude           DECIMAL(10,7) NULL,
  location_updated_at TIMESTAMP NULL,
  updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_officer_status_user FOREIGN KEY (officer_id) REFERENCES users(user_id) ON DELETE CASCADE
);

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

CREATE TABLE IF NOT EXISTS app_settings (
  setting_key        VARCHAR(60) PRIMARY KEY,
  setting_value      VARCHAR(255) NOT NULL,
  updated_by_user_id INT UNSIGNED NULL,
  updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_settings_user FOREIGN KEY (updated_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL
);

INSERT IGNORE INTO app_settings (setting_key, setting_value) VALUES ('alert_range_km', '5');
