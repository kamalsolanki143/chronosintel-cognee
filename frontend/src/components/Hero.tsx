"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Play, Shield, Lock, FileCheck } from "lucide-react";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const trustItems = [
  { icon: Shield, label: "SOC 2 Compliant" },
  { icon: Lock, label: "End-to-End Encryption" },
  { icon: FileCheck, label: "GDPR Compliant" },
];

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-24 pb-16"
    >
      {/* Animated grid background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(99, 102, 241, 0.3) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99, 102, 241, 0.3) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(6, 182, 212, 0.2) 1px, transparent 1px),
              linear-gradient(90deg, rgba(6, 182, 212, 0.2) 1px, transparent 1px)
            `,
            backgroundSize: "240px 240px",
          }}
        />
      </div>

      {/* Aurora / glow behind headline */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] pointer-events-none">
        <div className="absolute inset-0 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-accent/5 rounded-full blur-[100px] translate-x-32 translate-y-10" />
      </div>

      {/* Floating graph visualization mockup */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={isInView ? { opacity: 0.6, scale: 1, y: 0 } : {}}
        transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
        className="absolute right-[5%] top-[20%] hidden lg:block pointer-events-none"
      >
        <motion.div
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="relative w-[420px] h-[320px]"
        >
          {/* Mock graph panel */}
          <div className="glass-strong rounded-2xl p-5 w-full h-full border border-white/[0.08]">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-danger" />
              <div className="w-3 h-3 rounded-full bg-warning" />
              <div className="w-3 h-3 rounded-full bg-success" />
              <div className="ml-3 text-xs text-text-muted font-mono">
                knowledge_graph — temporal v2.4
              </div>
            </div>
            <div className="relative w-full h-[200px]">
              {/* Nodes and edges */}
              <svg className="w-full h-full" viewBox="0 0 300 200">
                <line x1="80" y1="40" x2="150" y2="30" stroke="#6366f1" strokeWidth="1.5" opacity="0.5" />
                <line x1="150" y1="30" x2="220" y2="60" stroke="#6366f1" strokeWidth="1.5" opacity="0.5" />
                <line x1="80" y1="40" x2="60" y2="110" stroke="#06b6d4" strokeWidth="1.5" opacity="0.4" />
                <line x1="150" y1="30" x2="140" y2="120" stroke="#06b6d4" strokeWidth="1.5" opacity="0.4" />
                <line x1="220" y1="60" x2="180" y2="140" stroke="#06b6d4" strokeWidth="1.5" opacity="0.4" />
                <line x1="60" y1="110" x2="140" y2="120" stroke="#818cf8" strokeWidth="1.5" opacity="0.3" />
                <line x1="140" y1="120" x2="180" y2="140" stroke="#818cf8" strokeWidth="1.5" opacity="0.3" />
                <line x1="80" y1="40" x2="220" y2="60" stroke="#818cf8" strokeWidth="1" opacity="0.2" />

                <circle cx="80" cy="40" r="6" fill="#6366f1" className="animate-pulse" style={{ animationDuration: "3s" }} />
                <circle cx="150" cy="30" r="8" fill="#818cf8" className="animate-pulse" style={{ animationDuration: "2.5s" }} />
                <circle cx="220" cy="60" r="6" fill="#6366f1" className="animate-pulse" style={{ animationDuration: "3.5s" }} />
                <circle cx="60" cy="110" r="5" fill="#06b6d4" />
                <circle cx="140" cy="120" r="7" fill="#22d3ee" className="animate-pulse" style={{ animationDuration: "2s" }} />
                <circle cx="180" cy="140" r="5" fill="#06b6d4" />
              </svg>
              <div className="absolute top-6 left-16 text-[10px] text-primary-light font-mono">
                person:john_doe
              </div>
              <div className="absolute top-2 left-36 text-[10px] text-accent-light font-mono">
                event:meeting_04
              </div>
              <div className="absolute top-16 right-4 text-[10px] text-text-muted font-mono">
                org:acme_corp
              </div>
              <div className="absolute bottom-10 left-8 text-[10px] text-text-muted font-mono">
                document:report_q3
              </div>
              <div className="absolute bottom-12 left-28 text-[10px] text-accent-light font-mono">
                comm:slack_#eng
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Main content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        className="relative z-10 mx-auto max-w-4xl px-4 text-center"
      >
        <motion.div variants={itemVariants} className="mb-6">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold tracking-wider uppercase text-primary-light bg-primary/10 rounded-full border border-primary/20">
            AI-Powered Investigation Platform
          </span>
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6"
        >
          <span className="text-text">Uncover Truth Hidden in</span>
          <br />
          <span className="text-gradient-primary">Enterprise Evidence</span>
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="mx-auto max-w-2xl text-lg sm:text-xl text-text-secondary leading-relaxed mb-10"
        >
          ChronosIntel transforms scattered evidence into time-aware knowledge
          graphs. Upload emails, chats, logs, and documents — our AI maps
          connections, reconstructs timelines, and surfaces findings with
          grounded citations.
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-3.5 text-base font-semibold text-white bg-primary hover:bg-primary-dark rounded-xl transition-all duration-200 shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] active:scale-[0.98]"
          >
            Start Investigation
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="#features"
            onClick={(e) => {
              e.preventDefault();
              document.querySelector("#features")?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }}
            className="inline-flex items-center gap-2 px-8 py-3.5 text-base font-semibold text-text-secondary border border-border hover:border-primary/40 hover:text-text rounded-xl transition-all duration-200 hover:bg-surface-2/50 group"
          >
            <Play className="w-4 h-4 group-hover:text-primary transition-colors" />
            See How It Works
          </a>
        </motion.div>
      </motion.div>

      {/* Trust strip */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: 1.2 }}
        className="relative z-10 mt-20 w-full max-w-3xl mx-auto px-4"
      >
        <p className="text-center text-xs font-medium text-text-muted uppercase tracking-widest mb-5">
          Trusted by Enterprise Security Teams
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {trustItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 text-sm text-text-secondary"
            >
              <item.icon className="w-4 h-4 text-primary-light" />
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
