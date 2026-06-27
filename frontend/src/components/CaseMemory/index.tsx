"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Brain,
  Lightbulb,
  FileEdit,
  User,
  Building2,
  MapPin,
  Calendar,
  Clock,
  Monitor,
  FileText,
} from "lucide-react";
import { fetchEntities } from "@/services/investigationService";
import { formatRelativeTime } from "@/utils/format";
import type { Entity } from "@/services/mockData";

const ENTITY_TYPE_ICONS: Record<string, React.ReactNode> = {
  person: <User className="w-3.5 h-3.5" />,
  organization: <Building2 className="w-3.5 h-3.5" />,
  location: <MapPin className="w-3.5 h-3.5" />,
  event: <Calendar className="w-3.5 h-3.5" />,
  document: <FileText className="w-3.5 h-3.5" />,
  system: <Monitor className="w-3.5 h-3.5" />,
  timestamp: <Clock className="w-3.5 h-3.5" />,
};

const MOCK_INSIGHTS = [
  "Attack pattern consistent with TA-447 APT group — credential stuffing followed by encrypted exfiltration.",
  "Michael Torres (Emp #4731) database queries targeted specific customer PII tables — suggests prior knowledge of data schema.",
  "Whistleblower submission in CASE-006 corroborated by chat logs between Reynolds and ConsulTech CEO.",
  "Transfer pricing anomalies in Zurich subsidiary may indicate systematic tax evasion spanning 3+ fiscal quarters.",
];

interface CaseMemoryProps {
  caseId?: string;
}

export default function CaseMemory({ caseId }: CaseMemoryProps) {
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState(
    "Preliminary investigation notes:\n- Timeline suggests coordinated attack\n- Multiple threat vectors identified\n- Recommend full forensic analysis of affected systems"
  );

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await fetchEntities(caseId || "CASE-001");
        setEntities(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [caseId]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5 space-y-6"
    >
      <div className="flex items-center gap-2 pb-3 border-b border-border">
        <Brain className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-text">Case Memory</h2>
      </div>

      {/* Remembered Entities */}
      <div>
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5" />
          Remembered Entities
        </h3>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="skeleton w-8 h-8 rounded-lg" />
                <div className="space-y-1 flex-1">
                  <div className="skeleton h-3 w-28" />
                  <div className="skeleton h-2 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : entities.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-4">No entities remembered</p>
        ) : (
          <div className="space-y-1.5">
            {entities.slice(0, 6).map((entity) => (
              <motion.div
                key={entity.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-surface-3 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-surface-3 flex items-center justify-center text-text-secondary shrink-0">
                  {ENTITY_TYPE_ICONS[entity.type] || <User className="w-3.5 h-3.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-text truncate">{entity.name}</p>
                  <p className="text-[10px] text-text-muted">
                    Last seen {formatRelativeTime(entity.lastSeen)}
                  </p>
                </div>
                <span className="text-[10px] text-text-muted bg-surface-3 px-1.5 py-0.5 rounded">
                  {entity.type}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Key Insights */}
      <div>
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <Lightbulb className="w-3.5 h-3.5" />
          Key Insights
        </h3>
        <ul className="space-y-2">
          {MOCK_INSIGHTS.map((insight, idx) => (
            <motion.li
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className="flex gap-2 text-xs text-text-secondary leading-relaxed"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1 shrink-0" />
              {insight}
            </motion.li>
          ))}
        </ul>
      </div>

      {/* Investigator Notes */}
      <div>
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3 flex items-center gap-1.5">
          <FileEdit className="w-3.5 h-3.5" />
          Investigator Notes
        </h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add your investigation notes here..."
          className="w-full h-32 bg-surface-3 border border-border-light rounded-xl p-3 text-xs text-text placeholder:text-text-muted resize-none focus:outline-none focus:border-primary/50 transition-colors"
        />
        <p className="text-[10px] text-text-muted mt-1">
          Notes are saved locally in your session
        </p>
      </div>
    </motion.div>
  );
}
