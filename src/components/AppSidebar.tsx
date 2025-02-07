import { Book, FileText, Brain, Link as LinkIcon, MessageCircle, Save, Bookmark } from "lucide-react";
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

const menuItems = [
  {
    title: "Documents",
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
      </SidebarContent>
    </Sidebar>
  );
}