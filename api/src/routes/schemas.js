// All request validation (zod) in one place. Unknown fields are stripped, so a client cannot sneak in extra data.
const { z } = require('zod');
const { STATUSES, OFFICER_STATUSES, INJURY_VALUES, ROLES, PLATFORMS } = require('../config/constants');

const id = z.coerce.number().int().positive();
const email = z.string().trim().toLowerCase().email().max(120);
const phone = z.string().trim().max(20).optional().or(z.literal('').transform(() => undefined));
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD');
const emptyToUndef = (v) => (v === '' ? undefined : v);

const register = z.object({
  full_name: z.string().trim().min(2).max(100),
  contact_email: email,
  contact_phone: phone,
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});
const login = z.object({
  contact_email: email,
  password: z.string().min(1).max(128),
  platform: z.enum(PLATFORMS, { errorMap: () => ({ message: "platform must be 'web' or 'mobile'" }) }),
});

const createUser = register.extend({ role: z.enum(Object.values(ROLES)) });
const setRole = z.object({ role: z.enum(Object.values(ROLES)) });
const setActive = z.object({ is_active: z.boolean() });
const listUsersQuery = z.object({ role: z.enum(Object.values(ROLES)).optional() });

const createReport = z.object({
  accident_type_id: z.coerce.number().int().positive(),
  accident_date: date,
  accident_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Use HH:MM or HH:MM:SS'),
  accident_location: z.string().trim().min(3).max(255),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  vehicles_involved: z.string().trim().max(255).optional(),
  injury_information: z.enum(INJURY_VALUES),
  accident_description: z.string().trim().min(10).max(10000),
}).refine((d) => (d.latitude === undefined) === (d.longitude === undefined), { message: 'Send latitude and longitude together', path: ['latitude'] });

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.preprocess(emptyToUndef, z.enum(STATUSES).optional()),
  accident_type_id: z.preprocess(emptyToUndef, z.coerce.number().int().positive().optional()),
  record_type: z.preprocess(emptyToUndef, z.enum(['public_submission', 'verified_record']).optional()),
  assigned_officer_id: z.preprocess(emptyToUndef, z.coerce.number().int().positive().optional()),
  date_from: z.preprocess(emptyToUndef, date.optional()),
  date_to: z.preprocess(emptyToUndef, date.optional()),
  location: z.preprocess(emptyToUndef, z.string().trim().max(100).optional()),
  q: z.preprocess(emptyToUndef, z.string().trim().max(100).optional()),
});

const adminStatus = z.object({
  status: z.enum(STATUSES),
  remarks: z.string().trim().min(1).max(10000).optional(),
  rejection_reason: z.string().trim().min(3).max(2000).optional(),
}).refine((d) => d.status !== 'Rejected' || d.rejection_reason, { message: 'A rejection reason is required', path: ['rejection_reason'] });

const assign = z.object({ officer_id: z.coerce.number().int().positive(), remarks: z.string().trim().min(1).max(10000).optional() });

const officerUpdate = z.object({
  status: z.enum(OFFICER_STATUSES).optional(),
  remarks: z.string().trim().min(1).max(10000).optional(),
}).refine((d) => d.status || d.remarks, { message: 'Send a status, remarks, or both', path: ['status'] });

const summaryQuery = z.object({
  period: z.enum(['daily', 'weekly', 'monthly', 'annual']),
  date: z.preprocess(emptyToUndef, date.optional()),
});
const accidentType = z.object({ type_name: z.string().trim().min(2).max(60) });
const idParam = z.object({ id });

module.exports = {
  register, login, createUser, setRole, setActive, listUsersQuery, createReport, listQuery, adminStatus, assign,
  officerUpdate, summaryQuery, accidentType, idParam,
};
