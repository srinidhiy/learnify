import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UploadModal } from "@/components/UploadModal";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from '@/integrations/supabase/client';
import { getDocuments, getUser } from "@/lib/supabaseUtils";
import { useEffect, useState } from "react";
import { Archive, BookOpen, Clock, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { useSidebar } from "@/components/ui/sidebar";
import { useTopics } from "@/contexts/TopicsContext";
import { getTopics } from "@/lib/supabaseUtils";

const Documents = () => {
  const [signedInUser, setSignedInUser] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedTopicIds } = useTopics();
  const [topics, setTopics] = useState([]);

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

  const filteredDocuments = documents.filter(doc => {
    // Filter by selected topics
    if (selectedTopicIds.length > 0 && !selectedTopicIds.includes(doc.topic_id)) {
      return false;
    }
    // Filter out archived documents
    if (doc.status == "archived") {
      return false;
    }
    // TODO: Add semantic search when implemented
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
      <Input
          placeholder="Search documents..."
          className="w-64"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
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
            onClick={() => navigate(`/reader/${doc.id}`)}
          >
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{doc.title}</h3>
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
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Documents;
