import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true, // sends httpOnly cookie on every request
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default apiClient;
