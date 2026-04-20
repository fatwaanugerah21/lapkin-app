import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

/**
 * Same origin as REST: `VITE_API_URL` at build time → `wss://<that-host>/socket.io`.
 * If unset, uses `window.location` → `wss://<this-site>/socket.io` (reverse proxy must
 * forward `/socket.io` with Upgrade / Connection for WebSocket).
 */
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
      path: '/socket.io',
      withCredentials: true,
      // Polling first often works through proxies; then upgrades to websocket (wss when page is https).
      transports: ['polling', 'websocket'],
    });
  }
  return socket;
};

export const disconnectSocket = (): void => {
  socket?.disconnect();
  socket = null;
};

export const getSocket = (): Socket | null => socket;
