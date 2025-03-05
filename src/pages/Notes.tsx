import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useTopics } from "@/contexts/TopicsContext";
import { getAllNotes, getDocuments, getTopics } from "@/lib/supabaseUtils";
import { ArrowUpRight, Quote } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const Notes = () => {
  const [notes, setNotes] = useState([]);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedTopicIds } = useTopics();
  const [topics, setTopics] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      const [userNotes, userTopics] = await Promise.all([
        getAllNotes(user),
        getTopics(user)
      ]);
      setNotes(userNotes);
      setTopics(userTopics);
    };
    fetchData();
  }, [user]);

  const filteredNotes = notes.filter(note => {
    if (selectedTopicIds.length === 0) return true;
    return selectedTopicIds.includes(note.documents?.topic_id);
  }).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  const getTopicName = (topicId: string) => {
    const topic = topics.find(t => t.id === topicId);
    return topic?.name || '';
  };

  const handleNoteClick = (note) => {
    navigate(`/reader/${note.document_id}`, {
      state: { scrollToText: note.referenced_text }
    });
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="mt-16 text-3xl font-bold">Your Notes</h1>
        <p className="text-muted-foreground mt-2">
          Click on a note to go to the referenced text in the document.
        </p>
      </div>
      <Input
          placeholder="Search notes..."
          className="w-64"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      {filteredNotes.length === 0 && (
        <div className="text-center text-muted-foreground">
          No notes found
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredNotes.map((note) => (
          <Card 
            key={note.id} 
            className="p-6 hover:bg-accent/5 cursor-pointer transition-colors group"
            onClick={() => handleNoteClick(note)}
          >
            <div className="space-y-4">
              {note.referenced_text && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Quote className="w-4 h-4" />
                    <span className="text-sm font-medium">Referenced Text</span>
                  </div>
                  <p className="text-sm italic text-muted-foreground line-clamp-3">
                    "{note.referenced_text}"
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span className="text-sm font-medium">Note</span>
                </div>
                <p className="text-sm line-clamp-4">
                  {note.content}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <span className="bg-accent rounded-md px-2 py-0.5 text-xs">
                  {getTopicName(note.documents?.topic_id)}
                </span>
                <div className="flex items-center gap-1 text-muted-foreground group-hover:text-primary transition-colors">
                  <span className="text-xs">View in document</span>
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Notes;