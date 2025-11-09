import Dexie, { Table } from "dexie";
import {
  Note,
  Task,
  CalendarEvent,
  PendingOperation,
  Conversation,
} from "@/types";

/**
 * Offline Database using Dexie (IndexedDB wrapper)
 * Stores data locally for offline-first functionality
 */
export class OfflineDatabase extends Dexie {
  notes!: Table<Note>;
  tasks!: Table<Task>;
  events!: Table<CalendarEvent>;
  conversations!: Table<Conversation>;
  pendingOperations!: Table<PendingOperation>;

  constructor() {
    super("LifeAIOfflineDB");

    this.version(1).stores({
      notes: "++id, userId, type, createdAt, synced, pillar",
      tasks: "++id, userId, status, dueDate, synced, pillar",
      events: "++id, userId, startTime, synced, source",
      conversations: "++id, userId, createdAt",
      pendingOperations: "++id, collection, timestamp, type",
    });
  }
}

// Create singleton instance
export const offlineDB = new OfflineDatabase();

/**
 * Queue an operation to be synced with Firestore when online
 */
export async function queueOperation(
  operation: Omit<PendingOperation, "id">
): Promise<void> {
  await offlineDB.pendingOperations.add(operation);
}

/**
 * Get all pending operations
 */
export async function getPendingOperations(): Promise<PendingOperation[]> {
  return await offlineDB.pendingOperations.toArray();
}

/**
 * Remove a pending operation after successful sync
 */
export async function removePendingOperation(id: number): Promise<void> {
  await offlineDB.pendingOperations.delete(id);
}

/**
 * Clear all pending operations
 */
export async function clearPendingOperations(): Promise<void> {
  await offlineDB.pendingOperations.clear();
}

/**
 * Check if there are pending operations
 */
export async function hasPendingOperations(): Promise<boolean> {
  const count = await offlineDB.pendingOperations.count();
  return count > 0;
}
