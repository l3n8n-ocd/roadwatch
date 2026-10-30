const { AppSetting } = require('../models');
const { DISPATCH } = require('../config/constants');
const { recordAudit } = require('./auditService');

// Settings the administrator changes on Users & settings (app_settings). v1.2.0 has one: the nearby-officer
// alert range (#57).
async function getAlertRangeKm() {
  const row = await AppSetting.findByPk('alert_range_km');
  const km = row ? Number(row.setting_value) : NaN;
  return Number.isFinite(km) && km > 0 ? km : DISPATCH.DEFAULT_RANGE_KM;
}

async function getSettings() {
  return { alert_range_km: await getAlertRangeKm() };
}

async function setAlertRangeKm(km, actor) {
  const previous = await getAlertRangeKm();
  await AppSetting.upsert({ setting_key: 'alert_range_km', setting_value: String(km), updated_by_user_id: actor.user_id, updated_at: new Date() });
  await recordAudit(actor.user_id, 'settings.updated', { setting: 'alert_range_km', from: previous, to: km });
  return getSettings();
}

module.exports = { getAlertRangeKm, getSettings, setAlertRangeKm };
