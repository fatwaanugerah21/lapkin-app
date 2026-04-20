import axios from 'axios';

/**
 * Relative `/api` uses the current page origin (Vite dev proxy or same-host reverse proxy).
 * Set `VITE_API_URL` at **build time** to your API origin (e.g. `https://api.lapkin.ftsdigihouse.com`)
 * when the API is on another host.
 */
function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_URL?.trim();
  if (!raw) return '/api';
  try {
    const u = new URL(raw);
    return `${u.origin}/api`;
  } catch {
    return '/api';
  }
}

const apiClient = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true, // sends httpOnly cookie on every request
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = (error.config?.url ?? '').replace(/\?.*$/, '');
    const method = (error.config?.method ?? 'get').toLowerCase();

    // Session check and failed login are expected 401s — do not hard-navigate (would loop on /login).
    const skipRedirect =
      url === '/auth/me' || (method === 'post' && url === '/auth/login');

    if (status === 401 && !skipRedirect) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default apiClient;
