
import { useState } from "react";
import { Card } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
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
  onNoteClick?: (text: string) => void;
  setSelectedText: (text: string | null) => void;
  selectedRange?: Range | null;
}

export function NoteSidebar({ 
  documentId, 
  selectedText, 
  setSelectedText,
  selectedRange 
}: NoteSidebarProps) {
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

  if (!selectedText && !selectedRange) return null;

  return (
    <Card className="p-4 w-72 shadow-lg">
      <Textarea
        value={newNote}
        onChange={(e) => setNewNote(e.target.value)}
        placeholder="Add a note..."
        className="mb-2"
      />
      <div className="flex gap-2">
        <Button 
          onClick={handleSubmitNote}
          disabled={!newNote.trim()}
          className="flex-1"
        >
          Add Note
        </Button>
        <Button 
          variant="outline"
          onClick={() => setSelectedText(null)}
        >
          Cancel
        </Button>
      </div>
    </Card>
  );
}
