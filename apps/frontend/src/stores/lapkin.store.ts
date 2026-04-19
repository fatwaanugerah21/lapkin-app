import { create } from 'zustand';
import { Lapkin, CreateLapkinRowPayload, UpdateLapkinRowPayload, LapkinRowActivityInput } from '../types';
import { lapkinService } from '../services/lapkin.service';

interface LapkinState {
  lapkins: Lapkin[];
  activeLapkin: Lapkin | null;
  isLoading: boolean;

  fetchAll: () => Promise<void>;
  fetchOne: (id: string) => Promise<void>;
  createLapkin: (reportDate: string) => Promise<Lapkin>;
  deleteLapkin: (id: string) => Promise<void>;
  lockLapkin: (id: string) => Promise<void>;
  unlockLapkin: (id: string) => Promise<void>;
  addRow: (lapkinId: string, payload: CreateLapkinRowPayload) => Promise<void>;
  updateRow: (lapkinId: string, rowId: string, payload: UpdateLapkinRowPayload) => Promise<void>;
  deleteRow: (lapkinId: string, rowId: string) => Promise<void>;
  evaluateRow: (lapkinId: string, rowId: string) => Promise<void>;
  managerUpdateRowScores: (
    lapkinId: string,
    rowId: string,
    activities: LapkinRowActivityInput[],
  ) => Promise<void>;
  signLapkinByManager: (lapkinId: string) => Promise<void>;
  signLapkinByEmployee: (lapkinId: string) => Promise<void>;
  syncLapkin: (lapkin: Lapkin) => void;
}

export const useLapkinStore = create<LapkinState>((set, get) => ({
  lapkins: [],
  activeLapkin: null,
  isLoading: false,

  fetchAll: async () => {
    set({ isLoading: true });
    const lapkins = await lapkinService.getAll();
    set({ lapkins, isLoading: false });
  },

  fetchOne: async (id) => {
    const lapkin = await lapkinService.getOne(id);
    set({ activeLapkin: lapkin });
    get().syncLapkin(lapkin);
  },

  createLapkin: async (reportDate) => {
    const lapkin = await lapkinService.create(reportDate);
    set((s) => ({ lapkins: [lapkin, ...s.lapkins] }));
    return lapkin;
  },

  deleteLapkin: async (id) => {
    await lapkinService.deleteLapkin(id);
    set((s) => ({ lapkins: s.lapkins.filter((l) => l.id !== id), activeLapkin: null }));
  },

  lockLapkin: async (id) => {
    const updated = await lapkinService.lock(id);
    get().syncLapkin(updated);
  },

  unlockLapkin: async (id) => {
    const updated = await lapkinService.unlock(id);
    get().syncLapkin(updated);
  },

  addRow: async (lapkinId, payload) => {
    const updated = await lapkinService.addRow(lapkinId, payload);
    get().syncLapkin(updated);
  },

  updateRow: async (lapkinId, rowId, payload) => {
    const updated = await lapkinService.updateRow(lapkinId, rowId, payload);
    get().syncLapkin(updated);
  },

  deleteRow: async (lapkinId, rowId) => {
    const updated = await lapkinService.deleteRow(lapkinId, rowId);
    get().syncLapkin(updated);
  },

  evaluateRow: async (lapkinId, rowId) => {
    const updated = await lapkinService.evaluateRow(lapkinId, rowId);
    get().syncLapkin(updated);
  },

  managerUpdateRowScores: async (lapkinId, rowId, activities) => {
    const updated = await lapkinService.managerUpdateRowScores(lapkinId, rowId, activities);
    get().syncLapkin(updated);
  },

  signLapkinByManager: async (lapkinId) => {
    const updated = await lapkinService.signByManager(lapkinId);
    get().syncLapkin(updated);
  },

  signLapkinByEmployee: async (lapkinId) => {
    const updated = await lapkinService.signByEmployee(lapkinId);
    get().syncLapkin(updated);
  },

  syncLapkin: (lapkin) => {
    set((s) => ({
      activeLapkin: s.activeLapkin?.id === lapkin.id ? lapkin : s.activeLapkin,
      lapkins: s.lapkins.map((l) => (l.id === lapkin.id ? lapkin : l)),
    }));
  },
}));
