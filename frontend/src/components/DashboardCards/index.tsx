"use client";

import { motion } from "framer-motion";
import { TrendingUp, TrendingDown } from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: "up" | "down";
  trendValue?: string;
  color?: string;
  loading?: boolean;
}

export function MetricCard({
  title,
  value,
  icon,
  trend,
  trendValue,
  color = "primary",
  loading = false,
}: MetricCardProps) {
  if (loading) {
    return (
      <div className="glass-card p-5 space-y-4">
        <div className="skeleton h-5 w-20" />
        <div className="skeleton h-9 w-32" />
        <div className="skeleton h-4 w-24" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card p-5 card-hover relative overflow-hidden group"
    >
      <div
        className="absolute top-3 right-3 w-10 h-10 rounded-lg flex items-center justify-center"
        style={{
          background: `color-mix(in srgb, var(--color-${color}) 15%, transparent)`,
          color: `var(--color-${color})`,
        }}
      >
        {icon}
      </div>
      <p className="text-sm font-medium text-text-secondary mb-1">{title}</p>
      <p
        className="text-3xl font-bold tracking-tight text-text mb-2"
        style={color !== "primary" ? { color: `var(--color-${color})` } : undefined}
      >
        {value}
      </p>
      {trend && trendValue && (
        <div className="flex items-center gap-1.5">
          {trend === "up" ? (
            <TrendingUp className="w-4 h-4 text-success" />
          ) : (
            <TrendingDown className="w-4 h-4 text-danger" />
          )}
          <span
            className={`text-xs font-medium ${
              trend === "up" ? "text-success" : "text-danger"
            }`}
          >
            {trendValue}
          </span>
        </div>
      )}
    </motion.div>
  );
}

interface TrendCardProps {
  title: string;
  data: { name: string; value: number }[];
  color?: string;
  loading?: boolean;
}

export function TrendCard({
  title,
  data,
  color = "#6366f1",
  loading = false,
}: TrendCardProps) {
  if (loading) {
    return (
      <div className="glass-card p-5 space-y-4">
        <div className="skeleton h-5 w-32" />
        <div className="skeleton h-48 w-full" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="glass-card p-5"
    >
      <h3 className="text-sm font-medium text-text-secondary mb-4">{title}</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748b", fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                background: "#1a1f28",
                border: "1px solid #2a3344",
                borderRadius: "8px",
                fontSize: "13px",
              }}
              labelStyle={{ color: "#f1f5f9" }}
              itemStyle={{ color }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#gradient-${title})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

interface StatItem {
  label: string;
  value: string | number;
  color?: string;
}

interface StatWidgetProps {
  title: string;
  items: StatItem[];
  loading?: boolean;
}

export function StatWidget({
  title,
  items,
  loading = false,
}: StatWidgetProps) {
  if (loading) {
    return (
      <div className="glass-card p-5 space-y-4">
        <div className="skeleton h-5 w-28" />
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="skeleton h-3 w-16" />
              <div className="skeleton h-6 w-12" />
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
      transition={{ duration: 0.4, delay: 0.2 }}
      className="glass-card p-5"
    >
      <h3 className="text-sm font-medium text-text-secondary mb-4">{title}</h3>
      <div className="grid grid-cols-2 gap-4">
        {items.map((item, idx) => (
          <div key={idx}>
            <p className="text-xs text-text-muted mb-0.5">{item.label}</p>
            <p
              className="text-xl font-bold"
              style={
                item.color ? { color: `var(--color-${item.color})` } : undefined
              }
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
