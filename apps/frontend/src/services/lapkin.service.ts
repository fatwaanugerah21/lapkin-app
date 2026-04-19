import apiClient from './apiClient';
import { Lapkin, CreateLapkinRowPayload, UpdateLapkinRowPayload, LapkinRowActivityInput } from '../types';

export const lapkinService = {
  getAll: async (): Promise<Lapkin[]> => {
    const { data } = await apiClient.get('/lapkins');
    return data;
  },

  getOne: async (id: string): Promise<Lapkin> => {
    const { data } = await apiClient.get(`/lapkins/${id}`);
    return data;
  },

  create: async (reportDate: string): Promise<Lapkin> => {
    const { data } = await apiClient.post('/lapkins', { reportDate });
    return data;
  },

  deleteLapkin: async (id: string): Promise<void> => {
    await apiClient.delete(`/lapkins/${id}`);
  },

  lock: async (id: string): Promise<Lapkin> => {
    const { data } = await apiClient.patch(`/lapkins/${id}/lock`);
    return data;
  },

  unlock: async (id: string): Promise<Lapkin> => {
    const { data } = await apiClient.patch(`/lapkins/${id}/unlock`);
    return data;
  },

  addRow: async (lapkinId: string, payload: CreateLapkinRowPayload): Promise<Lapkin> => {
    const { data } = await apiClient.post(`/lapkins/${lapkinId}/rows`, payload);
    return data;
  },

  updateRow: async (lapkinId: string, rowId: string, payload: UpdateLapkinRowPayload): Promise<Lapkin> => {
    const { data } = await apiClient.patch(`/lapkins/${lapkinId}/rows/${rowId}`, payload);
    return data;
  },

  managerUpdateRowScores: async (
    lapkinId: string,
    rowId: string,
    activities: LapkinRowActivityInput[],
  ): Promise<Lapkin> => {
    const { data } = await apiClient.patch(`/lapkins/${lapkinId}/rows/${rowId}/scores`, { activities });
    return data;
  },

  deleteRow: async (lapkinId: string, rowId: string): Promise<Lapkin> => {
    await apiClient.delete(`/lapkins/${lapkinId}/rows/${rowId}`);
    const { data } = await apiClient.get(`/lapkins/${lapkinId}`);
    return data;
  },

  evaluateRow: async (lapkinId: string, rowId: string): Promise<Lapkin> => {
    const { data } = await apiClient.patch(`/lapkins/${lapkinId}/rows/${rowId}/evaluate`, {});
    return data;
  },

  signByManager: async (lapkinId: string): Promise<Lapkin> => {
    const { data } = await apiClient.patch(`/lapkins/${lapkinId}/sign-by-manager`, {});
    return data;
  },

  signByEmployee: async (lapkinId: string): Promise<Lapkin> => {
    const { data } = await apiClient.patch(`/lapkins/${lapkinId}/sign-by-employee`, {});
    return data;
  },
};
