import { useState } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { MoreVertical, Pencil, Trash, X, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Note {
  id: string;
  content: string;
  referenced_text: string | null;
  created_at: string;
}

interface ReaderSidebarProps {
  onNoteClick?: (text: string) => void;
  notes: Note[];
  onEditNote?: (note: Note, newContent: string) => void;
  onDeleteNote?: (id: string) => void;
}

export function ReaderSidebar({ 
  onNoteClick,
  notes,
  onEditNote,
  onDeleteNote,
}: ReaderSidebarProps) {
  const [selectedTab, setSelectedTab] = useState("notes");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const handleStartEdit = (note: Note) => {
    setEditingNoteId(note.id);
    setEditContent(note.content);
  };

  const handleSaveEdit = (note: Note) => {
    onEditNote?.(note, editContent);
    setEditingNoteId(null);
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditContent("");
  };

  return (
    <div className="w-1/4 border-l border-border fixed right-0 top-0 bottom-0 bg-background p-4 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <Button 
          variant={selectedTab === "notes" ? "default" : "outline"} 
          className="flex-1"
          onClick={() => setSelectedTab("notes")}
        >
          Notes
        </Button>
        <Button 
          variant={selectedTab === "chat" ? "default" : "outline"} 
          className="flex-1"
          onClick={() => setSelectedTab("chat")}
        >
          Chat
        </Button>
      </div>

      {selectedTab === "notes" && (
        <div className="space-y-4 flex-1 overflow-auto">
          <ScrollArea className="flex-1">
            <div className="space-y-4">
              {notes?.map((note) => (
                <Card 
                  key={note.id} 
                  className="p-4 relative group"
                >
                  <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleStartEdit(note)}>
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => onDeleteNote?.(note.id)}
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div 
                    className="cursor-pointer"
                    onClick={() => note.referenced_text && onNoteClick?.(note.referenced_text)}
                  >
                    {note.referenced_text && (
                      <p className="text-sm text-muted-foreground mb-2 italic border-l-2 border-primary/50 pl-2">
                        "{note.referenced_text}"
                      </p>
                    )}
                    {editingNoteId === note.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="min-h-[100px]"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelEdit();
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveEdit(note);
                            }}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm">{note.content}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(note.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}