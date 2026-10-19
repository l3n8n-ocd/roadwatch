import axios from 'axios';

// One axios instance for the RoadWatch API (docs/API.md).
// Success: { success: true, data }. Error: { success: false, error, details? }.
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const TOKEN_KEY = 'rw-token';

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage blocked (private mode): the session lasts until reload.
  }
}

export const api = axios.create({ baseURL: API_URL, timeout: 20000 });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Unwrap { success, data } so callers get the data directly. Paged lists also carry
// `pagination`; request them with { withPagination: true } to get { data, pagination }.
api.interceptors.response.use(
  (res) => {
    const body = res.data;
    if (!body || !Object.prototype.hasOwnProperty.call(body, 'data')) return body;
    if (res.config.withPagination) return { data: body.data, pagination: body.pagination };
    return body.data;
  },
  (err) => {
    const body = err.response?.data;
    const e = new Error(
      body?.error ||
        (err.code === 'ECONNABORTED' || !err.response
          ? 'Cannot reach the server. Check your connection and try again.'
          : 'Something went wrong. Please try again.'),
    );
    e.status = err.response?.status;
    e.details = body?.details;
    return Promise.reject(e);
  },
);

// File downloads (CSV/PDF) need the auth header, so fetch the blob and save it.
export async function downloadFile(path, params, filename) {
  const res = await axios.get(`${API_URL}${path}`, {
    params,
    responseType: 'blob',
    headers: getToken() ? { Authorization: `Bearer ${getToken()}` } : {},
  });
  const url = URL.createObjectURL(res.data);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
