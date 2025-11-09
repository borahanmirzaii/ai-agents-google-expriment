"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { TipTapEditor } from "./tiptap-editor";
import { Note, LifePillar } from "@/types";
import { X, Loader2, Sparkles } from "lucide-react";
import { analyzeNoteContent } from "@/lib/ai/gemini";

interface EditNoteDialogProps {
  note: Note | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (id: string, updates: Partial<Note>) => Promise<void>;
}

const PILLARS: { value: LifePillar; label: string }[] = [
  { value: "health", label: "Health" },
  { value: "finance", label: "Finance" },
  { value: "career", label: "Career" },
  { value: "relationships", label: "Relationships" },
  { value: "mental", label: "Mental" },
  { value: "learning", label: "Learning" },
  { value: "recreation", label: "Recreation" },
  { value: "contribution", label: "Contribution" },
];

export function EditNoteDialog({
  note,
  open,
  onOpenChange,
  onSave,
}: EditNoteDialogProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [pillar, setPillar] = useState<LifePillar | undefined>();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);

  // Initialize form when note changes
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setTags(note.tags || []);
      setPillar(note.pillar);
      setSuggestedTags([]);
    }
  }, [note]);

  // Auto-analyze content for AI suggestions (only for text notes)
  useEffect(() => {
    if (note?.type !== "text" || !content || content.length < 50) {
      setSuggestedTags([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setAiLoading(true);
      try {
        const metadata = await analyzeNoteContent(content);
        if (metadata.topics && metadata.topics.length > 0) {
          // Filter out tags that are already added
          const newSuggestions = metadata.topics
            .filter((topic) => !tags.includes(topic))
            .slice(0, 5);
          setSuggestedTags(newSuggestions);
        }
      } catch (error) {
        console.error("Failed to analyze content:", error);
      } finally {
        setAiLoading(false);
      }
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [content, note?.type, tags]);

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleAddSuggestedTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setSuggestedTags(suggestedTags.filter((t) => t !== tag));
  };

  const handleSubmit = async () => {
    if (!note || !title.trim()) return;

    setLoading(true);
    try {
      const updates: Partial<Note> = {
        title: title.trim(),
        tags,
        pillar,
        updatedAt: new Date(),
      };

      // Only update content for text notes
      if (note.type === "text") {
        updates.content = content.trim();
      }

      await onSave(note.id, updates);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update note:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!note) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Note</DialogTitle>
          <DialogDescription>
            Update your note&apos;s title, content, tags, and pillar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="title"
              placeholder="Enter note title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Content (only for text notes) */}
          {note.type === "text" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Content</label>
              <TipTapEditor
                content={content}
                onChange={setContent}
                placeholder="Edit your note content..."
              />
            </div>
          )}

          {/* Show transcription for media notes (read-only) */}
          {note.type !== "text" && note.transcription && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Transcription (Read-only)
              </label>
              <div className="p-3 rounded-md border bg-muted/50 text-sm">
                {note.transcription}
              </div>
            </div>
          )}

          {/* Pillar Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Pillar (Optional)</label>
            <div className="flex flex-wrap gap-2">
              {PILLARS.map((p) => (
                <Badge
                  key={p.value}
                  variant={pillar === p.value ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setPillar(pillar === p.value ? undefined : p.value)}
                >
                  {p.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* AI Suggested Tags */}
          {suggestedTags.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <label className="text-sm font-medium">AI Suggested Tags</label>
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestedTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                    onClick={() => handleAddSuggestedTag(tag)}
                  >
                    + {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Tags {aiLoading && <Loader2 className="h-3 w-3 inline animate-spin ml-2" />}
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Add tags..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                disabled={loading}
              />
              <Button type="button" onClick={handleAddTag} disabled={loading}>
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="default">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={loading || !title.trim()}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
