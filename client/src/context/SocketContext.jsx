import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

const normalizeSocketUrl = (value, apiValue) => {
  const candidate = value || apiValue || window.location.origin;
  if (!candidate) return window.location.origin;

  const trimmed = candidate.trim().replace(/\/$/, '');
  if (trimmed.endsWith('/api')) return trimmed.replace(/\/api$/, '');
  return trimmed;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Support multi-domain production deployments via env variable
    const socketUrl = normalizeSocketUrl(
      import.meta.env.VITE_SOCKET_URL,
      import.meta.env.VITE_API_URL,
    );

    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('connect_error', () => {
      setIsConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
