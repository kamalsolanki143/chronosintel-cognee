"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  User,
  Building2,
  MapPin,
  Calendar,
  FileText,
  Monitor,
  Clock,
} from "lucide-react";
import { fetchGraphData } from "@/services/graphService";
import { getEntityColor } from "@/utils/format";
import type { GraphNode, GraphLink } from "@/services/mockData";

const ENTITY_TYPES = [
  { key: "person", label: "People", icon: User },
  { key: "organization", label: "Organizations", icon: Building2 },
  { key: "location", label: "Locations", icon: MapPin },
  { key: "event", label: "Events", icon: Calendar },
  { key: "document", label: "Documents", icon: FileText },
  { key: "system", label: "Systems", icon: Monitor },
  { key: "timestamp", label: "Timestamps", icon: Clock },
];

const TYPE_CANVAS_COLORS: Record<string, string> = {
  person: "#60a5fa",
  organization: "#34d399",
  location: "#fbbf24",
  event: "#a78bfa",
  document: "#f472b6",
  system: "#22d3ee",
  timestamp: "#fb923c",
};

interface KnowledgeGraphProps {
  caseId?: string;
}

export default function KnowledgeGraph({ caseId }: KnowledgeGraphProps) {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hiddenTypes, setHiddenTypes] = useState<Set<string>>(new Set());
  const [zoom, setZoom] = useState(1);
  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [dragging, setDragging] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await fetchGraphData(caseId || "CASE-001");
        setNodes(data.nodes);
        setLinks(data.links);

        const pos: Record<string, { x: number; y: number }> = {};
        const centerX = 300;
        const centerY = 250;
        const radius = Math.min(centerX, centerY) - 60;

        data.nodes.forEach((node, idx) => {
          const angle = (2 * Math.PI * idx) / data.nodes.length - Math.PI / 2;
          pos[node.id] = {
            x: centerX + radius * Math.cos(angle) + (Math.random() - 0.5) * 40,
            y: centerY + radius * Math.sin(angle) + (Math.random() - 0.5) * 40,
          };
        });
        setPositions(pos);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [caseId]);

  const toggleType = (type: string) => {
    setHiddenTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  const filteredNodes = nodes.filter((n) => !hiddenTypes.has(n.type));
  const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
  const filteredLinks = links.filter(
    (l) =>
      filteredNodeIds.has(l.source as string) &&
      filteredNodeIds.has(l.target as string)
  );

  const getNodeColor = (type: string) => TYPE_CANVAS_COLORS[type] || "#64748b";

  const handleMouseDown = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDragging(nodeId);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging) return;
      setPositions((prev) => ({
        ...prev,
        [dragging]: {
          x: prev[dragging].x + e.movementX / zoom,
          y: prev[dragging].y + e.movementY / zoom,
        },
      }));
    },
    [dragging, zoom]
  );

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  const visibleLinks = filteredLinks.map((l) => ({
    ...l,
    sourcePos: positions[l.source as string],
    targetPos: positions[l.target as string],
  })).filter(
    (l) => l.sourcePos && l.targetPos
  );

  if (loading) {
    return (
      <div className="glass-card p-5 space-y-4">
        <div className="skeleton h-6 w-32" />
        <div className="skeleton h-[500px] w-full" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card overflow-hidden"
    >
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-sm font-semibold text-text">Knowledge Graph</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.2, 2.5))}
            className="p-1.5 rounded-lg hover:bg-surface-3 text-text-secondary hover:text-text transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-xs text-text-muted w-8 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.2, 0.4))}
            className="p-1.5 rounded-lg hover:bg-surface-3 text-text-secondary hover:text-text transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(1)}
            className="p-1.5 rounded-lg hover:bg-surface-3 text-text-secondary hover:text-text transition-colors ml-1"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex h-[500px]">
        <div className="flex-1 relative overflow-hidden">
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
          >
            {visibleLinks.map((link, idx) => {
              if (!link.sourcePos || !link.targetPos) return null;
              const dx = link.targetPos.x - link.sourcePos.x;
              const dy = link.targetPos.y - link.sourcePos.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              const nx = -(dy / dist) * 8;
              const ny = (dx / dist) * 8;

              return (
                <g key={`link-${idx}`}>
                  <line
                    x1={link.sourcePos.x}
                    y1={link.sourcePos.y}
                    x2={link.targetPos.x}
                    y2={link.targetPos.y}
                    stroke="#2a3344"
                    strokeWidth={1.5}
                    strokeDasharray={link.strength > 0.8 ? "none" : "4 3"}
                  />
                  <text
                    x={(link.sourcePos.x + link.targetPos.x) / 2}
                    y={(link.sourcePos.y + link.targetPos.y) / 2 - 8}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize={9}
                    fontFamily="Inter, sans-serif"
                  >
                    {link.label}
                  </text>
                </g>
              );
            })}
          </svg>

          <div
            className="absolute inset-0"
            style={{ transform: `scale(${zoom})`, transformOrigin: "center center" }}
          >
            <AnimatePresence>
              {filteredNodes.map((node) => {
                const pos = positions[node.id];
                if (!pos) return null;
                const labelWidth = node.name.length * 7 + 16;

                return (
                  <motion.div
                    key={node.id}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="absolute cursor-grab active:cursor-grabbing"
                    style={{
                      left: pos.x - 24,
                      top: pos.y - 24,
                      zIndex: selectedNode?.id === node.id ? 10 : 1,
                    }}
                    onMouseDown={(e) => handleMouseDown(node.id, e)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNode(node);
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-200"
                      style={{
                        backgroundColor: `${getNodeColor(node.type)}20`,
                        borderColor:
                          selectedNode?.id === node.id
                            ? getNodeColor(node.type)
                            : `${getNodeColor(node.type)}60`,
                        boxShadow:
                          selectedNode?.id === node.id
                            ? `0 0 20px ${getNodeColor(node.type)}40`
                            : "none",
                      }}
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getNodeColor(node.type) }}
                      />
                    </div>
                    <div
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-0.5 rounded-md bg-surface-2/90 backdrop-blur-sm border border-border whitespace-nowrap text-xs text-text-secondary font-medium text-center pointer-events-none"
                      style={{ minWidth: labelWidth }}
                    >
                      {node.name}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {filteredNodes.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <Building2 className="w-10 h-10 text-text-muted mb-2" />
              <p className="text-sm text-text-secondary">No entities to display</p>
              <p className="text-xs text-text-muted mt-1">
                All entity types are hidden
              </p>
            </div>
          )}
        </div>

        <div className="w-64 border-l border-border p-4 space-y-4 overflow-y-auto">
          <div>
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Entity Types
            </h3>
            <div className="space-y-1.5">
              {ENTITY_TYPES.map((type) => (
                <label
                  key={type.key}
                  className="flex items-center gap-2 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={!hiddenTypes.has(type.key)}
                    onChange={() => toggleType(type.key)}
                    className="w-3.5 h-3.5 rounded border-border-light bg-surface-3 accent-primary"
                  />
                  <type.icon className="w-3.5 h-3.5 text-text-muted" />
                  <span className="text-xs text-text-secondary group-hover:text-text transition-colors">
                    {type.label}
                  </span>
                  <div
                    className="w-2 h-2 rounded-full ml-auto"
                    style={{ backgroundColor: TYPE_CANVAS_COLORS[type.key] }}
                  />
                </label>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {selectedNode ? (
              <motion.div
                key={selectedNode.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Details
                  </h3>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="p-1 rounded hover:bg-surface-3 text-text-muted hover:text-text transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div>
                  <p className="text-sm font-semibold text-text">{selectedNode.name}</p>
                  <span
                    className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded ${getEntityColor(selectedNode.type)}`}
                  >
                    {selectedNode.type}
                  </span>
                </div>
                <div className="space-y-1">
                  {Object.entries(selectedNode.properties).map(([key, val]) => (
                    <div key={key} className="flex justify-between text-xs">
                      <span className="text-text-muted capitalize">{key}</span>
                      <span className="text-text-secondary">{val}</span>
                    </div>
                  ))}
                </div>
                <div className="text-xs text-text-muted">
                  <p>Mentions: {selectedNode.mentions}</p>
                  <p>Connections: {selectedNode.connections?.length || 0}</p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-6"
              >
                <User className="w-8 h-8 text-text-muted mx-auto mb-2" />
                <p className="text-xs text-text-muted">
                  Click a node to see its details
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
