
import { useState } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { Card } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";

interface Note {
  id: string;
  content: string;
  referenced_text: string | null;
  created_at: string;
}

interface ReaderSidebarProps {
  documentId: string;
  selectedText: string | null;
  onNoteClick?: (text: string) => void;
  setSelectedText: (text: string | null) => void;
}

export function ReaderSidebar({ 
  documentId, 
  selectedText, 
  onNoteClick,
  setSelectedText 
}: ReaderSidebarProps) {
  const [newNote, setNewNote] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [selectedTab, setSelectedTab] = useState("notes");

  const { data: notes, refetch: refetchNotes } = useQuery({
    queryKey: ['notes', documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('document_id', documentId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Note[];
    }
  });

  const handleSubmitNote = async () => {
    if (!user) return;
    
    try {
      const { error } = await supabase
        .from('notes')
        .insert({
          content: newNote,
          document_id: documentId,
          user_id: user.id,
          referenced_text: selectedText
        });

      if (error) throw error;

      setNewNote("");
      setIsAddingNote(false);
      setSelectedText(null);
      refetchNotes();
      toast({
        title: "Note added successfully",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: "Failed to add note",
        variant: "destructive",
        duration: 3000,
      });
    }
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
          {selectedText && !isAddingNote && (
            <Button 
              className="w-full"
              onClick={() => setIsAddingNote(true)}
            >
              Add note for selected text
            </Button>
          )}

          {isAddingNote && selectedText && (
            <Card className="p-4">
              <p className="text-sm text-muted-foreground mb-2">Add note for selected text:</p>
              <p className="text-sm italic mb-4 border-l-2 border-primary/50 pl-2">
                "{selectedText}"
              </p>
              <Textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Write your note..."
                className="mb-2"
              />
              <div className="flex gap-2">
                <Button 
                  onClick={handleSubmitNote}
                  // disabled={!newNote.trim()}
                  className="flex-1"
                >
                  Add Note
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setIsAddingNote(false);
                    setSelectedText(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </Card>
          )}

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
