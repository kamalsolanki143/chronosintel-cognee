'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileBarChart,
  Plus,
  Search,
  X,
  FileText,
  Download,
  ChevronRight,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSpreadsheet,
  File,
  ChevronDown,
} from 'lucide-react';
import { useData } from '@/hooks/useData';
import { fetchReports } from '@/services/reportsService';
import { fetchCases } from '@/services/casesService';
import { formatDate, formatRelativeTime } from '@/utils/format';
import type { Report } from '@/services/mockData';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

const statusColors: Record<string, string> = {
  draft: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  final: 'bg-green-500/10 text-green-500 border-green-500/20',
  review: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
};

const statusIcons: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  draft: Clock,
  final: CheckCircle2,
  review: AlertCircle,
};

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export default function ReportsPage() {
  const { data: reports, loading } = useData(fetchReports);
  const { data: cases } = useData(fetchCases);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [caseFilter, setCaseFilter] = useState('all');
  const [sortBy, setSortBy] = useState('Newest');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const filteredReports = useMemo(() => {
    if (!reports) return [];
    let result = [...reports];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter((r) => r.title.toLowerCase().includes(q) || r.id.toLowerCase().includes(q));
    }
    if (statusFilter !== 'all') result = result.filter((r) => r.status === statusFilter);
    if (caseFilter !== 'all') result = result.filter((r) => r.caseId === caseFilter);

    result.sort((a, b) => {
      if (sortBy === 'Newest') return new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime();
      if (sortBy === 'Oldest') return new Date(a.generatedAt).getTime() - new Date(b.generatedAt).getTime();
      return 0;
    });

    return result;
  }, [reports, search, statusFilter, caseFilter, sortBy]);

  const getCaseTitle = (caseId: string) => {
    return cases?.find((c) => c.id === caseId)?.title ?? caseId;
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
              <h1 className="text-3xl font-bold tracking-tight text-text">Reports</h1>
              <p className="mt-1 text-text-secondary">Generate and manage investigation reports</p>
            </div>
            <button className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-primary-dark active:scale-[0.98] shadow-lg shadow-primary/20">
              <Plus size={16} />
              Generate Report
            </button>
          </motion.div>

          {/* Filter Bar */}
          <motion.div variants={itemVariants} className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="Search reports..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-11 w-full rounded-xl border border-border bg-surface-2/80 pl-10 pr-10 text-sm text-text placeholder-text-muted outline-none transition-all focus:border-primary/40"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text">
                  <X size={14} />
                </button>
              )}
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 rounded-xl border border-border bg-surface-2/80 px-3 pr-8 text-sm text-text outline-none appearance-none bg-[length:14px] bg-[right_10px_center] bg-no-repeat transition-all focus:border-primary/40"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%2394a3b8'%3e%3cpath d='M4.646 5.646a.5.5 0 0 1 .708 0L8 8.293l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z'/%3e%3c/svg%3e")` }}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="final">Final</option>
              <option value="review">Review</option>
            </select>
            <select
              value={caseFilter}
              onChange={(e) => setCaseFilter(e.target.value)}
              className="h-11 rounded-xl border border-border bg-surface-2/80 px-3 pr-8 text-sm text-text outline-none appearance-none bg-[length:14px] bg-[right_10px_center] bg-no-repeat transition-all focus:border-primary/40"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%2394a3b8'%3e%3cpath d='M4.646 5.646a.5.5 0 0 1 .708 0L8 8.293l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z'/%3e%3c/svg%3e")` }}
            >
              <option value="all">All Cases</option>
              {(cases ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.id} - {c.title.slice(0, 30)}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="h-11 rounded-xl border border-border bg-surface-2/80 px-3 pr-8 text-sm text-text outline-none appearance-none bg-[length:14px] bg-[right_10px_center] bg-no-repeat transition-all focus:border-primary/40"
              style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%2394a3b8'%3e%3cpath d='M4.646 5.646a.5.5 0 0 1 .708 0L8 8.293l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z'/%3e%3c/svg%3e")` }}
            >
              <option value="Newest">Newest</option>
              <option value="Oldest">Oldest</option>
            </select>
          </motion.div>

          {/* Loading */}
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-44 rounded-xl" />
              ))}
            </div>
          ) : filteredReports.length === 0 ? (
            /* Empty State */
            <motion.div variants={itemVariants} className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-surface-3">
                <FileBarChart size={28} className="text-text-muted" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-text">No reports found</h3>
              <p className="mt-1 text-sm text-text-muted">No reports match the selected filters.</p>
            </motion.div>
          ) : (
            /* Report Cards Grid */
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredReports.map((report) => {
                const StatusIcon = statusIcons[report.status] || FileText;
                const statusColor = statusColors[report.status] || 'bg-gray-500/10 text-gray-500';

                return (
                  <motion.button
                    key={report.id}
                    variants={itemVariants}
                    onClick={() => setSelectedReport(selectedReport?.id === report.id ? null : report)}
                    className={`glass-card group relative overflow-hidden p-5 text-left transition-all ${
                      selectedReport?.id === report.id ? 'ring-1 ring-primary/40' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <FileText size={18} className="text-primary" />
                      </div>
                      <span className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium capitalize ${statusColor}`}>
                        <StatusIcon size={11} />
                        {report.status}
                      </span>
                    </div>

                    <h3 className="mt-3 text-sm font-semibold text-text line-clamp-2">{report.title}</h3>

                    <p className="mt-1.5 text-xs text-text-secondary line-clamp-2">{report.summary}</p>

                    <div className="mt-4 flex items-center gap-3 border-t border-border/50 pt-3 text-xs text-text-muted">
                      <span className="flex items-center gap-1">
                        <FileText size={11} />
                        {report.findings} findings
                      </span>
                      <span className="flex items-center gap-1">
                        <File size={11} />
                        {report.evidenceCited} cited
                      </span>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-text-muted">{formatRelativeTime(report.generatedAt)}</span>
                      <ChevronRight size={12} className="text-text-muted transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      {/* Detail Panel */}
      <AnimatePresence>
        {selectedReport && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 480, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' as const }}
            className="hidden overflow-hidden border-l border-border bg-surface/95 lg:block"
          >
            <div className="flex h-full w-[480px] flex-col overflow-y-auto">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-border p-6">
                <div className="min-w-0">
                  <p className="text-xs text-text-muted">{selectedReport.id}</p>
                  <h2 className="mt-1 text-lg font-bold text-text leading-snug">{selectedReport.title}</h2>
                  <p className="mt-1 text-xs text-text-muted">Case: {getCaseTitle(selectedReport.caseId)}</p>
                </div>
                <button onClick={() => setSelectedReport(null)} className="flex h-7 w-7 items-center justify-center rounded-lg text-text-muted hover:bg-surface-3 hover:text-text">
                  <X size={14} />
                </button>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-3 border-b border-border px-6 py-3">
                <span className={`flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${
                  statusColors[selectedReport.status]
                }`}>
                  {selectedReport.status}
                </span>
                <span className="flex items-center gap-1 text-xs text-text-muted">
                  <Calendar size={12} />
                  {formatDate(selectedReport.generatedAt)}
                </span>
                <span className="flex items-center gap-1 text-xs text-text-muted">
                  <FileText size={12} />
                  {selectedReport.findings} findings
                </span>
                <span className="flex items-center gap-1 text-xs text-text-muted">
                  <File size={12} />
                  {selectedReport.evidenceCited} evidence cited
                </span>
              </div>

              {/* Summary */}
              <div className="px-6 py-4">
                <p className="text-sm text-text-secondary leading-relaxed">{selectedReport.summary}</p>
              </div>

              {/* Sections */}
              <div className="flex-1 px-6 pb-6 space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">Report Sections</h3>
                {selectedReport.sections.map((section, idx) => (
                  <div key={idx} className="rounded-xl border border-border bg-surface-3/40 p-4">
                    <h4 className="text-sm font-semibold text-text mb-2">{section.title}</h4>
                    <p className="text-xs text-text-secondary leading-relaxed">{section.content}</p>
                    {section.evidenceIds.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {section.evidenceIds.map((eid) => (
                          <span key={eid} className="rounded-md bg-surface-3 px-2 py-0.5 text-[10px] text-text-muted">{eid}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Export Buttons */}
              <div className="border-t border-border p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Export</p>
                <div className="flex gap-2">
                  <button className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-surface-3/40 px-4 py-2.5 text-xs text-text-secondary transition-colors hover:border-primary/30 hover:text-text">
                    <FileText size={14} />
                    PDF
                  </button>
                  <button className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-surface-3/40 px-4 py-2.5 text-xs text-text-secondary transition-colors hover:border-primary/30 hover:text-text">
                    <FileSpreadsheet size={14} />
                    DOCX
                  </button>
                  <button className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-surface-3/40 px-4 py-2.5 text-xs text-text-secondary transition-colors hover:border-primary/30 hover:text-text">
                    <File size={14} />
                    CSV
                  </button>
                  <button className="flex items-center justify-center gap-2 rounded-lg bg-primary/10 px-4 py-2.5 text-xs text-primary transition-colors hover:bg-primary/20">
                    <Download size={14} />
                  </button>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
}
