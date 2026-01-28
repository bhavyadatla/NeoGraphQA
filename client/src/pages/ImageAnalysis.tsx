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
    // Simulate analysis API call
    setTimeout(() => {
      setAnalysisResult("This image depicts a scientific laboratory setting. Key elements include a microscope, test tubes containing various colored liquids, and a digital display showing molecular structures. The lighting is cool-toned, suggesting a sterile environment.");
      setIsAnalyzing(false);
    }, 2000);
  };

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    // Simulate generation API call
    setTimeout(() => {
      setGeneratedImage("https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bmV1cmFsJTIwbmV0d29ya3xlbnwwfHwwfHx8MA%3D%3D"); 
      setIsGenerating(false);
    }, 2000);
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
                  <CardHeader>
                    <CardTitle>Result</CardTitle>
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
