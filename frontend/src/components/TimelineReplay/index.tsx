"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  MessageSquare,
  Activity,
  GitBranch,
  AlertTriangle,
  RefreshCw,
  Eye,
  Calendar,
} from "lucide-react";
import { fetchTimelineEvents } from "@/services/timelineService";
import { formatDate, formatRelativeTime } from "@/utils/format";
import type { TimelineEvent } from "@/services/mockData";

const CATEGORIES = [
  { key: "all", label: "All", icon: Activity },
  { key: "communication", label: "Communications", icon: MessageSquare },
  { key: "action", label: "Actions", icon: Activity },
  { key: "decision", label: "Decisions", icon: GitBranch },
  { key: "incident", label: "Incidents", icon: AlertTriangle },
  { key: "update", label: "Updates", icon: RefreshCw },
  { key: "review", label: "Reviews", icon: Eye },
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  communication: "#3b82f6",
  action: "#10b981",
  decision: "#8b5cf6",
  incident: "#ef4444",
  update: "#f59e0b",
  review: "#06b6d4",
};

const IMPORTANCE_COLORS: Record<string, string> = {
  critical: "bg-danger",
  high: "bg-warning",
  medium: "bg-info",
  low: "bg-text-muted",
};

interface TimelineReplayProps {
  caseId?: string;
}

export default function TimelineReplay({ caseId }: TimelineReplayProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<TimelineEvent[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [replaying, setReplaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await fetchTimelineEvents(caseId || "CASE-001");
        setEvents(data);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [caseId]);

  useEffect(() => {
    if (activeCategory === "all") {
      setFilteredEvents(events);
    } else {
      setFilteredEvents(
        events.filter((e) => e.category === activeCategory)
      );
    }
    setCurrentIndex(-1);
  }, [events, activeCategory]);

  useEffect(() => {
    if (!replaying || filteredEvents.length === 0) return;
    const next = currentIndex + 1;
    if (next >= filteredEvents.length) {
      setReplaying(false);
      setCurrentIndex(filteredEvents.length - 1);
      return;
    }
    const timer = setTimeout(() => setCurrentIndex(next), 1200);
    return () => clearTimeout(timer);
  }, [replaying, currentIndex, filteredEvents]);

  const scrollToEvent = useCallback((index: number) => {
    setTimeout(() => {
      const el = document.getElementById(`timeline-event-${index}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }, []);

  const handleReplay = () => {
    if (replaying) {
      setReplaying(false);
      return;
    }
    if (currentIndex >= filteredEvents.length - 1) {
      setCurrentIndex(-1);
    }
    setReplaying(true);
  };

  useEffect(() => {
    if (currentIndex >= 0) scrollToEvent(currentIndex);
  }, [currentIndex, scrollToEvent]);

  if (loading) {
    return (
      <div className="glass-card p-5 space-y-4">
        <div className="skeleton h-8 w-full" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex gap-4">
              <div className="skeleton h-12 w-12 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="skeleton h-4 w-24" />
                <div className="skeleton h-3 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card"
    >
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-text flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Case Timeline
          </h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleReplay}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              replaying
                ? "bg-danger/10 text-danger"
                : "bg-primary/10 text-primary hover:bg-primary/20"
            }`}
          >
            {replaying ? (
              <Pause className="w-3.5 h-3.5" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            {replaying ? "Pause" : "Replay"}
          </motion.button>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeCategory === cat.key
                  ? "bg-primary text-white"
                  : "bg-surface-3 text-text-secondary hover:text-text"
              }`}
            >
              <cat.icon className="w-3 h-3" />
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Activity className="w-10 h-10 text-text-muted mb-3" />
          <p className="text-text-secondary font-medium">No events found</p>
          <p className="text-sm text-text-muted mt-1">
            No events match the selected category
          </p>
        </div>
      ) : (
        <div ref={containerRef} className="relative p-4 max-h-[600px] overflow-y-auto">
          <div className="absolute left-[23px] top-0 bottom-0 w-px bg-border" />
          <div className="space-y-0">
            {filteredEvents.map((event, idx) => (
              <motion.div
                key={event.id}
                id={`timeline-event-${idx}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{
                  opacity: replaying && idx <= currentIndex ? 1 : !replaying ? 1 : idx <= currentIndex ? 1 : 0.3,
                  x: 0,
                }}
                transition={{ duration: 0.4, delay: replaying ? 0 : idx * 0.05 }}
                className={`relative flex gap-4 pb-6 last:pb-0 transition-opacity duration-500 ${
                  replaying && idx > currentIndex ? "opacity-30" : "opacity-100"
                }`}
              >
                <div className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-[14px] h-[14px] rounded-full border-2 mt-1.5 ${
                      idx <= currentIndex
                        ? "border-primary bg-primary"
                        : "border-border bg-surface-2"
                    }`}
                    style={
                      idx > currentIndex
                        ? undefined
                        : {
                            borderColor: CATEGORY_COLORS[event.category],
                            backgroundColor: CATEGORY_COLORS[event.category],
                          }
                    }
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs text-text-muted font-mono">
                      {formatDate(event.timestamp)}
                    </span>
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider"
                      style={{
                        backgroundColor: `${CATEGORY_COLORS[event.category]}20`,
                        color: CATEGORY_COLORS[event.category],
                      }}
                    >
                      {event.category}
                    </span>
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${IMPORTANCE_COLORS[event.importance]}`}
                    />
                  </div>
                  <h3 className="text-sm font-semibold text-text mb-1">
                    {event.title}
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {event.description}
                  </p>
                  <p className="text-[11px] text-text-muted mt-1">
                    Source: {event.source}
                  </p>
                  {event.evidenceIds.length > 0 && (
                    <div className="flex gap-1 mt-1.5">
                      {event.evidenceIds.slice(0, 3).map ((eid) => (
                        <span
                          key={eid}
                          className="px-1.5 py-0.5 rounded text-[10px] bg-surface-3 text-text-muted font-mono"
                        >
                          {eid}
                        </span>
                      ))}
                      {event.evidenceIds.length > 3 && (
                        <span className="text-[10px] text-text-muted">
                          +{event.evidenceIds.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
