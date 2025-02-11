
import { Dialog, DialogContent } from "./ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ReaderViewProps {
  documentId: string | null;
  onClose: () => void;
}

export function ReaderView({ documentId, onClose }: ReaderViewProps) {
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

  return (
    <Dialog open={!!documentId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl h-[80vh]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="h-full overflow-y-auto">
            <h1 className="text-2xl font-bold mb-4">{content?.title}</h1>
            <div 
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: content?.content || '' }}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
