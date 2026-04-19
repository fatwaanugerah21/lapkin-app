import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
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
