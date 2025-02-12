
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Minus, Plus } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect, useRef } from "react";
import { NoteSidebar } from "@/components/NoteSidebar";

export default function Reader() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [fontSize, setFontSize] = useState(16);
  const [showNotes, setShowNotes] = useState(true);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

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

  const { data: notes } = useQuery({
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

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    
    if (selectedText && selectedText.length > 0) {
      setSelectedText(selectedText);
    }
  }, []);

  const scrollToText = useCallback((text: string) => {
    if (!contentRef.current) return;

    const contentHtml = contentRef.current.innerHTML;
    const cleanText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const newHtml = contentHtml.replace(
      new RegExp(`(${cleanText})`, 'g'),
      '<span class="bg-primary/20">$1</span>'
    );
    contentRef.current.innerHTML = newHtml;

    const highlightedEl = contentRef.current.querySelector('.bg-primary/20');
    if (highlightedEl) {
      highlightedEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
          '<span class="bg-primary/20">$1</span>'
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
      <div className={`p-6 md:p-12 transition-all ${showNotes ? 'mr-80' : ''}`}>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
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

          <h1 className="text-3xl font-bold mb-8">{content?.title}</h1>
          
          <article 
            className="text-gray-200 max-w-none
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
              [&_li]:mb-2"
            style={{ 
              fontSize: `${fontSize}px`,
            }}
            onMouseUp={handleTextSelection}
          >
            <div 
              ref={contentRef}
              dangerouslySetInnerHTML={{ __html: content?.content || '' }}
            />
          </article>
        </div>
      </div>

      {documentId && (
        <NoteSidebar
          documentId={documentId}
          selectedText={selectedText}
          onClose={() => {
            setShowNotes(false);
            setSelectedText(null);
          }}
          onNoteClick={scrollToText}
        />
      )}
    </div>
  );
}
