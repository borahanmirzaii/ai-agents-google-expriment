import { useCallback, useEffect } from "react";
import { useNotesStore } from "@/store/notes-store";
import { useAuthStore } from "@/store/auth-store";
import { useSyncStore } from "@/store/sync-store";
import { getNotes } from "@/lib/firebase/notes";
import { syncManager } from "@/lib/sync/sync-manager";
import { Note, NoteFormData } from "@/types";

/**
 * Hook for managing notes
 */
export function useNotes() {
  const { user } = useAuthStore();
  const {
    notes,
    loading,
    error,
    filters,
    setNotes,
    setLoading,
    setError,
    addNote,
    updateNote: updateNoteInStore,
    removeNote,
  } = useNotesStore();
  const { isOnline } = useSyncStore();

  /**
   * Fetch notes from Firebase or local cache
   */
  const fetchNotes = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      if (isOnline) {
        // Fetch from Firebase
        const result = await getNotes(user.uid, {
          type: filters.type,
          pillar: filters.pillar,
        });
        setNotes(result.notes);
      } else {
        // Load from local cache
        const localNotes = await syncManager.loadLocalNotes(user.uid);
        setNotes(localNotes);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch notes";
      setError(errorMessage);
      console.error("Error fetching notes:", err);
    } finally {
      setLoading(false);
    }
  }, [user, filters, isOnline, setNotes, setLoading, setError]);

  /**
   * Create a new note
   */
  const createNote = useCallback(
    async (noteData: NoteFormData & { content: string }) => {
      if (!user) throw new Error("User not authenticated");

      const newNote: Note = {
        id: crypto.randomUUID(), // Temporary ID
        userId: user.uid,
        type: noteData.type,
        title: noteData.title,
        content: noteData.content,
        tags: noteData.tags || [],
        categories: [],
        pillar: noteData.pillar,
        synced: isOnline,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Optimistic update
      addNote(newNote);

      try {
        if (isOnline) {
          // Create in Firebase
          const response = await fetch("/api/notes", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-user-id": user.uid,
            },
            body: JSON.stringify(noteData),
          });

          if (!response.ok) {
            throw new Error("Failed to create note");
          }

          const { data } = await response.json();
          updateNoteInStore(newNote.id, data);
        } else {
          // Save locally and queue for sync
          await syncManager.saveNoteLocally(newNote);
        }

        return newNote;
      } catch (err) {
        // Rollback optimistic update
        removeNote(newNote.id);
        throw err;
      }
    },
    [user, isOnline, addNote, updateNoteInStore, removeNote]
  );

  /**
   * Update an existing note
   */
  const updateNote = useCallback(
    async (id: string, updates: Partial<Note>) => {
      if (!user) throw new Error("User not authenticated");

      // Optimistic update
      updateNoteInStore(id, updates);

      try {
        if (isOnline) {
          const response = await fetch(`/api/notes/${id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "x-user-id": user.uid,
            },
            body: JSON.stringify(updates),
          });

          if (!response.ok) {
            throw new Error("Failed to update note");
          }

          const { data } = await response.json();
          updateNoteInStore(id, data);
        } else {
          // Update locally and queue for sync
          const note = notes.find((n) => n.id === id);
          if (note) {
            await syncManager.saveNoteLocally({ ...note, ...updates });
          }
        }
      } catch (err) {
        // TODO: Rollback optimistic update
        throw err;
      }
    },
    [user, isOnline, notes, updateNoteInStore]
  );

  /**
   * Delete a note
   */
  const deleteNote = useCallback(
    async (id: string) => {
      if (!user) throw new Error("User not authenticated");

      // Optimistic update
      removeNote(id);

      try {
        if (isOnline) {
          const response = await fetch(`/api/notes/${id}`, {
            method: "DELETE",
            headers: {
              "x-user-id": user.uid,
            },
          });

          if (!response.ok) {
            throw new Error("Failed to delete note");
          }
        } else {
          // Delete locally and queue for sync
          await syncManager.deleteNoteLocally(id, user.uid);
        }
      } catch (err) {
        // TODO: Rollback optimistic update
        throw err;
      }
    },
    [user, isOnline, removeNote]
  );

  // Auto-fetch notes when user or filters change
  useEffect(() => {
    if (user) {
      fetchNotes();
    }
  }, [user, filters, fetchNotes]);

  return {
    notes,
    loading,
    error,
    fetchNotes,
    createNote,
    updateNote,
    deleteNote,
  };
}
