import React, { createContext, useContext, useEffect, useState } from 'react';
import { syncManager, SyncMetrics } from '../services/syncManager';

interface OfflineContextType extends SyncMetrics {
  syncNow: () => Promise<void>;
  prepareOfflineData: (staffId?: string) => Promise<any>;
}

const OfflineContext = createContext<OfflineContextType>({
  isOnline: true,
  pendingCount: 0,
  failedCount: 0,
  isSyncing: false,
  lastSyncedAt: null,
  isDataReady: false,
  syncNow: async () => {},
  prepareOfflineData: async () => {},
});

export const OfflineProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [metrics, setMetrics] = useState<SyncMetrics>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    pendingCount: 0,
    failedCount: 0,
    isSyncing: false,
    lastSyncedAt: null,
    isDataReady: false,
  });

  useEffect(() => {
    const unsubscribe = syncManager.subscribe(newMetrics => {
      setMetrics(newMetrics);
    });
    return () => unsubscribe();
  }, []);

  const syncNow = async () => {
    await syncManager.processSyncQueue();
  };

  const prepareOfflineData = async (staffId: string = 'u-staff-001') => {
    return await syncManager.prepareOfflineData(staffId);
  };

  return (
    <OfflineContext.Provider
      value={{
        ...metrics,
        syncNow,
        prepareOfflineData,
      }}
    >
      {children}
    </OfflineContext.Provider>
  );
};

export const useOffline = () => useContext(OfflineContext);
