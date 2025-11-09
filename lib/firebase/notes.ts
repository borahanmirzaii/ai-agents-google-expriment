import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "./config";
import { Note, NoteFormData, NoteType, LifePillar } from "@/types";

const NOTES_COLLECTION = "notes";
const NOTES_PER_PAGE = 20;

/**
 * Convert Firestore Timestamp to Date
 */
function timestampToDate(timestamp: Timestamp): Date {
  return timestamp.toDate();
}

/**
 * Convert Note data from Firestore
 */
function convertNoteData(doc: QueryDocumentSnapshot<DocumentData>): Note {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    createdAt: data.createdAt ? timestampToDate(data.createdAt) : new Date(),
    updatedAt: data.updatedAt ? timestampToDate(data.updatedAt) : new Date(),
  } as Note;
}

/**
 * Create a new note
 */
export async function createNote(
  userId: string,
  noteData: NoteFormData & { content: string }
): Promise<Note> {
  try {
    const now = Timestamp.now();
    const noteDoc = {
      userId,
      type: noteData.type,
      title: noteData.title,
      content: noteData.content,
      tags: noteData.tags || [],
      categories: [],
      pillar: noteData.pillar || null,
      synced: true,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, NOTES_COLLECTION), noteDoc);
    const newNote = await getDoc(docRef);

    return convertNoteData(newNote as QueryDocumentSnapshot<DocumentData>);
  } catch (error) {
    console.error("Error creating note:", error);
    throw new Error("Failed to create note");
  }
}

/**
 * Get a single note by ID
 */
export async function getNote(noteId: string, userId: string): Promise<Note | null> {
  try {
    const noteRef = doc(db, NOTES_COLLECTION, noteId);
    const noteDoc = await getDoc(noteRef);

    if (!noteDoc.exists()) {
      return null;
    }

    const note = convertNoteData(noteDoc as QueryDocumentSnapshot<DocumentData>);

    // Check if user owns this note
    if (note.userId !== userId) {
      throw new Error("Unauthorized");
    }

    return note;
  } catch (error) {
    console.error("Error getting note:", error);
    throw new Error("Failed to get note");
  }
}

/**
 * Get notes for a user with filters and pagination
 */
export async function getNotes(
  userId: string,
  options: {
    type?: NoteType | "all";
    pillar?: LifePillar | "all";
    search?: string;
    page?: number;
    pageSize?: number;
    lastDoc?: QueryDocumentSnapshot<DocumentData>;
  } = {}
): Promise<{ notes: Note[]; hasMore: boolean; lastDoc?: QueryDocumentSnapshot<DocumentData> }> {
  try {
    const {
      type = "all",
      pillar = "all",
      pageSize = NOTES_PER_PAGE,
      lastDoc,
    } = options;

    let q = query(
      collection(db, NOTES_COLLECTION),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    // Apply type filter
    if (type !== "all") {
      q = query(q, where("type", "==", type));
    }

    // Apply pillar filter
    if (pillar !== "all") {
      q = query(q, where("pillar", "==", pillar));
    }

    // Apply pagination
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    q = query(q, limit(pageSize + 1)); // Fetch one extra to check if there are more

    const snapshot = await getDocs(q);
    const hasMore = snapshot.docs.length > pageSize;
    const docs = hasMore ? snapshot.docs.slice(0, pageSize) : snapshot.docs;

    const notes = docs.map(convertNoteData);
    const newLastDoc = docs[docs.length - 1];

    return { notes, hasMore, lastDoc: newLastDoc };
  } catch (error) {
    console.error("Error getting notes:", error);
    throw new Error("Failed to get notes");
  }
}

/**
 * Update a note
 */
export async function updateNote(
  noteId: string,
  userId: string,
  updates: Partial<Note>
): Promise<Note> {
  try {
    const noteRef = doc(db, NOTES_COLLECTION, noteId);
    const noteDoc = await getDoc(noteRef);

    if (!noteDoc.exists()) {
      throw new Error("Note not found");
    }

    const note = convertNoteData(noteDoc as QueryDocumentSnapshot<DocumentData>);

    if (note.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const updateData = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    await updateDoc(noteRef, updateData);

    const updatedNote = await getDoc(noteRef);
    return convertNoteData(updatedNote as QueryDocumentSnapshot<DocumentData>);
  } catch (error) {
    console.error("Error updating note:", error);
    throw new Error("Failed to update note");
  }
}

/**
 * Delete a note
 */
export async function deleteNote(noteId: string, userId: string): Promise<void> {
  try {
    const noteRef = doc(db, NOTES_COLLECTION, noteId);
    const noteDoc = await getDoc(noteRef);

    if (!noteDoc.exists()) {
      throw new Error("Note not found");
    }

    const note = convertNoteData(noteDoc as QueryDocumentSnapshot<DocumentData>);

    if (note.userId !== userId) {
      throw new Error("Unauthorized");
    }

    // Delete associated media files if any
    if (note.mediaUrl) {
      await deleteMediaFile(note.mediaUrl);
    }
    if (note.thumbnailUrl) {
      await deleteMediaFile(note.thumbnailUrl);
    }

    await deleteDoc(noteRef);
  } catch (error) {
    console.error("Error deleting note:", error);
    throw new Error("Failed to delete note");
  }
}

/**
 * Upload media file to Firebase Storage
 */
export async function uploadMediaFile(
  userId: string,
  noteId: string,
  file: File,
  type: "audio" | "image" | "video" | "thumbnail"
): Promise<string> {
  try {
    const fileExtension = file.name.split(".").pop();
    const fileName = type === "thumbnail" ? `thumbnail.${fileExtension}` : `${noteId}.${fileExtension}`;
    const filePath = `users/${userId}/${type}s/${fileName}`;

    const storageRef = ref(storage, filePath);
    await uploadBytes(storageRef, file);

    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading media file:", error);
    throw new Error("Failed to upload media file");
  }
}

/**
 * Delete media file from Firebase Storage
 */
async function deleteMediaFile(url: string): Promise<void> {
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch (error) {
    console.error("Error deleting media file:", error);
    // Don't throw - file might already be deleted
  }
}

/**
 * Search notes by text content
 */
export async function searchNotes(
  userId: string,
  searchTerm: string,
  options: { type?: NoteType; pillar?: LifePillar } = {}
): Promise<Note[]> {
  try {
    // Note: This is a simple implementation
    // For production, consider using Algolia, Elasticsearch, or Firebase Extensions
    const { notes } = await getNotes(userId, {
      type: options.type,
      pillar: options.pillar,
      pageSize: 100, // Limit for search
    });

    const searchLower = searchTerm.toLowerCase();
    return notes.filter(
      (note) =>
        note.title.toLowerCase().includes(searchLower) ||
        note.content.toLowerCase().includes(searchLower) ||
        note.tags.some((tag) => tag.toLowerCase().includes(searchLower))
    );
  } catch (error) {
    console.error("Error searching notes:", error);
    throw new Error("Failed to search notes");
  }
}
