import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useDocuments } from "@/hooks/use-documents";
import { 
  Image as ImageIcon, 
  FileText, 
  Download, 
  Trash2, 
  Loader2,
  Sparkles,
  LayoutGrid,
  Calendar
} from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type GeneratedImage = {
  id: number;
  userId: string;
  prompt: string;
  imageData: string;
  size: string;
  revisedPrompt: string | null;
  createdAt: string;
};

export default function Gallery() {
  const { toast } = useToast();
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  
  const { data: documents, isLoading: docsLoading } = useDocuments();
  
  const { data: generatedImages, isLoading: imagesLoading } = useQuery<GeneratedImage[]>({
    queryKey: ["/api/generated-images"],
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/generated-images/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/generated-images"] });
      toast({ title: "Image deleted" });
      setSelectedImage(null);
    },
    onError: () => {
      toast({ title: "Failed to delete image", variant: "destructive" });
    }
  });

  const handleDownload = (image: GeneratedImage) => {
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${image.imageData}`;
    link.download = `generated-image-${image.id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Image downloaded" });
  };

  const handleDownloadDocument = async (doc: any) => {
    if (doc.fileUrl) {
      const link = document.createElement('a');
      link.href = `/api/images/${doc.id}`;
      link.download = doc.title;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast({ title: "File downloaded" });
    }
  };

  const uploadedImages = documents?.filter(d => d.fileType === 'image') || [];
  const uploadedDocs = documents?.filter(d => d.fileType !== 'image') || [];

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 md:ml-72 flex flex-col h-full">
        <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-primary" />
            <h2 className="font-semibold">Gallery</h2>
          </div>
          <div className="text-sm text-muted-foreground">
            {(generatedImages?.length || 0) + (documents?.length || 0)} total assets
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex">
          <div className="flex-1 p-6 overflow-auto">
            <Tabs defaultValue="generated" className="w-full">
              <TabsList className="grid w-full grid-cols-3 max-w-[500px] mb-6">
                <TabsTrigger value="generated" className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  Generated ({generatedImages?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="uploaded" className="gap-2">
                  <ImageIcon className="w-4 h-4" />
                  Uploaded ({uploadedImages.length})
                </TabsTrigger>
                <TabsTrigger value="documents" className="gap-2">
                  <FileText className="w-4 h-4" />
                  Docs ({uploadedDocs.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="generated">
                {imagesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : generatedImages && generatedImages.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {generatedImages.map((image) => (
                      <Card 
                        key={image.id} 
                        className={cn(
                          "overflow-hidden group cursor-pointer transition-all hover:ring-2 hover:ring-primary/50",
                          selectedImage?.id === image.id && "ring-2 ring-primary"
                        )}
                        onClick={() => setSelectedImage(image)}
                      >
                        <CardContent className="p-0 aspect-square relative">
                          <img 
                            src={`data:image/png;base64,${image.imageData}`} 
                            alt={image.prompt}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-0 left-0 right-0 p-3">
                              <p className="text-white text-xs line-clamp-2">{image.prompt}</p>
                            </div>
                          </div>
                          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              size="icon" 
                              variant="secondary" 
                              className="h-8 w-8"
                              onClick={(e) => { e.stopPropagation(); handleDownload(image); }}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              variant="destructive" 
                              className="h-8 w-8"
                              onClick={(e) => { e.stopPropagation(); deleteImageMutation.mutate(image.id); }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Sparkles className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-lg font-medium">No generated images yet</p>
                    <p className="text-sm">Go to Image Analysis to create AI-generated images</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="uploaded">
                {docsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : uploadedImages.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {uploadedImages.map((doc) => (
                      <Card key={doc.id} className="overflow-hidden group cursor-pointer hover:ring-2 hover:ring-primary/50">
                        <CardContent className="p-0 aspect-square relative">
                          <img 
                            src={`/api/images/${doc.id}`} 
                            alt={doc.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-0 left-0 right-0 p-3">
                              <p className="text-white text-xs truncate">{doc.title}</p>
                            </div>
                          </div>
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              size="icon" 
                              variant="secondary" 
                              className="h-8 w-8"
                              onClick={() => handleDownloadDocument(doc)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <ImageIcon className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-lg font-medium">No uploaded images yet</p>
                    <p className="text-sm">Upload images from the Documents page</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="documents">
                {docsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : uploadedDocs.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {uploadedDocs.map((doc) => (
                      <Card key={doc.id} className="overflow-hidden group hover:ring-2 hover:ring-primary/50 transition-all">
                        <CardContent className="p-4 flex items-start gap-4">
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <FileText className="w-6 h-6 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{doc.title}</p>
                            <p className="text-xs text-muted-foreground capitalize">{doc.fileType}</p>
                            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                              <Calendar className="w-3 h-3" />
                              {new Date(doc.createdAt!).toLocaleDateString()}
                            </div>
                          </div>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 shrink-0"
                            onClick={() => handleDownloadDocument(doc)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <FileText className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-lg font-medium">No documents yet</p>
                    <p className="text-sm">Upload documents from the Documents page</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {selectedImage && (
            <div className="w-96 border-l border-border bg-card p-6 overflow-auto hidden lg:block">
              <div className="space-y-6">
                <div className="aspect-square rounded-xl overflow-hidden border border-border">
                  <img 
                    src={`data:image/png;base64,${selectedImage.imageData}`} 
                    alt={selectedImage.prompt}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Prompt</h4>
                    <p className="text-sm">{selectedImage.prompt}</p>
                  </div>

                  {selectedImage.revisedPrompt && (
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-1">Revised Prompt</h4>
                      <p className="text-sm">{selectedImage.revisedPrompt}</p>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Size</h4>
                    <p className="text-sm">{selectedImage.size}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Created</h4>
                    <p className="text-sm">{new Date(selectedImage.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => handleDownload(selectedImage)}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="icon"
                    onClick={() => deleteImageMutation.mutate(selectedImage.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
