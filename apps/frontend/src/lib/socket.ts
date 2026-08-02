import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getKdsSocket = (): Socket => {
  if (!socket) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000/kds';
    socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true
    });
  }
  return socket;
};
