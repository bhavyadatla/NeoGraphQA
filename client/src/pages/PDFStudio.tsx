import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDocuments, useUploadDocument } from "@/hooks/use-documents";
import { useToast } from "@/hooks/use-toast";
import { 
  FileText, 
  Upload, 
  Sparkles, 
  MessageSquare, 
  Loader2, 
  FileSearch,
  BookOpen,
  ChevronRight
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

export default function PDFStudio() {
  const { data: documents } = useDocuments();
  const uploadMutation = useUploadDocument();
  const { toast } = useToast();
  
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<{ text: string, source: string } | null>(null);
  const [isAsking, setIsAsking] = useState(false);

  const selectedDoc = documents?.find(d => d.id === selectedDocId);
  const pdfs = documents?.filter(d => d.fileType === "pdf") || [];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const doc = await uploadMutation.mutateAsync(formData);
      setSelectedDocId(doc.id);
      toast({ title: "PDF Uploaded", description: "Analysis started in background." });
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim() || !selectedDocId) return;
    
    setIsAsking(true);
    setAnswer(null);

    try {
      const res = await apiRequest("POST", "/api/chat/query", {
        message: question,
        documentId: selectedDocId,
        mode: "pdf"
      });
      const data = await res.json();
      setAnswer({ text: data.response, source: data.source });
    } catch (error) {
      toast({ title: "Error", description: "Failed to get an answer.", variant: "destructive" });
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex h-screen bg-background"
    >
      <AppSidebar />
      <div className="flex-1 md:ml-72 flex flex-col h-full overflow-hidden">
        <header className="h-16 border-b flex items-center justify-between px-8 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold font-display">PDF Studio</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <input 
              type="file" 
              id="pdf-upload" 
              className="hidden" 
              accept=".pdf"
              onChange={handleFileUpload} 
            />
            <Button asChild variant="default" className="gap-2">
              <label htmlFor="pdf-upload" className="cursor-pointer">
                {uploadMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Upload PDF
              </label>
            </Button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - PDF List */}
          <div className="w-80 border-r bg-muted/5 flex flex-col">
            <div className="p-4 border-b">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">My Library</h3>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2 space-y-1">
                {pdfs.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    className={`w-full text-left px-3 py-3 rounded-xl text-sm transition-all flex items-center gap-3 group ${
                      selectedDocId === doc.id 
                        ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20" 
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <FileText className={`w-4 h-4 shrink-0 ${selectedDocId === doc.id ? "text-primary" : "text-muted-foreground group-hover:text-primary"}`} />
                    <span className="truncate font-medium">{doc.title}</span>
                    {selectedDocId === doc.id && <ChevronRight className="w-4 h-4 ml-auto" />}
                  </button>
                ))}
                {pdfs.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    <p className="text-xs italic">No PDFs found</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Main Content Area */}
          <main className="flex-1 overflow-auto bg-muted/5 p-8">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              {!selectedDoc ? (
                <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-20 h-20 rounded-3xl bg-primary/5 flex items-center justify-center">
                    <FileSearch className="w-10 h-10 text-primary/40" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold font-display">Select a PDF to begin</h2>
                    <p className="text-muted-foreground mt-2 max-w-sm">
                      Upload or select a document from your library to extract text, generate summaries, and ask questions.
                    </p>
                  </div>
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  {/* Header Info */}
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-bold font-display">{selectedDoc.title}</h2>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          selectedDoc.processingStatus === 'completed' 
                            ? "bg-green-500/10 text-green-600 border border-green-500/20" 
                            : "bg-yellow-500/10 text-yellow-600 border border-yellow-500/20"
                        }`}>
                          {selectedDoc.processingStatus}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(selectedDoc.createdAt!).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Summaries */}
                    <div className="space-y-6">
                      <Card className="border-border/50 shadow-sm overflow-hidden">
                        <CardHeader className="bg-primary/5 border-b border-border/50">
                          <CardTitle className="text-base flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-primary" />
                            Abstractive Summary
                          </CardTitle>
                          <CardDescription className="text-xs">A natural language overview of the document content.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            {selectedDoc.summary || "Summary is being generated..."}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-border/50 shadow-sm overflow-hidden">
                        <CardHeader className="bg-accent/5 border-b border-border/50">
                          <CardTitle className="text-base flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-accent-foreground" />
                            Extractive Summary
                          </CardTitle>
                          <CardDescription className="text-xs">Key points extracted directly from the text.</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            {(selectedDoc as any).extractiveSummary || "Key points are being extracted..."}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* QA & Preview */}
                    <div className="space-y-6">
                      <Card className="border-border/50 shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-primary" />
                            Ask PDF Question
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex gap-2">
                            <Input 
                              placeholder="e.g. What are the key findings?" 
                              value={question}
                              onChange={(e) => setQuestion(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                              className="bg-muted/30"
                            />
                            <Button size="icon" onClick={handleAskQuestion} disabled={isAsking || !question.trim()}>
                              {isAsking ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                            </Button>
                          </div>
                          
                          <AnimatePresence>
                            {answer && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="p-4 rounded-xl bg-primary/5 border border-primary/10"
                              >
                                <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                                  <ReactMarkdown>{answer.text}</ReactMarkdown>
                                </div>
                                <div className="mt-3 pt-3 border-t border-primary/10 flex items-center gap-2 text-[10px] text-primary/60 uppercase font-bold tracking-widest">
                                  <FileText className="w-3 h-3" />
                                  Source: {answer.source}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </CardContent>
                      </Card>

                      <Card className="border-border/50 shadow-sm h-[400px] flex flex-col">
                        <CardHeader>
                          <CardTitle className="text-base flex items-center gap-2">
                            <FileSearch className="w-4 h-4 text-muted-foreground" />
                            Extracted Text Preview
                          </CardTitle>
                        </CardHeader>
                        <ScrollArea className="flex-1 p-6 bg-muted/10">
                          <div className="prose prose-sm dark:prose-invert max-w-none opacity-80">
                            {selectedDoc.content}
                          </div>
                        </ScrollArea>
                      </Card>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </main>
        </div>
      </div>
    </motion.div>
  );
}
