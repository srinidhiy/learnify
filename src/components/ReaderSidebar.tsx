import { useState } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { Card } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";

interface Note {
  id: string;
  content: string;
  referenced_text: string | null;
  created_at: string;
  position?: number;
}

interface ReaderSidebarProps {
  onNoteClick?: (text: string) => void;
  notes: Note[];
}

export function ReaderSidebar({ 
  onNoteClick,
  notes,
}: ReaderSidebarProps) {
  const [selectedTab, setSelectedTab] = useState("notes");

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
                  className="p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => note.referenced_text && onNoteClick?.(note.referenced_text)}
                >
                  {note.referenced_text && (
                    <p className="text-sm text-muted-foreground mb-2 italic border-l-2 border-primary/50 pl-2">
                      "{note.referenced_text}"
                    </p>
                  )}
                  <p className="text-sm">{note.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(note.created_at).toLocaleDateString()}
                  </p>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}