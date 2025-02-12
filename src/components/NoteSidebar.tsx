
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

interface NoteSidebarProps {
  documentId: string;
  selectedText: string | null;
  onClose: () => void;
}

export function NoteSidebar({ documentId, selectedText, onClose }: NoteSidebarProps) {
  const [newNote, setNewNote] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();

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
    <div className="w-80 border-l border-border h-screen fixed right-0 top-0 bg-background p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Notes</h2>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {selectedText && (
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
            <Button 
              onClick={handleSubmitNote}
              disabled={!newNote.trim()}
              className="w-full"
            >
              Add Note
            </Button>
          </Card>
        )}

        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-4">
            {notes?.map((note) => (
              <Card key={note.id} className="p-4">
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
    </div>
  );
}
