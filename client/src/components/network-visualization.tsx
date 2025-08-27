import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";

interface NetworkData {
  nodes: Array<{
    id: string;
    label: string;
    size: number;
    color: string;
    x?: number;
    y?: number;
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
    weight: number;
  }>;
}

interface NetworkVisualizationProps {
  networkData: NetworkData;
}

export default function NetworkVisualization({ networkData }: NetworkVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || !networkData) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    // Simple network visualization using canvas
    const drawNetwork = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Calculate positions if not provided
      const nodes = networkData.nodes.map((node, index) => ({
        ...node,
        x: node.x || (Math.cos((index * 2 * Math.PI) / networkData.nodes.length) * 150 + canvas.width / 2),
        y: node.y || (Math.sin((index * 2 * Math.PI) / networkData.nodes.length) * 150 + canvas.height / 2),
      }));

      // Draw edges
      ctx.strokeStyle = "hsl(210, 40%, 80%)";
      ctx.lineWidth = 1;
      
      networkData.edges.forEach(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        
        if (sourceNode && targetNode) {
          ctx.beginPath();
          ctx.moveTo(sourceNode.x!, sourceNode.y!);
          ctx.lineTo(targetNode.x!, targetNode.y!);
          ctx.stroke();
        }
      });

      // Draw nodes
      nodes.forEach(node => {
        // Node circle
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, node.size, 0, 2 * Math.PI);
        ctx.fill();
        
        // Node border
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Node label
        ctx.fillStyle = "hsl(222.2, 84%, 4.9%)";
        ctx.font = "12px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(node.label, node.x!, node.y! + node.size + 15);
      });
    };

    drawNetwork();

    // Handle canvas resize
    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      drawNetwork();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [networkData]);

  if (!networkData || networkData.nodes.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          <p>No network data available to visualize</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid lg:grid-cols-4 gap-6">
      {/* Network Controls */}
      <div className="lg:col-span-1 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Layout Algorithm</label>
          <select className="w-full p-2 border border-input rounded-md bg-background focus:ring-2 focus:ring-ring">
            <option>Force-directed</option>
            <option>Circular</option>
            <option>Random</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Node Size: 5</label>
          <input type="range" min="1" max="10" defaultValue="5" className="w-full" />
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Edge Thickness: 2</label>
          <input type="range" min="1" max="5" defaultValue="2" className="w-full" />
        </div>
        
        <div className="space-y-2">
          <label className="flex items-center space-x-2">
            <input type="checkbox" defaultChecked className="rounded border-border text-primary" />
            <span className="text-sm">Show labels</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="rounded border-border text-primary" />
            <span className="text-sm">Show communities</span>
          </label>
          <label className="flex items-center space-x-2">
            <input type="checkbox" defaultChecked className="rounded border-border text-primary" />
            <span className="text-sm">Animate layout</span>
          </label>
        </div>

        {/* Network Stats */}
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-medium mb-2">Network Stats</h4>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nodes:</span>
              <span>{networkData.nodes.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Edges:</span>
              <span>{networkData.edges.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Density:</span>
              <span>{((networkData.edges.length * 2) / (networkData.nodes.length * (networkData.nodes.length - 1))).toFixed(3)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Network Canvas */}
      <div className="lg:col-span-3" ref={containerRef}>
        <canvas
          ref={canvasRef}
          className="w-full h-96 border border-border rounded-lg bg-background cursor-move"
          data-testid="network-canvas"
        />
      </div>
    </div>
  );
}
