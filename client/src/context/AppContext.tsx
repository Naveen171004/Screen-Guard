import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import api from '../utils/api';
import { App, DailyUsage } from '../types';

interface AppContextType {
  apps: App[];
  todayUsage: DailyUsage[];
  fetchApps: () => Promise<void>;
  fetchTodayUsage: () => Promise<void>;
  updateApp: (id: string, data: Partial<App>) => Promise<void>;
  addApp: (data: Partial<App>) => Promise<App>;
  deleteApp: (id: string) => Promise<void>;
  setApps: React.Dispatch<React.SetStateAction<App[]>>;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [apps, setApps] = useState<App[]>([]);
  const [todayUsage, setTodayUsage] = useState<DailyUsage[]>([]);

  const fetchApps = useCallback(async () => {
    try {
      const res = await api.get('/apps');
      setApps(res.data.apps);
    } catch (err) {
      console.error('Failed to fetch apps:', err);
    }
  }, []);

  const fetchTodayUsage = useCallback(async () => {
    try {
      const res = await api.get('/usage/today');
      setTodayUsage(res.data.usage);
    } catch (err) {
      console.error('Failed to fetch today usage:', err);
    }
  }, []);

  const updateApp = async (id: string, data: Partial<App>) => {
    const res = await api.put(`/apps/${id}`, data);
    setApps((prev) => prev.map((a) => (a._id === id ? res.data.app : a)));
  };

  const addApp = async (data: Partial<App>): Promise<App> => {
    const res = await api.post('/apps', data);
    setApps((prev) => [...prev, res.data.app]);
    return res.data.app;
  };

  const deleteApp = async (id: string) => {
    await api.delete(`/apps/${id}`);
    setApps((prev) => prev.filter((a) => a._id !== id));
  };

  return (
    <AppContext.Provider value={{ apps, todayUsage, fetchApps, fetchTodayUsage, updateApp, addApp, deleteApp, setApps }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApps = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApps must be used within AppProvider');
  return ctx;
};
