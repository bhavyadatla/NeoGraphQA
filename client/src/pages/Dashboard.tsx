import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDocuments } from "@/hooks/use-documents";
import { 
  FileText, 
  Network, 
  Activity, 
  Cpu, 
  Clock,
  ArrowRight
} from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function Dashboard() {
  const { data: documents } = useDocuments();

  const stats = [
    { label: "Total Documents", value: documents?.length || 0, icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Processed", value: documents?.filter(d => d.processingStatus === 'completed').length || 0, icon: Cpu, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Pending", value: documents?.filter(d => d.processingStatus === 'pending').length || 0, icon: Clock, color: "text-orange-500", bg: "bg-orange-500/10" },
    { label: "Knowledge Nodes", value: "~", icon: Network, color: "text-purple-500", bg: "bg-purple-500/10" },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground mt-2">Overview of your knowledge base status.</p>
            </div>
            <Link href="/documents" className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
              Manage Documents <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div key={i} variants={item}>
                <Card className="hover:shadow-lg transition-shadow duration-300 border-border/50">
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

          {/* Recent Activity Section */}
          <motion.div variants={item}>
            <Card className="border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" />
                  Recent Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                {documents && documents.length > 0 ? (
                  <div className="divide-y divide-border/50">
                    {documents.slice(0, 5).map((doc) => (
                      <div key={doc.id} className="py-4 flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            <FileText className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{doc.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {new Date(doc.createdAt!).toLocaleDateString()} • {(doc.fileType || 'Unknown').toUpperCase()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            doc.processingStatus === 'completed' 
                              ? 'bg-green-500/10 text-green-600 border-green-500/20' 
                              : doc.processingStatus === 'processing'
                              ? 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                              : 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                          }`}>
                            {doc.processingStatus}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No documents found.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
