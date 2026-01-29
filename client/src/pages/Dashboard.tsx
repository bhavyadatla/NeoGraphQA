import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDocuments } from "@/hooks/use-documents";
import { useQuery } from "@tanstack/react-query";
import { 
  FileText, 
  ImageIcon, 
  MessageSquare, 
  Network, 
  Activity,
  UserCircle
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { type GeneratedImage } from "@shared/schema";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: documents } = useDocuments();
  const { data: generatedImages } = useQuery<GeneratedImage[]>({
    queryKey: ["/api/images/generated"],
    retry: false
  });

  const pdfs = documents?.filter(d => d.fileType === 'pdf') || [];
  const images = documents?.filter(d => d.fileType === 'image') || [];
  const allImages = [...(generatedImages || []).map(img => ({ type: 'generated', ...img })), ...images.map(img => ({ type: 'uploaded', ...img }))];

  const stats = [
    { label: "Uploaded PDFs", value: pdfs.length, icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Uploaded Images", value: images.length, icon: ImageIcon, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Total Questions", value: 0, icon: MessageSquare, color: "text-purple-500", bg: "bg-purple-500/10" },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 md:ml-72 p-8 overflow-auto">
        <motion.div 
          initial="hidden"
          animate="show"
          variants={container}
          className="max-w-7xl mx-auto space-y-8"
        >
          <div className="flex items-center gap-4">
            <UserCircle className="w-12 h-12 text-primary" />
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">Hi {user?.firstName || "there"}</h1>
              <p className="text-muted-foreground">Welcome back to your intelligence dashboard.</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, i) => (
              <motion.div key={i} variants={item}>
                <Card className="hover-elevate transition-all duration-300 border-border/50">
                  <CardContent className="p-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                      <h3 className="text-3xl font-bold mt-2 font-display">{stat.value}</h3>
                    </div>
                    <div className={`p-4 rounded-xl ${stat.bg} ${stat.color}`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Gallery Section */}
            <motion.div variants={item} className="space-y-4">
              <h2 className="text-xl font-bold font-display flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-primary" />
                Gallery
              </h2>
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 gap-4">
                    {allImages.length > 0 ? (
                      allImages.slice(0, 4).map((img, i) => (
                        <div key={i} className="aspect-square rounded-lg overflow-hidden bg-muted relative group">
                          <img 
                            src={'imageData' in img ? img.imageData : img.fileUrl || ''} 
                            alt="Gallery item"
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-xs font-medium px-2 py-1 bg-primary/80 rounded-full capitalize">
                              {'type' in img ? img.type : 'uploaded'}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 py-12 text-center text-muted-foreground text-sm">
                        No images found in your gallery.
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Documents and KG Lists */}
            <div className="space-y-8">
              <motion.div variants={item} className="space-y-4">
                <h2 className="text-xl font-bold font-display flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Uploaded PDFs
                </h2>
                <Card className="border-border/50">
                  <CardContent className="p-0">
                    <div className="divide-y divide-border/50">
                      {pdfs.length > 0 ? (
                        pdfs.slice(0, 3).map((doc) => (
                          <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <FileText className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm font-medium truncate max-w-[200px]">{doc.title}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(doc.createdAt!).toLocaleDateString()}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-muted-foreground text-sm">
                          No PDFs uploaded.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div variants={item} className="space-y-4">
                <h2 className="text-xl font-bold font-display flex items-center gap-2">
                  <Network className="w-5 h-5 text-primary" />
                  Knowledge Graphs
                </h2>
                <Card className="border-border/50">
                  <CardContent className="p-0">
                    <div className="divide-y divide-border/50">
                      {documents?.filter(d => d.processingStatus === 'completed').length ? (
                        documents.filter(d => d.processingStatus === 'completed').slice(0, 3).map((doc) => (
                          <div key={doc.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <Network className="w-4 h-4 text-primary" />
                              <span className="text-sm font-medium truncate max-w-[200px]">{doc.title} Graph</span>
                            </div>
                            <Activity className="w-4 h-4 text-green-500" />
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-muted-foreground text-sm">
                          No knowledge graphs generated yet.
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
