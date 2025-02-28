import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { useTopics } from "@/contexts/TopicsContext";
import { getDocuments, getTopics, getUser } from "@/lib/supabaseUtils";
import { CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";


const Archive = () => {
    const [documents, setDocuments] = useState([]);
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
      setDocuments(userDocs);
      setTopics(userTopics);
    };
    fetchData();
    }, [user]);

    const filteredDocuments = documents.filter(doc => {
        if (selectedTopicIds.length > 0 && !selectedTopicIds.includes(doc.topic_id)) {
            return false;
        }
        if (doc.status != "completed") {
            return false;
        }
        return true;
    });

    const getTopicName = (topicId: string) => {
        const topic = topics.find(t => t.id === topicId);
        return topic?.name || '';
      };
  
    return (
        <div className="space-y-6 pb-12">
            <div>
                <h1 className="mt-16 text-3xl font-bold">Archived Documents</h1>
            </div>
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
                <div className="flex items-center gap-2">
                    <span className="text-sm text-green-500">Completed</span>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                </div>
            </Card>
            ))}
        </div>
      </div>
    );
};

export default Archive;