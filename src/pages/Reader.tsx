
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Minus, Plus } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect, useRef } from "react";
import { NoteSidebar } from "@/components/NoteSidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";

interface InlineNote {
  id: string;
  content: string;
  referenced_text: string | null;
  created_at: string;
  position?: { top: number; left: number };
}

export default function Reader() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [fontSize, setFontSize] = useState(16);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState<Range | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [notes, setNotes] = useState<InlineNote[]>([]);

  const { data: content, isLoading } = useQuery({
    queryKey: ['document-content', documentId],
    queryFn: async () => {
      if (!documentId) return null;
      const { data, error } = await supabase
        .from('documents')
        .select('content, title')
        .eq('id', documentId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!documentId
  });

  const { data: fetchedNotes } = useQuery({
    queryKey: ['notes', documentId],
    queryFn: async () => {
      if (!documentId) return null;
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('document_id', documentId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!documentId
  });

  useEffect(() => {
    if (fetchedNotes) {
      const notesWithPositions = fetchedNotes.map(note => {
        if (note.referenced_text && contentRef.current) {
          const content = contentRef.current.innerHTML;
          const index = content.indexOf(note.referenced_text);
          if (index !== -1) {
            const range = document.createRange();
            const textNodes = Array.from(contentRef.current.getElementsByTagName('*'))
              .filter(node => node.textContent?.includes(note.referenced_text || ''));
            
            if (textNodes.length > 0) {
              const textNode = textNodes[0];
              const rect = textNode.getBoundingClientRect();
              return {
                ...note,
                position: {
                  top: rect.top + window.scrollY,
                  left: rect.right + 20
                }
              };
            }
          }
        }
        return note;
      });
      setNotes(notesWithPositions);
    }
  }, [fetchedNotes]);

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    
    if (selectedText && selectedText.length > 0) {
      const range = selection?.getRangeAt(0);
      if (range) {
        const rect = range.getBoundingClientRect();
        setSelectedRange(range);
        setSelectedText(selectedText);
      }
    }
  }, []);

  useEffect(() => {
    if (!contentRef.current || !notes || !content) return;

    let newHtml = content.content;
    notes.forEach(note => {
      if (note.referenced_text) {
        const cleanText = note.referenced_text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        newHtml = newHtml.replace(
          new RegExp(`(${cleanText})`, 'g'),
          '<span class="highlighted-text">$1</span>'
        );
      }
    });
    contentRef.current.innerHTML = newHtml;
  }, [notes, content]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)}
            >
              ← Back
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setFontSize(prev => Math.max(12, prev - 2))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setFontSize(prev => Math.min(24, prev + 2))}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-4 relative">
        <h1 className="text-3xl font-bold mb-8">{content?.title}</h1>
        
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <article 
            className="text-gray-200 max-w-none prose-invert relative
              [&_p]:mb-6 [&_p]:leading-relaxed
              [&_a]:text-blue-400 [&_a:hover]:text-blue-300 [&_a]:no-underline [&_a:hover]:underline
              [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-gray-100 [&_h1]:my-6
              [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-gray-100 [&_h2]:my-4
              [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-gray-100 [&_h3]:my-3
              [&_strong]:text-gray-100
              [&_img]:mx-auto [&_img]:my-6 [&_img]:max-w-full
              [&_figure]:my-8 [&_figure]:mx-auto
              [&_figcaption]:text-sm [&_figcaption]:text-gray-400 [&_figcaption]:text-center [&_figcaption]:mt-2
              [&_time]:text-gray-400 [&_time]:text-sm
              [&>div>ul]:list-none [&>div>ul]:p-0 [&>div>ul]:m-0
              [&_section]:mt-8
              [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:my-4
              [&_ol]:list-decimal [&_ol]:ml-6 [&_ol]:my-4
              [&_li]:mb-2
              [&_.highlighted-text]:bg-primary/20 [&_.highlighted-text]:cursor-pointer [&_.highlighted-text]:transition-colors [&_.highlighted-text]:hover:bg-primary/30"
            style={{ 
              fontSize: `${fontSize}px`,
            }}
            onMouseUp={handleTextSelection}
          >
            <div 
              ref={contentRef}
              dangerouslySetInnerHTML={{ __html: content?.content || '' }}
            />
            
            {/* Render existing notes */}
            {notes.map((note) => (
              note.position && (
                <Card
                  key={note.id}
                  className="absolute w-72 p-4 shadow-lg"
                  style={{
                    top: `${note.position.top}px`,
                    left: `${note.position.left}px`,
                  }}
                >
                  <p className="text-sm">{note.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(note.created_at).toLocaleDateString()}
                  </p>
                </Card>
              )
            ))}

            {/* Render note creation form */}
            {selectedText && selectedRange && (
              <div
                className="absolute"
                style={{
                  top: `${selectedRange.getBoundingClientRect().top + window.scrollY}px`,
                  left: `${selectedRange.getBoundingClientRect().right + 20}px`,
                }}
              >
                <NoteSidebar
                  documentId={documentId || ''}
                  selectedText={selectedText}
                  setSelectedText={setSelectedText}
                  selectedRange={selectedRange}
                  onClose={() => {}}
                  onNoteClick={() => {}}
                />
              </div>
            )}
          </article>
        </ScrollArea>
      </div>
    </div>
  );
}
