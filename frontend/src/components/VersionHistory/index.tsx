"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitBranch,
  Eye,
  RotateCcw,
  Check,
  Clock,
  User,
  FileText,
} from "lucide-react";
import { fetchVersionHistory } from "@/services/timelineService";
import { formatDate, formatRelativeTime } from "@/utils/format";
import type { VersionEntry } from "@/services/mockData";

interface VersionHistoryProps {
  caseId?: string;
}

export default function VersionHistory({ caseId }: VersionHistoryProps) {
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await fetchVersionHistory(caseId || "CASE-001");
        setVersions(data);
        if (data.length > 0) setSelectedVersion(data[0].id);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [caseId]);

  const selected = versions.find((v) => v.id === selectedVersion);

  if (loading) {
    return (
      <div className="glass-card p-5 space-y-4">
        <div className="skeleton h-6 w-36" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="skeleton h-8 w-8 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="skeleton h-4 w-32" />
                <div className="skeleton h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-10 text-center"
      >
        <GitBranch className="w-10 h-10 text-text-muted mx-auto mb-3" />
        <p className="text-text-secondary font-medium">No version history</p>
        <p className="text-sm text-text-muted mt-1">
          Versions will appear as the case progresses
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
      <h2 className="text-sm font-semibold text-text mb-5 flex items-center gap-2">
        <GitBranch className="w-4 h-4 text-primary" />
        Version History
      </h2>

      <div className="space-y-0">
        {versions.map((version, idx) => {
          const isSelected = selectedVersion === version.id;
          const isLast = idx === versions.length - 1;

          return (
            <div key={version.id} className="relative flex gap-4 pb-5 last:pb-0">
              {/* Timeline dot + line */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => setSelectedVersion(version.id)}
                  className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isSelected
                      ? "border-primary bg-primary text-white shadow-lg shadow-primary/30"
                      : "border-border bg-surface-2 text-text-muted hover:border-primary/50"
                  }`}
                >
                  <span className="text-[11px] font-bold">v{version.version}</span>
                </button>
                {!isLast && (
                  <div className="w-px flex-1 bg-border mt-1" />
                )}
              </div>

              {/* Card */}
              <div className="flex-1 pb-1 min-w-0">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={version.id}
                    initial={{ opacity: 0.6 }}
                    animate={{ opacity: 1 }}
                    className={`p-3 rounded-xl transition-all duration-300 ${
                      isSelected
                        ? "bg-primary/5 border border-primary/20"
                        : "bg-surface-3/30 border border-transparent hover:bg-surface-3/60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h3
                        className={`text-sm font-semibold ${
                          isSelected ? "text-primary" : "text-text"
                        }`}
                      >
                        Version {version.version}
                      </h3>
                      <span className="text-[10px] text-text-muted shrink-0">
                        {formatRelativeTime(version.timestamp)}
                      </span>
                    </div>

                    <p className="text-xs text-text-secondary mb-2">
                      {version.summary}
                    </p>

                    <div className="flex items-center gap-3 text-[10px] text-text-muted mb-2">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {version.author}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(version.timestamp)}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {version.changes.length} changes
                      </span>
                    </div>

                    {isSelected && version.changes.length > 0 && (
                      <motion.ul
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-1 mt-2 pt-2 border-t border-border/50"
                      >
                        {version.changes.map((change, ci) => (
                          <li
                            key={ci}
                            className="flex items-start gap-1.5 text-[11px] text-text-secondary"
                          >
                            <Check className="w-3 h-3 text-success mt-0.5 shrink-0" />
                            {change}
                          </li>
                        ))}
                      </motion.ul>
                    )}

                    <div className="flex gap-2 mt-2">
                      <button
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                          isSelected
                            ? "bg-primary/10 text-primary"
                            : "bg-surface-3 text-text-muted hover:text-text"
                        }`}
                      >
                        <Eye className="w-3 h-3" />
                        Preview
                      </button>
                      <button
                        disabled
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-surface-3 text-text-muted/50 cursor-not-allowed"
                        title="Rollback is available for administrators"
                      >
                        <RotateCcw className="w-3 h-3" />
                        Rollback
                      </button>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
