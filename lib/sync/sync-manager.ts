import {
  offlineDB,
  getPendingOperations,
  removePendingOperation,
  queueOperation,
} from "@/lib/db/offline-db";
import { createNote, updateNote, deleteNote } from "@/lib/firebase/notes";
import { useSyncStore } from "@/store/sync-store";
import { Note } from "@/types";

/**
 * Sync Manager - Handles offline sync and background sync
 */
class SyncManager {
  private syncInterval: NodeJS.Timeout | null = null;
  private isInitialized = false;

  /**
   * Initialize sync manager
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Set up online/offline listeners
    if (typeof window !== "undefined") {
      window.addEventListener("online", this.handleOnline);
      window.addEventListener("offline", this.handleOffline);

      // Initial sync if online
      if (navigator.onLine) {
        await this.syncNow();
      }

      // Set up periodic sync (every 5 minutes)
      this.syncInterval = setInterval(() => {
        if (navigator.onLine) {
          this.syncNow();
        }
      }, 5 * 60 * 1000);
    }

    this.isInitialized = true;
  }

  /**
   * Handle online event
   */
  private handleOnline = async () => {
    useSyncStore.getState().setIsOnline(true);
    await this.syncNow();
  };

  /**
   * Handle offline event
   */
  private handleOffline = () => {
    useSyncStore.getState().setIsOnline(false);
  };

  /**
   * Sync all pending operations
   */
  async syncNow(): Promise<void> {
    const { setIsSyncing, setLastSyncTime, setSyncError, setPendingCount } =
      useSyncStore.getState();

    try {
      setIsSyncing(true);
      setSyncError(null);

      const operations = await getPendingOperations();
      setPendingCount(operations.length);

      if (operations.length === 0) {
        setLastSyncTime(new Date());
        return;
      }

      // Process operations sequentially
      for (const operation of operations) {
        try {
          await this.executeOperation(operation);
          await removePendingOperation(operation.id!);
          setPendingCount(operations.length - 1);
        } catch (error) {
          console.error("Failed to sync operation:", operation, error);
          // Continue with next operation
        }
      }

      setLastSyncTime(new Date());
    } catch (error) {
      console.error("Sync failed:", error);
      setSyncError("Sync failed. Will retry later.");
    } finally {
      setIsSyncing(false);
    }
  }

  /**
   * Execute a pending operation
   */
  private async executeOperation(operation: {
    type: "create" | "update" | "delete";
    collection: string;
    docId: string;
    data: unknown;
  }): Promise<void> {
    if (operation.collection !== "notes") {
      throw new Error(`Unknown collection: ${operation.collection}`);
    }

    const data = operation.data as Note;

    switch (operation.type) {
      case "create":
        await createNote(data.userId, {
          type: data.type,
          title: data.title,
          content: data.content,
          tags: data.tags,
          pillar: data.pillar,
        });
        break;

      case "update":
        await updateNote(operation.docId, data.userId, data);
        break;

      case "delete":
        await deleteNote(operation.docId, data.userId);
        break;

      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  /**
   * Save note locally with optimistic update
   */
  async saveNoteLocally(note: Note): Promise<void> {
    try {
      // Save to IndexedDB
      await offlineDB.notes.put(note);

      // Queue for sync if offline
      if (!navigator.onLine) {
        await queueOperation({
          type: note.id ? "update" : "create",
          collection: "notes",
          docId: note.id || "",
          data: note,
          timestamp: Date.now(),
        });

        useSyncStore.getState().incrementPending();
      }
    } catch (error) {
      console.error("Failed to save note locally:", error);
      throw error;
    }
  }

  /**
   * Delete note locally with optimistic update
   */
  async deleteNoteLocally(noteId: string, userId: string): Promise<void> {
    try {
      // Delete from IndexedDB
      await offlineDB.notes.delete(noteId);

      // Queue for sync if offline
      if (!navigator.onLine) {
        await queueOperation({
          type: "delete",
          collection: "notes",
          docId: noteId,
          data: { userId },
          timestamp: Date.now(),
        });

        useSyncStore.getState().incrementPending();
      }
    } catch (error) {
      console.error("Failed to delete note locally:", error);
      throw error;
    }
  }

  /**
   * Load notes from local cache
   */
  async loadLocalNotes(userId: string): Promise<Note[]> {
    try {
      const notes = await offlineDB.notes
        .where("userId")
        .equals(userId)
        .reverse()
        .sortBy("createdAt");

      return notes;
    } catch (error) {
      console.error("Failed to load local notes:", error);
      return [];
    }
  }

  /**
   * Clean up sync manager
   */
  cleanup(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.handleOnline);
      window.removeEventListener("offline", this.handleOffline);
    }

    this.isInitialized = false;
  }
}

// Export singleton instance
export const syncManager = new SyncManager();
