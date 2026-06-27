"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Mail,
  MessageSquare,
  Terminal,
  Code,
  Video,
  File,
  ChevronDown,
  ChevronUp,
  Link2,
  Scale,
  ThumbsUp,
  Minus,
  ThumbsDown,
} from "lucide-react";
import { fetchEvidence } from "@/services/investigationService";
import { formatDate, truncate } from "@/utils/format";
import type { Evidence } from "@/services/mockData";

const TYPE_ICONS: Record<string, React.ReactNode> = {
  email: <Mail className="w-4 h-4" />,
  chat: <MessageSquare className="w-4 h-4" />,
  document: <FileText className="w-4 h-4" />,
  log: <Terminal className="w-4 h-4" />,
  code: <Code className="w-4 h-4" />,
  meeting: <Video className="w-4 h-4" />,
  other: <File className="w-4 h-4" />,
};

function getSupportLevel(
  evidence: Evidence
): { label: string; color: string; icon: React.ReactNode } {
  if (evidence.extracted) {
    return {
      label: "Supporting",
      color: "text-success",
      icon: <ThumbsUp className="w-3.5 h-3.5" />,
    };
  }
  if (evidence.entities.length > 0) {
    return {
      label: "Partial",
      color: "text-warning",
      icon: <Minus className="w-3.5 h-3.5" />,
    };
  }
  return {
    label: "Contradicts",
    color: "text-danger",
    icon: <ThumbsDown className="w-3.5 h-3.5" />,
  };
}

const REASONING_STEPS = [
  "Initial Collection",
  "Corroboration",
  "Cross-Reference",
  "Verification",
  "Conclusion",
];

interface EvidenceChainProps {
  caseId?: string;
}

export default function EvidenceChain({ caseId }: EvidenceChainProps) {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await fetchEvidence(caseId || "CASE-001");
        setEvidence(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [caseId]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="glass-card p-5 space-y-4">
        <div className="skeleton h-6 w-36" />
        <div className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="skeleton h-10 w-10 rounded-lg shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="skeleton h-4 w-48" />
                <div className="skeleton h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (evidence.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-10 text-center"
      >
        <Scale className="w-10 h-10 text-text-muted mx-auto mb-3" />
        <p className="text-text-secondary font-medium">No evidence chain</p>
        <p className="text-sm text-text-muted mt-1">
          Evidence items will appear here once collected
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5"
    >
      <h2 className="text-sm font-semibold text-text mb-6 flex items-center gap-2">
        <Link2 className="w-4 h-4 text-primary" />
        Evidence Chain
      </h2>

      <div className="relative">
        <div className="absolute left-5 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-accent to-transparent" />

        {evidence.map((item, idx) => {
          const support = getSupportLevel(item);
          const expanded = expandedIds.has(item.id);
          const stepIdx = Math.min(idx, REASONING_STEPS.length - 1);

          return (
            <div key={item.id} className="relative pl-12 pb-6 last:pb-0">
              <div className="absolute left-[18px] top-0 w-[14px] h-[14px] rounded-full border-2 border-primary bg-surface-2 z-10 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              </div>

              {idx > 0 && (
                <div className="absolute left-5 -top-3 translate-x-[-10px]">
                  <span className="text-[10px] text-text-muted bg-surface-2 px-2 py-0.5 rounded-full border border-border whitespace-nowrap">
                    {REASONING_STEPS[stepIdx]}
                  </span>
                </div>
              )}

              <motion.div
                layout
                className="glass p-3 rounded-xl card-hover"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-surface-3 flex items-center justify-center text-text-secondary shrink-0">
                    {TYPE_ICONS[item.type] || TYPE_ICONS.other}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-text truncate">
                        {item.title}
                      </h3>
                      <span className={`flex items-center gap-1 text-xs font-medium shrink-0 ${support.color}`}>
                        {support.icon}
                        {support.label}
                      </span>
                    </div>

                    <p className="text-xs text-text-secondary leading-relaxed">
                      {expanded
                        ? item.content
                        : truncate(item.content, 120)}
                    </p>

                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[11px] text-text-muted">
                        {item.source}
                      </span>
                      <span className="text-[11px] text-text-muted">
                        {formatDate(item.timestamp)}
                      </span>
                      {item.fileSize && (
                        <span className="text-[11px] text-text-muted">
                          {item.fileSize}
                        </span>
                      )}
                    </div>

                    {item.content.length > 120 && (
                      <button
                        onClick={() => toggleExpand(item.id)}
                        className="flex items-center gap-1 text-xs text-primary hover:text-primary-light mt-1.5 transition-colors"
                      >
                        {expanded ? (
                          <>
                            <ChevronUp className="w-3 h-3" /> Show less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3 h-3" /> Show full content
                          </>
                        )}
                      </button>
                    )}

                    {item.entities.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.entities.map((ent) => (
                          <span
                            key={ent}
                            className="px-1.5 py-0.5 rounded text-[10px] bg-surface-3 text-text-muted font-mono"
                          >
                            {ent}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {idx < evidence.length - 1 && (
                <div className="flex justify-center py-2">
                  <ChevronDown className="w-4 h-4 text-text-muted" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
