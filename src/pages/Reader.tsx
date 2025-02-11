
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Minus, Plus } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function Reader() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const [fontSize, setFontSize] = useState(16);

  const { data: content, isLoading } = useQuery({
    queryKey: ['document-content', documentId],
    queryFn: async () => {
      if (!documentId) return null;
      const { data, error } = await supabase
        .from('documents')
        .select('content, title')
        .eq('id', documentId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!documentId
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
          >
            ← Back
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setFontSize(prev => Math.max(12, prev - 2))}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setFontSize(prev => Math.min(24, prev + 2))}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-8">{content?.title}</h1>
        
        <div 
          className="prose prose-invert max-w-none"
          style={{ 
            fontSize: `${fontSize}px`,
            '--tw-prose-invert-links': '#9b87f5',
            '--tw-prose-invert-p': 'rgb(229 231 235)'
          } as React.CSSProperties}
        >
          <div 
            className="[&>p]:mb-6 [&>p>a]:text-accent hover:[&>p>a]:underline"
            dangerouslySetInnerHTML={{ __html: content?.content || '' }}
          />
        </div>
      </div>
    </div>
  );
}
