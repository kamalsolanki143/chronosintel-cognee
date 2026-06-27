"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import {
  Upload,
  ScanSearch,
  Share2,
  Timeline,
  Link2,
  FileText,
} from "lucide-react";

const features = [
  {
    icon: Upload,
    title: "Multi-Source Ingestion",
    description:
      "Upload emails, chat logs, documents, meeting transcripts, and raw log files. ChronosIntel parses and normalizes evidence from over 30 formats.",
  },
  {
    icon: ScanSearch,
    title: "Entity Extraction",
    description:
      "AI identifies people, organizations, events, locations, and relationships across all evidence. Automatically tags and categorizes every entity.",
  },
  {
    icon: Share2,
    title: "Knowledge Graphs",
    description:
      "Visualize connections across all evidence in an interactive, temporal graph. Explore relationships and discover hidden links between entities.",
  },
  {
    icon: Timeline,
    title: "Timeline Reconstruction",
    description:
      "Chronological replay of events with precision timestamps. Filter by date, entity, or evidence type to see exactly what happened and when.",
  },
  {
    icon: Link2,
    title: "Evidence Chaining",
    description:
      "Trace provenance and reasoning paths through the evidence graph. Follow chains of custody and verify the integrity of each finding.",
  },
  {
    icon: FileText,
    title: "Grounded Reports",
    description:
      "Generate findings with cited evidence. Every claim in a report links back to the source material — no hallucination, full traceability.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export default function Features() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  return (
    <section
      id="features"
      ref={sectionRef}
      className="relative py-24 sm:py-32 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] via-transparent to-accent/[0.02] pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-text mb-4">
            Everything You Need to{" "}
            <span className="text-gradient-primary">Investigate at Scale</span>
          </h2>
          <p className="mx-auto max-w-2xl text-text-secondary text-lg leading-relaxed">
            From ingestion to reporting — a unified workflow for modern
            investigative teams.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={cardVariants}
              className="group glass-card rounded-xl p-6 card-hover relative overflow-hidden"
            >
              <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all duration-500" />

              <div className="relative z-10">
                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 border border-primary/20 mb-4 group-hover:bg-primary/15 group-hover:border-primary/30 group-hover:shadow-lg group-hover:shadow-primary/10 transition-all duration-300">
                  <feature.icon className="w-6 h-6 text-primary-light" />
                </div>
                <h3 className="text-base font-semibold text-text mb-2 group-hover:text-primary-light transition-colors duration-300">
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
