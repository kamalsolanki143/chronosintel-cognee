'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  Briefcase,
  FileText,
  Shield,
  TrendingUp,
  TrendingDown,
  Activity,
  Plus,
  Upload,
  ChevronRight,
  FileBarChart,
} from 'lucide-react';
import { useData } from '@/hooks/useData';
import { fetchDashboardMetrics, fetchRecentActivity, fetchLatestUpdates } from '@/services/dashboardService';
import { formatRelativeTime, getInitials } from '@/utils/format';
import type { ActivityItem, CaseUpdate } from '@/services/mockData';

const DashboardCharts = dynamic(() => import('@/components/DashboardCharts'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-surface-3 h-56 rounded-lg flex items-center justify-center text-xs text-text-muted">Loading charts...</div>
});

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

function MetricCard({
  icon: Icon,
  label,
  value,
  trend,
  trendValue,
  color,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color: string;
}) {
  return (
    <motion.div
      variants={itemVariants}
      className="glass-card group relative overflow-hidden p-5"
    >
      <div className={`absolute right-0 top-0 h-24 w-24 -translate-y-6 translate-x-6 rounded-full opacity-[0.04] ${color}`} />
      <div className="flex items-start justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}/10`}>
          <Icon size={20} className={color} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${
            trend === 'up' ? 'bg-success/10 text-success' : trend === 'down' ? 'bg-danger/10 text-danger' : 'bg-text-muted/10 text-text-muted'
          }`}>
            {trend === 'up' ? <TrendingUp size={12} /> : trend === 'down' ? <TrendingDown size={12} /> : null}
            {trendValue}
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm text-text-secondary">{label}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-text">{value}</p>
      </div>
    </motion.div>
  );
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

function RecentActivityItem({ item }: { item: ActivityItem }) {
  const typeConfig: Record<string, { icon: React.ComponentType<{ size?: number; className?: string }>; color: string }> = {
    evidence_added: { icon: FileText, color: 'text-primary' },
    entity_discovered: { icon: Shield, color: 'text-accent' },
    status_change: { icon: Activity, color: 'text-warning' },
    case_created: { icon: Briefcase, color: 'text-success' },
    report_generated: { icon: FileBarChart, color: 'text-info' },
    note_added: { icon: FileText, color: 'text-text-muted' },
  };

  const config = typeConfig[item.type] || { icon: Activity, color: 'text-text-muted' };
  const Icon = config.icon;

  return (
    <motion.div
      variants={itemVariants}
      className="flex items-start gap-3 rounded-lg p-3 transition-colors hover:bg-surface-3/50"
    >
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.color}/10`}>
        <Icon size={14} className={config.color} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-text">{item.description}</p>
        <p className="mt-0.5 text-xs text-text-muted">{formatRelativeTime(item.timestamp)}</p>
      </div>
      <button className="shrink-0 rounded px-2 py-1 text-xs text-primary transition-colors hover:bg-primary/10">
        {item.caseTitle}
      </button>
    </motion.div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: metrics, loading: metricsLoading } = useData(fetchDashboardMetrics);
  const { data: activities, loading: activitiesLoading } = useData(fetchRecentActivity);
  const { data: updates, loading: updatesLoading } = useData(fetchLatestUpdates);

  const quickActions = useMemo(() => [
    { icon: Plus, label: 'New Case', desc: 'Create a new investigation case', color: 'text-primary', href: '/cases' },
    { icon: Upload, label: 'Upload Evidence', desc: 'Add evidence to a case', color: 'text-accent', href: '/investigation' },
    { icon: FileBarChart, label: 'Generate Report', desc: 'Create investigation report', color: 'text-success', href: '/reports' },
    { icon: Briefcase, label: 'View All Cases', desc: 'Browse all investigations', color: 'text-warning', href: '/cases' },
  ], []);

  const chartData = metrics?.weeklyActivity || [];

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-7xl space-y-8"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <h1 className="text-3xl font-bold tracking-tight text-text">Dashboard</h1>
          <p className="mt-1 text-text-secondary">
            Welcome back, <span className="font-medium text-text">Dr. Sarah Chen</span>
          </p>
        </motion.div>

        {/* Metrics Row */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metricsLoading ? (
            <>
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
              <Skeleton className="h-32 rounded-xl" />
            </>
          ) : (
            <>
              <MetricCard icon={Briefcase} label="Active Cases" value={metrics?.activeCases ?? 0} trend="up" trendValue="+12%" color="text-primary" />
              <MetricCard icon={Shield} label="Entities Extracted" value={metrics?.totalEntities ?? 0} trend="up" trendValue="+8%" color="text-accent" />
              <MetricCard icon={FileText} label="Evidence Items" value={metrics?.totalEvidence ?? 0} trend="up" trendValue="+24%" color="text-success" />
              <MetricCard icon={Activity} label="Risk Score" value={`${metrics?.avgRiskScore ?? 0}`} trend="down" trendValue="-3%" color="text-danger" />
            </>
          )}
        </div>

        {/* 2-Column Grid */}
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Weekly Activity Chart */}
            <motion.div variants={itemVariants} className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text">Weekly Activity</h2>
                <span className="text-xs text-text-muted">Cases & Evidence over 7 days</span>
              </div>
              {metricsLoading ? (
                <Skeleton className="h-56 rounded-lg" />
              ) : (
                <DashboardCharts chartData={chartData} />
              )}
            </motion.div>

            <motion.div variants={itemVariants} className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text">Recent Activity</h2>
                <button className="text-xs text-primary transition-colors hover:text-primary-light">View all</button>
              </div>
              {activitiesLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {(activities ?? []).slice(0, 10).map((item) => (
                    <RecentActivityItem key={item.id} item={item} />
                  ))}
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Latest Updates */}
            <motion.div variants={itemVariants} className="glass-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-text">Latest Updates</h2>
                <span className="text-xs text-text-muted">Recent case changes</span>
              </div>
              {updatesLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Skeleton className="h-2 w-2 mt-2 rounded-full" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {(updates ?? []).map((update: CaseUpdate) => (
                    <div key={update.id} className="group flex items-start gap-3 rounded-lg p-2 transition-colors hover:bg-surface-3/40">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary/60" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-text">{update.description}</p>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-text-muted">
                          <span>{formatRelativeTime(update.timestamp)}</span>
                          <span>&middot;</span>
                          <span>{update.user}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Quick Actions */}
            <motion.div variants={itemVariants} className="glass-card p-5">
              <h2 className="text-lg font-semibold text-text mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => router.push(action.href)}
                    className="group flex flex-col items-start gap-2 rounded-xl border border-border bg-surface-3/40 p-4 text-left transition-all duration-300 hover:border-primary/30 hover:bg-surface-3 hover:shadow-lg hover:shadow-primary/5"
                  >
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${action.color}/10 transition-colors group-hover:${action.color}/20`}>
                      <action.icon size={16} className={action.color} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-text">{action.label}</p>
                      <p className="text-xs text-text-muted">{action.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
