import { Book, FileText, Brain, Link as LinkIcon } from "lucide-react";
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

const subjects = [
  {
    title: "Computer Science",
    url: "/",
    icon: Brain,
  },
  {
    title: "Mathematics",
    url: "/math",
    icon: FileText,
  },
  {
    title: "Physics",
    url: "/physics",
    icon: Book,
  },
  {
    title: "Languages",
    url: "/languages",
    icon: LinkIcon,
  },
];

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <span className="text-mindmosaic-400 font-bold tracking-wider">SUBJECTS</span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {subjects.map((subject) => (
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