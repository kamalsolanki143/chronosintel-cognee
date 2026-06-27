'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  BookOpen,
  GitBranch,
  History,
  BrainCircuit,
  StickyNote,
  Files,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useData } from '@/hooks/useData';
import { fetchCases } from '@/services/casesService';
import { formatNumber, getStatusColor, getSeverityColor } from '@/utils/format';
import type { Case } from '@/services/mockData';

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export default function InvestigationPage() {
  const { data: cases, loading: casesLoading } = useData(fetchCases);
  const [selectedCaseId, setSelectedCaseId] = useState('CASE-001');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [evidenceOpen, setEvidenceOpen] = useState(true);
  const [notes, setNotes] = useState('');

  const selectedCase = cases?.find((c) => c.id === selectedCaseId) ?? null;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Main Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Case Selector */}
        <div className="flex items-center gap-3 border-b border-border bg-surface/60 px-6 py-3 backdrop-blur-xl">
          <BookOpen size={16} className="text-text-muted shrink-0" />
          <select
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            className="flex-1 bg-transparent text-sm font-medium text-text outline-none"
          >
            {casesLoading ? (
              <option>Loading cases...</option>
            ) : (
              (cases ?? []).map((c) => (
                <option key={c.id} value={c.id}>{c.id} - {c.title}</option>
              ))
            )}
          </select>
          <ChevronDown size={14} className="text-text-muted" />
        </div>

        {/* Chat + Upload */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex h-full items-center justify-center">
              <div className="glass-card flex flex-col items-center gap-4 p-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                  <BrainCircuit size={32} className="text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-text">Investigation Chat</h3>
                <p className="max-w-sm text-sm text-text-secondary">
                  The <span className="font-medium text-text">InvestigationChat</span> component will render here — your AI-powered conversational interface for exploring case evidence.
                </p>
                <div className="mt-2 flex gap-2">
                  <span className="rounded-lg bg-surface-3 px-3 py-1 text-xs text-text-secondary">Evidence analysis</span>
                  <span className="rounded-lg bg-surface-3 px-3 py-1 text-xs text-text-secondary">Entity queries</span>
                  <span className="rounded-lg bg-surface-3 px-3 py-1 text-xs text-text-secondary">Timeline Q&A</span>
                </div>
              </div>
            </div>
          </div>

          {/* Upload Panel */}
          <div className="border-t border-border bg-surface/60 backdrop-blur-xl">
            <div className="p-4">
              <div className="flex items-center gap-3 rounded-xl border-2 border-dashed border-border-light p-4 transition-colors hover:border-primary/30 hover:bg-primary/[0.02]">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Files size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text">UploadPanel component</p>
                  <p className="text-xs text-text-muted">Drop evidence files here or click to browse</p>
                </div>
                <button className="ml-auto rounded-xl bg-primary/10 px-4 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/20">
                  Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 0 : 360 }}
        transition={{ duration: 0.3, ease: 'easeInOut' as const }}
        className="relative overflow-hidden border-l border-border bg-surface/95"
      >
        <button
          onClick={() => setSidebarCollapsed((p) => !p)}
          className="absolute left-0 top-1/2 z-10 flex h-8 w-5 -translate-x-full items-center justify-center rounded-l-lg border border-border bg-surface-2 text-text-muted hover:text-text"
        >
          {sidebarCollapsed ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
        </button>

        <div className="h-full w-[360px] overflow-y-auto p-5 space-y-5">
          {/* Case Summary */}
          <div className="glass-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3">Case Summary</h3>
            {casesLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            ) : selectedCase ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-text leading-snug">{selectedCase.title}</p>
                <div className="flex gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${getStatusColor(selectedCase.status)}`}>
                    {selectedCase.status}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${getSeverityColor(selectedCase.severity)}`}>
                    {selectedCase.severity}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-surface-3/60 p-2.5">
                    <p className="text-[10px] text-text-muted">Entities</p>
                    <p className="text-base font-bold text-text">{selectedCase.entities}</p>
                  </div>
                  <div className="rounded-lg bg-surface-3/60 p-2.5">
                    <p className="text-[10px] text-text-muted">Evidence</p>
                    <p className="text-base font-bold text-text">{selectedCase.evidence}</p>
                  </div>
                  <div className="rounded-lg bg-surface-3/60 p-2.5">
                    <p className="text-[10px] text-text-muted">Events</p>
                    <p className="text-base font-bold text-text">{selectedCase.events}</p>
                  </div>
                  <div className="rounded-lg bg-surface-3/60 p-2.5">
                    <p className="text-[10px] text-text-muted">Risk</p>
                    <p className={`text-base font-bold ${selectedCase.riskScore >= 80 ? 'text-danger' : selectedCase.riskScore >= 60 ? 'text-warning' : 'text-success'}`}>
                      {selectedCase.riskScore}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-text-muted">No case selected</p>
            )}
          </div>

          {/* EvidenceChain placeholder */}
          <div className="glass-card overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border p-3">
              <GitBranch size={14} className="text-accent" />
              <span className="text-xs font-semibold text-text">Evidence Chain</span>
            </div>
            <div className="p-4 text-center">
              <p className="text-xs text-text-muted">EvidenceChain component</p>
              <p className="mt-1 text-[10px] text-text-muted">Linked evidence relationships</p>
            </div>
          </div>

          {/* VersionHistory placeholder */}
          <div className="glass-card overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border p-3">
              <History size={14} className="text-warning" />
              <span className="text-xs font-semibold text-text">Version History</span>
            </div>
            <div className="p-4 text-center">
              <p className="text-xs text-text-muted">VersionHistory component</p>
              <p className="mt-1 text-[10px] text-text-muted">Case version tracking</p>
            </div>
          </div>

          {/* CaseMemory placeholder */}
          <div className="glass-card overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border p-3">
              <BrainCircuit size={14} className="text-primary" />
              <span className="text-xs font-semibold text-text">Case Memory</span>
            </div>
            <div className="p-4 text-center">
              <p className="text-xs text-text-muted">CaseMemory component</p>
              <p className="mt-1 text-[10px] text-text-muted">AI-powered case context memory</p>
            </div>
          </div>

          {/* Evidence Sources (collapsible) */}
          <div className="glass-card overflow-hidden">
            <button
              onClick={() => setEvidenceOpen((p) => !p)}
              className="flex w-full items-center justify-between border-b border-border p-3 transition-colors hover:bg-surface-3/40"
            >
              <div className="flex items-center gap-2">
                <Files size={14} className="text-text-muted" />
                <span className="text-xs font-semibold text-text">Evidence Sources</span>
              </div>
              <ChevronDown size={12} className={`text-text-muted transition-transform ${evidenceOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence initial={false}>
              {evidenceOpen && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-1 p-3">
                    {['Emails (48)', 'Logs (72)', 'Documents (56)', 'Chat (34)', 'Meetings (12)'].map((src) => (
                      <div key={src} className="flex items-center justify-between rounded-lg px-2.5 py-2 text-xs text-text-secondary hover:bg-surface-3/40">
                        <span>{src.split(' ')[0]}</span>
                        <span>{src.match(/\((\d+)\)/)?.[1]}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Analyst Notes */}
          <div className="glass-card overflow-hidden">
            <div className="flex items-center gap-2 border-b border-border p-3">
              <StickyNote size={14} className="text-success" />
              <span className="text-xs font-semibold text-text">Analyst Notes</span>
            </div>
            <div className="p-3">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Type your analysis notes here..."
                className="min-h-[120px] w-full resize-none rounded-xl border border-border bg-surface-3/40 p-3 text-sm text-text placeholder-text-muted outline-none transition-all focus:border-primary/40"
              />
            </div>
          </div>
        </div>
      </motion.aside>
    </div>
  );
}
