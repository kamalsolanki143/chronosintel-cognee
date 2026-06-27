'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  AlertTriangle,
  FileText,
  History,
  Layers,
  Filter,
  X,
} from 'lucide-react';
import { useData } from '@/hooks/useData';
import { fetchTimelineEvents, fetchVersionHistory } from '@/services/timelineService';
import { fetchCases } from '@/services/casesService';
import { formatDate, formatRelativeTime, getEntityColor } from '@/utils/format';
import type { TimelineEvent, VersionEntry } from '@/services/mockData';

const speedOptions = [0.5, 1, 1.5, 2, 4];
const categories = ['all', 'communication', 'action', 'decision', 'incident', 'update', 'review'];

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export default function TimelinePage() {
  const { data: cases } = useData(fetchCases);
  const [selectedCaseId, setSelectedCaseId] = useState('CASE-001');
  const { data: events, loading: eventsLoading } = useData(() => fetchTimelineEvents(selectedCaseId));
  const { data: versions, loading: versionsLoading } = useData(() => fetchVersionHistory(selectedCaseId));

  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [progress, setProgress] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedEvent, setSelectedEvent] = useState<TimelineEvent | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    let result = [...events];
    if (categoryFilter !== 'all') {
      result = result.filter((e) => e.category === categoryFilter);
    }
    return result.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [events, categoryFilter]);

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      communication: 'bg-blue-500',
      action: 'bg-amber-500',
      decision: 'bg-purple-500',
      incident: 'bg-red-500',
      update: 'bg-green-500',
      review: 'bg-cyan-500',
    };
    return colors[cat] || 'bg-gray-500';
  };

  const getImportanceIcon = (imp: string) => {
    if (imp === 'critical') return <AlertTriangle size={14} className="text-danger" />;
    if (imp === 'high') return <AlertTriangle size={14} className="text-warning" />;
    return <Clock size={14} className="text-text-muted" />;
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left Sidebar */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 0 : 280 }}
        transition={{ duration: 0.3, ease: 'easeInOut' as const }}
        className="relative overflow-hidden border-r border-border bg-surface/95"
      >
        <button
          onClick={() => setSidebarCollapsed((p) => !p)}
          className="absolute -right-5 top-1/2 z-10 flex h-8 w-5 items-center justify-center rounded-r-lg border border-l-0 border-border bg-surface-2 text-text-muted hover:text-text"
        >
          {sidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        <div className="h-full w-[280px] overflow-y-auto p-4 space-y-5">
          {/* Version History */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
              <div className="flex items-center gap-2">
                <History size={14} />
                <span>Version History</span>
              </div>
            </h3>
            {versionsLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 rounded-lg" />
                <Skeleton className="h-16 rounded-lg" />
              </div>
            ) : (
              <div className="space-y-2">
                {(versions ?? []).map((v: VersionEntry) => (
                  <div key={v.id} className="rounded-lg border border-border bg-surface-3/40 p-3 transition-colors hover:border-primary/20">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-text">v{v.version}</span>
                      <span className="text-[10px] text-text-muted">{formatDate(v.timestamp)}</span>
                    </div>
                    <p className="text-[11px] text-text-secondary line-clamp-2">{v.summary}</p>
                    <p className="mt-1 text-[10px] text-text-muted">{v.author}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Change Summary */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">
              <div className="flex items-center gap-2">
                <Layers size={14} />
                <span>Latest Changes</span>
              </div>
            </h3>
            <div className="space-y-2">
              {versionsLoading ? (
                <>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-5/6" />
                </>
              ) : (
                (versions ?? []).slice(0, 1).map((v: VersionEntry) => (
                  <div key={v.id} className="space-y-1.5">
                    {v.changes.map((change, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-text-secondary">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                        <span>{change}</span>
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Center - Timeline */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border bg-surface/60 px-6 py-3 backdrop-blur-xl">
          <Calendar size={16} className="text-text-muted shrink-0" />
          <span className="text-sm font-semibold text-text">Timeline</span>
          <div className="flex items-center gap-2 ml-auto">
            <select
              value={selectedCaseId}
              onChange={(e) => { setSelectedCaseId(e.target.value); setSelectedEvent(null); }}
              className="bg-transparent text-xs text-text-secondary outline-none"
            >
              {(cases ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.id} - {c.title.slice(0, 30)}...</option>
              ))}
            </select>
            <button
              onClick={() => setShowFilters((p) => !p)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-colors ${
                categoryFilter !== 'all' || showFilters
                  ? 'bg-primary/10 text-primary'
                  : 'text-text-secondary hover:bg-surface-3'
              }`}
            >
              <Filter size={12} />
              {categoryFilter !== 'all' ? categoryFilter : 'Filter'}
            </button>
          </div>
        </div>

        {/* Replay Controls */}
        <div className="border-b border-border bg-surface-2/60 px-6 py-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <button className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-3 hover:text-text">
                <SkipBack size={14} />
              </button>
              <button
                onClick={() => setPlaying((p) => !p)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white transition-all hover:bg-primary-dark"
              >
                {playing ? <Pause size={14} /> : <Play size={14} />}
              </button>
              <button className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-3 hover:text-text">
                <SkipForward size={14} />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="flex-1">
              <div className="relative h-1.5 rounded-full bg-surface-3">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </div>
            </div>

            <select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="rounded-lg border border-border bg-surface-3/60 px-2.5 py-1.5 text-xs text-text outline-none"
            >
              {speedOptions.map((s) => (
                <option key={s} value={s}>{s}x</option>
              ))}
            </select>
          </div>

          {/* Category Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex flex-wrap gap-2 pt-3">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat === categoryFilter ? 'all' : cat)}
                      className={`rounded-lg px-3 py-1.5 text-xs capitalize transition-all ${
                        categoryFilter === cat
                          ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                          : 'bg-surface-3/40 text-text-secondary hover:bg-surface-3'
                      }`}
                    >
                      {cat === 'all' ? 'All Events' : cat}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Timeline List */}
        <div className="flex-1 overflow-y-auto p-6">
          {eventsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-3">
                <Calendar size={28} className="text-text-muted" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-text">No timeline events</h3>
              <p className="mt-1 text-sm text-text-muted">No events match the selected filters for this case.</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline vertical line */}
              <div className="absolute left-[17px] top-0 h-full w-0.5 bg-border" />

              <div className="space-y-0">
                {filteredEvents.map((event, idx) => (
                  <motion.button
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.3 }}
                    onClick={() => setSelectedEvent(selectedEvent?.id === event.id ? null : event)}
                    className={`relative flex w-full gap-4 py-4 pl-0 pr-4 text-left transition-all ${
                      selectedEvent?.id === event.id ? 'scale-[1.02]' : ''
                    }`}
                  >
                    {/* Dot */}
                    <div className="relative z-10 flex shrink-0 items-center justify-center">
                      <div className={`h-9 w-9 rounded-full border-2 border-surface ${getCategoryColor(event.category)} flex items-center justify-center shadow-lg`}>
                        <span className="text-[10px] font-bold text-white">
                          {event.category.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className={`min-w-0 flex-1 rounded-xl border p-4 transition-all ${
                      selectedEvent?.id === event.id
                        ? 'border-primary/30 bg-primary/[0.03] shadow-lg shadow-primary/5'
                        : 'border-border bg-surface-2/40 hover:border-border-light'
                    }`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-text">{event.title}</span>
                            {getImportanceIcon(event.importance)}
                          </div>
                          <p className="mt-1 text-xs text-text-muted line-clamp-1">{event.description}</p>
                        </div>
                        <span className="shrink-0 text-[10px] text-text-muted whitespace-nowrap">
                          {formatRelativeTime(event.timestamp)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className="rounded bg-surface-3 px-2 py-0.5 text-[10px] text-text-muted capitalize">
                          {event.category}
                        </span>
                        <span className="text-[10px] text-text-muted">{event.source}</span>
                        {event.evidenceIds.length > 0 && (
                          <span className="flex items-center gap-1 text-[10px] text-text-muted">
                            <FileText size={10} />
                            {event.evidenceIds.length}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Event Detail Panel */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 340, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' as const }}
            className="overflow-hidden border-l border-border bg-surface/95"
          >
            <div className="h-full w-[340px] overflow-y-auto p-5">
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium capitalize ${getEntityColor(selectedEvent.category)}`}>
                      {selectedEvent.category}
                    </span>
                    <span className={`text-[11px] font-medium ${
                      selectedEvent.importance === 'critical' ? 'text-danger' : selectedEvent.importance === 'high' ? 'text-warning' : 'text-text-muted'
                    }`}>
                      {selectedEvent.importance}
                    </span>
                  </div>
                  <h2 className="mt-2 text-lg font-bold text-text leading-snug">{selectedEvent.title}</h2>
                </div>
                <button onClick={() => setSelectedEvent(null)} className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-surface-3 hover:text-text">
                  <X size={14} />
                </button>
              </div>

              <p className="text-sm text-text-secondary leading-relaxed mb-5">{selectedEvent.description}</p>

              <div className="space-y-3 mb-5">
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <Calendar size={12} />
                  <span>{formatDate(selectedEvent.timestamp)}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <FileText size={12} />
                  <span>Source: {selectedEvent.source}</span>
                </div>
              </div>

              {selectedEvent.evidenceIds.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-2">Linked Evidence</h3>
                  <div className="space-y-1.5">
                    {selectedEvent.evidenceIds.map((eid) => (
                      <div key={eid} className="rounded-lg border border-border bg-surface-3/40 px-3 py-2 text-xs text-text-secondary">
                        {eid}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
