import { useEffect } from "react";
import { useSyncStore } from "@/store/sync-store";
import { syncManager } from "@/lib/sync/sync-manager";

/**
 * Hook for managing offline sync
 */
export function useSync() {
  const {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncTime,
    syncError,
    setIsOnline,
  } = useSyncStore();

  useEffect(() => {
    // Initialize sync manager
    syncManager.initialize();

    // Update online status
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    updateOnlineStatus();

    return () => {
      syncManager.cleanup();
    };
  }, [setIsOnline]);

  const syncNow = async () => {
    await syncManager.syncNow();
  };

  return {
    isOnline,
    isSyncing,
    pendingCount,
    lastSyncTime,
    syncError,
    syncNow,
  };
}
