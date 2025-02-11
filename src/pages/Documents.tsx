
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UploadModal } from "@/components/UploadModal";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from '@/integrations/supabase/client';
import { getDocuments, getUser } from "@/lib/supabaseUtils";
import { useEffect, useState } from "react";
import { ReaderView } from "@/components/ReaderView";
import { BookOpen } from "lucide-react";

const Documents = () => {
  const [signedInUser, setSignedInUser] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [selectedDocumentId, setSelectedDocumentId] = useState(null);
  const { user } = useAuth();
  if (!user) return;

  useEffect(() => {
    const fetchUserProfile = async () => {
      setSignedInUser(await getUser(user));
    };
    const fetchDocuments = async () => {
      setDocuments(await getDocuments(user));
    };
    fetchUserProfile();
    fetchDocuments();
  }, [user]);

  const handleDocumentUpload = async (newDocument) => {
    setDocuments((prevDocs) => [...prevDocs, newDocument]);
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-end mb-6">
        <UploadModal onDocumentUpload={handleDocumentUpload}/>
      </div>
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {signedInUser?.full_name}</h1>
        <p className="text-muted-foreground mt-1">Here's what to read today.</p>
      </div>
      
      <div className="flex flex-col gap-6">
        {documents.length === 0 && ( 
          <div className="col-span-3 text-center text-muted-foreground">
            No documents added yet
          </div>
        )}
        {documents.map((doc) => (
          <Card 
            key={doc.id} 
            className="p-6 hover:bg-accent/5 cursor-pointer transition-colors"
            onClick={() => setSelectedDocumentId(doc.id)}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold mb-2">{doc.title}</h3>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{doc.topic}</span>
                </div>
              </div>
              <BookOpen className="w-5 h-5 text-muted-foreground" />
            </div>
          </Card>
        ))}
      </div>

      <ReaderView 
        documentId={selectedDocumentId} 
        onClose={() => setSelectedDocumentId(null)} 
      />
    </div>
  );
}

export default Documents;
