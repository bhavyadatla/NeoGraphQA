import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dropzone } from "@/components/Dropzone";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { useDocuments, useUploadDocument, useDeleteDocument, useProcessDocument } from "@/hooks/use-documents";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { FileText, Trash2, Play, Plus, Search, Loader2 } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export default function Documents() {
  const { data: documents, isLoading } = useDocuments();
  const uploadMutation = useUploadDocument();
  const deleteMutation = useDeleteDocument();
  const processMutation = useProcessDocument();
  const [searchTerm, setSearchTerm] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);

  const filteredDocs = documents?.filter(doc => 
    doc.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpload = async (files: File[]) => {
    const formData = new FormData();
    formData.append("file", files[0]);
    await uploadMutation.mutateAsync(formData);
    setUploadOpen(false);
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 md:ml-72 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-display font-bold">Documents</h1>
              <p className="text-muted-foreground mt-1">Upload and process knowledge sources.</p>
            </div>
            
            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25">
                  <Plus className="w-4 h-4 mr-2" /> Upload Document
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Upload Document</DialogTitle>
                  <DialogDescription>
                    Supported formats: PDF, TXT, CSV. Max size 10MB.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                  <Dropzone 
                    onDrop={handleUpload} 
                    isLoading={uploadMutation.isPending}
                    accept={{
                      'application/pdf': ['.pdf'],
                      'text/plain': ['.txt'],
                      'text/csv': ['.csv']
                    }}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Search & Filter */}
          <div className="flex items-center gap-4 bg-card p-2 rounded-xl border border-border shadow-sm max-w-md">
            <Search className="w-5 h-5 text-muted-foreground ml-2" />
            <Input 
              placeholder="Search documents..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-none shadow-none focus-visible:ring-0 bg-transparent"
            />
          </div>

          {/* Documents Table */}
          <Card className="border-border/50 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date Added</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <Loader2 className="w-4 h-4 animate-spin" /> Loading documents...
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredDocs?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                        No documents found. Upload one to get started.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDocs?.map((doc) => (
                      <TableRow key={doc.id} className="group hover:bg-muted/30">
                        <TableCell className="font-medium flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <FileText className="w-4 h-4" />
                          </div>
                          {doc.title}
                        </TableCell>
                        <TableCell className="uppercase text-xs font-medium text-muted-foreground">
                          {doc.fileType}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(doc.createdAt!).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-xs font-medium border",
                            doc.processingStatus === 'completed' && "bg-green-500/10 text-green-600 border-green-500/20",
                            doc.processingStatus === 'processing' && "bg-blue-500/10 text-blue-600 border-blue-500/20",
                            doc.processingStatus === 'failed' && "bg-red-500/10 text-red-600 border-red-500/20",
                            doc.processingStatus === 'pending' && "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
                          )}>
                            {doc.processingStatus}
                          </span>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {doc.processingStatus === 'pending' && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => processMutation.mutate(doc.id)}
                              disabled={processMutation.isPending}
                              title="Process Document"
                            >
                              <Play className="w-4 h-4 text-primary" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => deleteMutation.mutate(doc.id)}
                            disabled={deleteMutation.isPending}
                            className="text-muted-foreground hover:text-destructive"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
