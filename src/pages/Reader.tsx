
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Minus, Plus } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect, useRef } from "react";
import { ReaderSidebar } from "@/components/ReaderSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { getDocument, getNotes } from "@/lib/supabaseUtils";

export default function Reader() {
  const { documentId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [notes, setNotes] = useState([]);
  const [fontSize, setFontSize] = useState(16);
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      const fetchDocument = async () => {
        setDocument(await getDocument(user, documentId));
      };
      const fetchNotes = async () => {
        setNotes(await getNotes(user, documentId));
      };
      fetchDocument();
      fetchNotes();
    }, [user]);

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    
    if (selectedText && selectedText.length > 0) {
      setSelectedText(selectedText);
    } else {
      setSelectedText(null);
    }
  }, []);

  const scrollToText = useCallback((text: string) => {
    if (!contentRef.current) return;

    console.log(contentRef.current.innerHTML);

    const contentHtml = contentRef.current.innerHTML;
    const cleanText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const newHtml = contentHtml.replace(
      new RegExp(`(${cleanText})`, 'g'),
      '<span class="highlighted-text">$1</span>'
    );
    contentRef.current.innerHTML = newHtml;

    const highlightedEl = contentRef.current.querySelector('.highlighted-text');
    if (highlightedEl) {
      highlightedEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  useEffect(() => {
    if (!contentRef.current || !notes || !document) return;

    let newHtml = document.content;
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
  }, [notes, document]);

  return (
    <div className="min-h-screen bg-background flex">
      <div className={`flex-1 p-6 md:p-12 mr-80`}>
        <div className="w-3/4 mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/')}
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

          <h1 className="text-3xl font-bold mb-8">{document?.title}</h1>
          
          <article 
            className="text-gray-200 max-w-none prose-invert
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
              [&_.highlighted-text]:bg-[#333333]"
            style={{ 
              fontSize: `${fontSize}px`,
            }}
            onMouseUp={handleTextSelection}
          >
            <div 
              ref={contentRef}
              dangerouslySetInnerHTML={{ __html: document?.content || '' }}
            />
          </article>
        </div>
      </div>

      {documentId && (
        <ReaderSidebar
          documentId={documentId}
          selectedText={selectedText}
          setSelectedText={setSelectedText}
          onNoteClick={scrollToText}
        />
      )}
    </div>
  );
}
