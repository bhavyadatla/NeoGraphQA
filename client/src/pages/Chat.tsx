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
import { useDocuments, useUploadDocument } from "@/hooks/use-documents";
import { 
  Send, 
  Bot, 
  User, 
  FileText, 
  Sparkles, 
  ChevronDown, 
  ChevronUp,
  BrainCircuit,
  Paperclip,
  ImageIcon,
  Loader2,
  X,
  LayoutGrid
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import ReactMarkdown from 'react-markdown';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Message = {
  role: 'user' | 'assistant';
  content: string;
  source?: string;
  reasoning?: string;
  confidence?: number;
  attachments?: { name: string, type: string }[];
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hello! I am NeoGraphQA. I can answer questions from your documents using PDF analysis, Knowledge Graphs, or Image recognition. How can I help?' }
  ]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<'auto' | 'pdf' | 'kg' | 'image'>('auto');
  const [selectedDocId, setSelectedDocId] = useState<string>("all");
  const [showGallery, setShowGallery] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: documents } = useDocuments();
  const chatMutation = useChat();
  const uploadMutation = useUploadDocument();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      await uploadMutation.mutateAsync(formData);
      // Logic for adding attachment preview to input could go here
    } catch (error) {
      // Toast already handled by hook
    }
  };

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
      <div className="flex-1 md:ml-72 flex flex-col h-full relative">
        {/* Header */}
        <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Chat Assistant</h2>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn("gap-2 text-xs", showGallery && "bg-accent")}
              onClick={() => setShowGallery(!showGallery)}
            >
              <LayoutGrid className="w-4 h-4" />
              Gallery
            </Button>
            
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

        <div className="flex flex-1 overflow-hidden">
          {/* Messages Area */}
          <div className="flex-1 flex flex-col h-full min-w-0">
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
                      "flex flex-col gap-2 max-w-[85%]",
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
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>

            {/* Input Area */}
            <div className="p-4 md:p-6 bg-background border-t border-border">
              <div className="max-w-3xl mx-auto">
                <form onSubmit={handleSubmit} className="relative group">
                  <div className="relative flex flex-col bg-card border border-border rounded-2xl shadow-sm focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                    <Textarea 
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmit();
                        }
                      }}
                      placeholder="Type your message, upload files or images..."
                      className="min-h-[100px] pr-12 resize-none py-4 px-4 rounded-2xl border-0 focus-visible:ring-0 text-sm"
                    />
                    
                    <div className="flex items-center justify-between px-4 pb-3">
                      <div className="flex items-center gap-2">
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
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadMutation.isPending}
                        >
                          {uploadMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                        </Button>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-muted-foreground hover:text-primary"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <ImageIcon className="w-4 h-4" />
                        </Button>
                      </div>

                      <Button 
                        type="submit" 
                        size="icon" 
                        disabled={!input.trim() || chatMutation.isPending}
                        className="h-8 w-8 bg-primary hover:bg-primary/90 transition-all shrink-0"
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-center text-[10px] text-muted-foreground mt-3">
                    NeoGraph AI: Multimodal Knowledge Graph Intelligence
                  </p>
                </form>
              </div>
            </div>
          </div>

          {/* Side Gallery */}
          <AnimatePresence>
            {showGallery && (
              <motion.div
                initial={{ x: 400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 400, opacity: 0 }}
                className="w-80 border-l border-border bg-card overflow-hidden flex flex-col shrink-0"
              >
                <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4" />
                    Asset Gallery
                  </h3>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowGallery(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      {documents?.map(doc => (
                        <Card key={doc.id} className="overflow-hidden group cursor-pointer hover:border-primary/50 transition-colors">
                          <CardContent className="p-0 aspect-square flex flex-col items-center justify-center bg-muted/20 relative">
                            {doc.fileType === 'image' ? (
                               <img src={`/api/images/${doc.id}`} alt={doc.title} className="w-full h-full object-cover" />
                            ) : (
                               <FileText className="w-8 h-8 text-muted-foreground/50" />
                            )}
                            <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <p className="text-[9px] text-white truncate px-1">{doc.title}</p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                    {(!documents || documents.length === 0) && (
                      <div className="text-center py-12 text-muted-foreground">
                        <p className="text-xs italic">No assets uploaded yet</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </motion.div>
            )}
          </AnimatePresence>
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
              {Math.round(confidence * 100)}%
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
