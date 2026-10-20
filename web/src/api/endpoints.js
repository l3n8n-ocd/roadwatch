import { api } from './client';

// Thin wrappers over docs/API.md. Endpoints marked "not built yet" are approved in
// design (docs/DECISIONS.md) but do not exist on the API; callers must handle errors.
export const auth = {
  // The web signs in Administrators only; the API refuses other roles on "web" (#36).
  login: (contact_email, password) => api.post('/auth/login', { contact_email, password, platform: 'web' }),
  me: () => api.get('/auth/me'),
  updateMe: (body) => api.patch('/auth/me', body), // not built yet (#25)
  changePassword: (body) => api.patch('/auth/me/password', body), // not built yet (#25)
  myActivity: (params) => api.get('/auth/me/activity', { params }), // not built yet (#27)
};

export const publicApi = {
  health: () => api.get('/health'),
  appInfo: () => api.get('/app-info'),
  updates: () => api.get('/public/updates'), // not built yet (#23)
};

export const lookups = {
  accidentTypes: () => api.get('/accident-types'),
};

export const notifications = {
  list: () => api.get('/notifications'),
  read: (id) => api.patch(`/notifications/${id}/read`),
  readAll: () => api.patch('/notifications/read-all'),
};

export const admin = {
  list: (params) => api.get('/admin/reports', { params }),
  listPage: (params) => api.get('/admin/reports', { params, withPagination: true }), // { data, pagination }
  get: (id) => api.get(`/admin/reports/${id}`),
  setStatus: (id, body) => api.patch(`/admin/reports/${id}/status`, body),
  assign: (id, body) => api.patch(`/admin/reports/${id}/assign`, body),
  addAccidentType: (type_name) => api.post('/admin/accident-types', { type_name }),
  auditLogs: (params) => api.get('/admin/audit-logs', { params }), // not built yet (#27)
};

export const users = {
  list: (params) => api.get('/users', { params }),
  create: (body) => api.post('/users', body),
  setRole: (id, role) => api.patch(`/users/${id}/role`, { role }),
  setActive: (id, is_active) => api.patch(`/users/${id}/active`, { is_active }),
};

export const dashboard = {
  stats: () => api.get('/dashboard/stats'),
};

export const exportsApi = {
  summary: (params) => api.get('/exports/summary', { params }),
};
