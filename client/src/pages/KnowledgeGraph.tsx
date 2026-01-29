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
        <header className="h-16 border-b flex items-center px-8 bg-card/50 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-4 w-full">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Network className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold font-display tracking-tight">Knowledge Intelligence</h1>
            <div className="ml-auto flex items-center gap-3">
              <Select value={selectedDocId} onValueChange={(v) => { setSelectedDocId(v); setAnswer(null); setInsights(null); }}>
                <SelectTrigger className="w-[280px] bg-background/50 border-border/50" data-testid="select-document">
                  <SelectValue placeholder="Select a knowledge source..." />
                </SelectTrigger>
                <SelectContent>
                  {documents?.map(doc => (
                    <SelectItem key={doc.id} value={doc.id.toString()} data-testid={`doc-option-${doc.id}`}>
                      {doc.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleGenerateInsights}
                disabled={!selectedDocId || !graphData?.nodes.length || isGeneratingInsights}
                className="hover-elevate"
              >
                {isGeneratingInsights ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Analyze Graph
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-muted/5 p-4 lg:p-8">
          <div className="max-w-[1600px] mx-auto space-y-8">
            {graphData && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { label: "Entities", value: graphData.nodes.length, icon: Circle, color: "text-primary" },
                  { label: "Relationships", value: graphData.edges.length, icon: ArrowRight, color: "text-accent-foreground" },
                  { label: "Key Concepts", value: topEntities.length, icon: Lightbulb, color: "text-yellow-500" },
                  { label: "Connectivity", value: `${(graphData.edges.length / (graphData.nodes.length || 1)).toFixed(1)}x`, icon: TrendingUp, color: "text-green-500" }
                ].map((stat, i) => (
                  <Card key={i} className="border-border/50 shadow-sm hover-elevate bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className={`p-2 rounded-lg bg-muted/50 ${stat.color}`}>
                        <stat.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">{stat.label}</p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <div className="grid lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-8 space-y-8">
                <Card className="border-border/50 shadow-md overflow-hidden bg-card/50 backdrop-blur-sm min-h-[600px] flex flex-col">
                  <CardHeader className="py-4 px-6 border-b flex flex-row items-center justify-between bg-muted/5">
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Network className="w-4 h-4 text-primary" />
                        Graph Visualization
                      </CardTitle>
                      <CardDescription className="text-xs">Interactive neural map of extracted entities and relations</CardDescription>
                    </div>
                    {graphData && (
                      <Badge variant="outline" className="bg-background/50 font-mono text-[10px]">
                        V-L: {graphData.nodes.length} | E-L: {graphData.edges.length}
                      </Badge>
                    )}
                  </CardHeader>
                  <CardContent className="p-0 flex-1 relative min-h-[500px]">
                    {selectedDocId ? (
                      isGraphLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-sm z-10">
                          <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-10 h-10 text-primary animate-spin" />
                            <p className="text-sm font-medium animate-pulse">Mapping relationships...</p>
                          </div>
                        </div>
                      ) : graphData?.nodes.length ? (
                        <div className="w-full h-full min-h-[500px]">
                          <GraphViz data={vizData} />
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                          <div className="text-center max-w-xs space-y-4">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                              <Network className="w-8 h-8 opacity-20" />
                            </div>
                            <p className="text-sm font-medium">No knowledge graph data found for this document.</p>
                            <Button variant="outline" size="sm">Process Document</Button>
                          </div>
                        </div>
                      )
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                        <div className="text-center max-w-xs space-y-4">
                          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto animate-bounce duration-[3s]">
                            <Network className="w-8 h-8 opacity-20" />
                          </div>
                          <p className="text-sm font-medium">Select a knowledge source from the dropdown to begin analysis.</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-border/50 shadow-md bg-card/50 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="py-4 px-6 border-b bg-muted/5">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      Knowledge Inquiry
                    </CardTitle>
                    <CardDescription className="text-xs">Natural language interface for graph-based reasoning</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="relative group">
                      <Textarea
                        placeholder="e.g., 'What are the primary influences between these entities?' or 'Explain the reasoning for...'"
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        className="resize-none min-h-[120px] bg-muted/20 border-border/50 focus:border-primary/50 transition-all text-sm p-4 rounded-xl"
                        disabled={!selectedDocId || !graphData?.nodes.length}
                        data-testid="input-kg-question"
                      />
                      <Button 
                        className="absolute bottom-4 right-4 shadow-lg hover-elevate active-elevate-2" 
                        size="sm"
                        onClick={handleAskQuestion} 
                        disabled={!question.trim() || !selectedDocId || isAsking || !graphData?.nodes.length}
                        data-testid="button-ask-kg"
                      >
                        {isAsking ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                        Inquire
                      </Button>
                    </div>

                    {answer && (
                      <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-primary">
                            <div className="w-1 h-4 bg-primary rounded-full" />
                            Synthesized Answer
                          </div>
                          <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 shadow-inner">
                            <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90 font-medium">{answer.answer}</p>
                          </div>
                        </div>

                        {answer.reasoningPath && answer.reasoningPath.length > 0 && (
                          <div className="space-y-4">
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-accent-foreground">
                              <div className="w-1 h-4 bg-accent-foreground rounded-full" />
                              Graph Reasoning Path
                            </div>
                            <div className="grid gap-3 relative pl-4 border-l-2 border-dashed border-border/50 ml-2">
                              {answer.reasoningPath.map((step, idx) => (
                                <div key={idx} className="relative group animate-in slide-in-from-left-2" style={{ animationDelay: `${idx * 100}ms` }}>
                                  <div className="absolute -left-[22px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-background border-2 border-accent-foreground flex items-center justify-center z-10">
                                    <div className="w-1.5 h-1.5 rounded-full bg-accent-foreground" />
                                  </div>
                                  <div className="p-4 rounded-xl bg-card border border-border/50 shadow-sm hover:border-accent-foreground/30 transition-colors group-hover:shadow-md">
                                    <p className="text-xs text-muted-foreground leading-relaxed italic">
                                      <span className="font-bold text-accent-foreground mr-2">Step {idx + 1}:</span>
                                      {step}
                                    </p>
                                  </div>
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

              <div className="lg:col-span-4 space-y-8 h-full">
                <Card className="border-border/50 shadow-md bg-card/50 backdrop-blur-sm overflow-hidden flex flex-col max-h-[500px]">
                  <CardHeader className="py-4 px-6 border-b bg-muted/5 sticky top-0 z-10 backdrop-blur-md">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      Priority Entities
                    </CardTitle>
                    <CardDescription className="text-[10px]">High-centrality nodes in the semantic network</CardDescription>
                  </CardHeader>
                  <ScrollArea className="flex-1">
                    <div className="p-6 space-y-3">
                      {importantNodes.length > 0 ? (
                        importantNodes.map((node, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-muted/10 border border-border/50 hover:bg-muted/20 transition-all hover:scale-[1.02] cursor-default group">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shadow-sm" style={{ backgroundColor: `${node.color || '#3b82f6'}15`, color: node.color || '#3b82f6', border: `1px solid ${node.color || '#3b82f6'}30` }}>
                                {node.connections}
                              </div>
                              <div className="space-y-0.5">
                                <p className="text-sm font-bold truncate max-w-[140px]">{node.label}</p>
                                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">{node.type}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-[9px] h-5 bg-background/50 border-border/30 group-hover:border-primary/30 opacity-0 group-hover:opacity-100 transition-opacity">Central</Badge>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center space-y-2 opacity-50">
                          <Brain className="w-8 h-8 mx-auto" />
                          <p className="text-[10px] font-medium uppercase tracking-widest">Awaiting Analysis</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </Card>

                <Card className="border-border/50 shadow-md bg-card/50 backdrop-blur-sm overflow-hidden flex flex-col">
                  <CardHeader className="py-4 px-6 border-b bg-muted/5">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                      <Brain className="w-4 h-4 text-purple-500" />
                      AI Graph Insights
                    </CardTitle>
                    <CardDescription className="text-[10px]">Automated structural & thematic explanation</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 flex-1">
                    {!insights ? (
                      <div className="py-12 text-center space-y-4">
                        <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto text-purple-500 animate-pulse">
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-bold">No insights generated</p>
                          <p className="text-[10px] text-muted-foreground max-w-[180px] mx-auto">Generate a thematic summary and structural findings for this graph.</p>
                        </div>
                        <Button 
                          className="w-full bg-gradient-to-r from-purple-500 to-primary hover-elevate shadow-lg" 
                          onClick={handleGenerateInsights}
                          disabled={!selectedDocId || !graphData?.nodes.length || isGeneratingInsights}
                          data-testid="button-generate-insights"
                        >
                          {isGeneratingInsights ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                          Analyze Structure
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6 animate-in zoom-in-95 duration-500">
                        <div className="space-y-3 p-4 rounded-xl bg-purple-500/5 border border-purple-500/10">
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-purple-500 flex items-center gap-1.5">
                            <div className="w-1 h-3 bg-purple-500 rounded-full" />
                            Summary
                          </h4>
                          <p className="text-xs text-foreground/80 leading-relaxed font-medium italic">"{insights.summary}"</p>
                        </div>
                        
                        {insights.keyFindings && insights.keyFindings.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                              <div className="w-1 h-3 bg-border rounded-full" />
                              Core Patterns
                            </h4>
                            <div className="space-y-2">
                              {insights.keyFindings.map((finding, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-2.5 rounded-lg border border-border/30 bg-muted/5 hover:border-purple-500/30 transition-colors">
                                  <div className="w-5 h-5 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center shrink-0 text-[10px] font-bold">
                                    {idx + 1}
                                  </div>
                                  <p className="text-[11px] text-muted-foreground leading-snug">{finding}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-[10px] uppercase font-bold tracking-widest hover:text-purple-500" 
                          onClick={handleGenerateInsights}
                          disabled={isGeneratingInsights}
                        >
                          {isGeneratingInsights ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <TrendingUp className="w-3 h-3 mr-1" />}
                          Update Analysis
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
