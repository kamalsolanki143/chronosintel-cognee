"use client";

import { useState, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "What types of evidence can I upload?",
    answer:
      "ChronosIntel supports emails (.eml, .msg), chat exports (Slack, Teams, Discord), documents (PDF, DOCX, TXT), meeting transcripts, log files, spreadsheets (CSV, XLSX), and structured data via API. Our ingestion pipeline normalizes all formats into a unified evidence model.",
  },
  {
    question: "How does the temporal knowledge graph work?",
    answer:
      "Our AI extracts entities (people, organizations, events) from every piece of evidence and links them based on temporal co-occurrence, communication patterns, and semantic relationships. Each relationship carries timestamps, allowing you to replay events chronologically and detect temporal anomalies.",
  },
  {
    question: "Is my data secure and encrypted?",
    answer:
      "Yes. All data is encrypted at rest using AES-256 and in transit via TLS 1.3. We are SOC 2 Type II certified, GDPR compliant, and offer dedicated single-tenant deployments for enterprise customers. Your evidence is never used to train or improve models outside your tenancy.",
  },
  {
    question: "Can I collaborate with my team?",
    answer:
      "Absolutely. ChronosIntel supports real-time collaborative investigations with shared cases, role-based access controls, comments, and audit logging. Team members can work on the same evidence set simultaneously with changes synchronized instantly.",
  },
  {
    question: "How are reports generated?",
    answer:
      "Reports are built from your investigation findings with one click. The AI drafts structured reports that include a timeline of events, entity relationship maps, key findings, and cited evidence. Every claim includes a direct link to the source evidence for verification.",
  },
  {
    question: "Do you support custom integrations?",
    answer:
      "Yes. We offer a REST API and webhooks for ingesting evidence, querying the knowledge graph, and exporting findings. We also provide pre-built connectors for common SIEM, case management, and collaboration tools. Custom integration support is available for enterprise plans.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      id="faq"
      ref={sectionRef}
      className="relative py-24 sm:py-32 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-accent/[0.02] via-transparent to-transparent pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-text mb-4">
            Frequently Asked{" "}
            <span className="text-gradient-primary">Questions</span>
          </h2>
          <p className="mx-auto max-w-xl text-text-secondary text-lg leading-relaxed">
            Everything you need to know about ChronosIntel.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass-strong rounded-2xl divide-y divide-border/60 overflow-hidden"
        >
          {faqs.map((faq, index) => (
            <div key={index}>
              <button
                onClick={() => toggle(index)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors duration-200 hover:bg-surface-2/50"
                aria-expanded={openIndex === index}
              >
                <span className="text-sm sm:text-base font-medium text-text">
                  {faq.question}
                </span>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="shrink-0"
                >
                  <ChevronDown className="w-5 h-5 text-text-muted" />
                </motion.div>
              </button>
              <AnimatePresence initial={false}>
                {openIndex === index && (
                  <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 pt-0">
                      <p className="text-sm text-text-secondary leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
