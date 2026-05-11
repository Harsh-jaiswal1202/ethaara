import { useEffect, useMemo } from 'react';
import { io } from 'socket.io-client';
import { SocketContext } from './SocketContext';
import { useAuth } from './AuthContext';

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const token = user ? localStorage.getItem('token') : null;
  const socket = useMemo(() => io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
    withCredentials: true,
    autoConnect: false,
    auth: token ? { token } : undefined,
  }), [token]);

  useEffect(() => {
    if (token) socket.connect();

    return () => {
      socket.disconnect();
    };
  }, [socket, token]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};
