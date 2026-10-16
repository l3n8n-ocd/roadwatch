const { AuditLog } = require('../models');

// FR-14: record important actions. Pass { transaction } when called inside one.
async function recordAudit(userId, action, details = null, transaction) {
  return AuditLog.create(
    { user_id: userId, action_taken: action, action_details: details ? JSON.stringify(details) : null },
    { transaction }
  );
}

module.exports = { recordAudit };
