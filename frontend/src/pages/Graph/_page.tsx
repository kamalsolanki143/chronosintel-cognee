'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Crosshair,
  RefreshCw,
  Layers,
  ChevronLeft,
  ChevronRight,
  Users,
  Building2,
  MapPin,
  Calendar,
  FileText,
  Monitor,
  Clock,
  Link2,
} from 'lucide-react';
import { useData } from '@/hooks/useData';
import { fetchGraphData, fetchNodeDetails } from '@/services/graphService';
import { formatDate, getEntityColor } from '@/utils/format';
import type { GraphNode, GraphLink } from '@/services/mockData';

const entityTypes = [
  { key: 'person', label: 'Person', icon: Users, color: 'text-blue-400' },
  { key: 'organization', label: 'Organization', icon: Building2, color: 'text-purple-400' },
  { key: 'location', label: 'Location', icon: MapPin, color: 'text-green-400' },
  { key: 'event', label: 'Event', icon: Calendar, color: 'text-orange-400' },
  { key: 'document', label: 'Document', icon: FileText, color: 'text-yellow-400' },
  { key: 'system', label: 'System', icon: Monitor, color: 'text-cyan-400' },
  { key: 'timestamp', label: 'Timestamp', icon: Clock, color: 'text-pink-400' },
];

