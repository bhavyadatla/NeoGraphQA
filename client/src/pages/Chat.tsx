import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useChat } from "@/hooks/use-chat";
import { useDocuments } from "@/hooks/use-documents";
import { 
  Send, 
  Bot, 
  User, 
  FileText, 
  Sparkles, 
  ChevronDown, 
  ChevronUp,
  BrainCircuit
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

type Message = {
  role: 'user' | 'assistant';
  content: string;
  source?: string;
  reasoning?: string;
  confidence?: number;
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am NeoGraphQA. I can answer questions from your documents using PDF analysis, Knowledge Graphs, or Image recognition. How can I help?' }
  ]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<'auto' | 'pdf' | 'kg' | 'image'>('auto');
  const [selectedDocId, setSelectedDocId] = useState<string>("all");
  
  const { data: documents } = useDocuments();
  const chatMutation = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage = input;
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await chatMutation.mutateAsync({
        message: userMessage,
        mode,
        documentId: selectedDocId === "all" ? undefined : Number(selectedDocId)
      });

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: response.response,
        source: response.source,
        reasoning: response.reasoning,
        confidence: response.confidence
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: "Sorry, I encountered an error processing your request." 
      }]);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 md:ml-72 flex flex-col h-full">
        {/* Header */}
        <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">AI Assistant</h2>
          </div>
          <div className="flex items-center gap-3">
            <Select value={mode} onValueChange={(v: any) => setMode(v)}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue placeholder="Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto Mode</SelectItem>
                <SelectItem value="pdf">PDF QA</SelectItem>
                <SelectItem value="kg">Knowledge Graph</SelectItem>
                <SelectItem value="image">Image QA</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedDocId} onValueChange={setSelectedDocId}>
              <SelectTrigger className="w-48 h-8 text-xs">
                <SelectValue placeholder="Context: All Docs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Documents</SelectItem>
                {documents?.map(doc => (
                  <SelectItem key={doc.id} value={doc.id.toString()}>
                    {doc.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4 md:p-8">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex gap-4",
                  msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                  msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"
                )}>
                  {msg.role === 'user' ? <User className="w-5 h-5" /> : <Sparkles className="w-4 h-4" />}
                </div>
                
                <div className={cn(
                  "flex flex-col gap-2 max-w-[80%]",
                  msg.role === 'user' ? "items-end" : "items-start"
                )}>
                  <div className={cn(
                    "p-4 rounded-2xl shadow-sm text-sm leading-relaxed",
                    msg.role === 'user' 
                      ? "bg-primary text-primary-foreground rounded-tr-none" 
                      : "bg-card border border-border rounded-tl-none"
                  )}>
                    <div className="prose-custom">
                      <ReactMarkdown>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>

                  {/* Assistant Extras: Source & Reasoning */}
                  {msg.role === 'assistant' && (msg.source || msg.reasoning) && (
                    <div className="w-full space-y-2">
                      {msg.reasoning && (
                        <ReasoningBlock reasoning={msg.reasoning} confidence={msg.confidence} />
                      )}
                      {msg.source && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50 self-start">
                          <FileText className="w-3 h-3" />
                          Source: <span className="font-medium">{msg.source}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
            {chatMutation.isPending && (
              <div className="flex gap-4">
                <div className="w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="bg-card border border-border p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}/>
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}/>
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}/>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-background border-t border-border">
          <div className="max-w-3xl mx-auto relative">
            <form onSubmit={handleSubmit} className="relative flex gap-2">
              <Textarea 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="Ask a question about your documents..."
                className="min-h-[52px] max-h-32 pr-12 resize-none py-3 rounded-xl shadow-sm focus-visible:ring-primary"
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!input.trim() || chatMutation.isPending}
                className="absolute right-2 top-2 h-9 w-9 bg-primary hover:bg-primary/90 transition-all"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
            <p className="text-center text-[10px] text-muted-foreground mt-2">
              AI can make mistakes. Please verify important information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReasoningBlock({ reasoning, confidence }: { reasoning: string, confidence?: number }) {
  const [open, setOpen] = useState(false);
  
  return (
    <div className="w-full bg-muted/30 border border-border/50 rounded-lg overflow-hidden text-xs">
      <button 
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          <BrainCircuit className="w-3.5 h-3.5" />
          <span className="font-medium">Reasoning Process</span>
        </div>
        <div className="flex items-center gap-3">
          {confidence && (
            <span className={cn(
              "px-1.5 py-0.5 rounded text-[10px] font-medium border",
              confidence > 0.8 ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
            )}>
              {Math.round(confidence * 100)}% Confidence
            </span>
          )}
          {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0 text-muted-foreground border-t border-border/50 bg-muted/10">
              {reasoning}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
