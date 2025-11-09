"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Search, Loader2 } from "lucide-react";
import { useNotes } from "@/hooks/use-notes";
import { useNotesStore } from "@/store/notes-store";
import { useUIStore } from "@/store/ui-store";
import { NoteCard } from "@/components/notes/note-card";
import { CreateNoteMulti } from "@/components/notes/create-note-multi";
import { EditNoteDialog } from "@/components/notes/edit-note-dialog";
import { DeleteNoteDialog } from "@/components/notes/delete-note-dialog";
import { Note, NoteType, LifePillar } from "@/types";

export default function NotesPage() {
  const { notes, loading, updateNote, deleteNote } = useNotes();
  const { filters, setFilters } = useNotesStore();
  const { addToast } = useUIStore();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleTypeFilter = (type: NoteType | "all") => {
    setFilters({ type });
  };

  const handlePillarFilter = (pillar: LifePillar | "all") => {
    setFilters({ pillar });
  };

  const handleEdit = (note: Note) => {
    setSelectedNote(note);
    setEditDialogOpen(true);
  };

  const handleDelete = (note: Note) => {
    setSelectedNote(note);
    setDeleteDialogOpen(true);
  };

  const handleSaveEdit = async (id: string, updates: Partial<Note>) => {
    try {
      await updateNote(id, updates);
      addToast({ type: "success", message: "Note updated successfully!" });
    } catch (error) {
      console.error("Failed to update note:", error);
      addToast({ type: "error", message: "Failed to update note" });
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedNote) return;

    try {
      await deleteNote(selectedNote.id);
      addToast({ type: "success", message: "Note deleted successfully!" });
      setDeleteDialogOpen(false);
      setSelectedNote(null);
    } catch (error) {
      console.error("Failed to delete note:", error);
      addToast({ type: "error", message: "Failed to delete note" });
    }
  };

  // Filter notes by search term (client-side)
  const filteredNotes = notes.filter((note) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      note.title.toLowerCase().includes(search) ||
      note.content.toLowerCase().includes(search) ||
      note.tags.some((tag) => tag.toLowerCase().includes(search))
    );
  });

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Notes</h1>
          <p className="text-muted-foreground mt-2">
            Capture your thoughts in multiple formats
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Note
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-2 rounded-md border bg-background"
          value={filters.type}
          onChange={(e) => handleTypeFilter(e.target.value as NoteType | "all")}
        >
          <option value="all">All Types</option>
          <option value="text">Text</option>
          <option value="audio">Audio</option>
          <option value="image">Image</option>
          <option value="video">Video</option>
        </select>
        <select
          className="px-4 py-2 rounded-md border bg-background"
          value={filters.pillar}
          onChange={(e) => handlePillarFilter(e.target.value as LifePillar | "all")}
        >
          <option value="all">All Pillars</option>
          <option value="health">Health</option>
          <option value="finance">Finance</option>
          <option value="career">Career</option>
          <option value="relationships">Relationships</option>
          <option value="mental">Mental</option>
          <option value="learning">Learning</option>
          <option value="recreation">Recreation</option>
          <option value="contribution">Contribution</option>
        </select>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredNotes.length === 0 && !searchTerm && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Welcome to Notes</CardTitle>
              <CardDescription>Create your first note</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Click the &ldquo;New Note&rdquo; button to get started. You can create text,
                audio, image, or video notes.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Analysis</CardTitle>
              <CardDescription>Smart organization</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your notes are automatically analyzed and tagged using Google
                Gemini AI for easy discovery.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Offline Support</CardTitle>
              <CardDescription>Works everywhere</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Create and edit notes offline. They&apos;ll sync automatically when
                you&apos;re back online.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* No Results */}
      {!loading && filteredNotes.length === 0 && searchTerm && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No notes found matching &ldquo;{searchTerm}&rdquo;</p>
        </div>
      )}

      {/* Notes Grid */}
      {!loading && filteredNotes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Create Note Dialog */}
      <CreateNoteMulti open={createDialogOpen} onOpenChange={setCreateDialogOpen} />

      {/* Edit Note Dialog */}
      <EditNoteDialog
        note={selectedNote}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSaveEdit}
      />

      {/* Delete Note Dialog */}
      <DeleteNoteDialog
        note={selectedNote}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
