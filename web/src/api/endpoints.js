import { api } from './client';

// Thin wrappers over docs/API.md.
export const auth = {
  // The web signs in staff: Administrators and Traffic Officers (#36, #52). Reporters get 403 WRONG_PLATFORM.
  login: (contact_email, password) => api.post('/auth/login', { contact_email, password, platform: 'web' }),
  me: () => api.get('/auth/me'),
  updateMe: (body) => api.patch('/auth/me', body), // #25
  changePassword: (body) => api.patch('/auth/me/password', body), // #25
  // Forgot password (#37): public. The first answer is the same whether or not the email exists.
  forgotPassword: (contact_email) => api.post('/auth/forgot-password', { contact_email }),
  resetPassword: (body) => api.post('/auth/reset-password', body), // { contact_email, reset_code, new_password }
  myActivity: (params) => api.get('/auth/me/activity', { params, withPagination: true }), // #27, { data, pagination }
};

export const publicApi = {
  health: () => api.get('/health'),
  appInfo: () => api.get('/app-info'),
  updates: () => api.get('/public/updates'), // verified records, last 7 days (#23)
  stats: () => api.get('/public/stats'), // landing stats bar (#40)
};

export const lookups = {
  accidentTypes: () => api.get('/accident-types'),
};

export const notifications = {
  list: () => api.get('/notifications'),
  read: (id) => api.patch(`/notifications/${id}/read`),
  readAll: () => api.patch('/notifications/read-all'),
};

// Traffic Officer web portal (#52): only reports assigned to the signed-in officer.
export const officer = {
  list: (params) => api.get('/officer/reports', { params }),
  get: (id) => api.get(`/officer/reports/${id}`),
  update: (id, body) => api.patch(`/officer/reports/${id}`, body), // { status?, remarks? }
};

export const admin = {
  list: (params) => api.get('/admin/reports', { params }),
  listPage: (params) => api.get('/admin/reports', { params, withPagination: true }), // { data, pagination }
  get: (id) => api.get(`/admin/reports/${id}`),
  setStatus: (id, body) => api.patch(`/admin/reports/${id}/status`, body),
  assign: (id, body) => api.patch(`/admin/reports/${id}/assign`, body),
  addAccidentType: (type_name) => api.post('/admin/accident-types', { type_name }),
  auditLogs: (params) => api.get('/admin/audit-logs', { params, withPagination: true }), // #27, { data, pagination }
};

export const users = {
  list: (params) => api.get('/users', { params }),
  create: (body) => api.post('/users', body),
  setRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
  setActive: (id, is_active) => api.patch(`/users/${id}/active`, { is_active }),
  resetPassword: (id, new_password) => api.patch(`/users/${id}/password`, { new_password }), // #37
};

export const dashboard = {
  stats: () => api.get('/dashboard/stats'),
};

export const exportsApi = {
  summary: (params) => api.get('/exports/summary', { params }),
};
