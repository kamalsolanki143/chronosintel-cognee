"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Calendar } from "lucide-react";

export default function CTA() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section
      ref={sectionRef}
      className="relative py-20 sm:py-28 overflow-hidden"
    >
      {/* Premium gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.08] via-surface to-accent/[0.06]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/[0.04] rounded-full blur-[120px]" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 mx-auto max-w-4xl px-4 text-center"
      >
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-text mb-4">
          Ready to Transform Your{" "}
          <span className="text-gradient-primary">Investigations</span>?
        </h2>
        <p className="mx-auto max-w-xl text-text-secondary text-lg leading-relaxed mb-10">
          Join leading enterprise teams that use ChronosIntel to cut
          investigation time by 70% and uncover insights they were missing.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-3.5 text-base font-semibold text-white bg-primary hover:bg-primary-dark rounded-xl transition-all duration-200 shadow-xl shadow-primary/30 hover:shadow-primary/50 hover:scale-[1.02] active:scale-[0.98]"
          >
            Start Free Trial
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="#"
            className="inline-flex items-center gap-2 px-8 py-3.5 text-base font-semibold text-text-secondary border border-border hover:border-accent/40 hover:text-text rounded-xl transition-all duration-200 hover:bg-surface-2/50 group"
          >
            <Calendar className="w-4 h-4 group-hover:text-accent transition-colors" />
            Request Demo
          </a>
        </div>
      </motion.div>
    </section>
  );
}
