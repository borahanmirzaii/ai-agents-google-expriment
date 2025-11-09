import { Note } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Mic, Image, Video } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface NoteCardProps {
  note: Note;
  onClick?: () => void;
}

const noteIcons = {
  text: FileText,
  audio: Mic,
  image: Image,
  video: Video,
};

export function NoteCard({ note, onClick }: NoteCardProps) {
  const Icon = noteIcons[note.type];

  return (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-lg">{note.title}</CardTitle>
          </div>
          {note.pillar && (
            <Badge variant="secondary" className="text-xs">
              {note.pillar}
            </Badge>
          )}
        </div>
        <CardDescription>
          {formatDistanceToNow(note.createdAt, { addSuffix: true })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3">
          {note.type === "text" ? note.content : note.transcription || "No content"}
        </p>
        {note.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {note.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
