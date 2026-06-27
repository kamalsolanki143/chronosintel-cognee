'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  Search,
  Bell,
  X,
  ChevronDown,
  User,
  Settings,
  LogOut,
  CheckCheck,
  Trash2,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { fetchUserProfile, type UserProfile } from '@/services/settingsService';
import { formatRelativeTime, getInitials } from '@/utils/format';

const notificationTypeStyles: Record<string, string> = {
  alert: 'border-l-red-500 bg-red-500/5',
  warning: 'border-l-amber-500 bg-amber-500/5',
  success: 'border-l-emerald-500 bg-emerald-500/5',
  info: 'border-l-blue-500 bg-blue-500/5',
};

const notificationDotStyles: Record<string, string> = {
  alert: 'bg-red-500',
  warning: 'bg-amber-500',
  success: 'bg-emerald-500',
  info: 'bg-blue-500',
};

export default function Navbar() {
  const { toggleSidebar, notifications, markNotificationRead, clearNotifications } = useApp();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    fetchUserProfile().then(setProfile);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = (id: string) => {
    markNotificationRead(id);
  };

  const handleClearAll = () => {
    clearNotifications();
    setNotifOpen(false);
  };

  const handleMarkAllRead = () => {
    notifications.forEach((n) => {
      if (!n.read) markNotificationRead(n.id);
    });
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b border-border bg-surface/70 backdrop-blur-2xl supports-[backdrop-filter]:bg-surface/50 px-4 lg:px-6">
      {/* Left section */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-text-secondary hover:bg-surface-3 hover:text-text transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>

        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20">
            <span className="text-sm font-bold text-white">C</span>
          </div>
          <span className="hidden sm:inline text-base font-semibold tracking-tight text-text">
            Chronos<span className="text-gradient-primary">Intel</span>
          </span>
        </Link>
      </div>

      {/* Center – Search */}
      <div className="hidden md:flex flex-1 items-center justify-center max-w-lg mx-auto">
        <div className="relative w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search cases, evidence, entities..."
            className="w-full h-9 pl-9 pr-4 text-sm rounded-xl bg-surface-3/80 border border-border text-text placeholder:text-text-muted focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      {/* Mobile search */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, scaleX: 0.9 }}
            animate={{ opacity: 1, scaleX: 1 }}
            exit={{ opacity: 0, scaleX: 0.9 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-x-4 top-2 z-50 md:hidden"
          >
            <div className="glass-strong rounded-xl overflow-hidden flex items-center px-3 py-2">
              <Search size={16} className="shrink-0 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                autoFocus
                className="flex-1 ml-2 bg-transparent text-sm text-text placeholder:text-text-muted focus:outline-none"
              />
              <button
                onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                className="ml-2 p-1 rounded-lg text-text-muted hover:text-text hover:bg-surface-3 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right section */}
      <div className="flex items-center gap-1.5 ml-auto">
        {/* Mobile search trigger */}
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="flex md:hidden h-9 w-9 items-center justify-center rounded-xl text-text-secondary hover:bg-surface-3 hover:text-text transition-colors"
          aria-label="Search"
        >
          <Search size={18} />
        </button>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl text-text-secondary hover:bg-surface-3 hover:text-text transition-colors"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-white shadow-lg shadow-danger/30">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -4 }}
                transition={{ duration: 0.15, ease: 'easeOut' as const }}
                className="absolute right-0 top-full mt-2 w-80 sm:w-96 origin-top-right"
              >
                <div className="glass-strong rounded-2xl overflow-hidden shadow-2xl shadow-black/30">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                    <span className="text-sm font-semibold text-text">Notifications</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleMarkAllRead}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-text-secondary hover:text-text rounded-lg hover:bg-surface-3 transition-colors"
                      >
                        <CheckCheck size={13} />
                        Mark all read
                      </button>
                      <button
                        onClick={handleClearAll}
                        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-text-secondary hover:text-danger rounded-lg hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 size={13} />
                        Clear all
                      </button>
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
                        <Bell size={28} className="text-text-muted mb-2" />
                        <p className="text-sm text-text-muted">No notifications yet</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <button
                          key={notif.id}
                          onClick={() => handleMarkRead(notif.id)}
                          className={`w-full text-left px-4 py-3 border-l-2 transition-colors hover:bg-surface-3/60 ${
                            notificationTypeStyles[notif.type] || 'border-l-transparent'
                          } ${notif.read ? 'opacity-60' : ''}`}
                        >
                          <div className="flex items-start gap-3">
                            <span
                              className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                                notificationDotStyles[notif.type] || 'bg-text-muted'
                              } ${notif.read ? 'opacity-0' : ''}`}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs leading-snug text-text line-clamp-2">{notif.message}</p>
                              <span className="mt-1 block text-[11px] text-text-muted">
                                {formatRelativeTime(notif.timestamp)}
                              </span>
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User menu */}
        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => setUserMenuOpen((o) => !o)}
            className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-xl hover:bg-surface-3 transition-colors group"
            aria-label="User menu"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-bold text-white shadow-md shadow-primary/20">
              {profile ? getInitials(profile.name) : '?'}
            </div>
            <ChevronDown
              size={14}
              className={`hidden sm:block text-text-muted transition-transform duration-200 ${
                userMenuOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          <AnimatePresence>
            {userMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: -4 }}
                transition={{ duration: 0.15, ease: 'easeOut' as const }}
                className="absolute right-0 top-full mt-2 w-56 origin-top-right"
              >
                <div className="glass-strong rounded-2xl overflow-hidden shadow-2xl shadow-black/30">
                  {profile && (
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-sm font-semibold text-text truncate">{profile.name}</p>
                      <p className="text-xs text-text-muted truncate mt-0.5">{profile.email}</p>
                      <p className="text-[11px] text-text-muted truncate mt-0.5 capitalize">{profile.role}</p>
                    </div>
                  )}

                  <div className="p-1.5">
                    <Link
                      href="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-text-secondary rounded-xl hover:bg-surface-3 hover:text-text transition-colors"
                    >
                      <User size={16} className="text-text-muted" />
                      Profile
                    </Link>
                    <Link
                      href="/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-text-secondary rounded-xl hover:bg-surface-3 hover:text-text transition-colors"
                    >
                      <Settings size={16} className="text-text-muted" />
                      Settings
                    </Link>
                    <hr className="my-1 border-border" />
                    <button
                      onClick={() => setUserMenuOpen(false)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-text-secondary rounded-xl hover:bg-red-500/10 hover:text-danger transition-colors"
                    >
                      <LogOut size={16} className="text-text-muted group-hover:text-danger" />
                      Sign out
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
