import { AppSidebar } from "@/components/AppSidebar";
import { GraphViz } from "@/components/GraphViz";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useDocuments } from "@/hooks/use-documents";
import { useKnowledgeGraph } from "@/hooks/use-kg";
import { useState } from "react";
import { Network, Loader2 } from "lucide-react";

export default function KnowledgeGraph() {
  const { data: documents } = useDocuments();
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  
  const { data: graphData, isLoading: isGraphLoading } = useKnowledgeGraph(Number(selectedDocId));

  // Transform data for GraphViz
  const vizData = graphData ? {
    nodes: graphData.nodes.map(n => ({ id: n.id, label: n.label, type: n.type, color: n.color || "#3b82f6" })),
    edges: graphData.edges.map(e => ({ source: e.sourceId!, target: e.targetId!, relation: e.relation })),
  } : { nodes: [], edges: [] };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 md:ml-72 flex flex-col h-full overflow-hidden relative">
        {/* Controls Overlay */}
        <div className="absolute top-6 left-6 z-10 w-full max-w-sm space-y-4 pointer-events-none">
          <div className="pointer-events-auto bg-card/90 backdrop-blur-md p-4 rounded-2xl border border-border shadow-lg">
            <h1 className="text-xl font-display font-bold flex items-center gap-2">
              <Network className="w-5 h-5 text-accent" /> Knowledge Graph
            </h1>
            <p className="text-sm text-muted-foreground mb-4">Visualize relationships in your data.</p>
            
            <div className="space-y-2">
              <label className="text-xs font-medium uppercase text-muted-foreground">Select Document</label>
              <Select value={selectedDocId} onValueChange={setSelectedDocId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a document..." />
                </SelectTrigger>
                <SelectContent>
                  {documents?.map(doc => (
                    <SelectItem key={doc.id} value={doc.id.toString()}>
                      {doc.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {graphData && (
              <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-primary">{graphData.nodes.length}</div>
                  <div className="text-xs text-muted-foreground uppercase">Nodes</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent">{graphData.edges.length}</div>
                  <div className="text-xs text-muted-foreground uppercase">Relations</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Graph Canvas */}
        <div className="flex-1 bg-muted/10 relative">
          {selectedDocId ? (
            isGraphLoading ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
            ) : graphData?.nodes.length ? (
              <GraphViz data={vizData} />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                No graph data available for this document. Try processing it first.
              </div>
            )
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
              Select a document to visualize its Knowledge Graph.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
