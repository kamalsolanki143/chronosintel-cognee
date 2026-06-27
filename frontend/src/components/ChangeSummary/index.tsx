"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  ArrowRight,
  Edit3,
  GitCompare,
  Tag,
} from "lucide-react";
import { fetchCaseUpdates } from "@/services/casesService";
import { formatDate, formatRelativeTime } from "@/utils/format";
import type { CaseUpdate } from "@/services/mockData";

const CHANGE_ICONS: Record<string, React.ReactNode> = {
  evidence_added: <Plus className="w-3.5 h-3.5" />,
  entity_discovered: <Plus className="w-3.5 h-3.5" />,
  status_change: <ArrowRight className="w-3.5 h-3.5" />,
  note_added: <Edit3 className="w-3.5 h-3.5" />,
  report_generated: <Plus className="w-3.5 h-3.5" />,
};

const CHANGE_COLORS: Record<string, string> = {
  evidence_added: "text-success",
  entity_discovered: "text-success",
  status_change: "text-warning",
  note_added: "text-info",
  report_generated: "text-success",
};

const CHANGE_LABELS: Record<string, string> = {
  evidence_added: "Evidence Added",
  entity_discovered: "Entity Discovered",
  status_change: "Status Changed",
  note_added: "Note Added",
  report_generated: "Report Generated",
};

interface ChangeSummaryProps {
  caseId?: string;
  version?: number;
}

export default function ChangeSummary({ caseId, version = 2 }: ChangeSummaryProps) {
  const [updates, setUpdates] = useState<CaseUpdate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await fetchCaseUpdates(caseId || "CASE-001");
        setUpdates(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [caseId]);

  const beforeChanges = updates.slice(0, Math.floor(updates.length / 2));
  const afterChanges = updates.slice(Math.floor(updates.length / 2));

  if (loading) {
    return (
      <div className="glass-card p-5 space-y-4">
        <div className="skeleton h-6 w-40" />
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="skeleton h-4 w-16" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-14 w-full" />
            ))}
          </div>
          <div className="space-y-2">
            <div className="skeleton h-4 w-16" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-14 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-text flex items-center gap-2">
          <GitCompare className="w-4 h-4 text-primary" />
          Change Summary
        </h2>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-medium">
          <Tag className="w-3 h-3" />
          v{version}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Before Panel */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
            Before
          </h3>
          {beforeChanges.length === 0 ? (
            <p className="text-xs text-text-muted text-center py-4">No prior changes</p>
          ) : (
            beforeChanges.map((change) => {
              const Icon = CHANGE_ICONS[change.type] || <ArrowRight className="w-3.5 h-3.5" />;
              const color = CHANGE_COLORS[change.type] || "text-text-muted";
              const label = CHANGE_LABELS[change.type] || change.type;

              return (
                <motion.div
                  key={change.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 rounded-lg bg-surface-3/50 border border-border/50"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={color}>{Icon}</span>
                    <span className={`text-[10px] font-medium ${color}`}>{label}</span>
                    <span className="text-[10px] text-text-muted ml-auto">
                      {formatRelativeTime(change.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {change.description}
                  </p>
                </motion.div>
              );
            })
          )}
        </div>

        {/* After Panel */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
            After
          </h3>
          {afterChanges.length === 0 ? (
            <p className="text-xs text-text-muted text-center py-4">No recent changes</p>
          ) : (
            afterChanges.map((change) => {
              const Icon = CHANGE_ICONS[change.type] || <ArrowRight className="w-3.5 h-3.5" />;
              const color = CHANGE_COLORS[change.type] || "text-text-muted";
              const label = CHANGE_LABELS[change.type] || change.type;

              return (
                <motion.div
                  key={change.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="p-3 rounded-lg bg-primary/5 border border-primary/20"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={color}>{Icon}</span>
                    <span className={`text-[10px] font-medium ${color}`}>{label}</span>
                    <span className="text-[10px] text-text-muted ml-auto">
                      {formatRelativeTime(change.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {change.description}
                  </p>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </motion.div>
  );
}
