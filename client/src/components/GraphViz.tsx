import { useEffect, useRef, useState } from "react";
import ForceGraph2D, { type ForceGraphMethods } from "react-force-graph-2d";
import { useTheme } from "next-themes";
import { ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GraphData {
  nodes: Array<{ id: number; label: string; type: string; color: string }>;
  edges: Array<{ source: number; target: number; relation: string }>;
}

export function GraphViz({ data }: { data: GraphData }) {
  const { theme } = useTheme();
  const fgRef = useRef<ForceGraphMethods>();
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContainerDimensions({
            width: entry.contentRect.width,
            height: entry.contentRect.height,
          });
        }
      });
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

  const isDark = theme === 'dark';

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden bg-card border border-border shadow-inner" ref={containerRef}>
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <Button variant="secondary" size="icon" onClick={() => fgRef.current?.zoom(fgRef.current.zoom() * 1.2, 400)}>
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button variant="secondary" size="icon" onClick={() => fgRef.current?.zoom(fgRef.current.zoom() / 1.2, 400)}>
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button variant="secondary" size="icon" onClick={() => fgRef.current?.zoomToFit(400)}>
          <Maximize className="w-4 h-4" />
        </Button>
      </div>

      {containerDimensions.width > 0 && (
        <ForceGraph2D
          ref={fgRef}
          width={containerDimensions.width}
          height={containerDimensions.height}
          graphData={{
            nodes: data.nodes || [],
            links: data.edges?.map(e => ({
              source: e.source,
              target: e.target,
              label: e.relation
            })) || []
          }}
          backgroundColor={isDark ? "#0f172a" : "#ffffff"}
          nodeLabel="label"
          nodeColor={(node: any) => node.color || "#3b82f6"}
          nodeRelSize={6}
          linkColor={() => isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"}
          linkDirectionalArrowLength={3.5}
          linkDirectionalArrowRelPos={1}
          linkCurvature={0.25}
          cooldownTicks={100}
          onNodeDragEnd={node => {
            node.fx = node.x;
            node.fy = node.y;
          }}
        />
      )}
    </div>
  );
}
