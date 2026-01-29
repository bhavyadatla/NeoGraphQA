import { AppSidebar } from "@/components/AppSidebar";
import { GraphViz } from "@/components/GraphViz";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useDocuments } from "@/hooks/use-documents";
import { useKnowledgeGraph } from "@/hooks/use-kg";
import { useState, useMemo } from "react";
import { 
  Network, 
  Loader2, 
  Circle, 
  ArrowRight, 
  Sparkles, 
  MessageSquare, 
  Brain,
  TrendingUp,
  Lightbulb,
  Send,
  ChevronRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function KnowledgeGraph() {
  const { toast } = useToast();
  const { data: documents } = useDocuments();
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [question, setQuestion] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [answer, setAnswer] = useState<{ answer: string; reasoningPath: string[] } | null>(null);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [insights, setInsights] = useState<{ summary: string; keyFindings: string[] } | null>(null);
  
  const { data: graphData, isLoading: isGraphLoading } = useKnowledgeGraph(Number(selectedDocId));

  const vizData = graphData ? {
    nodes: graphData.nodes.map(n => ({ id: n.id, label: n.label, type: n.type, color: n.color || "#3b82f6" })),
    edges: graphData.edges.map(e => ({ source: e.sourceId!, target: e.targetId!, relation: e.relation })),
  } : { nodes: [], edges: [] };

  const topEntities = useMemo(() => {
    if (!graphData?.nodes) return [];
    const entityCounts: Record<string, { label: string; type: string; count: number; color: string }> = {};
    
    graphData.nodes.forEach(node => {
      if (!entityCounts[node.label]) {
        entityCounts[node.label] = { label: node.label, type: node.type, count: 0, color: node.color || "#3b82f6" };
      }
      entityCounts[node.label].count++;
    });

    graphData.edges.forEach(edge => {
      const sourceNode = graphData.nodes.find(n => n.id === edge.sourceId);
      const targetNode = graphData.nodes.find(n => n.id === edge.targetId);
      if (sourceNode) entityCounts[sourceNode.label].count++;
      if (targetNode) entityCounts[targetNode.label].count++;
    });

    return Object.values(entityCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [graphData]);

  const importantNodes = useMemo(() => {
    if (!graphData?.nodes || !graphData?.edges) return [];
    const connectivity: Record<number, number> = {};
    
    graphData.edges.forEach(edge => {
      connectivity[edge.sourceId!] = (connectivity[edge.sourceId!] || 0) + 1;
      connectivity[edge.targetId!] = (connectivity[edge.targetId!] || 0) + 1;
    });

    return graphData.nodes
      .map(node => ({ ...node, connections: connectivity[node.id] || 0 }))
      .sort((a, b) => b.connections - a.connections)
      .slice(0, 5);
  }, [graphData]);

  const handleAskQuestion = async () => {
    if (!question.trim() || !selectedDocId) return;
    setIsAsking(true);
    setAnswer(null);
    
    try {
      const res = await fetch('/api/kg/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ documentId: Number(selectedDocId), question })
      });
      
      if (res.ok) {
        const data = await res.json();
        setAnswer(data);
      } else {
        toast({ title: "Failed to get answer", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to process question", variant: "destructive" });
    }
    setIsAsking(false);
  };

  const handleGenerateInsights = async () => {
    if (!selectedDocId || !graphData?.nodes.length) return;
    setIsGeneratingInsights(true);
    setInsights(null);
    
    try {
      const res = await fetch('/api/kg/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ documentId: Number(selectedDocId) })
      });
      
      if (res.ok) {
        const data = await res.json();
        setInsights(data);
      } else {
        toast({ title: "Failed to generate insights", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to generate insights", variant: "destructive" });
    }
    setIsGeneratingInsights(false);
  };

  return (
    <div className="flex h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 md:ml-72 flex flex-col h-full overflow-hidden">
        <header className="h-16 border-b flex items-center px-8 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="p-2 rounded-lg bg-accent/10 text-accent-foreground mr-3">
            <Network className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold font-display">Knowledge Graph</h1>
        </header>

        <main className="flex-1 overflow-y-auto p-6 bg-muted/5">
          <div className="grid lg:grid-cols-12 gap-6 h-full">
            <div className="lg:col-span-8 flex flex-col gap-6">
              <Card className="border-border/50 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Network className="w-4 h-4 text-primary" />
                    Select Document
                  </CardTitle>
                  <CardDescription className="text-xs">Choose a document to visualize its knowledge graph</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={selectedDocId} onValueChange={(v) => { setSelectedDocId(v); setAnswer(null); setInsights(null); }}>
                    <SelectTrigger data-testid="select-document">
                      <SelectValue placeholder="Choose a document..." />
                    </SelectTrigger>
                    <SelectContent>
                      {documents?.map(doc => (
                        <SelectItem key={doc.id} value={doc.id.toString()} data-testid={`doc-option-${doc.id}`}>
                          {doc.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {graphData && (
                <div className="grid grid-cols-3 gap-4">
                  <Card className="border-border/50 shadow-sm">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Circle className="w-4 h-4 text-primary fill-primary/20" />
                        <span className="text-2xl font-bold text-primary">{graphData.nodes.length}</span>
                      </div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Nodes</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/50 shadow-sm">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <ArrowRight className="w-4 h-4 text-accent-foreground" />
                        <span className="text-2xl font-bold text-accent-foreground">{graphData.edges.length}</span>
                      </div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Edges</p>
                    </CardContent>
                  </Card>
                  <Card className="border-border/50 shadow-sm">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-green-500" />
                        <span className="text-2xl font-bold text-green-500">{topEntities.length}</span>
                      </div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Top Entities</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              <Card className="border-border/50 shadow-sm flex-1 min-h-[400px] overflow-hidden">
                <CardHeader className="py-3 border-b bg-muted/10">
                  <CardTitle className="text-sm font-semibold">Graph Visualization</CardTitle>
                </CardHeader>
                <CardContent className="p-0 h-[500px]">
                  {selectedDocId ? (
                    isGraphLoading ? (
                      <div className="h-full flex items-center justify-center">
                        <Loader2 className="w-10 h-10 text-primary animate-spin" />
                      </div>
                    ) : graphData?.nodes.length ? (
                      <GraphViz data={vizData} />
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <Network className="w-12 h-12 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">No graph data available. Process the document first.</p>
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Network className="w-12 h-12 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Select a document to visualize</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/50 shadow-sm">
                <CardHeader className="py-3 border-b bg-muted/10">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    Ask Question from Knowledge Graph
                  </CardTitle>
                  <CardDescription className="text-xs">Query the knowledge graph to find answers with reasoning paths</CardDescription>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <div className="flex gap-3">
                    <Textarea
                      placeholder="What are the main relationships between entities in this document?"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      className="resize-none h-20 bg-muted/30"
                      disabled={!selectedDocId || !graphData?.nodes.length}
                      data-testid="input-kg-question"
                    />
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={handleAskQuestion} 
                    disabled={!question.trim() || !selectedDocId || isAsking || !graphData?.nodes.length}
                    data-testid="button-ask-kg"
                  >
                    {isAsking ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                    Ask Knowledge Graph
                  </Button>

                  {answer && (
                    <div className="space-y-4 pt-4 border-t border-border/50">
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                          <Brain className="w-3.5 h-3.5 text-primary" />
                          Answer
                        </h4>
                        <div className="p-4 rounded-xl bg-muted/30 border border-border/50">
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{answer.answer}</p>
                        </div>
                      </div>

                      {answer.reasoningPath && answer.reasoningPath.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <ChevronRight className="w-3.5 h-3.5 text-accent-foreground" />
                            Reasoning Path
                          </h4>
                          <div className="space-y-2">
                            {answer.reasoningPath.map((step, idx) => (
                              <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-accent/5 border border-accent/20">
                                <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0 text-xs font-bold text-accent-foreground">
                                  {idx + 1}
                                </div>
                                <p className="text-sm text-muted-foreground">{step}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-4 space-y-6">
              {graphData && topEntities.length > 0 && (
                <Card className="border-border/50 shadow-sm">
                  <CardHeader className="py-3 border-b bg-muted/10">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                      Top Entities
                    </CardTitle>
                  </CardHeader>
                  <ScrollArea className="h-[200px]">
                    <div className="p-4 space-y-2">
                      {topEntities.map((entity, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entity.color }} />
                            <span className="text-sm font-medium truncate max-w-[120px]">{entity.label}</span>
                          </div>
                          <Badge variant="secondary" className="text-[10px]">{entity.type}</Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </Card>
              )}

              {graphData && importantNodes.length > 0 && (
                <Card className="border-border/50 shadow-sm">
                  <CardHeader className="py-3 border-b bg-muted/10">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Important Nodes
                    </CardTitle>
                    <CardDescription className="text-[10px]">Most connected entities in the graph</CardDescription>
                  </CardHeader>
                  <ScrollArea className="h-[200px]">
                    <div className="p-4 space-y-2">
                      {importantNodes.map((node, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/50">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: `${node.color || '#3b82f6'}20`, color: node.color || '#3b82f6' }}>
                              {idx + 1}
                            </div>
                            <span className="text-sm font-medium truncate max-w-[100px]">{node.label}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{node.connections} links</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </Card>
              )}

              <Card className="border-border/50 shadow-sm">
                <CardHeader className="py-3 border-b bg-muted/10">
                  <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Lightbulb className="w-3.5 h-3.5 text-yellow-500" />
                    Graph Insights
                  </CardTitle>
                  <CardDescription className="text-[10px]">AI-generated explanation of the knowledge graph</CardDescription>
                </CardHeader>
                <CardContent className="p-4">
                  {!insights ? (
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={handleGenerateInsights}
                      disabled={!selectedDocId || !graphData?.nodes.length || isGeneratingInsights}
                      data-testid="button-generate-insights"
                    >
                      {isGeneratingInsights ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                      Generate Insights
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Summary</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">{insights.summary}</p>
                      </div>
                      {insights.keyFindings && insights.keyFindings.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Key Findings</h4>
                          <ul className="space-y-1">
                            {insights.keyFindings.map((finding, idx) => (
                              <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                                <ChevronRight className="w-3 h-3 mt-0.5 text-primary shrink-0" />
                                {finding}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full text-xs" 
                        onClick={handleGenerateInsights}
                        disabled={isGeneratingInsights}
                      >
                        {isGeneratingInsights ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                        Regenerate
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
