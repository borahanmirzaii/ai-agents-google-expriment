import { Note } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Mic, Image, Video, Edit, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface NoteCardProps {
  note: Note;
  onClick?: () => void;
  onEdit?: (note: Note) => void;
  onDelete?: (note: Note) => void;
}

const noteIcons = {
  text: FileText,
  audio: Mic,
  image: Image,
  video: Video,
};

export function NoteCard({ note, onClick, onEdit, onDelete }: NoteCardProps) {
  const Icon = noteIcons[note.type];

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(note);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(note);
  };

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
          <div className="flex items-center gap-2">
            {note.pillar && (
              <Badge variant="secondary" className="text-xs">
                {note.pillar}
              </Badge>
            )}
            {onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
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