const entityColorMap: Record<string, string> = {
  person: '#60a5fa',
  organization: '#a78bfa',
  location: '#34d399',
  event: '#fb923c',
  document: '#facc15',
  system: '#22d3ee',
  timestamp: '#f472b6',
};

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export default function GraphPage() {
  const { data: graphData, loading } = useData(() => fetchGraphData('CASE-001'));
  const [typeFilters, setTypeFilters] = useState<string[]>(entityTypes.map((t) => t.key));
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleType = (key: string) => {
    setTypeFilters((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const filteredNodes = (graphData?.nodes ?? []).filter((n) => {
    if (!typeFilters.includes(n.type)) return false;
    if (searchQuery && !n.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const nodeDetailColors: Record<string, string> = {
    person: 'border-l-blue-400',
    organization: 'border-l-purple-400',
    location: 'border-l-green-400',
    event: 'border-l-orange-400',
    document: 'border-l-yellow-400',
    system: 'border-l-cyan-400',
    timestamp: 'border-l-pink-400',
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left Control Panel */}
      <motion.aside
        animate={{ width: sidebarOpen ? 280 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' as const }}
        className="relative overflow-hidden border-r border-border bg-surface/95"
      >
        <button
          onClick={() => setSidebarOpen((p) => !p)}
          className="absolute -right-5 top-1/2 z-10 flex h-8 w-5 items-center justify-center rounded-r-lg border border-l-0 border-border bg-surface-2 text-text-muted hover:text-text"
        >
          {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
        </button>

        <div className="h-full w-[280px] overflow-y-auto p-4 space-y-5">
          {/* Search */}
          <div>
            <div className="relative">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search nodes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-surface-2/80 pl-9 pr-8 text-xs text-text placeholder-text-muted outline-none transition-all focus:border-primary/40"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text">
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* Entity Type Filters */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Entity Types</h3>
            <div className="space-y-1">
              {entityTypes.map(({ key, label, icon: Icon, color }) => (
                <button
                  key={key}
                  onClick={() => toggleType(key)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs transition-all ${
                    typeFilters.includes(key)
                      ? 'bg-primary/10 text-text'
                      : 'text-text-secondary hover:bg-surface-3/60'
                  }`}
                >
                  <div className={`flex h-6 w-6 items-center justify-center rounded-md ${color}/10`}>
                    <Icon size={12} className={color} />
                  </div>
                  <span className="flex-1 text-left">{label}</span>
                  <div className={`h-3 w-3 rounded-sm border ${typeFilters.includes(key) ? 'bg-primary border-primary' : 'border-border-light'}`}>
                    {typeFilters.includes(key) && (
                      <svg viewBox="0 0 12 12" className="h-full w-full text-white">
                        <path d="M3 6l2 2 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Actions</h3>
            <button className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-surface-2/60 px-3 py-2.5 text-xs text-text-secondary transition-colors hover:border-primary/30 hover:text-text">
              <Crosshair size={14} className="text-accent" />
              Highlight Path
            </button>
            <button className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-surface-2/60 px-3 py-2.5 text-xs text-text-secondary transition-colors hover:border-primary/30 hover:text-text">
              <RefreshCw size={14} className="text-primary" />
              Reset View
            </button>
            <button className="flex w-full items-center gap-2.5 rounded-lg border border-border bg-surface-2/60 px-3 py-2.5 text-xs text-text-secondary transition-colors hover:border-primary/30 hover:text-text">
              <Layers size={14} className="text-warning" />
              Cluster by Source
            </button>
          </div>

          {/* Legend */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Legend</h3>
            <div className="space-y-2">
              {entityTypes.filter((t) => typeFilters.includes(t.key)).map(({ key, label, color }) => (
                <div key={key} className="flex items-center gap-2.5">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: entityColorMap[key] }}
                  />
                  <span className="text-xs text-text-secondary">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Graph Area */}
      <div className="relative flex-1 overflow-hidden bg-surface">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="space-y-4 text-center">
              <Skeleton className="mx-auto h-80 w-80 rounded-full" />
              <Skeleton className="mx-auto h-4 w-48" />
            </div>
          </div>
        ) : (
          <>
            {/* KnowledgeGraph placeholder */}
            <div className="flex h-full items-center justify-center p-8">
              <div className="glass-card relative flex flex-col items-center gap-4 p-10 text-center max-w-lg">
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/[0.03] to-accent/[0.03]" />
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20 ring-1 ring-white/10">
                  <Layers size={40} className="text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-text">Knowledge Graph</h3>
                <p className="text-sm text-text-secondary">
                  The <span className="font-medium text-text">KnowledgeGraph</span> component renders here — an interactive force-directed graph visualization of entities and their relationships.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {filteredNodes.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => setSelectedNode(n)}
                      className="rounded-full border border-border bg-surface-3/60 px-3 py-1 text-xs text-text-secondary transition-colors hover:border-primary/30"
                    >
                      {n.name}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-text-muted">
                  {filteredNodes.length} nodes &middot; {(graphData?.links ?? []).length} connections
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Right Node Detail Panel */}
      <AnimatePresence>
        {selectedNode && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' as const }}
            className="overflow-hidden border-l border-border bg-surface/95"
          >
            <div className="h-full w-[320px] overflow-y-auto p-5">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${getEntityColor(selectedNode.type)}`}>
                    {selectedNode.type}
                  </span>
                  <h2 className="mt-2 text-lg font-bold text-text leading-snug">{selectedNode.name}</h2>
                </div>
                <button onClick={() => setSelectedNode(null)} className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-surface-3 hover:text-text">
                  <X size={14} />
                </button>
              </div>

              <div className={`border-l-2 ${nodeDetailColors[selectedNode.type] || 'border-l-primary'} pl-4 space-y-4`}>
                {/* Properties */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Properties</h3>
                  <div className="space-y-1.5">
                    {Object.entries(selectedNode.properties).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between rounded-lg bg-surface-3/40 px-3 py-2">
                        <span className="text-xs capitalize text-text-muted">{key.replace(/_/g, ' ')}</span>
                        <span className="text-xs font-medium text-text">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Connected Entities */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Connected Entities</h3>
                  <div className="space-y-1">
                    {selectedNode.connections.length > 0 ? (
                      selectedNode.connections.map((connId) => {
                        const connNode = graphData?.nodes.find((n) => n.id === connId);
                        return connNode ? (
                          <button
                            key={connId}
                            onClick={() => setSelectedNode(connNode)}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-text-secondary transition-colors hover:bg-surface-3/60"
                          >
                            <Link2 size={12} className="text-primary" />
                            <span>{connNode.name}</span>
                            <span className={`ml-auto text-[10px] ${getEntityColor(connNode.type)}`}>{connNode.type}</span>
                          </button>
                        ) : null;
                      })
                    ) : (
                      <p className="text-xs text-text-muted">No connections</p>
                    )}
                  </div>
                </div>

                {/* First / Last Seen */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-surface-3/40 p-3">
                    <p className="text-[10px] text-text-muted">First Seen</p>
                    <p className="mt-0.5 text-xs font-medium text-text">{formatDate(selectedNode.firstSeen)}</p>
                  </div>
                  <div className="rounded-lg bg-surface-3/40 p-3">
                    <p className="text-[10px] text-text-muted">Last Seen</p>
                    <p className="mt-0.5 text-xs font-medium text-text">{formatDate(selectedNode.lastSeen)}</p>
                  </div>
                </div>

                {/* Mentions */}
                <div className="rounded-lg bg-surface-3/40 p-3">
                  <p className="text-[10px] text-text-muted">Mentions</p>
                  <p className="mt-0.5 text-sm font-bold text-text">{selectedNode.mentions}</p>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
