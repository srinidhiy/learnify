import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Highlighter, Loader2, Minus, Notebook, Plus, CheckCircle } from "lucide-react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { ReaderSidebar } from "@/components/ReaderSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { getDocument, getNotes, deleteNote, updateNote } from "@/lib/supabaseUtils";
import Mark from 'mark.js';
import { useToast } from "@/hooks/use-toast";

// Helper function to normalize text for comparison
const normalizeText = (text: string) => {
  if (!text) return '';
  // Replace all whitespace (including newlines) with a single space
  return text
    .trim()
    .replace(/\s+/g, ' ');
};

const findTextPosition = (content: string, searchText: string) => {
  // If either content or searchText is empty, return -1
  if (!content || !searchText) return -1;
  
  // Create a temporary div to parse the HTML content
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = content;
  
  // Get the text content without HTML tags and index of the highlighted text
  const flattenedContent = normalizeText(tempDiv.textContent) || '';
  const normalizedSearchText = normalizeText(searchText);
  return flattenedContent.indexOf(normalizedSearchText);
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
  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const markInstance = useRef<Mark | null>(null);
  const endOfContentRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { scrollToText } = location.state || {};

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

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(user, documentId, noteId);
      refetchNotes();
      toast({
        title: "Note deleted successfully",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Failed to delete note",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const handleSubmitNote = async () => {
    if (!user || !selectedText) return;
    
    try {
      // Create new note
      const { error } = await supabase
        .from('notes')
        .insert({
          content: newNote,
          document_id: documentId,
          user_id: user.id,
          referenced_text: selectedText
        });

      if (error) throw error;

      // Apply new highlight immediately
      if (markInstance.current) {
        console.log("Marking text:", selectedText);
        markInstance.current.mark(selectedText, {
          className: 'highlighted-text',
          separateWordSearch: false,
          acrossElements: true
        });
      }

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

  const scrollToTextInDocument = useCallback((text: string, noteId?: string) => {
    if (!contentRef.current || !documentData?.text_content) return;
  
    // If we have a noteId, try to find and scroll to matching highlights first
    if (noteId) {
      const elements = document.querySelectorAll(`[data-note-id="${noteId}"]`);
      if (elements.length > 0) {
        elements[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Add a visual cue
        elements.forEach(el => el.classList.add('highlighted-text-focus'));
        setTimeout(() => {
          elements.forEach(el => el.classList.remove('highlighted-text-focus'));
        }, 3000);
        
        return;
      }
    }
  
    const normalizedSearchText = normalizeText(text);
    const normalizedFullText = normalizeText(documentData.text_content);
    
    // Try finding an exact match first
    let position = normalizedFullText.indexOf(normalizedSearchText);
    
    // If exact match fails, try a more fuzzy approach for cross-paragraph text
    if (position < 0) {
      // Split the search text into words
      const searchWords = normalizedSearchText.split(' ').filter(word => word.length > 3);
      
      // Try to find a sequence of these words in the document
      if (searchWords.length > 1) {
        // Look for the first word
        position = normalizedFullText.indexOf(searchWords[0]);
        
        // Check if subsequent words appear within a reasonable distance
        let found = position >= 0;
        let lastPos = position;
        
        for (let i = 1; i < searchWords.length && found; i++) {
          const nextPos = normalizedFullText.indexOf(searchWords[i], lastPos);
          // If the next word is too far away, this isn't our text
          found = nextPos > lastPos && (nextPos - lastPos) < 100;
          lastPos = nextPos;
        }
        
        if (!found) position = -1;
      }
    }
    
    if (position >= 0) {
      // Calculate the percentage through the document
      const percentage = position / normalizedFullText.length;
      
      // Log for debugging
      console.log(`Found text at position ${position} (${Math.round(percentage * 100)}% through document)`);
      
      // Get the total scrollable height
      const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight;
      const viewportHeight = window.innerHeight;
      
      // Calculate the target scroll position
      const targetScrollPosition = (scrollHeight * percentage) - (viewportHeight / 3);
      
      // Scroll to the calculated position
      window.scrollTo({
        top: Math.max(0, targetScrollPosition),
        behavior: 'smooth'
      });
      
      // Add a temporary highlight to help locate the text
      if (markInstance.current) {
        markInstance.current.unmark({ className: 'temp-highlight' });
        markInstance.current.mark(normalizedSearchText, {
          className: 'temp-highlight highlighted-text-focus',
          separateWordSearch: false,
          acrossElements: true,
          accuracy: {
            value: "partially",
            limiters: [",", ".", " "]
          }
        });
        
        setTimeout(() => {
          markInstance.current?.unmark({ className: 'temp-highlight' });
        }, 1000);
      }
    } else {
      console.log("Could not find text in document:", normalizedSearchText);
    }
  }, [documentData, markInstance]);

  // Apply highlights whenever notes or document changes
  useEffect(() => {
    applyHighlights();
  }, [applyHighlights, documentData?.content]);

  // Update document status
  const updateDocumentStatus = useCallback(async (status: 'unread' | 'in_progress' | 'completed' | 'archived') => {
    if (!user || !documentId) return;
    console.log("Updating status to:", status);

    try {
      const { error } = await supabase
        .from('documents')
        .update({ status })
        .eq('id', documentId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setDocumentData(prev => prev ? { ...prev, status } : null);
    } catch (error) {
      console.error('Error updating document status:', error);
    }
  }, [user, documentId]);

  // Track reading progress using Intersection Observer
  useEffect(() => {
    if (!endOfContentRef.current || !documentData) return;

    // Only observe if document isn't already completed
    if (documentData.status === 'completed' || documentData.status === 'archived') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Only mark as completed if we're scrolling down to the end
          if (entry.isIntersecting && !hasReachedEnd && entry.boundingClientRect.y > 0) {
            console.log("Reached end of document by scrolling");
            setHasReachedEnd(true);
            updateDocumentStatus('completed');
          }
        });
      },
      {
        threshold: 1.0,
        rootMargin: '0px',
      }
    );

    observer.observe(endOfContentRef.current);
    return () => observer.disconnect();
  }, [hasReachedEnd, updateDocumentStatus, documentData]);

  // Separate effect for initial status
  useEffect(() => {
    if (documentData?.status === 'unread') {
      updateDocumentStatus('in_progress');
    } else if (documentData?.status === 'completed') {
      setHasReachedEnd(true);
    }
  }, [documentData?.status, updateDocumentStatus]);

  useEffect(() => {
    if (!scrollToText || !documentData?.content) return;

    let attempts = 0;
    const maxAttempts = 5;
    
    const tryScroll = () => {
      if (contentRef.current && window.document.querySelector('.highlighted-text')) {
        const text = normalizeText(scrollToText);
        scrollToTextInDocument(text);
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(tryScroll, 200);
      }
    };

    setTimeout(tryScroll, 500);
  }, [documentData?.content, scrollToText, scrollToTextInDocument]);

  return (
    <div className="min-h-screen bg-background flex">
      <div className={`flex-1 p-6 md:p-12 mr-80`}>
        <div className="w-3/4 mx-auto">
          <div className="flex items-center justify-between mb-8 sticky top-0 bg-background z-10 p-2">
            <Button variant="ghost" onClick={() => navigate(-1)}>
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
            <div ref={endOfContentRef} className="h-1" />
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
          onNoteClick={scrollToTextInDocument}
          notes={sortedNotes}
          onEditNote={async (note, newContent) => {
            try {
              await updateNote(user, note.id, newContent);
              refetchNotes();
              toast({
                title: "Note updated successfully",
                duration: 3000,
              });
            } catch (error) {
              toast({
                title: "Failed to update note",
                variant: "destructive",
                duration: 3000,
              });
            }
          }}
          onDeleteNote={handleDeleteNote}
        />
      )}
    </div>
  );
}
