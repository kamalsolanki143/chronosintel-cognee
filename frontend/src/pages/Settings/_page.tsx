'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Users,
  Bell,
  Key,
  Database,
  Palette,
  Save,
  Plus,
  Copy,
  Eye,
  EyeOff,
  Check,
  X,
  RefreshCw,
  Download,
  Shield,
  Mail,
} from 'lucide-react';
import { useData } from '@/hooks/useData';
import {
  fetchUserProfile,
  fetchTeamMembers,
  fetchNotificationPreferences,
  updateNotificationPreferences,
  type UserProfile,
  type TeamMember,
  type NotificationPreferences,
} from '@/services/settingsService';
import { getInitials } from '@/utils/format';

const tabs = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'api', label: 'API & Integrations', icon: Key },
  { id: 'retention', label: 'Data Retention', icon: Database },
  { id: 'theme', label: 'Theme', icon: Palette },
];

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const { data: profile, loading: profileLoading } = useData(fetchUserProfile);
  const { data: team, loading: teamLoading } = useData(fetchTeamMembers);
  const { data: notifPrefs, loading: notifLoading } = useData(fetchNotificationPreferences);

  const [localPrefs, setLocalPrefs] = useState<NotificationPreferences | null>(null);
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('https://hooks.chronosintel.com/investigation-events');
  const [retentionPeriod, setRetentionPeriod] = useState('90');
  const [autoArchive, setAutoArchive] = useState(true);
  const [selectedAccent, setSelectedAccent] = useState('#6366f1');

  const accentColors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const prefs = localPrefs ?? notifPrefs;

  const togglePref = (key: keyof NotificationPreferences) => {
    if (!prefs) return;
    const updated = { ...prefs, [key]: !prefs[key] };
    setLocalPrefs(updated);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-text">Settings</h1>
          <p className="mt-1 text-text-secondary">Manage your account and application preferences</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto gap-1 rounded-xl border border-border bg-surface-2/60 p-1.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-primary/15 text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text hover:bg-surface-3/60'
              }`}
            >
              <tab.icon size={15} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="glass-card p-6 space-y-6">
                <h2 className="text-lg font-semibold text-text">Profile Information</h2>
                {profileLoading ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Skeleton className="h-16 w-16 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : profile ? (
                  <>
                    <div className="flex items-center gap-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary/30 to-accent/30 text-lg font-bold text-primary-light shadow-inner shadow-white/5 ring-1 ring-white/10">
                        {getInitials(profile.name)}
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-text">{profile.name}</p>
                        <p className="text-sm text-text-muted">{profile.role}</p>
                      </div>
                      <button className="ml-auto rounded-lg border border-border px-4 py-2 text-xs text-text-secondary transition-colors hover:bg-surface-3 hover:text-text">
                        Change Avatar
                      </button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1.5">Full Name</label>
                        <input
                          type="text"
                          defaultValue={profile.name}
                          className="h-11 w-full rounded-xl border border-border bg-surface-3/40 px-4 text-sm text-text placeholder-text-muted outline-none transition-all focus:border-primary/40"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1.5">Email</label>
                        <input
                          type="email"
                          defaultValue={profile.email}
                          className="h-11 w-full rounded-xl border border-border bg-surface-3/40 px-4 text-sm text-text placeholder-text-muted outline-none transition-all focus:border-primary/40"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1.5">Role</label>
                        <input
                          type="text"
                          defaultValue={profile.role}
                          className="h-11 w-full rounded-xl border border-border bg-surface-3/40 px-4 text-sm text-text placeholder-text-muted outline-none transition-all focus:border-primary/40"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-muted mb-1.5">Organization</label>
                        <input
                          type="text"
                          defaultValue={profile.organization}
                          className="h-11 w-full rounded-xl border border-border bg-surface-3/40 px-4 text-sm text-text placeholder-text-muted outline-none transition-all focus:border-primary/40"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white transition-all hover:bg-primary-dark active:scale-[0.98] shadow-lg shadow-primary/20">
                        <Save size={15} />
                        Save Changes
                      </button>
                    </div>
                  </>
                ) : null}
              </div>
            )}

            {/* Team Tab */}
            {activeTab === 'team' && (
              <div className="glass-card p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-text">Team Members</h2>
                  <button className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-primary-dark active:scale-[0.98] shadow-lg shadow-primary/20">
                    <Plus size={15} />
                    Invite Member
                  </button>
                </div>

                {teamLoading ? (
                  <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="flex-1 space-y-1.5">
                          <Skeleton className="h-4 w-40" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(team ?? []).map((member: TeamMember) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 rounded-xl border border-border bg-surface-3/30 p-3 transition-colors hover:bg-surface-3/60"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 to-accent/20 text-xs font-semibold text-primary-light">
                          {getInitials(member.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-text">{member.name}</p>
                          <p className="text-xs text-text-muted">{member.role}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-text-muted">{member.email}</p>
                          <span className={`text-[11px] font-medium ${
                            member.status === 'active' ? 'text-success' : member.status === 'invited' ? 'text-warning' : 'text-text-muted'
                          }`}>
                            {member.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="glass-card p-6 space-y-6">
                <h2 className="text-lg font-semibold text-text">Notification Preferences</h2>
                {notifLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-6 w-10 rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : prefs ? (
                  <div className="space-y-4">
                    {([
                      { key: 'emailAlerts', label: 'Email Alerts', desc: 'Receive email notifications for critical events' },
                      { key: 'weeklyDigest', label: 'Weekly Digest', desc: 'Weekly summary of all case activities' },
                      { key: 'caseUpdates', label: 'Case Updates', desc: 'Notifications when cases are updated' },
                      { key: 'reportReady', label: 'Report Ready', desc: 'Get notified when reports are generated' },
                    ] as const).map(({ key, label, desc }) => (
                      <div key={key} className="flex items-center justify-between rounded-xl border border-border bg-surface-3/30 p-4">
                        <div>
                          <p className="text-sm font-medium text-text">{label}</p>
                          <p className="text-xs text-text-muted">{desc}</p>
                        </div>
                        <button
                          onClick={() => togglePref(key)}
                          className={`relative h-7 w-12 rounded-full transition-colors ${
                            prefs[key] ? 'bg-primary' : 'bg-surface-3'
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                              prefs[key] ? 'translate-x-5' : ''
                            }`}
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            )}

            {/* API & Integrations Tab */}
            {activeTab === 'api' && (
              <div className="space-y-6">
                <div className="glass-card p-6 space-y-6">
                  <h2 className="text-lg font-semibold text-text">API Keys</h2>
                  <div className="rounded-xl border border-border bg-surface-3/40 p-4">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-text-muted mb-1">Primary API Key</p>
                        <div className="flex items-center gap-2">
                          <code className="rounded bg-surface-3 px-3 py-1.5 text-sm font-mono text-text-secondary">
                            {apiKeyVisible ? 'ci_live_sk_7f3a2c1b8d4e9f0a5b6c7d8e9f0a1b2c3d4e5f' : 'ci_live_sk_7f3a...'}
                          </code>
                          <button
                            onClick={() => setApiKeyVisible((p) => !p)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-surface-3 hover:text-text"
                          >
                            {apiKeyVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                          <button className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-surface-3 hover:text-text">
                            <Copy size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button className="flex items-center gap-2 rounded-xl border border-border bg-surface-3/40 px-5 py-2.5 text-sm text-text-secondary transition-colors hover:border-primary/30 hover:text-text">
                    <RefreshCw size={15} />
                    Generate New Key
                  </button>
                </div>

                <div className="glass-card p-6 space-y-4">
                  <h2 className="text-lg font-semibold text-text">Webhook Configuration</h2>
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1.5">Webhook URL</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={webhookUrl}
                        onChange={(e) => setWebhookUrl(e.target.value)}
                        className="h-11 flex-1 rounded-xl border border-border bg-surface-3/40 px-4 text-sm text-text placeholder-text-muted outline-none transition-all focus:border-primary/40"
                      />
                      <button className="flex items-center gap-2 rounded-xl bg-primary/10 px-4 text-sm text-primary transition-colors hover:bg-primary/20">
                        Test
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Data Retention Tab */}
            {activeTab === 'retention' && (
              <div className="space-y-6">
                <div className="glass-card p-6 space-y-6">
                  <h2 className="text-lg font-semibold text-text">Retention Settings</h2>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-medium text-text-muted mb-1.5">Retention Period</label>
                      <select
                        value={retentionPeriod}
                        onChange={(e) => setRetentionPeriod(e.target.value)}
                        className="h-11 w-full rounded-xl border border-border bg-surface-3/40 px-4 pr-8 text-sm text-text outline-none appearance-none bg-[length:14px] bg-[right_12px_center] bg-no-repeat transition-all focus:border-primary/40"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%2394a3b8'%3e%3cpath d='M4.646 5.646a.5.5 0 0 1 .708 0L8 8.293l2.646-2.647a.5.5 0 0 1 .708.708l-3 3a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 0-.708z'/%3e%3c/svg%3e")` }}
                      >
                        <option value="30">30 days</option>
                        <option value="60">60 days</option>
                        <option value="90">90 days</option>
                        <option value="180">180 days</option>
                        <option value="365">1 year</option>
                        <option value="0">Indefinite</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <div className="flex w-full items-center justify-between rounded-xl border border-border bg-surface-3/40 p-4">
                        <div>
                          <p className="text-sm font-medium text-text">Auto-archive cases</p>
                          <p className="text-xs text-text-muted">Automatically archive cases after retention period</p>
                        </div>
                        <button
                          onClick={() => setAutoArchive((p) => !p)}
                          className={`relative h-7 w-12 rounded-full transition-colors ${
                            autoArchive ? 'bg-primary' : 'bg-surface-3'
                          }`}
                        >
                          <span
                            className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                              autoArchive ? 'translate-x-5' : ''
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-text">Export Data</h2>
                      <p className="text-sm text-text-muted">Download all your case data and evidence</p>
                    </div>
                    <button className="flex items-center gap-2 rounded-xl bg-primary/10 px-5 py-2.5 text-sm text-primary transition-colors hover:bg-primary/20">
                      <Download size={15} />
                      Export All
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Theme Tab */}
            {activeTab === 'theme' && (
              <div className="space-y-6">
                <div className="glass-card p-6 space-y-6">
                  <h2 className="text-lg font-semibold text-text">Appearance</h2>

                  <div className="flex items-center justify-between rounded-xl border border-border bg-surface-3/40 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-3">
                        <Shield size={18} className="text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text">Dark Mode</p>
                        <p className="text-xs text-text-muted">Currently enabled (ChronosIntel runs in dark mode)</p>
                      </div>
                    </div>
                    <div className="relative h-7 w-12 rounded-full bg-primary opacity-60 cursor-not-allowed">
                      <span className="absolute top-0.5 left-[18px] h-6 w-6 rounded-full bg-white shadow" />
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-text mb-3">Accent Color</p>
                    <div className="flex gap-3">
                      {accentColors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedAccent(color)}
                          className={`flex h-10 w-10 items-center justify-center rounded-xl transition-all ${
                            selectedAccent === color ? 'ring-2 ring-white ring-offset-2 ring-offset-surface-2 scale-110' : ''
                          }`}
                          style={{ backgroundColor: color }}
                        >
                          {selectedAccent === color && <Check size={16} className="text-white" />}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-text-muted">Accent color selection is visual-only in this version</p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
