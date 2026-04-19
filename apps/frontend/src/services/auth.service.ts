import apiClient from './apiClient';
import { AuthUser } from '../types';

export type UserSignaturePayload = {
  signatureDataUrl: string | null;
};

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

  getMySignature: async (): Promise<UserSignaturePayload> => {
    const { data } = await apiClient.get('/auth/me/signature');
    return data;
  },

  updateMySignature: async (payload: UserSignaturePayload): Promise<UserSignaturePayload> => {
    const { data } = await apiClient.patch('/auth/me/signature', payload);
    return data;
  },
};
