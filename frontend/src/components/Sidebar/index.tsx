'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FolderSearch,
  Search,
  Share2,
  Clock,
  FileText,
  Settings,
  HelpCircle,
  X,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

export interface SidebarItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

const navItems: SidebarItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Cases', path: '/cases', icon: FolderSearch },
  { label: 'Investigation', path: '/investigation', icon: Search },
  { label: 'Graph', path: '/graph', icon: Share2 },
  { label: 'Timeline', path: '/timeline', icon: Clock },
  { label: 'Reports', path: '/reports', icon: FileText },
  { label: 'Settings', path: '/settings', icon: Settings },
];

function NavItem({
  item,
  active,
  collapsed,
}: {
  item: SidebarItem;
  active: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.path}
      
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
        active
          ? 'bg-primary/[0.08] text-primary'
          : 'text-text-secondary hover:bg-surface-3/80 hover:text-text'
      } ${collapsed ? 'justify-center px-2' : ''}`}
    >
      {active && (
        <motion.div
          layoutId="activeNav"
          className="absolute -left-3 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary shadow-[0_0_8px_2px_rgba(99,102,241,0.4)]"
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      )}
      <Icon
        size={20}
        className={`shrink-0 transition-colors ${
          active ? 'text-primary' : 'text-text-muted group-hover:text-text'
        }`}
      />
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            transition={{ duration: 0.15, ease: 'easeInOut' as const }}
            className="overflow-hidden whitespace-nowrap"
          >
            {item.label}
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
}

export function Sidebar() {
  const { sidebarOpen, toggleSidebar } = useApp();
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === '/dashboard') return pathname === '/' || pathname === '/dashboard';
    return pathname?.startsWith(path) ?? false;
  };

  useEffect(() => {
    document.body.style.overflow =
      sidebarOpen && window.innerWidth < 768 ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={toggleSidebar}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: sidebarOpen ? 240 : 64,
        }}
        transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
        className={`fixed left-0 top-16 z-50 flex h-[calc(100vh-4rem)] flex-col border-r border-border bg-surface/80 backdrop-blur-2xl supports-[backdrop-filter]:bg-surface/60 ${
          sidebarOpen
            ? 'shadow-xl shadow-black/20'
            : 'shadow-lg shadow-black/10'
        } md:relative md:top-0 md:h-screen ${
          sidebarOpen
            ? 'translate-x-0'
            : '-translate-x-full md:translate-x-0'
        } transition-transform duration-250 ease-out md:transition-none`}
      >
        {/* Logo section in sidebar (desktop collapsed header) */}
        <div
          className={`flex h-16 shrink-0 items-center border-b border-border px-4 ${
            sidebarOpen ? 'justify-between' : 'justify-center'
          }`}
        >
          {sidebarOpen ? (
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20">
                <span className="text-sm font-bold text-white">C</span>
              </div>
              <span className="text-base font-semibold tracking-tight text-text">
                Chronos<span className="text-gradient-primary">Intel</span>
              </span>
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20">
              <span className="text-sm font-bold text-white">C</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavItem
                  item={item}
                  active={isActive(item.path)}
                  collapsed={!sidebarOpen}
                />
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom section */}
        <div className="shrink-0 border-t border-border px-3 py-4">
          <a
            href="#"
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-3 hover:text-text ${
              !sidebarOpen ? 'justify-center px-2' : ''
            }`}
          >
            <HelpCircle size={20} className="shrink-0 text-text-muted" />
            <AnimatePresence initial={false}>
              {sidebarOpen && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15, ease: 'easeInOut' as const }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  Need Help?
                </motion.span>
              )}
            </AnimatePresence>
          </a>
          <AnimatePresence initial={false}>
            {sidebarOpen && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-2 px-3 text-xs text-text-muted"
              >
                v1.0.0
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>
    </>
  );
}

export default Sidebar;
