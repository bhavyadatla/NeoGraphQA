import { useEffect, useRef, useState } from "react";
import ForceGraph2D, { type ForceGraphMethods } from "react-force-graph-2d";
import { ZoomIn, ZoomOut, Maximize } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GraphData {
  nodes: Array<{ id: number; label: string; type: string; color: string }>;
  edges: Array<{ source: number; target: number; relation: string }>;
}

export function GraphViz({ data }: { data: GraphData }) {
  const fgRef = useRef<ForceGraphMethods>();
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const updateDimensions = () => {
        if (containerRef.current) {
          setContainerDimensions({
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight || 500,
          });
        }
      };

      const resizeObserver = new ResizeObserver(updateDimensions);
      resizeObserver.observe(containerRef.current);
      updateDimensions();
      return () => resizeObserver.disconnect();
    }
  }, []);

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-2xl overflow-hidden bg-card border border-border shadow-inner" ref={containerRef}>
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
          backgroundColor="rgba(0,0,0,0)"
          nodeLabel="label"
          nodeColor={(node: any) => node.color || "#3b82f6"}
          nodeRelSize={6}
          linkColor={() => "rgba(156, 163, 175, 0.5)"}
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
