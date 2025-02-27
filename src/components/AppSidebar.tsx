import { Book, FileText, Brain, MessageCircle, Save, Bookmark, Plus, BookAIcon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";
import { ScrollArea } from "./ui/scroll-area";
import { useAuth } from "@/contexts/AuthContext";
import { createTopic, getTopics } from "@/lib/supabaseUtils";
import { cn } from "@/lib/utils";
import { useTopics } from "@/contexts/TopicsContext";

const menuItems = [
  {
    title: "All Documents",
    url: "/",
    icon: FileText,
  },
  {
    title: "Chat",
    url: "/flashcards",
    icon: MessageCircle,
  },
  {
    title: "Archive",
    url: "/archive",
    icon: Bookmark,
  },
];

export function AppSidebar() {
  const { toast } = useToast();
  const [topics, setTopics] = useState([]);
  const [newTopicName, setNewTopicName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { selectedTopicIds, toggleTopic, clearTopics } = useTopics();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const fetchTopics = async () => {
      const userTopics = await getTopics(user);
      if (userTopics) setTopics(userTopics);
    };
    fetchTopics();
  }, [user]);

  const handleAddTopic = async () => {
    try {
      const newTopic = await createTopic(user, newTopicName);
      if (newTopic) {
        setTopics((prevTopics) => [...prevTopics, newTopic[0]]);
        setNewTopicName("");
        setIsOpen(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Error creating topic: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleAllDocumentsClick = () => {
    clearTopics();
  };

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup className="mb-6">
          <SidebarGroupLabel>
            <span className="text-mindmosaic-400 font-bold tracking-wider">LEARNIFY</span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((subject) => (
                <SidebarMenuItem key={subject.title}>
                  <SidebarMenuButton asChild>
                    {subject.title === "All Documents" ? (
                      <Link 
                        to={subject.url} 
                        className="folder-tab"
                        onClick={handleAllDocumentsClick}
                      >
                        <subject.icon className="w-5 h-5" />
                        <span className="tracking-wide">{subject.title}</span>
                      </Link>
                    ) : (
                      <Link 
                        to={subject.url} 
                        className="folder-tab"
                      >
                        <subject.icon className="w-5 h-5" />
                        <span className="tracking-wide">{subject.title}</span>
                      </Link>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <hr/>
        <SidebarGroup className="mt-3">
          <SidebarGroupLabel className="flex justify-between items-center pr-4">
            <span className="text-muted-foreground font-medium">Topics</span>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-6 text-muted hover:text-white"
                >
                  <Plus className="h-4 w-4" />
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
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <ScrollArea className="h-[300px]">
              <SidebarMenu>
                {topics.map((topic) => (
                  <SidebarMenuItem key={topic.id}>
                    <SidebarMenuButton
                      onClick={() => toggleTopic(topic.id)}
                      className={cn(
                        "folder-tab group relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent",
                        selectedTopicIds.includes(topic.id) && "bg-accent"
                      )}
                    >
                      <Book className="h-4 w-4" />
                      <span>{topic.name}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
