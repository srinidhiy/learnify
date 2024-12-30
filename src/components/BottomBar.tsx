import { Plus } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { useToast } from "./ui/use-toast";

interface Topic {
  id: string;
  name: string;
  path: string;
}

const topics: Topic[] = [
  { id: "1", name: "Coding", path: "/topics/coding" },
  { id: "2", name: "Economics", path: "/topics/economics" },
  { id: "3", name: "Design", path: "/topics/design" },
];

export function BottomBar() {
  const location = useLocation();
  const { toast } = useToast();
  const [topics, setTopics] = useState<Topic[]>([
    { id: "1", name: "Coding", path: "/topics/coding" },
    { id: "2", name: "Economics", path: "/topics/economics" },
    { id: "3", name: "Design", path: "/topics/design" },
  ]);
  const [newTopicName, setNewTopicName] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const handleAddTopic = () => {
    if (!newTopicName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a topic name",
        variant: "destructive",
      });
      return;
    }

    const newTopic: Topic = {
      id: (topics.length + 1).toString(),
      name: newTopicName,
      path: `/topics/${newTopicName.toLowerCase().replace(/\s+/g, '-')}`,
    };

    setTopics([...topics, newTopic]);
    setNewTopicName("");
    setIsOpen(false);
    toast({
      title: "Success",
      description: `Topic "${newTopicName}" has been added`,
    });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 h-10 bg-primary border-t border-accent/20 flex items-center px-2 gap-1">
      <Link
        to="/"
        className={`h-8 px-4 flex items-center rounded-t-md transition-colors ${
          location.pathname === "/" 
            ? "bg-accent text-white" 
            : "bg-secondary/50 text-muted hover:bg-secondary"
        }`}
      >
        Home
      </Link>
      
      {topics.map((topic) => (
        <Link
          key={topic.id}
          to={topic.path}
          className={`h-8 px-4 flex items-center rounded-t-md transition-colors ${
            location.pathname === topic.path 
              ? "bg-accent text-white animate-folder-switch" 
              : "bg-secondary/50 text-muted hover:bg-secondary"
          }`}
        >
          {topic.name}
        </Link>
      ))}
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm"
            className="ml-2 text-muted hover:text-white"
          >
            <Plus className="h-4 w-4" />
            Add Topic
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Topic</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Input
                placeholder="Enter topic name"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
              />
            </div>
            <Button onClick={handleAddTopic} className="w-full">
              Add Topic
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}