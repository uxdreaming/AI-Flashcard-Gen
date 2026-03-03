"use client";

import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import type { Flashcard } from "@/types/flashcard";
import { getCategoryColor } from "@/lib/categoryColors";

interface ConceptMapProps {
  flashcards: Flashcard[];
  categories: string[];
  onSelectCard: (index: number) => void;
}

interface Node {
  id: string;
  label: string;
  type: "category" | "card";
  category: string;
  cardIndex?: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface Edge {
  source: string;
  target: string;
}

function extractTerms(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-záéíóúñüa-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3);
  return new Set(words);
}

function findSharedTerms(a: Flashcard, b: Flashcard): number {
  const termsA = extractTerms(a.question + " " + a.answer);
  const termsB = extractTerms(b.question + " " + b.answer);
  let shared = 0;
  termsA.forEach((t) => {
    if (termsB.has(t)) shared++;
  });
  return shared;
}

export default function ConceptMap({
  flashcards,
  categories,
  onSelectCard,
}: ConceptMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>(0);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [dragNode, setDragNode] = useState<string | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const nodesRef = useRef<Node[]>([]);
  const [, forceRender] = useState(0);

  // Build graph data
  const { initialNodes, edges } = useMemo(() => {
    const cx = dimensions.width / 2;
    const cy = dimensions.height / 2;
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Category nodes in a circle
    categories.forEach((cat, i) => {
      const angle = (2 * Math.PI * i) / categories.length - Math.PI / 2;
      const r = Math.min(dimensions.width, dimensions.height) * 0.3;
      nodes.push({
        id: `cat-${cat}`,
        label: cat,
        type: "category",
        category: cat,
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
        vx: 0,
        vy: 0,
        radius: 28,
      });
    });

    // Card nodes around their category
    flashcards.forEach((card, idx) => {
      const catNode = nodes.find((n) => n.id === `cat-${card.category}`);
      const jitter = () => (Math.random() - 0.5) * 80;
      nodes.push({
        id: `card-${card.id}`,
        label: card.question.slice(0, 30),
        type: "card",
        category: card.category,
        cardIndex: idx,
        x: (catNode?.x || cx) + jitter(),
        y: (catNode?.y || cy) + jitter(),
        vx: 0,
        vy: 0,
        radius: 6,
      });

      // Edge from card to its category
      edges.push({ source: `card-${card.id}`, target: `cat-${card.category}` });
    });

    // Edges between cards sharing concepts (threshold: 3+ shared terms)
    for (let i = 0; i < flashcards.length; i++) {
      for (let j = i + 1; j < flashcards.length; j++) {
        if (flashcards[i].category === flashcards[j].category) continue;
        const shared = findSharedTerms(flashcards[i], flashcards[j]);
        if (shared >= 3) {
          edges.push({
            source: `card-${flashcards[i].id}`,
            target: `card-${flashcards[j].id}`,
          });
        }
      }
    }

    return { initialNodes: nodes, edges };
  }, [flashcards, categories, dimensions]);

  // Init nodes ref
  useEffect(() => {
    nodesRef.current = initialNodes.map((n) => ({ ...n }));
    forceRender((c) => c + 1);
  }, [initialNodes]);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        setDimensions({ width, height });
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Force simulation
  useEffect(() => {
    const nodes = nodesRef.current;
    if (nodes.length === 0) return;

    const edgeMap = new Map<string, string[]>();
    edges.forEach(({ source, target }) => {
      if (!edgeMap.has(source)) edgeMap.set(source, []);
      if (!edgeMap.has(target)) edgeMap.set(target, []);
      edgeMap.get(source)!.push(target);
      edgeMap.get(target)!.push(source);
    });

    let iteration = 0;
    const maxIterations = 200;

    const tick = () => {
      if (iteration >= maxIterations) return;
      iteration++;

      const alpha = 1 - iteration / maxIterations;
      const repulsion = 800 * alpha;
      const attraction = 0.005 * alpha;
      const damping = 0.85;
      const cx = dimensions.width / 2;
      const cy = dimensions.height / 2;

      // Repulsion between all nodes
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const force = repulsion / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          nodes[i].vx += fx;
          nodes[i].vy += fy;
          nodes[j].vx -= fx;
          nodes[j].vy -= fy;
        }
      }

      // Attraction along edges
      edges.forEach(({ source, target }) => {
        const a = nodes.find((n) => n.id === source);
        const b = nodes.find((n) => n.id === target);
        if (!a || !b) return;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const idealDist = a.type === "category" || b.type === "category" ? 80 : 120;
        const force = (dist - idealDist) * attraction;
        a.vx += (dx / dist) * force;
        a.vy += (dy / dist) * force;
        b.vx -= (dx / dist) * force;
        b.vy -= (dy / dist) * force;
      });

      // Center gravity
      nodes.forEach((n) => {
        n.vx += (cx - n.x) * 0.001 * alpha;
        n.vy += (cy - n.y) * 0.001 * alpha;
      });

      // Apply velocities
      nodes.forEach((n) => {
        if (n.id === dragNode) return;
        n.vx *= damping;
        n.vy *= damping;
        n.x += n.vx;
        n.y += n.vy;
        // Bound within canvas
        n.x = Math.max(n.radius, Math.min(dimensions.width - n.radius, n.x));
        n.y = Math.max(n.radius, Math.min(dimensions.height - n.radius, n.y));
      });

      forceRender((c) => c + 1);
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [edges, dimensions, dragNode]);

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    setDragNode(nodeId);
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragNode || !svgRef.current) return;
      const rect = svgRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - offset.x) / zoom;
      const y = (e.clientY - rect.top - offset.y) / zoom;
      const node = nodesRef.current.find((n) => n.id === dragNode);
      if (node) {
        node.x = x;
        node.y = y;
        node.vx = 0;
        node.vy = 0;
        forceRender((c) => c + 1);
      }
    },
    [dragNode, offset, zoom]
  );

  const handleMouseUp = useCallback(() => {
    setDragNode(null);
  }, []);

  // Zoom handler
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.max(0.3, Math.min(3, z - e.deltaY * 0.001)));
  }, []);

  const nodes = nodesRef.current;

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800">
      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="h-full w-full"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <g transform={`translate(${offset.x},${offset.y}) scale(${zoom})`}>
          {/* Edges */}
          {edges.map((edge, i) => {
            const a = nodes.find((n) => n.id === edge.source);
            const b = nodes.find((n) => n.id === edge.target);
            if (!a || !b) return null;
            const isCrossCategory = a.type === "card" && b.type === "card";
            return (
              <line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke={isCrossCategory ? "#94a3b8" : "#e2e8f0"}
                strokeWidth={isCrossCategory ? 1 : 0.5}
                strokeDasharray={isCrossCategory ? "4 4" : undefined}
                opacity={0.5}
              />
            );
          })}

          {/* Nodes */}
          {nodes.map((node) => {
            const cc = getCategoryColor(node.category, categories);
            const isHovered = hoveredNode === node.id;

            if (node.type === "category") {
              return (
                <g key={node.id}>
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={node.radius + (isHovered ? 4 : 0)}
                    fill={cc.accentMuted}
                    stroke={cc.accent}
                    strokeWidth={2}
                    className="cursor-grab"
                    onMouseDown={(e) => handleMouseDown(e, node.id)}
                    onMouseEnter={() => setHoveredNode(node.id)}
                    onMouseLeave={() => setHoveredNode(null)}
                  />
                  <text
                    x={node.x}
                    y={node.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="pointer-events-none select-none"
                    fill={cc.accentText}
                    fontSize={10}
                    fontWeight={600}
                  >
                    {node.label.length > 12 ? node.label.slice(0, 12) + "..." : node.label}
                  </text>
                </g>
              );
            }

            return (
              <g key={node.id}>
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={node.radius + (isHovered ? 3 : 0)}
                  fill={isHovered ? cc.accent : cc.accentMuted}
                  stroke={cc.accent}
                  strokeWidth={1}
                  className="cursor-pointer"
                  onMouseDown={(e) => handleMouseDown(e, node.id)}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => {
                    if (node.cardIndex !== undefined) onSelectCard(node.cardIndex);
                  }}
                />
                {/* Tooltip on hover */}
                {isHovered && (
                  <foreignObject
                    x={node.x + 10}
                    y={node.y - 40}
                    width={200}
                    height={80}
                    className="pointer-events-none"
                  >
                    <div className="rounded-lg border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                      <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
                        {node.label}
                      </p>
                      <p className="mt-0.5 text-[10px] text-zinc-400">{node.category}</p>
                    </div>
                  </foreignObject>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Zoom indicator */}
      <div className="absolute bottom-3 right-3 rounded-lg bg-white/80 px-2 py-1 text-[10px] text-zinc-500 backdrop-blur dark:bg-zinc-800/80 dark:text-zinc-400">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}
