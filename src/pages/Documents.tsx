import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { UploadModal } from "@/components/UploadModal";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from '@/integrations/supabase/client';
import { getDocuments, getUser } from "@/lib/supabaseUtils";
import { useEffect, useState } from "react";

const Documents = () => {
  const [signedInUser, setSignedInUser] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
      
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"> */}
      <div className="flex flex-col gap-6">
        {documents.length === 0 && ( 
          <div className="col-span-3 text-center text-muted-foreground">
            No documents added yet
          </div>
        )}
        {documents.map((doc) => (
          <Card key={doc.id} className="p-6 hover:bg-accent/5 cursor-pointer transition-colors">
            <h3 className="text-lg font-semibold mb-2">{doc.title}</h3>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">{doc.topic}</span>
              <span className="text-accent">{doc.dueDate}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default Documents;