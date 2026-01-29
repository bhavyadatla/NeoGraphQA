import { useState, useRef, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useDocuments } from "@/hooks/use-documents";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Send, 
  Bot, 
  User, 
  FileText, 
  Sparkles, 
  Paperclip,
  ImageIcon,
  Loader2,
  Plus,
  MessageSquare,
  History,
  Trash2,
  X
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type Attachment = {
  type: 'image' | 'doc';
  id: number;
  url: string;
  title: string;
};

type Message = {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  attachments?: Attachment[];
  createdAt?: string;
};

type Conversation = {
  id: number;
  title: string;
  createdAt: string;
};

export default function Chat() {
  const [input, setInput] = useState("");
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [selectedAttachments, setSelectedAttachments] = useState<Attachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: documents } = useDocuments();

  const { data: conversations } = useQuery<Conversation[]>({
    queryKey: ["/api/conversations"],
  });

  const { data: conversationData, isLoading: isLoadingMessages } = useQuery<{ messages: Message[] }>({
    queryKey: ["/api/conversations", currentConversationId],
    enabled: !!currentConversationId,
  });

  const messages = conversationData?.messages || [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const createConversationMutation = useMutation({
    mutationFn: async (title: string) => {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to create conversation");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      setCurrentConversationId(data.id);
    }
  });

  const deleteConversationMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/conversations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      if (currentConversationId) setCurrentConversationId(null);
      toast({ title: "Chat deleted" });
    }
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const doc = await res.json();
      
      const newAttachment: Attachment = {
        type: doc.fileType === 'image' ? 'image' : 'doc',
        id: doc.id,
        url: doc.fileUrl || `/api/images/${doc.id}`,
        title: doc.title
      };
      
      setSelectedAttachments(prev => [...prev, newAttachment]);
      toast({ title: "File attached", description: doc.title });
    } catch (error) {
      toast({ title: "Upload failed", variant: "destructive" });
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && selectedAttachments.length === 0) || isLoading) return;

    let convId = currentConversationId;
    if (!convId) {
      const newConv = await createConversationMutation.mutateAsync(input.slice(0, 30) || "New Chat");
      convId = newConv.id;
    }

    const userContent = input;
    const userAttachments = [...selectedAttachments];
    
    setInput("");
    setSelectedAttachments([]);
    setIsLoading(true);

    try {
      // Use SSE for streaming
      const response = await fetch(`/api/conversations/${convId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: userContent,
          attachments: userAttachments
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        // Handle streaming UI updates here if needed
      }

      queryClient.invalidateQueries({ queryKey: ["/api/conversations", convId] });
    } catch (error) {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      
      <div className="flex-1 md:ml-72 flex flex-col h-full">
        {/* Header */}
        <header className="h-14 border-b flex items-center justify-between px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm">
              {currentConversationId ? conversations?.find(c => c.id === currentConversationId)?.title : "New Chat"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setCurrentConversationId(null)}
              className="h-8 text-xs gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              New Chat
            </Button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Main Chat Area */}
          <main className="flex-1 flex flex-col min-w-0 bg-background">
            <ScrollArea className="flex-1">
              <div className="max-w-3xl mx-auto py-8 px-4 space-y-8">
                {messages.length === 0 && !isLoading && (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <Bot className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold font-display">How can I help you today?</h2>
                    <p className="text-sm text-muted-foreground max-w-sm">
                      NeoGraphQA can analyze PDFs, extract knowledge graphs, and answer questions using multi-modal AI.
                    </p>
                  </div>
                )}

                {messages.map((msg, idx) => (
                  <div key={idx} className={cn(
                    "flex gap-4 group",
                    msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                  )}>
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
                      msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>
                    
                    <div className={cn(
                      "flex flex-col gap-2 max-w-[85%]",
                      msg.role === 'user' ? "items-end" : "items-start"
                    )}>
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-1">
                          {msg.attachments.map((at, i) => (
                            <div key={i} className="bg-muted/50 rounded-lg p-2 flex items-center gap-2 border border-border/50">
                              {at.type === 'image' ? (
                                <ImageIcon className="w-4 h-4 text-green-500" />
                              ) : (
                                <FileText className="w-4 h-4 text-blue-500" />
                              )}
                              <span className="text-xs font-medium truncate max-w-[150px]">{at.title}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className={cn(
                        "p-4 rounded-2xl text-sm leading-relaxed",
                        msg.role === 'user' 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted/30 border border-border/50"
                      )}>
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex gap-4">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 animate-pulse" />
                    </div>
                    <div className="bg-muted/30 border border-border/50 p-4 rounded-2xl flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 bg-background">
              <div className="max-w-3xl mx-auto space-y-4">
                {selectedAttachments.length > 0 && (
                  <div className="flex flex-wrap gap-2 px-4">
                    {selectedAttachments.map((at, i) => (
                      <div key={i} className="flex items-center gap-2 bg-primary/5 text-primary border border-primary/20 rounded-full px-3 py-1 text-xs">
                        {at.type === 'image' ? <ImageIcon className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                        <span className="truncate max-w-[100px]">{at.title}</span>
                        <button onClick={() => setSelectedAttachments(prev => prev.filter((_, idx) => idx !== i))}>
                          <X className="w-3 h-3 hover:text-destructive" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleSend} className="relative">
                  <div className="bg-muted/50 border border-border rounded-2xl focus-within:ring-1 focus-within:ring-primary/20 transition-all flex flex-col">
                    <Textarea 
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Message NeoGraphQA..."
                      className="min-h-[56px] h-auto max-h-[200px] pr-12 resize-none py-3 px-4 rounded-2xl border-0 bg-transparent focus-visible:ring-0 text-sm overflow-y-auto"
                    />
                    
                    <div className="flex items-center justify-between px-3 pb-3">
                      <div className="flex items-center gap-1">
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          onChange={handleFileUpload}
                          accept=".pdf,.txt,.csv,image/*"
                        />
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:bg-muted"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Paperclip className="w-4 h-4" />
                        </Button>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:bg-muted"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <ImageIcon className="w-4 h-4" />
                        </Button>
                      </div>

                      <Button 
                        type="submit" 
                        size="icon" 
                        disabled={(!input.trim() && selectedAttachments.length === 0) || isLoading}
                        className="h-8 w-8 rounded-lg bg-primary hover:bg-primary/90 transition-all"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-center text-[10px] text-muted-foreground mt-3">
                    NeoGraphQA can make mistakes. Verify important information.
                  </p>
                </form>
              </div>
            </div>
          </main>

          {/* History Sidebar */}
          <aside className="hidden lg:flex w-64 border-l flex-col bg-muted/5">
            <div className="p-4 border-b flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <History className="w-3.5 h-3.5" />
                Recent History
              </span>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {conversations?.map((conv) => (
                  <div 
                    key={conv.id}
                    className={cn(
                      "flex items-center justify-between px-3 py-2 rounded-lg text-sm cursor-pointer group transition-colors",
                      currentConversationId === conv.id ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => setCurrentConversationId(conv.id)}
                  >
                    <span className="truncate flex-1">{conv.title}</span>
                    <button 
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversationMutation.mutate(conv.id);
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </aside>
        </div>
      </div>
    </div>
  );
}
