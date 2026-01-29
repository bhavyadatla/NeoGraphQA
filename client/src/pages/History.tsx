import { useQuery } from "@tanstack/react-query";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { History as HistoryIcon, MessageSquare, FileText, Image as ImageIcon, Network, Search, Calendar } from "lucide-react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";

interface HistoryEntry {
  id: number;
  type: 'chat' | 'pdf' | 'image' | 'kg';
  question: string;
  answer: string;
  timestamp: string;
}

export default function History() {
  const { data: messages } = useQuery<any[]>({
    queryKey: ["/api/chat/messages"], // Assuming this exists or we fetch from shared/history
  });

  const { data: imageAnalyses } = useQuery<any[]>({
    queryKey: ["/api/image-analyses"],
  });

  // Mocking combined history for now based on available data
  const history: HistoryEntry[] = [
    ...(messages?.map(m => ({
      id: m.id,
      type: 'chat' as const,
      question: m.role === 'user' ? m.content : '',
      answer: m.role === 'assistant' ? m.content : '',
      timestamp: m.createdAt,
    })) || []),
    ...(imageAnalyses?.map(a => ({
      id: a.id,
      type: 'image' as const,
      question: a.question,
      answer: a.answer,
      timestamp: a.createdAt,
    })) || []),
  ].filter(h => h.question || h.answer).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getTypeIcon = (type: HistoryEntry['type']) => {
    switch (type) {
      case 'chat': return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'pdf': return <FileText className="w-4 h-4 text-red-500" />;
      case 'image': return <ImageIcon className="w-4 h-4 text-green-500" />;
      case 'kg': return <Network className="w-4 h-4 text-purple-500" />;
      default: return <Search className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 md:ml-72 flex flex-col h-full overflow-hidden">
        <header className="h-16 border-b flex items-center px-8 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="flex items-center gap-4 w-full">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <HistoryIcon className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold font-display tracking-tight">Activity History</h1>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-muted/5 p-4 lg:p-8">
          <div className="max-w-5xl mx-auto space-y-6">
            {history.length > 0 ? (
              history.map((entry) => (
                <Card key={`${entry.type}-${entry.id}`} className="border-border/50 shadow-sm hover-elevate bg-card/50 backdrop-blur-sm">
                  <CardHeader className="py-4 px-6 border-b flex flex-row items-center justify-between bg-muted/5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-background border border-border/50 shadow-sm">
                        {getTypeIcon(entry.type)}
                      </div>
                      <div>
                        <Badge variant="outline" className="text-[10px] uppercase tracking-widest font-bold">
                          {entry.type} Analysis
                        </Badge>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(entry.timestamp), "PPP p")}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Inquiry</p>
                      <p className="text-sm font-medium text-foreground/90">{entry.question || "System Analysis"}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-primary">Response</p>
                      <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                        <p className="text-sm leading-relaxed text-muted-foreground">{entry.answer}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center opacity-20">
                  <HistoryIcon className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-bold">No history found</p>
                  <p className="text-sm text-muted-foreground max-w-xs">Your activity across Chat, PDF, Image and KG analysis will appear here.</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
