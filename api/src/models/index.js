// Sequelize models. They mirror database/schema.sql exactly (tables are created by the SQL files, never by Sequelize).
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const { STATUSES, INJURY_VALUES, PRIORITIES } = require('../config/constants');

const Role = sequelize.define('roles', {
  role_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  role_name: { type: DataTypes.STRING(30), allowNull: false, unique: true },
});

const User = sequelize.define('users', {
  user_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  role_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  full_name: { type: DataTypes.STRING(100), allowNull: false },
  contact_email: { type: DataTypes.STRING(120), allowNull: false, unique: true },
  contact_phone: { type: DataTypes.STRING(20), allowNull: true },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  // password_hash is never returned unless a query asks for the 'withPassword' scope (login only).
  defaultScope: { attributes: { exclude: ['password_hash'] } },
  scopes: { withPassword: { attributes: { include: ['password_hash'] } } },
});

const AccidentType = sequelize.define('accident_types', {
  type_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  type_name: { type: DataTypes.STRING(60), allowNull: false, unique: true },
});

const Report = sequelize.define('reports', {
  report_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  reporter_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  assigned_officer_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  accident_type_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  record_type: { type: DataTypes.ENUM('public_submission', 'verified_record'), allowNull: false, defaultValue: 'public_submission' },
  accident_date: { type: DataTypes.DATEONLY, allowNull: false },
  accident_time: { type: DataTypes.TIME, allowNull: false },
  accident_location: { type: DataTypes.STRING(255), allowNull: false },
  latitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
  longitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
  vehicles_involved: { type: DataTypes.STRING(255), allowNull: true },
  injury_information: { type: DataTypes.ENUM(...INJURY_VALUES), allowNull: false, defaultValue: 'unknown' },
  accident_description: { type: DataTypes.TEXT, allowNull: false },
  report_status: { type: DataTypes.ENUM(...STATUSES), allowNull: false, defaultValue: 'Submitted' },
  official_remarks: { type: DataTypes.TEXT, allowNull: true },
  priority: { type: DataTypes.ENUM(...PRIORITIES), allowNull: false, defaultValue: 'Medium' },
  priority_source: { type: DataTypes.ENUM('auto', 'admin'), allowNull: false, defaultValue: 'auto' },
  date_submitted: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
});

const ReportPhoto = sequelize.define('report_photos', {
  photo_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  report_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  cloudinary_url: { type: DataTypes.STRING(500), allowNull: false },
  uploaded_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
});

const ReportStatusHistory = sequelize.define('report_status_history', {
  history_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  report_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  changed_by_user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  previous_status: { type: DataTypes.STRING(40), allowNull: true },
  new_status: { type: DataTypes.STRING(40), allowNull: false },
  changed_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
});

const Notification = sequelize.define('notifications', {
  notification_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  report_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  message: { type: DataTypes.STRING(255), allowNull: false },
  is_read: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
});

const AuditLog = sequelize.define('audit_logs', {
  log_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  action_taken: { type: DataTypes.STRING(100), allowNull: false },
  action_details: { type: DataTypes.TEXT, allowNull: true },
  timestamp: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
});

// Nearby on-duty officers (#57).
const OfficerStatus = sequelize.define('officer_status', {
  officer_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true },
  is_on_duty: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  latitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
  longitude: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
  location_updated_at: { type: DataTypes.DATE, allowNull: true },
  updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
});

const ReportDispatch = sequelize.define('report_dispatch', {
  dispatch_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
  report_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  officer_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  distance_km: { type: DataTypes.DECIMAL(6, 2), allowNull: false },
  dispatch_status: { type: DataTypes.ENUM('alerted', 'responded', 'declined', 'taken', 'expired'), allowNull: false, defaultValue: 'alerted' },
  outcome: { type: DataTypes.ENUM('confirmed', 'rejected_on_scene'), allowNull: true },
  alerted_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  responded_at: { type: DataTypes.DATE, allowNull: true },
  outcome_at: { type: DataTypes.DATE, allowNull: true },
});

const AppSetting = sequelize.define('app_settings', {
  setting_key: { type: DataTypes.STRING(60), primaryKey: true },
  setting_value: { type: DataTypes.STRING(255), allowNull: false },
  updated_by_user_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
  updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
});

Role.hasMany(User, { foreignKey: 'role_id' });
User.belongsTo(Role, { foreignKey: 'role_id', as: 'role' });
User.hasMany(Report, { foreignKey: 'reporter_id', as: 'submittedReports' });
Report.belongsTo(User, { foreignKey: 'reporter_id', as: 'reporter' });
User.hasMany(Report, { foreignKey: 'assigned_officer_id', as: 'assignedReports' });
Report.belongsTo(User, { foreignKey: 'assigned_officer_id', as: 'assignedOfficer' });
AccidentType.hasMany(Report, { foreignKey: 'accident_type_id' });
Report.belongsTo(AccidentType, { foreignKey: 'accident_type_id', as: 'accidentType' });
Report.hasMany(ReportPhoto, { foreignKey: 'report_id', as: 'photos' });
ReportPhoto.belongsTo(Report, { foreignKey: 'report_id' });
Report.hasMany(ReportStatusHistory, { foreignKey: 'report_id', as: 'statusHistory' });
ReportStatusHistory.belongsTo(Report, { foreignKey: 'report_id' });
ReportStatusHistory.belongsTo(User, { foreignKey: 'changed_by_user_id', as: 'changedBy' });
User.hasMany(Notification, { foreignKey: 'user_id' });
Notification.belongsTo(User, { foreignKey: 'user_id' });
Notification.belongsTo(Report, { foreignKey: 'report_id' });
User.hasMany(AuditLog, { foreignKey: 'user_id' });
AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasOne(OfficerStatus, { foreignKey: 'officer_id', as: 'dutyStatus' });
OfficerStatus.belongsTo(User, { foreignKey: 'officer_id', as: 'officer' });
Report.hasMany(ReportDispatch, { foreignKey: 'report_id', as: 'dispatches' });
ReportDispatch.belongsTo(Report, { foreignKey: 'report_id', as: 'report' });
ReportDispatch.belongsTo(User, { foreignKey: 'officer_id', as: 'officer' });

module.exports = {
  sequelize, Role, User, AccidentType, Report, ReportPhoto, ReportStatusHistory, Notification, AuditLog, OfficerStatus,
  ReportDispatch, AppSetting,
};
