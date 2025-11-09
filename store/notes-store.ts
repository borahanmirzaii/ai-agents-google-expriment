import { create } from "zustand";
import { Note, NoteType, LifePillar } from "@/types";

interface FilterState {
  search: string;
  type: NoteType | "all";
  pillar: LifePillar | "all";
  sortBy: "createdAt" | "updatedAt" | "title";
  sortOrder: "asc" | "desc";
}

interface NotesState {
  notes: Note[];
  loading: boolean;
  error: string | null;
  filters: FilterState;
  selectedNote: Note | null;

  // Pagination
  hasMore: boolean;
  page: number;

  // Actions
  setNotes: (notes: Note[]) => void;
  addNote: (note: Note) => void;
  updateNote: (id: string, data: Partial<Note>) => void;
  removeNote: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  setSelectedNote: (note: Note | null) => void;
  resetFilters: () => void;
  clearNotes: () => void;
}

const defaultFilters: FilterState = {
  search: "",
  type: "all",
  pillar: "all",
  sortBy: "createdAt",
  sortOrder: "desc",
};

export const useNotesStore = create<NotesState>((set) => ({
  notes: [],
  loading: false,
  error: null,
  filters: defaultFilters,
  selectedNote: null,
  hasMore: true,
  page: 1,

  setNotes: (notes) => set({ notes }),

  addNote: (note) =>
    set((state) => ({
      notes: [note, ...state.notes],
    })),

  updateNote: (id, data) =>
    set((state) => ({
      notes: state.notes.map((note) =>
        note.id === id ? { ...note, ...data, updatedAt: new Date() } : note
      ),
    })),

  removeNote: (id) =>
    set((state) => ({
      notes: state.notes.filter((note) => note.id !== id),
    })),

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),
  setSelectedNote: (note) => set({ selectedNote: note }),
  resetFilters: () => set({ filters: defaultFilters }),
  clearNotes: () => set({ notes: [], page: 1, hasMore: true }),
}));
