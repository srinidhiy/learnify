import { Plus } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "./ui/button";

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
      
      <Button 
        variant="ghost" 
        size="sm"
        className="ml-2 text-muted hover:text-white"
      >
        <Plus className="h-4 w-4" />
        Add Topic
      </Button>
    </div>
  );
}