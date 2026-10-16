const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../config/env');
const { User, Role } = require('../models');
const HttpError = require('../utils/httpError');

function signToken(user) {
  return jwt.sign({ sub: user.user_id }, getJwtSecret(), { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

// Verifies the Bearer token, then loads the user from the database on EVERY request
// so a deactivated user or a changed role takes effect immediately.
async function authenticate(req, res, next) {
  try {
    const [kind, token] = (req.headers.authorization || '').split(' ');
    if (kind !== 'Bearer' || !token) throw new HttpError(401, 'Authentication token required');
    let payload;
    try {
      payload = jwt.verify(token, getJwtSecret());
    } catch {
      throw new HttpError(401, 'Invalid or expired token');
    }
    const user = await User.findByPk(payload.sub, { include: [{ model: Role, as: 'role' }] });
    if (!user || !user.is_active) throw new HttpError(401, 'Account is unavailable');
    req.user = {
      user_id: user.user_id,
      full_name: user.full_name,
      contact_email: user.contact_email,
      contact_phone: user.contact_phone,
      role: user.role.role_name,
    };
    next();
  } catch (err) {
    next(err);
  }
}

// Role check done on the server for every protected route (never only in the UI).
const allowRoles = (...roles) => (req, res, next) => {
  if (!req.user) return next(new HttpError(401, 'Authentication required'));
  if (!roles.includes(req.user.role)) return next(new HttpError(403, 'You do not have permission for this action'));
  next();
};

module.exports = { signToken, authenticate, allowRoles };
