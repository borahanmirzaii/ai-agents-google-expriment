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
import { AudioRecorder } from "./audio-recorder";
import { ImageCapture } from "./image-capture";
import { VideoRecorder } from "./video-recorder";
import { useNotes } from "@/hooks/use-notes";
import { useAuthStore } from "@/store/auth-store";
import { useUIStore } from "@/store/ui-store";
import { LifePillar, NoteType } from "@/types";
import { X, Loader2, Sparkles, FileText, Mic, Image as ImageIcon, Video } from "lucide-react";
import { analyzeNoteContent } from "@/lib/ai/gemini";
import { uploadMediaFile, compressImage, generateVideoThumbnail } from "@/lib/utils/media-upload";

interface CreateNoteMultiProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NOTE_TYPES: { value: NoteType; label: string; icon: typeof FileText }[] = [
  { value: "text", label: "Text", icon: FileText },
  { value: "audio", label: "Audio", icon: Mic },
  { value: "image", label: "Image", icon: ImageIcon },
  { value: "video", label: "Video", icon: Video },
];

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

export function CreateNoteMulti({ open, onOpenChange }: CreateNoteMultiProps) {
  const { createNote } = useNotes();
  const { user } = useAuthStore();
  const { addToast } = useUIStore();
  const [noteType, setNoteType] = useState<NoteType>("text");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [pillar, setPillar] = useState<LifePillar | undefined>();
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [suggestedTags, setSuggestedTags] = useState<string[]>([]);

  // Media state
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);

  // Auto-analyze content for AI suggestions (debounced)
  useEffect(() => {
    if (noteType !== "text" || !content || content.length < 50) {
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
    }, 2000);

    return () => clearTimeout(timeoutId);
  }, [content, noteType]);

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
    if (!title.trim() || !user) {
      addToast({ type: "error", message: "Please provide a title" });
      return;
    }

    setLoading(true);
    try {
      let mediaUrl: string | undefined;
      let thumbnailUrl: string | undefined;
      let transcription: string | undefined;

      // Handle media upload
      if (noteType === "audio" && audioBlob) {
        const audioFile = new File([audioBlob], "audio.webm", { type: "audio/webm" });
        addToast({ type: "info", message: "Uploading audio..." });
        mediaUrl = await uploadMediaFile(user.uid, audioFile, "audio");

        // Transcribe audio
        try {
          addToast({ type: "info", message: "Transcribing audio..." });
          const response = await fetch("/api/media/transcribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mediaUrl, mediaType: "audio" }),
          });

          if (response.ok) {
            const { data } = await response.json();
            transcription = data.transcript;
            addToast({ type: "success", message: "Audio transcribed successfully!" });
          }
        } catch (error) {
          console.error("Failed to transcribe audio:", error);
          addToast({ type: "warning", message: "Transcription failed, but note will be saved" });
        }
      } else if (noteType === "image" && imageFile) {
        const compressed = await compressImage(imageFile);
        addToast({ type: "info", message: "Uploading image..." });
        mediaUrl = await uploadMediaFile(user.uid, compressed, "image");

        // Perform OCR
        try {
          addToast({ type: "info", message: "Extracting text from image..." });
          const response = await fetch("/api/media/ocr", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageUrl: mediaUrl }),
          });

          if (response.ok) {
            const { data } = await response.json();
            if (data.text) {
              transcription = data.text;
              addToast({ type: "success", message: "Text extracted successfully!" });
            }
            // Add suggested tags from image labels
            if (data.suggestedTags && data.suggestedTags.length > 0) {
              setSuggestedTags(data.suggestedTags);
            }
          }
        } catch (error) {
          console.error("Failed to perform OCR:", error);
          addToast({ type: "warning", message: "OCR failed, but note will be saved" });
        }
      } else if (noteType === "video" && videoBlob) {
        const videoFile = new File([videoBlob], "video.webm", { type: "video/webm" });
        const thumbnail = await generateVideoThumbnail(videoFile);

        addToast({ type: "info", message: "Uploading video..." });
        [mediaUrl, thumbnailUrl] = await Promise.all([
          uploadMediaFile(user.uid, videoFile, "video"),
          uploadMediaFile(user.uid, thumbnail, "thumbnail"),
        ]);

        // Transcribe video audio
        try {
          addToast({ type: "info", message: "Transcribing video..." });
          const response = await fetch("/api/media/transcribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mediaUrl, mediaType: "video" }),
          });

          if (response.ok) {
            const { data } = await response.json();
            transcription = data.transcript;
            addToast({ type: "success", message: "Video transcribed successfully!" });
          }
        } catch (error) {
          console.error("Failed to transcribe video:", error);
          addToast({ type: "warning", message: "Transcription failed, but note will be saved" });
        }
      }

      await createNote({
        type: noteType,
        title: title.trim(),
        content: content.trim() || "No content",
        tags,
        pillar,
        ...(mediaUrl && { mediaUrl }),
        ...(thumbnailUrl && { thumbnailUrl }),
        ...(transcription && { transcription }),
      } as never);

      addToast({ type: "success", message: "Note created successfully!" });

      // Reset form
      setTitle("");
      setContent("");
      setTags([]);
      setPillar(undefined);
      setSuggestedTags([]);
      setAudioBlob(null);
      setImageFile(null);
      setVideoBlob(null);
      setNoteType("text");
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create note:", error);
      addToast({ type: "error", message: "Failed to create note" });
    } finally {
      setLoading(false);
    }
  };

  const isValid = () => {
    if (!title.trim()) return false;
    if (noteType === "text" && !content.trim()) return false;
    if (noteType === "audio" && !audioBlob) return false;
    if (noteType === "image" && !imageFile) return false;
    if (noteType === "video" && !videoBlob) return false;
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Note</DialogTitle>
          <DialogDescription>
            Capture your thoughts in multiple formats with AI assistance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Note Type Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Note Type</label>
            <div className="flex flex-wrap gap-2">
              {NOTE_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <Badge
                    key={type.value}
                    variant={noteType === type.value ? "default" : "outline"}
                    className="cursor-pointer px-3 py-1.5"
                    onClick={() => setNoteType(type.value)}
                  >
                    <Icon className="h-3 w-3 mr-1.5" />
                    {type.label}
                  </Badge>
                );
              })}
            </div>
          </div>

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

          {/* Content based on type */}
          {noteType === "text" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Content</label>
              <TipTapEditor
                content={content}
                onChange={setContent}
                placeholder="Start writing your note..."
              />
            </div>
          )}

          {noteType === "audio" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Audio Recording</label>
              <AudioRecorder onRecordingComplete={setAudioBlob} />
            </div>
          )}

          {noteType === "image" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Image</label>
              <ImageCapture onImageCapture={setImageFile} />
            </div>
          )}

          {noteType === "video" && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Video Recording</label>
              <VideoRecorder onRecordingComplete={setVideoBlob} />
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
          <Button type="button" onClick={handleSubmit} disabled={loading || !isValid()}>
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
