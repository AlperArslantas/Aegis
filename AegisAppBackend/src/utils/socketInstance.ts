/**
 * Socket.IO Instance Manager
 * Socket.IO instance'ını global olarak yönetmek için
 */

import { Server as SocketIOServer } from 'socket.io';

let socketInstance: SocketIOServer | null = null;

export const setSocketInstance = (io: SocketIOServer): void => {
  socketInstance = io;
};

export const getSocketInstance = (): SocketIOServer | null => {
  return socketInstance;
};
