import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDocuments, useUploadDocument } from "@/hooks/use-documents";
import { useToast } from "@/hooks/use-toast";
import { 
  ImageIcon, 
  Upload, 
  MessageSquare, 
  Loader2, 
  Search,
  History,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Wand2
} from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ImageStudio() {
  const { data: documents } = useDocuments();
  const uploadMutation = useUploadDocument();
  const { toast } = useToast();
  
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [question, setQuestion] = useState("");
  const [analysis, setAnalysis] = useState<{ text: string, confidence: number, reasoning: string } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Text to Image state
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const selectedDoc = documents?.find(d => d.id === selectedDocId);
  const images = documents?.filter(d => d.fileType === "image") || [];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const doc = await uploadMutation.mutateAsync(formData);
      setSelectedDocId(doc.id);
      toast({ title: "Image Uploaded", description: "Image ready for analysis." });
    } catch (error) {
      // Error handled by hook
    }
  };

  const handleAnalyze = async () => {
    if (!selectedDocId) return;
    
    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      const res = await apiRequest("POST", "/api/chat/query", {
        message: question || "Describe this image in detail.",
        documentId: selectedDocId,
        mode: "image"
      });
      const data = await res.json();
      setAnalysis({ 
        text: data.response, 
        confidence: data.confidence || 0.95, 
        reasoning: data.reasoning 
      });
    } catch (error) {
      toast({ title: "Error", description: "Failed to analyze image.", variant: "destructive" });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    try {
      const res = await apiRequest("POST", "/api/generate-image", { prompt, size: '1024x1024' });
      const data = await res.json();
      if (data.b64_json) {
        setGeneratedImage(`data:image/png;base64,${data.b64_json}`);
        queryClient.invalidateQueries({ queryKey: ["/api/generated-images"] });
        toast({ title: "Image Generated", description: "Your image is ready." });
      } else if (data.url) {
        setGeneratedImage(data.url);
        toast({ title: "Image Generated", description: "Your image is ready." });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate image.", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 md:ml-72 flex flex-col h-full overflow-hidden">
        <header className="h-16 border-b flex items-center justify-between px-8 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <ImageIcon className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold font-display">Image Studio</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <input 
              type="file" 
              id="image-upload" 
              className="hidden" 
              accept="image/*"
              onChange={handleFileUpload} 
            />
            <Button asChild variant="default" className="gap-2">
              <label htmlFor="image-upload" className="cursor-pointer">
                {uploadMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                Upload Image
              </label>
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8 bg-muted/5">
          <div className="max-w-6xl mx-auto space-y-8">
            <Tabs defaultValue="analyze" className="w-full">
              <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-8">
                <TabsTrigger value="analyze">Vision Analysis</TabsTrigger>
                <TabsTrigger value="generate">Text to Image</TabsTrigger>
              </TabsList>

              <TabsContent value="analyze" className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex h-[70vh] gap-8">
                  {/* Sidebar - Image List */}
                  <div className="w-80 border rounded-2xl bg-card overflow-hidden flex flex-col shadow-sm">
                    <div className="p-4 border-b flex items-center justify-between bg-muted/30">
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Library</h3>
                      <History className="w-3 h-3 text-muted-foreground" />
                    </div>
                    <ScrollArea className="flex-1">
                      <div className="p-2 space-y-1">
                        {images.map((doc) => (
                          <button
                            key={doc.id}
                            onClick={() => setSelectedDocId(doc.id)}
                            className={`w-full text-left px-3 py-3 rounded-xl text-sm transition-all flex items-center gap-3 group ${
                              selectedDocId === doc.id 
                                ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20" 
                                : "hover:bg-muted text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted shrink-0 border border-border/50">
                              <img src={`/api/documents/${doc.id}/view`} alt={doc.title} className="w-full h-full object-cover" />
                            </div>
                            <span className="truncate font-medium">{doc.title}</span>
                            {selectedDocId === doc.id && <ChevronRight className="w-4 h-4 ml-auto" />}
                          </button>
                        ))}
                        {images.length === 0 && (
                          <div className="p-8 text-center text-muted-foreground">
                            <p className="text-xs italic">No images found</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Analysis Content Area */}
                  <div className="flex-1 space-y-8">
                    {!selectedDoc ? (
                      <div className="h-full flex flex-col items-center justify-center text-center space-y-6 bg-card border rounded-2xl shadow-sm">
                        <div className="w-20 h-20 rounded-3xl bg-primary/5 flex items-center justify-center">
                          <Search className="w-10 h-10 text-primary/40" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-bold font-display">Select an image to analyze</h2>
                          <p className="text-muted-foreground mt-2 max-w-sm">
                            Upload or select an image from your library to start deep visual analysis.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full"
                      >
                        {/* Image Preview */}
                        <Card className="border-border/50 shadow-sm overflow-hidden flex flex-col">
                          <div className="flex-1 bg-muted relative flex items-center justify-center p-4">
                            <img 
                              src={`/api/documents/${selectedDoc.id}/view`} 
                              alt={selectedDoc.title} 
                              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                            />
                          </div>
                          <CardHeader className="border-t border-border/50 bg-card">
                            <CardTitle className="text-base truncate">{selectedDoc.title}</CardTitle>
                            <CardDescription className="text-xs">
                              {new Date(selectedDoc.createdAt!).toLocaleDateString()}
                            </CardDescription>
                          </CardHeader>
                        </Card>

                        {/* Analysis & QA */}
                        <div className="space-y-6">
                          <Card className="border-border/50 shadow-sm h-full flex flex-col">
                            <CardHeader>
                              <CardTitle className="text-base flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-primary" />
                                Vision AI
                              </CardTitle>
                              <CardDescription className="text-xs">Identify objects, text, and context</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 flex flex-col space-y-4">
                              <div className="flex gap-2">
                                <Input 
                                  placeholder="Ask about this image..." 
                                  value={question}
                                  onChange={(e) => setQuestion(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                                  className="bg-muted/30"
                                />
                                <Button size="icon" onClick={handleAnalyze} disabled={isAnalyzing}>
                                  {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                                </Button>
                              </div>
                              
                              <ScrollArea className="flex-1">
                                <AnimatePresence mode="wait">
                                  {analysis ? (
                                    <motion.div
                                      key="analysis"
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -10 }}
                                      className="space-y-4"
                                    >
                                      <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                                        <div className="flex items-center justify-between mb-3 border-b border-primary/10 pb-2">
                                          <div className="flex items-center gap-2 text-[10px] text-primary/60 uppercase font-bold tracking-widest">
                                            <ShieldCheck className="w-3 h-3" />
                                            Results
                                          </div>
                                          <div className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold">
                                            {Math.round(analysis.confidence * 100)}% Confidence
                                          </div>
                                        </div>
                                        <div className="prose prose-sm dark:prose-invert max-w-none">
                                          <ReactMarkdown>{analysis.text}</ReactMarkdown>
                                        </div>
                                      </div>

                                      {analysis.reasoning && (
                                        <div className="p-3 rounded-lg bg-muted/50 border border-border/50 text-[11px] text-muted-foreground italic">
                                          <strong>Reasoning:</strong> {analysis.reasoning}
                                        </div>
                                      )}
                                    </motion.div>
                                  ) : isAnalyzing ? (
                                    <div className="h-40 flex flex-col items-center justify-center text-muted-foreground animate-pulse">
                                      <Loader2 className="w-8 h-8 mb-2 animate-spin" />
                                      <p className="text-xs">Analyzing visual features...</p>
                                    </div>
                                  ) : (
                                    <div className="h-40 flex flex-col items-center justify-center text-muted-foreground text-center border border-dashed rounded-xl border-border/50">
                                      <Sparkles className="w-8 h-8 mb-2 opacity-20" />
                                      <p className="text-xs px-4">Click "Analyze" or ask a question to process image.</p>
                                    </div>
                                  )}
                                </AnimatePresence>
                              </ScrollArea>

                              <Button 
                                variant="outline" 
                                className="w-full"
                                onClick={handleAnalyze}
                                disabled={isAnalyzing}
                              >
                                Deep Scan Image
                              </Button>
                            </CardContent>
                          </Card>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="generate" className="animate-in slide-in-from-bottom-4 duration-500">
                <div className="grid md:grid-cols-2 gap-8 h-[60vh]">
                  <Card className="shadow-sm border-border/50">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Wand2 className="w-4 h-4 text-accent-foreground" />
                        Generation Settings
                      </CardTitle>
                      <CardDescription className="text-xs">Create unique visual assets from descriptions</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Prompt Description</Label>
                        <Textarea 
                          placeholder="A cinematic shot of a futuristic data center with flowing neon light patterns..."
                          className="min-h-[200px] bg-muted/20 border-border/50 resize-none focus-visible:ring-accent"
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                        />
                      </div>
                      <Button 
                        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-bold shadow-lg shadow-accent/20 h-12"
                        onClick={handleGenerate}
                        disabled={!prompt || isGenerating}
                      >
                         {isGenerating ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Materializing...</>
                        ) : (
                          <><Sparkles className="w-4 h-4 mr-2" /> Generate Asset</>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="shadow-sm border-border/50 flex flex-col overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b">
                      <CardTitle className="text-base">Generated Result</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 relative group">
                       {generatedImage ? (
                         <div className="h-full relative">
                           <img src={generatedImage} alt="Generated" className="w-full h-full object-cover animate-in fade-in zoom-in duration-700" />
                           <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                             <Button variant="secondary" className="gap-2" onClick={() => {
                               const link = document.createElement('a');
                               link.href = generatedImage;
                               link.download = `neo-asset-${Date.now()}.png`;
                               link.click();
                             }}>
                               <Upload className="w-4 h-4 rotate-180" />
                               Download Asset
                             </Button>
                           </div>
                         </div>
                       ) : (
                         <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center p-8 bg-muted/10">
                           <div className="w-16 h-16 rounded-full bg-accent/5 flex items-center justify-center mb-4">
                             <Wand2 className="w-8 h-8 text-accent/20" />
                           </div>
                           <p className="text-sm">Describe your vision and click generate to materialize the image here.</p>
                         </div>
                       )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
