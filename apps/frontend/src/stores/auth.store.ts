import { create } from 'zustand';
import { AuthUser } from '../types';
import { authService } from '../services/auth.service';
import { connectSocket, disconnectSocket } from '../services/socket.service';

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isInitialized: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    try {
      const user = await authService.getMe();
      set({ user, isInitialized: true });
      connectSocket();
    } catch {
      set({ user: null, isInitialized: true });
    }
  },

  login: async (username, password) => {
    set({ isLoading: true });
    try {
      const user = await authService.login(username, password);
      set({ user, isLoading: false });
      connectSocket();
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    await authService.logout();
    disconnectSocket();
    set({ user: null });
  },
}));
