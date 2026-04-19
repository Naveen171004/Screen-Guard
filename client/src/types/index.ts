export interface User {
  id: string;
  name: string;
  email: string;
}

export interface App {
  _id: string;
  name: string;
  icon: string;
  category: string;
  color: string;
  dailyLimit: number; // seconds, 0 = no limit
  isActive: boolean;
  isBlocked: boolean;
  overrideUntil: string | null;
}

export interface DailyUsage {
  _id: string;
  userId: string;
  appId: string;
  appName: string;
  date: string;
  totalSeconds: number;
  updatedAt: string;
}

export interface UsageSession {
  _id: string;
  appId: string;
  appName: string;
  startTime: string;
  endTime: string | null;
  duration: number;
  date: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export interface AppContextType {
  apps: App[];
  todayUsage: DailyUsage[];
  fetchApps: () => Promise<void>;
  fetchTodayUsage: () => Promise<void>;
  updateApp: (id: string, data: Partial<App>) => Promise<void>;
  addApp: (data: Partial<App>) => Promise<void>;
  deleteApp: (id: string) => Promise<void>;
}

// For the timer display
export interface TimerState {
  appId: string | null;
  sessionId: string | null;
  totalSeconds: number;
  isRunning: boolean;
  isBlocked: boolean;
}
