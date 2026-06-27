'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Plus,
  SlidersHorizontal,
  LayoutGrid,
  List,
  X,
  ChevronRight,
  Clock,
  Users,
  AlertTriangle,
  FileText,
  ChevronDown,
} from 'lucide-react';
import { useData } from '@/hooks/useData';
import { fetchCases } from '@/services/casesService';
import { formatDate, formatRelativeTime, getStatusColor, getSeverityColor, truncate } from '@/utils/format';
import type { Case } from '@/services/mockData';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] as const } },
};

const statuses = ['all', 'active', 'closed', 'pending', 'archived'];
const severities = ['all', 'critical', 'high', 'medium', 'low'];
const sourceTypes = ['Logs', 'Network Traffic', 'Email', 'Documents', 'Financial Records', 'Meetings', 'Chat', 'Code', 'Access Records', 'Interviews', 'Security Reports', 'System Configs'];
const sortOptions = ['Newest', 'Oldest', 'Risk Score', 'Alphabetical'];

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export default function CasesPage() {
  const { data: cases, loading } = useData(fetchCases);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState('Newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCase, setSelectedCase] = useState<Case | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filteredCases = useMemo(() => {
    if (!cases) return [];
    let result = [...cases];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          c.assignee.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (statusFilter !== 'all') result = result.filter((c) => c.status === statusFilter);
    if (severityFilter !== 'all') result = result.filter((c) => c.severity === severityFilter);
    if (sourceFilter.length > 0) {
      result = result.filter((c) => c.sourceTypes.some((s) => sourceFilter.includes(s)));
    }
    result.sort((a, b) => {
      if (sortBy === 'Newest') return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      if (sortBy === 'Oldest') return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      if (sortBy === 'Risk Score') return b.riskScore - a.riskScore;
      return a.title.localeCompare(b.title);
    });

    return result;
  }, [cases, search, statusFilter, severityFilter, sourceFilter, sortBy]);

  const toggleSource = (src: string) => {
    setSourceFilter((prev) =>
      prev.includes(src) ? prev.filter((s) => s !== src) : [...prev, src]
    );
  };

  return (
    <div className="flex h-full">
      <div className="flex-1 overflow-y-auto p-6 lg:p-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mx-auto max-w-7xl space-y-6"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-text">Cases</h1>
              <p className="mt-1 text-text-secondary">Manage and review investigation cases</p>
            </div>
            <button className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-primary-dark active:scale-[0.98] shadow-lg shadow-primary/20">
              <Plus size={16} />
              New Case
            </button>
          </motion.div>

          {/* Search & Filter Bar */}
          <motion.div variants={itemVariants} className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search cases by title, ID, assignee, or tags..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-surface-2/80 pl-10 pr-10 text-sm text-text placeholder-text-muted outline-none transition-all focus:border-primary/40 focus:shadow-[0_0_20px_-8px_rgba(99,102,241,0.3)]"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text">
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-11 rounded-xl border border-border bg-surface-2/80 px-3 pr-8 text-sm text-text outline-none appearance-none bg-[length:14px] bg-[right_10px_center] bg-no-repeat transition-all focus:border-primary/40"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%2394a3b8'%3e%3cpath d='M4.646 5.646a.5.5 0 0 1 .708 0L8 8.293l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z'/%3e%3c/svg%3e")` }}
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="h-11 rounded-xl border border-border bg-surface-2/80 px-3 pr-8 text-sm text-text outline-none appearance-none bg-[length:14px] bg-[right_10px_center] bg-no-repeat transition-all focus:border-primary/40"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%2394a3b8'%3e%3cpath d='M4.646 5.646a.5.5 0 0 1 .708 0L8 8.293l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z'/%3e%3c/svg%3e")` }}
              >
                {severities.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
              <button
                onClick={() => setFiltersOpen((p) => !p)}
                className={`flex h-11 items-center gap-2 rounded-xl border px-3.5 text-sm transition-all ${
                  sourceFilter.length > 0 || filtersOpen
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border bg-surface-2/80 text-text-secondary hover:text-text'
                }`}
              >
                <SlidersHorizontal size={15} />
                <span className="hidden sm:inline">Filters</span>
                {sourceFilter.length > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-white">{sourceFilter.length}</span>
                )}
              </button>
              <div className="flex rounded-xl border border-border overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-primary/15 text-primary' : 'bg-surface-2/80 text-text-muted hover:text-text'}`}
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-primary/15 text-primary' : 'bg-surface-2/80 text-text-muted hover:text-text'}`}
                >
                  <List size={15} />
                </button>
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-11 rounded-xl border border-border bg-surface-2/80 px-3 pr-8 text-sm text-text outline-none appearance-none bg-[length:14px] bg-[right_10px_center] bg-no-repeat transition-all focus:border-primary/40 hidden sm:block"
                style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%2394a3b8'%3e%3cpath d='M4.646 5.646a.5.5 0 0 1 .708 0L8 8.293l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z'/%3e%3c/svg%3e")` }}
              >
                {sortOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </motion.div>

          {/* Expanded Filters */}
          <AnimatePresence>
            {filtersOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="glass-card p-4">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wider text-text-muted">Source Type</p>
                  <div className="flex flex-wrap gap-2">
                    {sourceTypes.map((src) => (
                      <button
                        key={src}
                        onClick={() => toggleSource(src)}
                        className={`rounded-lg border px-3 py-1.5 text-xs transition-all ${
                          sourceFilter.includes(src)
                            ? 'border-primary/40 bg-primary/10 text-primary'
                            : 'border-border bg-surface-3/40 text-text-secondary hover:border-border-light hover:text-text'
                        }`}
                      >
                        {src}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Case Count */}
          <motion.div variants={itemVariants} className="flex items-center gap-2 text-sm text-text-muted">
            <span className="font-medium text-text">{filteredCases.length}</span>
            <span>case{filteredCases.length !== 1 ? 's' : ''} found</span>
          </motion.div>

          {/* Loading State */}
          {loading ? (
            <div className={viewMode === 'grid' ? 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3' : 'space-y-3'}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className={viewMode === 'grid' ? 'h-48 rounded-xl' : 'h-24 rounded-xl'} />
              ))}
            </div>
          ) : filteredCases.length === 0 ? (
            /* Empty State */
            <motion.div variants={itemVariants} className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-3">
                <Search size={28} className="text-text-muted" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-text">No cases found</h3>
              <p className="mt-1 text-sm text-text-muted">No cases match your current filters. Try adjusting your search criteria.</p>
              <button
                onClick={() => { setSearch(''); setStatusFilter('all'); setSeverityFilter('all'); setSourceFilter([]); }}
                className="mt-4 rounded-xl bg-primary/10 px-4 py-2 text-sm text-primary transition-colors hover:bg-primary/20"
              >
                Clear all filters
              </button>
            </motion.div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredCases.map((c) => (
                <motion.button
                  key={c.id}
                  variants={itemVariants}
                  onClick={() => setSelectedCase(selectedCase?.id === c.id ? null : c)}
                  className={`glass-card group relative overflow-hidden p-5 text-left transition-all ${
                    selectedCase?.id === c.id ? 'ring-1 ring-primary/40' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-sm font-semibold text-text line-clamp-2">{c.title}</h3>
                    <ChevronRight size={14} className="mt-0.5 shrink-0 text-text-muted transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${getStatusColor(c.status)}`}>
                      {c.status}
                    </span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${getSeverityColor(c.severity)}`}>
                      {c.severity}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3 border-t border-border/50 pt-3">
                    <div>
                      <p className="text-[11px] text-text-muted">Entities</p>
                      <p className="text-sm font-semibold text-text">{c.entities}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-text-muted">Evidence</p>
                      <p className="text-sm font-semibold text-text">{c.evidence}</p>
                    </div>
                    <div>
                      <p className="text-[11px] text-text-muted">Risk</p>
                      <p className={`text-sm font-semibold ${c.riskScore >= 80 ? 'text-danger' : c.riskScore >= 60 ? 'text-warning' : 'text-success'}`}>
                        {c.riskScore}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-text-muted">
                      <Users size={12} />
                      <span>{c.assignee}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-text-muted">
                      <Clock size={12} />
                      <span>{formatRelativeTime(c.updatedAt)}</span>
                    </div>
                  </div>
                  {c.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {c.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="rounded bg-surface-3 px-2 py-0.5 text-[10px] text-text-muted">#{tag}</span>
                      ))}
                      {c.tags.length > 3 && (
                        <span className="text-[10px] text-text-muted">+{c.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="space-y-2">
              {filteredCases.map((c) => (
                <motion.button
                  key={c.id}
                  variants={itemVariants}
                  onClick={() => setSelectedCase(selectedCase?.id === c.id ? null : c)}
                  className={`glass-card flex w-full items-center gap-4 p-4 text-left transition-all ${
                    selectedCase?.id === c.id ? 'ring-1 ring-primary/40' : ''
                  }`}
                >
                  <div className="flex min-w-0 flex-1 items-center gap-4">
                    <h3 className="min-w-0 flex-1 truncate text-sm font-semibold text-text">{c.title}</h3>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${getStatusColor(c.status)}`}>
                      {c.status}
                    </span>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${getSeverityColor(c.severity)}`}>
                      {c.severity}
                    </span>
                    <span className="shrink-0 text-xs text-text-muted">{c.assignee}</span>
                    <span className={`shrink-0 text-xs font-semibold ${c.riskScore >= 80 ? 'text-danger' : c.riskScore >= 60 ? 'text-warning' : 'text-success'}`}>
                      {c.riskScore}
                    </span>
                    <span className="shrink-0 text-xs text-text-muted">{formatRelativeTime(c.updatedAt)}</span>
                  </div>
                  <ChevronRight size={14} className="shrink-0 text-text-muted" />
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Detail Panel */}
      <AnimatePresence>
        {selectedCase && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 380, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' as const }}
            className="hidden overflow-hidden border-l border-border bg-surface/95 lg:block"
          >
            <div className="flex h-full w-[380px] flex-col overflow-y-auto p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-xs text-text-muted">{selectedCase.id}</p>
                  <h2 className="mt-1 text-lg font-bold text-text leading-snug">{selectedCase.title}</h2>
                </div>
                <button onClick={() => setSelectedCase(null)} className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-surface-3 hover:text-text">
                  <X size={14} />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mb-5">
                <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${getStatusColor(selectedCase.status)}`}>
                  {selectedCase.status}
                </span>
                <span className={`rounded-full px-3 py-0.5 text-xs font-medium ${getSeverityColor(selectedCase.severity)}`}>
                  {selectedCase.severity}
                </span>
              </div>

              <p className="text-sm text-text-secondary leading-relaxed mb-6">{truncate(selectedCase.description, 200)}</p>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="rounded-xl bg-surface-3/60 p-3">
                  <p className="text-xs text-text-muted">Entities</p>
                  <p className="text-xl font-bold text-text">{selectedCase.entities}</p>
                </div>
                <div className="rounded-xl bg-surface-3/60 p-3">
                  <p className="text-xs text-text-muted">Evidence</p>
                  <p className="text-xl font-bold text-text">{selectedCase.evidence}</p>
                </div>
                <div className="rounded-xl bg-surface-3/60 p-3">
                  <p className="text-xs text-text-muted">Events</p>
                  <p className="text-xl font-bold text-text">{selectedCase.events}</p>
                </div>
                <div className="rounded-xl bg-surface-3/60 p-3">
                  <p className="text-xs text-text-muted">Risk Score</p>
                  <p className={`text-xl font-bold ${selectedCase.riskScore >= 80 ? 'text-danger' : selectedCase.riskScore >= 60 ? 'text-warning' : 'text-success'}`}>
                    {selectedCase.riskScore}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-xs font-medium uppercase tracking-wider text-text-muted mb-2">Timeline Snapshot</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <span>Created: {formatDate(selectedCase.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                    <span>Last updated: {formatDate(selectedCase.updatedAt)}</span>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-xs font-medium uppercase tracking-wider text-text-muted mb-2">Assignee</p>
                <div className="flex items-center gap-2.5 rounded-xl bg-surface-3/60 p-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-accent/30 text-xs font-semibold text-primary-light">
                    {selectedCase.assignee.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-text">{selectedCase.assignee}</p>
                    <p className="text-xs text-text-muted">Lead Investigator</p>
                  </div>
                </div>
              </div>

              {selectedCase.tags.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs font-medium uppercase tracking-wider text-text-muted mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCase.tags.map((tag) => (
                      <span key={tag} className="rounded-lg bg-surface-3 px-2.5 py-1 text-xs text-text-secondary">#{tag}</span>
                    ))}
                  </div>
                </div>
              )}

              <button className="mt-auto flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-white transition-all hover:bg-primary-dark active:scale-[0.98] shadow-lg shadow-primary/20">
                <AlertTriangle size={15} />
                Open Investigation
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
