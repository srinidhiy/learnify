import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Highlighter, Loader2, Minus, Notebook, Plus } from "lucide-react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { ReaderSidebar } from "@/components/ReaderSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { getDocument, getNotes } from "@/lib/supabaseUtils";
import rangy from 'rangy';
import 'rangy/lib/rangy-highlighter';
import 'rangy/lib/rangy-classapplier';
import { useToast } from "@/hooks/use-toast";
import { set } from "date-fns";

const highlighter = rangy.createHighlighter();
highlighter.addClassApplier(rangy.createClassApplier('highlighted-text',
  { ignoreWhiteSpace: true, elementTagName: 'span' }
));

// Helper function to normalize text for comparison
const normalizeText = (text: string) => {
  if (!text) return '';
  return text
    .replace(/\s+/g, ' ') // Replace multiple spaces, tabs, newlines with single space
    .trim();
};

// Helper function to find text position accounting for HTML
const findTextPosition = (content: string, searchText: string) => {
  const normalizedContent = normalizeText(content);
  const normalizedSearchText = normalizeText(searchText);
  return normalizedContent.indexOf(normalizedSearchText);
};

// Helper function to safely escape regex special characters
const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export default function Reader() {
  const { toast } = useToast();
  const { documentId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [newNote, setNewNote] = useState("");
  const [document, setDocument] = useState(null);
  const [fontSize, setFontSize] = useState(16);
  const [popupVisible, setPopupVisible] = useState(false);
  const [popupType, setPopupType] = useState<"select" | "note">("select");
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const originalContentRef = useRef<string>('');

  const { data: notes, refetch: refetchNotes } = useQuery({
    queryKey: ['notes', documentId],
    queryFn: async () => {
      const fetchedNotes = await getNotes(user, documentId);
      return fetchedNotes;
    },
    enabled: !!user && !!documentId,
  });

  useEffect(() => {
    const fetchDocument = async () => {
      const doc = await getDocument(user, documentId);
      setDocument(doc);
      if (doc?.content) {
        originalContentRef.current = doc.content;
      }
    };
    fetchDocument();
  }, [user, documentId]);

  // Sort notes based on their appearance in the document
  const sortedNotes = useMemo(() => {
    if (!document?.content || !notes) return [];

    const notesWithPositions = notes.map(note => {
      if (!note.referenced_text) return { ...note, position: Infinity };
      
      const position = findTextPosition(document.content, note.referenced_text);
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
  }, [notes, document]);

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.toString().trim() === "") {
      setPopupVisible(false);
      setSelectedText(null);
      return;
    }
    setPopupType("select");
    
    const range = selection.getRangeAt(0);
    const selectionRects = range.getClientRects();
    const firstRect = selectionRects[0];
    setPopupPosition({
      top: firstRect.top + window.scrollY - 50,
      left: firstRect.left + window.scrollX,
    });
    setPopupVisible(true);

    // Normalize the selected text
    const renderedContent = contentRef.current?.textContent || '';
    const normalizedContent = normalizeText(renderedContent);
    const selected = normalizeText(selection.toString());
    // Verify the text exists in the document
    if (renderedContent && findTextPosition(normalizedContent, selected) !== -1) {
      setSelectedText(selected);
    } else {
      setSelectedText(null);
    }
  }, [document]);

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
    } finally {
      setPopupVisible(false);
    }
  };

  const highlightText = useCallback((text: string, content: string) => {
    console.log("Highlighting:", text);
    const normalizedSearchText = normalizeText(text);
    const regex = new RegExp(escapeRegExp(normalizedSearchText), 'g');
  
    // Split on paragraph tags while preserving them.
    // This regex splits the content into parts that are either a <p> tag or text between them.
    const parts = content.split(/(<\/?p[^>]*>)/);
    
    // Process only the text parts (skip parts that are tags)
    const processedParts = parts.map(part => {
      // If part is a paragraph tag, leave it unchanged.
      if (part.match(/<\/?p[^>]*>/)) return part;
      // Otherwise, replace occurrences with the highlight span.
      return part.replace(regex, (match) => `<span class="highlighted-text">${match}</span>`);
    });
    
    return processedParts.join('');
  }, []);
  

  const scrollToText = useCallback((text: string) => {
    if (!contentRef.current || !document?.content) return;

    // Reset to original content
    let newHtml = originalContentRef.current;

    // Apply all highlights
    sortedNotes.forEach(note => {
      if (note.referenced_text) {
        newHtml = highlightText(note.referenced_text, newHtml);
      }
    });
    
    contentRef.current.innerHTML = newHtml;

    // Find and scroll to the specific text
    const elements = contentRef.current.querySelectorAll('.highlighted-text');
    for (const element of elements) {
      if (normalizeText(element.textContent || '') === normalizeText(text)) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
      }
    }
  }, [document, sortedNotes, highlightText]);

  // Apply highlights whenever notes or document changes
  useEffect(() => {
    if (!contentRef.current || !document?.content || !sortedNotes.length) return;

    let newHtml = originalContentRef.current;
    sortedNotes.forEach(note => {
      if (note.referenced_text) {
        newHtml = highlightText(note.referenced_text, newHtml);
      }
    });
    contentRef.current.innerHTML = newHtml;
  }, [sortedNotes, document, highlightText]);

  return (
    <div className="min-h-screen bg-background flex">
      <div className={`flex-1 p-6 md:p-12 mr-80`}>
        <div className="w-3/4 mx-auto">
            <div className="flex items-center justify-between mb-8 sticky top-0 bg-background z-10 p-2">
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

            <h3 className="text-lg text-gray-400 mb-4">
            See the original document <a href={document?.document_url} className="text-blue-400 hover:underline">here</a>
            </h3>
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
              [&_.highlighted-text]:bg-[#FFDC74] [&_.highlighted-text]:text-black"
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