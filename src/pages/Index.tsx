import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Play, Square, RotateCcw } from 'lucide-react';

interface Node {
  id: number;
  x: number;
  y: number;
  label: string;
}

interface Edge {
  from: number;
  to: number;
  weight: number;
}

interface PathStep {
  currentNode: number;
  visitedNodes: Set<number>;
  distances: { [key: number]: number };
  path: number[];
}

const Index = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [startNode, setStartNode] = useState<number | null>(null);
  const [endNode, setEndNode] = useState<number | null>(null);
  const [edgeWeight, setEdgeWeight] = useState<number>(1);
  const [algorithm, setAlgorithm] = useState<'dijkstra' | 'bfs'>('dijkstra');
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);
  const [pathSteps, setPathSteps] = useState<PathStep[]>([]);
  const [finalPath, setFinalPath] = useState<number[]>([]);
  const [mode, setMode] = useState<'add-node' | 'add-edge' | 'select-start' | 'select-end'>('add-node');
  const [isDirected, setIsDirected] = useState<boolean>(false);

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 600;
  const NODE_RADIUS = 25;

  // Function to draw arrow head
  const drawArrowHead = (ctx: CanvasRenderingContext2D, fromX: number, fromY: number, toX: number, toY: number) => {
    const headlen = 15; // length of head in pixels
    const angle = Math.atan2(toY - fromY, toX - fromX);
    
    // Calculate the point where the arrow should start (on the edge of the target node)
    const distance = Math.sqrt((toX - fromX) ** 2 + (toY - fromY) ** 2);
    const ratio = (distance - NODE_RADIUS) / distance;
    const arrowToX = fromX + (toX - fromX) * ratio;
    const arrowToY = fromY + (toY - fromY) * ratio;
    
    ctx.beginPath();
    ctx.moveTo(arrowToX, arrowToY);
    ctx.lineTo(arrowToX - headlen * Math.cos(angle - Math.PI / 6), arrowToY - headlen * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(arrowToX, arrowToY);
    ctx.lineTo(arrowToX - headlen * Math.cos(angle + Math.PI / 6), arrowToY - headlen * Math.sin(angle + Math.PI / 6));
    ctx.stroke();
  };

  // Canvas drawing functions
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= CANVAS_WIDTH; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let i = 0; i <= CANVAS_HEIGHT; i += 40) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(CANVAS_WIDTH, i);
      ctx.stroke();
    }

    // Draw edges
    edges.forEach(edge => {
      const fromNode = nodes.find(n => n.id === edge.from);
      const toNode = nodes.find(n => n.id === edge.to);
      if (!fromNode || !toNode) return;

      const isPathEdge = finalPath.includes(edge.from) && finalPath.includes(edge.to) && 
                        Math.abs(finalPath.indexOf(edge.from) - finalPath.indexOf(edge.to)) === 1;
      
      ctx.strokeStyle = isPathEdge ? '#10b981' : '#6b7280';
      ctx.lineWidth = isPathEdge ? 4 : 2;
      
      ctx.beginPath();
      ctx.moveTo(fromNode.x, fromNode.y);
      ctx.lineTo(toNode.x, toNode.y);
      ctx.stroke();

      // Draw arrow head for directed edges
      if (isDirected) {
        drawArrowHead(ctx, fromNode.x, fromNode.y, toNode.x, toNode.y);
      }

      // Draw weight
      if (algorithm === 'dijkstra') {
        const midX = (fromNode.x + toNode.x) / 2;
        const midY = (fromNode.y + toNode.y) / 2;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(midX - 15, midY - 10, 30, 20);
        ctx.strokeStyle = '#6b7280';
        ctx.strokeRect(midX - 15, midY - 10, 30, 20);
        ctx.fillStyle = '#374151';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(edge.weight.toString(), midX, midY + 4);
      }
    });

    // Draw nodes
    nodes.forEach(node => {
      let fillColor = '#ffffff';
      let strokeColor = '#6b7280';
      let strokeWidth = 2;

      if (node.id === startNode) {
        fillColor = '#10b981';
        strokeColor = '#047857';
      } else if (node.id === endNode) {
        fillColor = '#ef4444';
        strokeColor = '#dc2626';
      } else if (isAnimating && pathSteps[animationStep]?.visitedNodes.has(node.id)) {
        fillColor = '#fbbf24';
        strokeColor = '#f59e0b';
      } else if (finalPath.includes(node.id)) {
        fillColor = '#10b981';
        strokeColor = '#047857';
      } else if (selectedNode === node.id) {
        fillColor = '#3b82f6';
        strokeColor = '#1d4ed8';
      }

      ctx.fillStyle = fillColor;
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      
      ctx.beginPath();
      ctx.arc(node.x, node.y, NODE_RADIUS, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // Draw node label
      ctx.fillStyle = node.id === startNode || node.id === endNode || finalPath.includes(node.id) ? '#ffffff' : '#374151';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(node.label, node.x, node.y + 5);

      // Show distance during animation
      if (isAnimating && pathSteps[animationStep]?.distances[node.id] !== undefined) {
        const distance = pathSteps[animationStep].distances[node.id];
        if (distance !== Infinity) {
          ctx.fillStyle = '#374151';
          ctx.font = '10px Arial';
          ctx.fillText(`d:${distance}`, node.x, node.y - NODE_RADIUS - 5);
        }
      }
    });
  }, [nodes, edges, selectedNode, startNode, endNode, algorithm, isAnimating, animationStep, pathSteps, finalPath, isDirected]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Handle canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isAnimating) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicked on existing node
    const clickedNode = nodes.find(node => {
      const distance = Math.sqrt((x - node.x) ** 2 + (y - node.y) ** 2);
      return distance <= NODE_RADIUS;
    });

    if (mode === 'add-node') {
      if (!clickedNode) {
        // Add new node
        const newNode: Node = {
          id: nodes.length,
          x,
          y,
          label: String.fromCharCode(65 + nodes.length)
        };
        setNodes([...nodes, newNode]);
      }
    } else if (mode === 'add-edge') {
      if (clickedNode) {
        if (selectedNode === null) {
          setSelectedNode(clickedNode.id);
        } else if (selectedNode !== clickedNode.id) {
          // Create edge
          const newEdge: Edge = {
            from: selectedNode,
            to: clickedNode.id,
            weight: edgeWeight
          };
          setEdges([...edges, newEdge]);
          setSelectedNode(null);
        }
      }
    } else if (mode === 'select-start') {
      if (clickedNode) {
        setStartNode(clickedNode.id);
        setMode('add-node');
      }
    } else if (mode === 'select-end') {
      if (clickedNode) {
        setEndNode(clickedNode.id);
        setMode('add-node');
      }
    }
  };

  // Modified Dijkstra's algorithm to handle directed/undirected graphs
  const dijkstra = (start: number, end: number): PathStep[] => {
    const distances: { [key: number]: number } = {};
    const previous: { [key: number]: number | null } = {};
    const visited = new Set<number>();
    const steps: PathStep[] = [];

    // Initialize distances
    nodes.forEach(node => {
      distances[node.id] = node.id === start ? 0 : Infinity;
      previous[node.id] = null;
    });

    while (visited.size < nodes.length) {
      // Find unvisited node with minimum distance
      let currentNode = -1;
      let minDistance = Infinity;
      
      for (const node of nodes) {
        if (!visited.has(node.id) && distances[node.id] < minDistance) {
          minDistance = distances[node.id];
          currentNode = node.id;
        }
      }

      if (currentNode === -1 || distances[currentNode] === Infinity) break;

      visited.add(currentNode);

      // Record step
      steps.push({
        currentNode,
        visitedNodes: new Set(visited),
        distances: { ...distances },
        path: []
      });

      if (currentNode === end) break;

      // Update distances to neighbors based on graph direction
      const neighbors = isDirected 
        ? edges.filter(edge => edge.from === currentNode)
        : edges.filter(edge => edge.from === currentNode || edge.to === currentNode);
      
      for (const edge of neighbors) {
        const neighbor = isDirected 
          ? edge.to 
          : (edge.from === currentNode ? edge.to : edge.from);
        
        if (!visited.has(neighbor)) {
          const newDistance = distances[currentNode] + edge.weight;
          if (newDistance < distances[neighbor]) {
            distances[neighbor] = newDistance;
            previous[neighbor] = currentNode;
          }
        }
      }
    }

    return steps;
  };

  // Modified BFS algorithm to handle directed/undirected graphs
  const bfs = (start: number, end: number): PathStep[] => {
    const visited = new Set<number>();
    const queue: number[] = [start];
    const previous: { [key: number]: number | null } = {};
    const distances: { [key: number]: number } = {};
    const steps: PathStep[] = [];

    // Initialize
    nodes.forEach(node => {
      distances[node.id] = node.id === start ? 0 : Infinity;
      previous[node.id] = null;
    });

    visited.add(start);

    while (queue.length > 0) {
      const currentNode = queue.shift()!;

      steps.push({
        currentNode,
        visitedNodes: new Set(visited),
        distances: { ...distances },
        path: []
      });

      if (currentNode === end) break;

      // Find neighbors based on graph direction
      const neighborIds = isDirected
        ? edges.filter(edge => edge.from === currentNode).map(edge => edge.to)
        : edges
            .filter(edge => edge.from === currentNode || edge.to === currentNode)
            .map(edge => edge.from === currentNode ? edge.to : edge.from);

      for (const neighbor of neighborIds) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
          previous[neighbor] = currentNode;
          distances[neighbor] = distances[currentNode] + 1;
        }
      }
    }

    return steps;
  };

  // Run algorithm
  const runAlgorithm = () => {
    if (startNode === null || endNode === null) {
      alert('Please select start and end nodes');
      return;
    }

    const steps = algorithm === 'dijkstra' ? dijkstra(startNode, endNode) : bfs(startNode, endNode);
    setPathSteps(steps);
    setAnimationStep(0);
    setIsAnimating(true);
    setFinalPath([]);

    // Reconstruct final path
    const distances: { [key: number]: number } = {};
    const previous: { [key: number]: number | null } = {};
    
    if (algorithm === 'dijkstra') {
      // Re-run dijkstra to get final path
      nodes.forEach(node => {
        distances[node.id] = node.id === startNode ? 0 : Infinity;
        previous[node.id] = null;
      });

      const visited = new Set<number>();
      
      while (visited.size < nodes.length) {
        let currentNode = -1;
        let minDistance = Infinity;
        
        for (const node of nodes) {
          if (!visited.has(node.id) && distances[node.id] < minDistance) {
            minDistance = distances[node.id];
            currentNode = node.id;
          }
        }

        if (currentNode === -1 || distances[currentNode] === Infinity) break;
        visited.add(currentNode);

        const neighbors = isDirected 
          ? edges.filter(edge => edge.from === currentNode)
          : edges.filter(edge => edge.from === currentNode || edge.to === currentNode);
        
        for (const edge of neighbors) {
          const neighbor = isDirected 
            ? edge.to 
            : (edge.from === currentNode ? edge.to : edge.from);
          
          if (!visited.has(neighbor)) {
            const newDistance = distances[currentNode] + edge.weight;
            if (newDistance < distances[neighbor]) {
              distances[neighbor] = newDistance;
              previous[neighbor] = currentNode;
            }
          }
        }
      }
    } else {
      // BFS path reconstruction
      const visited = new Set<number>();
      const queue: number[] = [startNode];
      
      nodes.forEach(node => {
        distances[node.id] = node.id === startNode ? 0 : Infinity;
        previous[node.id] = null;
      });

      visited.add(startNode);

      while (queue.length > 0) {
        const currentNode = queue.shift()!;
        
        const neighborIds = isDirected
          ? edges.filter(edge => edge.from === currentNode).map(edge => edge.to)
          : edges
              .filter(edge => edge.from === currentNode || edge.to === currentNode)
              .map(edge => edge.from === currentNode ? edge.to : edge.from);

        for (const neighbor of neighborIds) {
          if (!visited.has(neighbor)) {
            visited.add(neighbor);
            queue.push(neighbor);
            previous[neighbor] = currentNode;
            distances[neighbor] = distances[currentNode] + 1;
          }
        }
      }
    }

    // Build final path
    const path: number[] = [];
    let current: number | null = endNode;
    while (current !== null) {
      path.unshift(current);
      current = previous[current];
    }
    
    setTimeout(() => {
      setFinalPath(path);
      setIsAnimating(false);
    }, steps.length * 500 + 1000);
  };

  // Animation effect
  useEffect(() => {
    if (isAnimating && animationStep < pathSteps.length - 1) {
      const timer = setTimeout(() => {
        setAnimationStep(animationStep + 1);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isAnimating, animationStep, pathSteps.length]);

  const clearGraph = () => {
    setNodes([]);
    setEdges([]);
    setSelectedNode(null);
    setStartNode(null);
    setEndNode(null);
    setFinalPath([]);
    setPathSteps([]);
    setIsAnimating(false);
    setAnimationStep(0);
  };

  const stopAnimation = () => {
    setIsAnimating(false);
    setFinalPath([]);
    setPathSteps([]);
    setAnimationStep(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Visualization of Shortest Path Finder using Graph Algorithms</h1>
          <p className="text-gray-600">Akash Kumar Singh <br /> PES1PG24CA010</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Canvas */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Graph Visualization
                  <Badge variant={algorithm === 'dijkstra' ? 'default' : 'secondary'}>
                    {algorithm === 'dijkstra' ? 'Weighted (Dijkstra)' : 'Unweighted (BFS)'}
                  </Badge>
                  <Badge variant={isDirected ? 'default' : 'outline'}>
                    {isDirected ? 'Directed' : 'Undirected'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <canvas
                  ref={canvasRef}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  onClick={handleCanvasClick}
                  className="border border-gray-300 rounded-lg cursor-crosshair bg-white"
                />
                
                {/* Legend */}
                <div className="mt-4 flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <span>&copy; PES University 2024–26 2<sup>nd</sup> Sem</span>
                  </div>


                </div>
              </CardContent>
            </Card>
          </div>



          {/* Controls */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Algorithm & Graph Type</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Choose Algorithm</Label>
                  <Select value={algorithm} onValueChange={(value: 'dijkstra' | 'bfs') => setAlgorithm(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dijkstra">Dijkstra (Weighted)</SelectItem>
                      <SelectItem value="bfs">BFS (Unweighted)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="directed-mode"
                    checked={isDirected}
                    onCheckedChange={setIsDirected}
                  />
                  <Label htmlFor="directed-mode">Directed Graph</Label>
                </div>

                {algorithm === 'dijkstra' && (
                  <div>
                    <Label>Edge Weight</Label>
                    <Input
                      type="number"
                      value={edgeWeight}
                      onChange={(e) => setEdgeWeight(parseInt(e.target.value) || 1)}
                      min="1"
                      max="99"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={mode === 'add-node' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMode('add-node')}
                  >
                    Add Node
                  </Button>
                  <Button
                    variant={mode === 'add-edge' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMode('add-edge')}
                  >
                    Add Edge
                  </Button>
                  <Button
                    variant={mode === 'select-start' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMode('select-start')}
                  >
                    Set Start
                  </Button>
                  <Button
                    variant={mode === 'select-end' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMode('select-end')}
                  >
                    Set End
                  </Button>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={runAlgorithm}
                    disabled={isAnimating || startNode === null || endNode === null}
                    className="w-full"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Find Path
                  </Button>
                  
                  {isAnimating && (
                    <Button onClick={stopAnimation} variant="outline" className="w-full">
                      <Square className="w-4 h-4 mr-2" />
                      Stop
                    </Button>
                  )}
                  
                  <Button onClick={clearGraph} variant="destructive" className="w-full">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Graph Stats</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                <p>Nodes: {nodes.length}</p>
                <p>Edges: {edges.length}</p>
                <p>Type: {isDirected ? 'Directed' : 'Undirected'}</p>
                {finalPath.length > 0 && (
                  <>
                    <p>Path Length: {finalPath.length - 1} edges</p>
                    {algorithm === 'dijkstra' && (
                      <p>Total Weight: {finalPath.slice(0, -1).reduce((sum, nodeId, index) => {
                        const edge = edges.find(e => 
                          isDirected 
                            ? (e.from === nodeId && e.to === finalPath[index + 1])
                            : ((e.from === nodeId && e.to === finalPath[index + 1]) ||
                               (e.to === nodeId && e.from === finalPath[index + 1]))
                        );
                        return sum + (edge?.weight || 0);
                      }, 0)}</p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
