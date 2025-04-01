
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UploadModal } from "@/components/UploadModal";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from '@/integrations/supabase/client';
import { deleteDocument, getDocuments, getUser, searchDocuments, updateDocument, getTopics } from "@/lib/supabaseUtils";
import { useEffect, useState } from "react";
import { Archive, BookOpen, Clock, CheckCircle, MoreVertical, Pencil, Trash } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { useSidebar } from "@/components/ui/sidebar";
import { useTopics } from "@/contexts/TopicsContext";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";

const Documents = () => {
  const [signedInUser, setSignedInUser] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [topics, setTopics] = useState([]);
  const [editingDocId, setEditingDocId] = useState(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedTopicIds } = useTopics();
  
  if (!user) return null;

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const [userProfile, userDocs, userTopics] = await Promise.all([
        getUser(user),
        getDocuments(user),
        getTopics(user)
      ]);
      setSignedInUser(userProfile);
      setDocuments(userDocs);
      setTopics(userTopics);
    };
    fetchData();
  }, [user]);

  const handleDocumentUpload = async (newDocument) => {
    setDocuments((prevDocs) => [...prevDocs, newDocument]);
  };

  // Handle search submission
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    
    setIsSearching(true);
    try {
      const results = await searchDocuments(user, searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search Failed",
        description: "There was an error searching documents.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Clear search results and query
  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults(null);
  };

  // Determine which documents to display
  const displayedDocuments = searchResults || documents;

  // Apply additional filters
  const filteredDocuments = displayedDocuments.filter(doc => {
    // Filter by selected topics
    if (selectedTopicIds.length > 0 && !selectedTopicIds.includes(doc.topic_id)) {
      return false;
    }
    // Filter out archived documents (unless we're showing search results)
    if (!searchResults && doc.status === "archived") {
      return false;
    }
    return true;
  }).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  const getTopicName = (topicId: string) => {
    const topic = topics.find(t => t.id === topicId);
    return topic?.name || '';
  };

  const handleArchive = async (docId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation when clicking archive button
    try {
      await supabase
        .from('documents')
        .update({ status: "archived" })
        .eq('id', docId);
      
      setDocuments(docs => docs.filter(d => d.id !== docId));
      
    } catch (error) {
      console.error('Error archiving document:', error);
    }
  };

  const handleStartEdit = (doc) => {
    setEditingDocId(doc.id);
    setEditedTitle(doc.title);
  };

  const handleSaveTitle = async (docId) => {
    try {
      await updateDocument(user, docId, { title: editedTitle });
      
      // Update the document in the local state
      setDocuments(prevDocs => 
        prevDocs.map(doc => 
          doc.id === docId ? { ...doc, title: editedTitle } : doc
        )
      );
      
      toast({
        title: "Success",
        description: "Document title updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update document title",
        variant: "destructive",
      });
    } finally {
      setEditingDocId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingDocId(null);
  };

  const handleDeleteDocument = async (docId) => {
    try {
      await deleteDocument(user, docId);
      
      setDocuments(docs => docs.filter(d => d.id !== docId));
      
      toast({
        title: "Success",
        description: "Document deleted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'unread':
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Unread</span>
            <BookOpen className="w-5 h-5 text-muted-foreground" />
          </div>
        );
      case 'in_progress':
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm text-blue-500">In Progress</span>
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
        );
      case 'completed':
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm text-green-500">Completed</span>
            <CheckCircle className="w-5 h-5 text-green-500" />
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Unread</span>
            <BookOpen className="w-5 h-5 text-muted-foreground" />
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-end mb-6">
        <UploadModal onDocumentUpload={handleDocumentUpload}/>
      </div>
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {signedInUser?.full_name}</h1>
        <p className="text-muted-foreground mt-1">Here's what to read today.</p>
      </div>
      <div className="flex items-center">
        <Input
          placeholder="Search documents..."
          className="w-full h-14"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearch();
            }
          }}
        />
        <Button 
          className="h-12 ml-2 bg-accent" 
          onClick={handleSearch}
          disabled={isSearching}
        >
          {isSearching ? "Searching..." : "Search"}
        </Button>
        {searchResults && (
          <Button 
            className="h-12 ml-2" 
            variant="outline" 
            onClick={clearSearch}
          >
            Clear
          </Button>
        )}
      </div>
      
      {searchResults && (
        <div className="bg-muted p-4 rounded-md flex items-center justify-between">
          <div>
            <p className="font-medium">
              Search results for: <span className="italic">{searchQuery}</span>
            </p>
            <p className="text-sm text-muted-foreground">
              Found {searchResults.length} document{searchResults.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button variant="outline" onClick={clearSearch}>
            Clear Search
          </Button>
        </div>
      )}
      
      <div className="flex flex-col gap-6">
        {filteredDocuments.length === 0 && ( 
          <div className="col-span-3 text-center text-muted-foreground">
            No documents found
          </div>
        )}
        {filteredDocuments.map((doc) => (
          <Card 
            key={doc.id} 
            className="p-6 hover:bg-accent/5 cursor-pointer transition-colors group"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-2" onClick={() => navigate(`/reader/${doc.id}`)}>
                {editingDocId === doc.id ? (
                  <div className="space-y-2">
                    <Input
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="text-lg font-semibold w-full"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={(e) => {
                          handleSaveTitle(doc.id)
                          e.stopPropagation();
                        }}
                      >
                        Save
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={(e) => {
                          handleCancelEdit();
                          e.stopPropagation();
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <h3 className="text-lg font-semibold">{doc.title}</h3>
                )}
                {doc.byline && (
                  <p className="text-sm text-muted-foreground">{doc.byline}</p>
                )}
                <div className="flex items-center gap-4 text-sm">
                  {doc.site_name && (
                    <>
                      <span className="text-muted-foreground">{doc.site_name}</span>
                      <span className="text-muted-foreground">•</span>
                    </>
                  )}
                  <span className="bg-accent rounded-md px-2 py-0.5">{getTopicName(doc.topic_id)}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3">
                  {doc.status === 'completed' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleArchive(doc.id, e)}
                    >
                      <Archive className="w-4 h-4" />
                    </Button>
                  )}
                  {getStatusIcon(doc.status)}
                </div>
                  <div className=" right-2 top-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                        onClick={() => handleStartEdit(doc)}
                        >
                          <Pencil className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDeleteDocument(doc.id)}
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Documents;
