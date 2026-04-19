import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface TimerTick {
  appId: string;
  totalSeconds: number;
  dailyLimit: number;
  elapsedThisSession: number;
}

interface BlockedEvent {
  appId: string;
  appName: string;
  totalSeconds: number;
  dailyLimit: number;
}

interface SocketContextType {
  socket: Socket | null;
  connected: boolean;
  startTimer: (appId: string, sessionId: string) => void;
  stopTimer: (appId: string) => void;
  onTimerTick: (cb: (data: TimerTick) => void) => void;
  onAppBlocked: (cb: (data: BlockedEvent) => void) => void;
  offTimerTick: () => void;
  offAppBlocked: () => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const { token } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!token) {
      // Disconnect if no token
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return;
    }

    // Connect socket with JWT auth
    const socket = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      console.log('✅ Socket connected');
      setConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setConnected(false);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  const startTimer = (appId: string, sessionId: string) => {
    socketRef.current?.emit('start_timer', { appId, sessionId });
  };

  const stopTimer = (appId: string) => {
    socketRef.current?.emit('stop_timer', { appId });
  };

  const onTimerTick = (cb: (data: TimerTick) => void) => {
    socketRef.current?.on('timer_tick', cb);
  };

  const onAppBlocked = (cb: (data: BlockedEvent) => void) => {
    socketRef.current?.on('app_blocked', cb);
  };

  const offTimerTick = () => {
    socketRef.current?.off('timer_tick');
  };

  const offAppBlocked = () => {
    socketRef.current?.off('app_blocked');
  };

  return (
    <SocketContext.Provider value={{
      socket: socketRef.current,
      connected,
      startTimer,
      stopTimer,
      onTimerTick,
      onAppBlocked,
      offTimerTick,
      offAppBlocked,
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
};
