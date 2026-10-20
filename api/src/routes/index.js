const router = require('express').Router();
const rateLimit = require('express-rate-limit');
const { authenticate, allowRoles } = require('../middleware/auth');
const validate = require('../middleware/validate');
const uploadImages = require('../middleware/uploadImages');
const wrap = require('../utils/asyncHandler');
const { ROLES } = require('../config/constants');
const s = require('./schemas');
const auth = require('../controllers/authController');
const users = require('../controllers/userController');
const reports = require('../controllers/reportController');
const adminReports = require('../controllers/adminReportController');
const officerReports = require('../controllers/officerReportController');
const misc = require('../controllers/miscController');

const { ADMIN, OFFICER, REPORTER } = ROLES;
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT || 100),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many attempts. Try again later.' },
});
// Public read-only data (no token): generous, but stops a script from hammering the database.
const publicLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: Number(process.env.PUBLIC_RATE_LIMIT || 60),
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests. Try again later.' },
});
const id = validate(s.idParam, 'params');

// ----- auth (public) -----
router.post('/auth/register', authLimiter, validate(s.register), wrap(auth.register));
router.post('/auth/login', authLimiter, validate(s.login), wrap(auth.login));
router.get('/auth/me', authenticate, wrap(auth.me));

// ----- public data (no token) -----
router.get('/public/stats', publicLimiter, wrap(misc.publicStats));

// Everything below needs a valid token.
router.use(authenticate);

router.get('/accident-types', wrap(misc.listTypes));
router.get('/notifications', wrap(misc.listNotifications));
router.patch('/notifications/read-all', wrap(misc.markAllRead));
router.patch('/notifications/:id/read', id, wrap(misc.markRead));

// ----- reporter -----
router.post('/reports', allowRoles(REPORTER), validate(s.createReport), wrap(reports.create));
router.get('/reports', allowRoles(REPORTER), validate(s.listQuery, 'query'), wrap(reports.listMine));
router.get('/reports/:id', allowRoles(REPORTER), id, wrap(reports.getOne));
router.post('/reports/:id/photos', allowRoles(REPORTER), id, uploadImages, wrap(reports.addPhotos));

// ----- traffic officer -----
router.get('/officer/reports', allowRoles(OFFICER), validate(s.listQuery, 'query'), wrap(officerReports.list));
router.get('/officer/reports/:id', allowRoles(OFFICER), id, wrap(officerReports.getOne));
router.patch('/officer/reports/:id', allowRoles(OFFICER), id, validate(s.officerUpdate), wrap(officerReports.update));

// ----- administrator -----
router.get('/admin/reports', allowRoles(ADMIN), validate(s.listQuery, 'query'), wrap(adminReports.list));
router.get('/admin/reports/:id', allowRoles(ADMIN), id, wrap(adminReports.getOne));
router.patch('/admin/reports/:id/status', allowRoles(ADMIN), id, validate(s.adminStatus), wrap(adminReports.setStatus));
router.patch('/admin/reports/:id/assign', allowRoles(ADMIN), id, validate(s.assign), wrap(adminReports.assign));
router.post('/admin/accident-types', allowRoles(ADMIN), validate(s.accidentType), wrap(misc.createType));

router.post('/users', allowRoles(ADMIN), validate(s.createUser), wrap(users.create));
router.get('/users', allowRoles(ADMIN), validate(s.listUsersQuery, 'query'), wrap(users.list));
router.patch('/users/:id/role', allowRoles(ADMIN), id, validate(s.setRole), wrap(users.setRole));
router.patch('/users/:id/active', allowRoles(ADMIN), id, validate(s.setActive), wrap(users.setActive));

router.get('/dashboard/stats', allowRoles(ADMIN), wrap(misc.stats));
router.get('/exports/summary', allowRoles(ADMIN), validate(s.summaryQuery, 'query'), wrap(misc.summary));
router.get('/exports/reports.csv', allowRoles(ADMIN), validate(s.listQuery, 'query'), wrap(misc.exportCsv));
router.get('/exports/reports.pdf', allowRoles(ADMIN), validate(s.listQuery, 'query'), wrap(misc.exportPdf));

module.exports = router;
