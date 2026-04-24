'use client';
import { io } from 'socket.io-client';
import { getToken } from './auth';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_API_URL, {
      auth: (cb) => cb({ token: getToken() }),
      autoConnect: false,
      reconnectionAttempts: 5,
      transports: ['websocket'],
    });
  }
  return socket;
}

export function connectSocket() {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnectSocket() {
  if (socket?.connected) socket.disconnect();
}
