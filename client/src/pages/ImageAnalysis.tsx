import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ImageIcon, 
  Wand2, 
  Upload, 
  Loader2, 
  Sparkles, 
  Save, 
  Download, 
  MessageSquare,
  Clock,
  ChevronRight
} from "lucide-react";
import { useState } from "react";
import { Dropzone } from "@/components/Dropzone";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import type { ImageAnalysis, GeneratedImage } from "@shared/schema";

export default function ImageAnalysisPage() {
  const { toast } = useToast();
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [question, setQuestion] = useState("Describe this image in detail, identifying key objects, colors, and context.");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<string>("0.95");
  
  // Gen State
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const { data: analyses } = useQuery<ImageAnalysis[]>({ queryKey: ["/api/image-analyses"] });
  const { data: genHistory } = useQuery<GeneratedImage[]>({ queryKey: ["/api/generated-images"] });

  const handleDrop = (files: File[]) => {
    const file = files[0];
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleAnalyze = async () => {
    if (!image || !question) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const res = await fetch('/api/chat/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            message: question,
            mode: 'image',
            imageBase64: base64
          })
        });

        if (res.ok) {
          const reader = res.body?.getReader();
          const decoder = new TextDecoder();
          let fullResponse = "";

          if (reader) {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const data = JSON.parse(line.slice(6));
                    if (data.content) {
                      fullResponse += data.content;
                      setAnalysisResult(fullResponse);
                    }
                  } catch (e) {}
                }
              }
            }
          }
        } else {
          toast({ title: "Analysis Failed", variant: "destructive" });
        }
        setIsAnalyzing(false);
      };
      reader.readAsDataURL(image);
    } catch (error) {
      toast({ title: "Error", description: "Failed to process image.", variant: "destructive" });
      setIsAnalyzing(false);
    }
  };

  const handleSaveAnalysis = async () => {
    if (!preview || !question || !analysisResult) return;
    try {
      await apiRequest("POST", "/api/image-analyses", {
        imageUrl: preview,
        question,
        answer: analysisResult,
        confidence
      });
      queryClient.invalidateQueries({ queryKey: ["/api/image-analyses"] });
      toast({ title: "Analysis Saved" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to save analysis.", variant: "destructive" });
    }
  };

  const handleDownloadAnalysis = () => {
    if (!analysisResult) return;
    const content = `Image Analysis Result\nTimestamp: ${new Date().toLocaleString()}\nQuestion: ${question}\nConfidence: ${confidence}\n\nAnswer:\n${analysisResult}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `image-analysis-${Date.now()}.txt`;
    link.click();
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
        toast({ title: "Image Generated" });
      }
    } catch (error) {
      toast({ title: "Generation Failed", variant: "destructive" });
    }
    setIsGenerating(false);
  };

  const handleDownloadGenerated = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `generated-image-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 md:ml-72 flex flex-col h-full overflow-hidden">
        <header className="h-16 border-b flex items-center px-8 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="p-2 rounded-lg bg-primary/10 text-primary mr-3">
            <ImageIcon className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold font-display">Image Studio</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-8 bg-muted/5">
          <div className="max-w-6xl mx-auto">
            <Tabs defaultValue="analyze" className="flex flex-col">
              <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-8 bg-muted/30">
                <TabsTrigger value="analyze">Image Analysis</TabsTrigger>
                <TabsTrigger value="generate">Text to Image</TabsTrigger>
              </TabsList>

              <TabsContent value="analyze" className="animate-in slide-in-from-bottom-4 duration-500">
                <div className="grid lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-8 space-y-6 pb-8">
                    <div className="grid md:grid-cols-2 gap-6">
                      <Card className="border-border/50 shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Upload className="w-4 h-4 text-primary" />
                            Upload & Preview
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {!preview ? (
                            <Dropzone onDrop={handleDrop} accept={{ 'image/*': ['.png', '.jpg', '.jpeg'] }} />
                          ) : (
                            <div className="relative rounded-xl overflow-hidden border border-border group bg-muted/20">
                              <img src={preview} alt="Upload" className="w-full h-auto object-contain max-h-[300px]" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button variant="secondary" size="sm" onClick={() => { setPreview(null); setImage(null); }}>
                                  Change Image
                                </Button>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="border-border/50 shadow-sm">
                        <CardHeader>
                          <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-primary" />
                            Ask About Image
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Your Question</Label>
                            <Textarea 
                              value={question}
                              onChange={(e) => setQuestion(e.target.value)}
                              className="bg-muted/30 resize-none h-24"
                              placeholder="Describe this image..."
                            />
                          </div>
                          <Button className="w-full h-10" onClick={handleAnalyze} disabled={!image || isAnalyzing}>
                            {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                            Run AI Analysis
                          </Button>
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="border-border/50 shadow-sm overflow-hidden">
                      <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/10 py-3">
                        <CardTitle className="text-sm font-semibold">Analysis Results</CardTitle>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={handleSaveAnalysis} disabled={!analysisResult}>
                            <Save className="w-3.5 h-3.5 mr-1.5" />
                            Save
                          </Button>
                          <Button variant="outline" size="sm" onClick={handleDownloadAnalysis} disabled={!analysisResult}>
                            <Download className="w-3.5 h-3.5 mr-1.5" />
                            TXT
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6">
                        {analysisResult ? (
                          <div className="space-y-4">
                            <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
                              {analysisResult}
                            </div>
                            <div className="flex items-center gap-2 pt-4 border-t border-border/50">
                              <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Confidence Score:</span>
                              <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 text-[10px] font-bold border border-green-500/20">
                                {confidence}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="h-48 flex flex-col items-center justify-center text-muted-foreground opacity-30">
                            <ImageIcon className="w-12 h-12 mb-2" />
                            <p className="text-sm">No analysis performed yet</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="lg:col-span-4 border-border/50 shadow-sm flex flex-col overflow-hidden mb-8">
                    <CardHeader className="border-b bg-muted/10 py-3">
                      <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-primary" />
                        Analysis History
                      </CardTitle>
                    </CardHeader>
                    <ScrollArea className="flex-1">
                      <div className="p-4 space-y-3">
                        {analyses?.map((a) => (
                          <div key={a.id} className="p-3 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-all group cursor-pointer">
                            <div className="flex gap-3 items-start">
                              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-border/50">
                                <img src={a.imageUrl} alt="History" className="w-full h-full object-cover" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-medium truncate mb-1">{a.question}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{new Date(a.createdAt!).toLocaleDateString()}</p>
                              </div>
                              <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-primary mt-1" />
                            </div>
                          </div>
                        ))}
                        {(!analyses || analyses.length === 0) && (
                          <div className="py-12 text-center opacity-30">
                            <p className="text-[10px] font-bold uppercase tracking-wider">No history found</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="generate" className="animate-in slide-in-from-bottom-4 duration-500">
                <div className="grid lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-8 space-y-6 pb-8">
                    <Card className="border-border/50 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                          <Wand2 className="w-4 h-4 text-accent-foreground" />
                          Text To Image
                        </CardTitle>
                        <CardDescription className="text-xs">Enter a descriptive prompt to generate scientific imagery.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Textarea 
                          placeholder="A high-resolution 3D visualization of a neural network architecture..."
                          className="h-32 resize-none bg-muted/30"
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                        />
                        <Button className="w-full h-11 bg-accent hover:bg-accent/90" onClick={handleGenerate} disabled={!prompt || isGenerating}>
                          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                          Generate Image
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="border-border/50 shadow-sm overflow-hidden">
                      <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/10 py-3">
                        <CardTitle className="text-sm font-semibold">Generation Result</CardTitle>
                        {generatedImage && (
                          <Button variant="outline" size="sm" onClick={handleDownloadGenerated}>
                            <Download className="w-3.5 h-3.5 mr-1.5" />
                            Download
                          </Button>
                        )}
                      </CardHeader>
                      <CardContent className="p-8 flex items-center justify-center bg-muted/5 min-h-[400px]">
                        {generatedImage ? (
                          <div className="rounded-2xl overflow-hidden shadow-2xl border border-border/50 max-w-lg w-full">
                            <img src={generatedImage} alt="Generated" className="w-full h-auto animate-in fade-in zoom-in duration-700" />
                          </div>
                        ) : (
                          <div className="text-center opacity-30">
                            <Wand2 className="w-16 h-16 mx-auto mb-4" />
                            <p className="text-sm font-medium">Your generated image will appear here</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  <Card className="lg:col-span-4 border-border/50 shadow-sm flex flex-col overflow-hidden mb-8">
                    <CardHeader className="border-b bg-muted/10 py-3">
                      <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-accent-foreground" />
                        Prompt History
                      </CardTitle>
                    </CardHeader>
                    <ScrollArea className="flex-1">
                      <div className="p-4 space-y-3">
                        {genHistory?.map((h) => (
                          <div key={h.id} className="p-3 rounded-xl bg-card border border-border/50 hover:border-accent/30 transition-all group cursor-pointer" onClick={() => setPrompt(h.prompt)}>
                            <div className="flex gap-3 items-center">
                              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                                <Wand2 className="w-4 h-4 text-accent-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-medium truncate mb-1">{h.prompt}</p>
                                <p className="text-[10px] text-muted-foreground truncate">{new Date(h.createdAt!).toLocaleDateString()}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                        {(!genHistory || genHistory.length === 0) && (
                          <div className="py-12 text-center opacity-30">
                            <p className="text-[10px] font-bold uppercase tracking-wider">No history found</p>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
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
