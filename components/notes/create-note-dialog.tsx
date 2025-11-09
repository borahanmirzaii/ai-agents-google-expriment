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
import { useNotes } from "@/hooks/use-notes";
import { LifePillar } from "@/types";
import { X, Loader2, Sparkles } from "lucide-react";
import { analyzeNoteContent } from "@/lib/ai/gemini";

interface CreateNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function CreateNoteDialog({ open, onOpenChange }: CreateNoteDialogProps) {
  const { createNote } = useNotes();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [pillar, setPillar] = useState<LifePillar | undefined>();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);

  // Auto-analyze content for AI suggestions (debounced)
  useEffect(() => {
    if (!content || content.length < 50) {
      setSuggestedTags([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setAiLoading(true);
      try {
        const metadata = await analyzeNoteContent(content);
        if (metadata.topics && metadata.topics.length > 0) {
          setSuggestedTags(metadata.topics.slice(0, 5));
        }
      } catch (error) {
        console.error("Failed to analyze content:", error);
      } finally {
        setAiLoading(false);
      }
    }, 2000); // Wait 2 seconds after user stops typing

    return () => clearTimeout(timeoutId);
  }, [content]);

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
    if (!title.trim() || !content.trim()) {
      return;
    }

    setLoading(true);
    try {
      await createNote({
        type: "text",
        title: title.trim(),
        content: content.trim(),
        tags,
        pillar,
      });

      // Reset form
      setTitle("");
      setContent("");
      setTags([]);
      setPillar(undefined);
      setSuggestedTags([]);
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create note:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Note</DialogTitle>
          <DialogDescription>
            Capture your thoughts and ideas. AI will help organize them.
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

          {/* Editor */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Content</label>
            <TipTapEditor
              content={content}
              onChange={setContent}
              placeholder="Start writing your note..."
            />
          </div>

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
          <Button type="button" onClick={handleSubmit} disabled={loading || !title || !content}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Note"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
