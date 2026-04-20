import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

/** Socket.IO attaches to the HTTP server origin, not under `/api`. */
function getSocketServerUrl(): string {
  const raw = import.meta.env.VITE_API_URL?.trim();
  if (!raw) return typeof window !== 'undefined' ? window.location.origin : '';
  try {
    return new URL(raw).origin;
  } catch {
    return typeof window !== 'undefined' ? window.location.origin : '';
  }
}

export const connectSocket = (): Socket => {
  if (!socket) {
    const url = getSocketServerUrl();
    socket = io(url, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
};

export const disconnectSocket = (): void => {
  socket?.disconnect();
  socket = null;
};

export const getSocket = (): Socket | null => socket;
