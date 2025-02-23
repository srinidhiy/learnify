import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Highlighter, Loader2, Minus, Notebook, Plus } from "lucide-react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { ReaderSidebar } from "@/components/ReaderSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { getDocument, getNotes } from "@/lib/supabaseUtils";
import Mark from 'mark.js';
import { useToast } from "@/hooks/use-toast";

// Helper function to normalize text for comparison
const normalizeText = (text: string) => {
  if (!text) return '';
  return text
    .trim();
};

const findTextPosition = (content: string, searchText: string) => {
  const normalizedContent = normalizeText(content);
  const normalizedSearchText = normalizeText(searchText);
  return normalizedContent.indexOf(normalizedSearchText);
};

export default function Reader() {
  const { toast } = useToast();
  const { documentId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [newNote, setNewNote] = useState("");
  const [documentData, setDocumentData] = useState(null);
  const [fontSize, setFontSize] = useState(16);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupType, setPopupType] = useState<"select" | "note">("select");
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const markInstance = useRef<Mark | null>(null);

  const { data: notes, refetch: refetchNotes } = useQuery({
    queryKey: ['notes', documentId],
    queryFn: async () => {
      const fetchedNotes = await getNotes(user, documentId);
      return fetchedNotes;
    },
    enabled: !!user && !!documentId,
  });

  // Initialize mark.js instance with acrossElements option
  useEffect(() => {
    if (contentRef.current) {
      markInstance.current = new Mark(contentRef.current);
    }
  }, []);

  useEffect(() => {
    const fetchDocument = async () => {
      const doc = await getDocument(user, documentId);
      setDocumentData(doc);
    };
    fetchDocument();
  }, [user, documentId]);

  // Sort notes based on their appearance in the document
  const sortedNotes = useMemo(() => {
    if (!documentData?.content || !notes) return [];

    const notesWithPositions = notes.map(note => {
      if (!note.referenced_text) return { ...note, position: Infinity };
      
      const position = findTextPosition(documentData.content, note.referenced_text);
      return {
        ...note,
        position: position === -1 ? Infinity : position
      };
    });

    return notesWithPositions.sort((a, b) => {
      if (!a.referenced_text && !b.referenced_text) {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (!a.referenced_text) return 1;
      if (!b.referenced_text) return -1;
      
      return (a.position || 0) - (b.position || 0);
    });
  }, [notes, documentData]);

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    const normalizedSelection = normalizeText(selection.toString());
    if (!selection || normalizedSelection === "") {
      setPopupVisible(false);
      setSelectedText(null);
      return;
    }
    
    setPopupType("select");
    
    const range = selection.getRangeAt(0);
    console.log(range)
    const selectionRects = range.getClientRects();
    const firstRect = selectionRects[0];
    
    setPopupPosition({
      top: firstRect.top + window.scrollY - 50,
      left: firstRect.left + window.scrollX,
    });
    
    setPopupVisible(true);
    setSelectedText(normalizedSelection);
  }, []);

  const handleSubmitNote = async () => {
    if (!user || !selectedText) return;
    
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
      
      // Apply new highlight immediately with acrossElements
      if (markInstance.current) {
        console.log("Marking text:", selectedText);
        markInstance.current.mark(selectedText, {
          className: 'highlighted-text',
          separateWordSearch: false,
          acrossElements: true
        });
      }

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
    } finally {
      setPopupVisible(false);
    }
  };

  const applyHighlights = useCallback(() => {
    if (!markInstance.current) return;
    
    // Clear existing highlights
    markInstance.current.unmark();

    // Apply highlights for each note with acrossElements
    sortedNotes.forEach(note => {
      if (note.referenced_text) {
        markInstance.current?.mark(note.referenced_text, {
          className: 'highlighted-text',
          separateWordSearch: false,
          acrossElements: true,
          done: () => {
            // Now using the global document object correctly
            const marks = window.document.querySelectorAll('.highlighted-text');
            marks.forEach(mark => {
              mark.setAttribute('data-note-id', note.id);
            });
          }
        });
      }
    });
  }, [sortedNotes]);

  const scrollToText = useCallback((text: string) => {
    if (!contentRef.current || !markInstance.current) return;

    // First ensure highlights are applied
    applyHighlights();

    // Find the highlight element containing the text
    const elements = contentRef.current.querySelectorAll('.highlighted-text');
    for (const element of elements) {
      if (normalizeText(element.textContent || '') === normalizeText(text)) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
      }
    }
  }, [applyHighlights]);

  // Apply highlights whenever notes or document changes
  useEffect(() => {
    applyHighlights();
  }, [applyHighlights, documentData?.content]);

  return (
    <div className="min-h-screen bg-background flex">
      <div className={`flex-1 p-6 md:p-12 mr-80`}>
        <div className="w-3/4 mx-auto">
          <div className="flex items-center justify-between mb-8 sticky top-0 bg-background z-10 p-2">
            <Button variant="ghost" onClick={() => navigate('/')}>
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

          <h3 className="text-lg text-gray-400 mb-4">
            See the original document <a href={documentData?.document_url} className="text-blue-400 hover:underline">here</a>
          </h3>
          <h1 className="text-3xl font-bold mb-8">{documentData?.title}</h1>
          
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
              [&_.highlighted-text]:bg-[#FFDC74] [&_.highlighted-text]:text-black"
            style={{ fontSize: `${fontSize}px` }}
            onMouseUp={handleTextSelection}
          >
            <div 
              ref={contentRef}
              dangerouslySetInnerHTML={{ __html: documentData?.content || '' }}
            />
          </article>
        </div>
      </div>
      
      {popupVisible && (
        <div
          style={{
            position: "absolute",
            top: popupPosition.top,
            left: popupPosition.left,
            background: "white",
            border: "1px solid #ccc",
            borderRadius: "8px",
            color: "#333",
            padding: "8px",
            zIndex: 1000,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          {popupType === "select" && (
            <div style={{ display: "flex", alignItems: "center" }}>
              <button className="flex gap-2" onClick={handleSubmitNote}>
                Highlight
                <Highlighter size={24} />
              </button>
              <div style={{ width: "1px", height: "24px", background: "#ccc", margin: "0 16px" }} />
              <button className="flex gap-2" onClick={() => setPopupType("note")}>
                Add Note
                <Notebook size={24} />
              </button>
            </div>
          )}
          {popupType === "note" && (
            <div className="flex flex-col gap-2">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Enter your note here"
                className="w-48 h-24 p-2 border border-gray-300 rounded"
              />
              <div className="flex justify-end gap-2">
                <button 
                  onClick={() => setPopupVisible(false)} 
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSubmitNote} 
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Submit
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {documentId && (
        <ReaderSidebar
          onNoteClick={scrollToText}
          notes={sortedNotes}
        />
      )}
    </div>
  );
}
