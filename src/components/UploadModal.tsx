
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Upload, Link as LinkIcon, Loader2, FileText } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { createDocument, getTopics, updateDocumentWithAI } from "@/lib/supabaseUtils";
import { toast } from "@/hooks/use-toast";

export function UploadModal({ onDocumentUpload }) {
  const [isLoading, setIsLoading] = useState(false);
  const [url, setUrl] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [topics, setTopics] = useState([]);
  const [newTopicName, setNewTopicName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const fetchTopics = async () => {
      const userTopics = await getTopics(user);
      if (userTopics) setTopics(userTopics);
    }
    fetchTopics();
  }, [user]);

  const handleOpenChange = (open) => {
    setIsOpen(open);
    if (!open) {
      setUrl("");
      setSelectedTopic("");
      setNewTopicName("");
      setFile(null);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    let err = false;
    
    try {
      const docTopic = selectedTopic === "new_topic" ? newTopicName : selectedTopic;
      
      if (!url && !file) {
        throw new Error("Please provide either a URL or upload a file");
      }
      
      let newDocument;
      
      if (url) {
        newDocument = await createDocument(user, { document_url: url, topic: docTopic });
      } else if (file) {
        // In a real implementation, you would handle the file upload here
        // For now, just treat it as a URL-based document
        toast({
          title: "File Upload",
          description: "File upload functionality is coming soon!",
          variant: "default",
        });
        return;
      }
      
      if (newDocument) {
        await updateDocumentWithAI(user, newDocument[0].id, newDocument[0].content);
        onDocumentUpload(newDocument[0]);
      }
    } catch (error) {
      err = true;
      toast({
        title: "Error",
        description: `Error creating document: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      if (!err) {
        handleOpenChange(false);
      } 
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-accent hover:bg-accent/90">
          <Upload className="w-4 h-4 mr-2" />
          Upload Document
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Document</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">

        <div className="space-y-2">
            <label className="text-sm font-medium">Topic</label>
            <Select value={selectedTopic} onValueChange={setSelectedTopic}>
              <SelectTrigger>
                <SelectValue placeholder="Select a topic" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new_topic">Add a new topic</SelectItem>
                {topics && topics.map((topic) => (
                  <SelectItem key={topic.id} value={topic.name}>
                    {topic.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
            <div className="space-y-2">
            {selectedTopic === "new_topic" && (
              <Input 
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)} 
              placeholder="Enter new topic name" 
              />
            )}  
            </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">URL</label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Paste URL here"
                className="pl-9"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Or Upload File</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                type="file" 
                className="cursor-pointer pl-9" 
                onChange={handleFileChange}
              />
            </div>
            {file && (
              <p className="text-xs text-muted-foreground">Selected: {file.name}</p>
            )}
          </div>
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding document...
              </>
            ) : (
              'Submit'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
