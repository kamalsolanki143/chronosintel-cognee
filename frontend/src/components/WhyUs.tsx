"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Brain,
  Clock,
  Layers,
  ShieldCheck,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Explainable AI",
    description:
      "Every conclusion cites its source evidence. No black boxes — trace every finding back to the original email, chat, log, or document with full provenance.",
  },
  {
    icon: Clock,
    title: "Temporal Intelligence",
    description:
      "Time-aware knowledge graphs that understand sequence and causality. Reconstruct events in chronological order and detect temporal anomalies.",
  },
  {
    icon: Layers,
    title: "Case Memory",
    description:
      "AI that remembers and learns across investigations. Build institutional knowledge as the platform adapts to your investigative patterns and preferences.",
  },
  {
    icon: ShieldCheck,
    title: "Enterprise Security",
    description:
      "SOC 2 compliant, end-to-end encrypted, and GDPR ready. Your evidence data is isolated, encrypted at rest and in transit, and never used for training.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

export default function WhyUs() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  return (
    <section
      id="why-us"
      ref={sectionRef}
      className="relative py-24 sm:py-32 overflow-hidden"
    >
      {/* Background subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-text mb-4">
            Why Investigators Choose{" "}
            <span className="text-gradient-primary">ChronosIntel</span>
          </h2>
          <p className="mx-auto max-w-2xl text-text-secondary text-lg leading-relaxed">
            Built for analysts, compliance teams, and forensic investigators who
            need clarity at scale.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={cardVariants}
              className="group relative glass-card rounded-2xl p-6 sm:p-8 gradient-border"
            >
              {/* Hover border glow */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10">
                <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 mb-5 group-hover:bg-primary/15 group-hover:border-primary/30 transition-all duration-300">
                  <feature.icon className="w-7 h-7 text-primary-light" />
                </div>
                <h3 className="text-lg font-semibold text-text mb-3 group-hover:text-primary-light transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
