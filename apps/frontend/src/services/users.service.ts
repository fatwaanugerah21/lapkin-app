import apiClient from './apiClient';
import { User, CreateUserPayload, UpdateUserPayload } from '../types';

export const usersService = {
  getAll: async (): Promise<User[]> => {
    const { data } = await apiClient.get('/users');
    return data;
  },

  getManagers: async (): Promise<Pick<User, 'id' | 'name' | 'jabatan'>[]> => {
    const { data } = await apiClient.get('/users/managers');
    return data;
  },

  getDirectReports: async (): Promise<User[]> => {
    const { data } = await apiClient.get('/users/direct-reports');
    return data;
  },

  create: async (payload: CreateUserPayload): Promise<User> => {
    const { data } = await apiClient.post('/users', payload);
    return data;
  },

  update: async (id: string, payload: UpdateUserPayload): Promise<User> => {
    const { data } = await apiClient.patch(`/users/${id}`, payload);
    return data;
  },

  remove: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },
};
