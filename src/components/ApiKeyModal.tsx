
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { setOpenAIApiKey } from "@/lib/openaiUtils";
import { Key } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export function ApiKeyModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setApiKey("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      if (!apiKey.trim()) {
        throw new Error("API key cannot be empty");
      }
      
      // Save API key to localStorage for persistence
      localStorage.setItem("openai_api_key", apiKey);
      // Set the API key in the utility
      setOpenAIApiKey(apiKey);
      
      toast({
        title: "API Key Saved",
        description: "Your OpenAI API key has been saved successfully.",
      });
      
      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Key className="h-4 w-4" />
          Set API Key
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Enter OpenAI API Key</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Enter your OpenAI API key to enable AI features. Your key is stored locally and never sent to our servers.
            </p>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              You can find your API key in the{" "}
              <a 
                href="https://platform.openai.com/api-keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="underline"
              >
                OpenAI dashboard
              </a>.
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save API Key"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
