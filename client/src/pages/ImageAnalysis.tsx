import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageIcon, Wand2, Upload, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { Dropzone } from "@/components/Dropzone";
import { queryClient } from "@/lib/queryClient";

export default function ImageAnalysis() {
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  
  // Gen State
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleDrop = (files: File[]) => {
    const file = files[0];
    setImage(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    try {
      // Convert to base64 and call chat API for image analysis
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        // Call chat endpoint with image context
        const res = await fetch('/api/chat/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            message: 'Describe this image in detail, identifying key objects, colors, and context.',
            mode: 'image',
            imageBase64: base64
          })
        });
        if (res.ok) {
          const data = await res.json();
          setAnalysisResult(data.response);
        } else {
          setAnalysisResult("Failed to analyze image. Please try again.");
        }
        setIsAnalyzing(false);
      };
      reader.readAsDataURL(image);
    } catch (error) {
      setAnalysisResult("Error analyzing image.");
      setIsAnalyzing(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ prompt, size: '1024x1024' })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.b64_json) {
          setGeneratedImage(`data:image/png;base64,${data.b64_json}`);
          // Invalidate gallery cache to show new image
          queryClient.invalidateQueries({ queryKey: ["/api/generated-images"] });
        } else if (data.url) {
          setGeneratedImage(data.url);
        }
      } else {
        console.error("Image generation failed");
      }
    } catch (error) {
      console.error("Error generating image:", error);
    }
    setIsGenerating(false);
  };

  const handleDownload = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `generated-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 md:ml-72 p-8 overflow-auto">
        <div className="max-w-5xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-display font-bold">Image Studio</h1>
            <p className="text-muted-foreground mt-1">Analyze existing images or generate new visual data.</p>
          </div>

          <Tabs defaultValue="analyze" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-8">
              <TabsTrigger value="analyze">Image Analysis</TabsTrigger>
              <TabsTrigger value="generate">Text to Image</TabsTrigger>
            </TabsList>

            <TabsContent value="analyze" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="grid md:grid-cols-2 gap-8">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Upload Image</CardTitle>
                    <CardDescription>Upload a PNG or JPG to extract insights.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!preview ? (
                      <Dropzone 
                        onDrop={handleDrop} 
                        accept={{ 'image/*': ['.png', '.jpg', '.jpeg'] }}
                      />
                    ) : (
                      <div className="relative rounded-xl overflow-hidden border border-border group">
                        <img src={preview} alt="Upload" className="w-full h-auto object-cover max-h-[400px]" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button variant="secondary" onClick={() => { setPreview(null); setImage(null); }}>
                            Change Image
                          </Button>
                        </div>
                      </div>
                    )}
                    <Button 
                      className="w-full mt-4" 
                      onClick={handleAnalyze}
                      disabled={!image || isAnalyzing}
                    >
                      {isAnalyzing ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</>
                      ) : (
                        <><Sparkles className="w-4 h-4 mr-2" /> Analyze Image</>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="h-full">
                  <CardHeader>
                    <CardTitle>Analysis Results</CardTitle>
                    <CardDescription>AI-generated insights will appear here.</CardDescription>
                  </CardHeader>
                  <CardContent className="h-[400px] overflow-auto bg-muted/20 rounded-xl p-6 border border-border/50">
                    {analysisResult ? (
                      <div className="prose-custom">
                        <p>{analysisResult}</p>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center p-4">
                        <ImageIcon className="w-12 h-12 mb-4 opacity-20" />
                        <p>No analysis yet. Upload an image and click Analyze.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="generate" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="grid md:grid-cols-2 gap-8">
                <Card>
                  <CardHeader>
                    <CardTitle>Prompt</CardTitle>
                    <CardDescription>Describe the image you want to create.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea 
                        placeholder="A futuristic laboratory with holographic displays..."
                        className="h-32 resize-none"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                      />
                    </div>
                    <Button 
                      className="w-full bg-accent hover:bg-accent/90"
                      onClick={handleGenerate}
                      disabled={!prompt || isGenerating}
                    >
                       {isGenerating ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                      ) : (
                        <><Wand2 className="w-4 h-4 mr-2" /> Generate Image</>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Result</CardTitle>
                    {generatedImage && (
                      <Button variant="outline" size="sm" onClick={handleDownload}>
                        Download
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="aspect-square bg-muted/20 rounded-xl border border-border/50 flex items-center justify-center overflow-hidden">
                       {generatedImage ? (
                         <img src={generatedImage} alt="Generated" className="w-full h-full object-cover animate-in fade-in zoom-in duration-500" />
                       ) : (
                         <div className="text-center p-6 text-muted-foreground">
                           <Wand2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
                           <p>Enter a prompt to generate scientific imagery.</p>
                         </div>
                       )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
