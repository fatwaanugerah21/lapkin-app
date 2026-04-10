import apiClient from './apiClient';
import { AuthUser } from '../types';

export const authService = {
  login: async (username: string, password: string): Promise<AuthUser> => {
    const { data } = await apiClient.post('/auth/login', { username, password });
    return data.user;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  getMe: async (): Promise<AuthUser> => {
    const { data } = await apiClient.get('/auth/me');
    return data;
  },
};
