'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { mockNotifications, type UserNotification } from '@/services/mockData';

interface AppContextValue {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  selectedCaseId: string | null;
  setSelectedCaseId: (id: string | null) => void;
  notifications: UserNotification[];
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  theme: 'dark';
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<UserNotification[]>(mockNotifications);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <AppContext.Provider
      value={{
        sidebarOpen,
        toggleSidebar,
        selectedCaseId,
        setSelectedCaseId,
        notifications,
        markNotificationRead,
        clearNotifications,
        theme: 'dark',
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
