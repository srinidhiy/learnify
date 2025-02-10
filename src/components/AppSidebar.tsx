
import { Book, FileText, Brain, MessageCircle, Save, Bookmark, Plus } from "lucide-react";
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
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";
import { ScrollArea } from "./ui/scroll-area";

interface Topic {
  id: string;
  name: string;
  path: string;
}

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
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <span className="text-mindmosaic-400 font-bold tracking-wider">LEARNIFY</span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((subject) => (
                <SidebarMenuItem key={subject.title}>
                  <SidebarMenuButton asChild>
                    <Link 
                      to={subject.url} 
                      className="folder-tab"
                    >
                      <subject.icon className="w-5 h-5" />
                      <span className="tracking-wide">{subject.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-6">
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
                    <SidebarMenuButton asChild>
                      <Link
                        to={topic.path}
                        className="folder-tab group relative flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent"
                      >
                        <Bookmark className="h-4 w-4" />
                        <span>{topic.name}</span>
                      </Link>
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
