"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, FileText, Sparkles } from "lucide-react";
import { formatRelativeTime } from "@/utils/format";
import { fetchChatHistory, sendChatMessage } from "@/services/investigationService";
import type { ChatMessage } from "@/services/mockData";

interface InvestigationChatProps {
  caseId?: string;
}

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-3"
    >
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="glass-card px-4 py-3 rounded-2xl rounded-tl-sm">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-2 h-2 rounded-full bg-text-muted"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function InvestigationChat({ caseId }: InvestigationChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const history = await fetchChatHistory(caseId || "CASE-001");
        setMessages(history);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [caseId]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, sending]);

  const handleSend = useCallback(
    async (text?: string) => {
      const content = (text || input).trim();
      if (!content || sending) return;

      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}`,
        sender: "user",
        content,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setSending(true);

      try {
        const response = await sendChatMessage(content, caseId || "CASE-001");
        setMessages((prev) => [...prev, response]);
      } finally {
        setSending(false);
      }
    },
    [input, sending, caseId]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full glass-card overflow-hidden"
    >
      <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
        <Sparkles className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-semibold text-text">AI Investigation Chat</h2>
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="skeleton w-8 h-8 rounded-lg shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-4 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="w-12 h-12 text-text-muted mb-3" />
            <p className="text-text-secondary font-medium">No messages yet</p>
            <p className="text-sm text-text-muted mt-1">
              Start the investigation by asking a question
            </p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`flex items-start gap-3 ${
                  msg.sender === "user" ? "flex-row-reverse" : ""
                }`}
              >
                {msg.sender === "ai" ? (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-surface-3 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4 text-text-secondary" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] space-y-2 ${
                    msg.sender === "user" ? "items-end" : ""
                  }`}
                >
                  <div
                    className={`px-4 py-3 rounded-2xl ${
                      msg.sender === "user"
                        ? "bg-primary text-white rounded-tr-sm"
                        : "glass-card rounded-tl-sm"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </p>
                  </div>

                  {msg.citations && msg.citations.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {msg.citations.map((cite, idx) => (
                        <button
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-accent/10 text-accent text-xs font-medium hover:bg-accent/20 transition-colors"
                        >
                          <FileText className="w-3 h-3" />
                          {cite.title}
                        </button>
                      ))}
                    </div>
                  )}

                  {msg.suggestedPrompts && msg.suggestedPrompts.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {msg.suggestedPrompts.map((prompt, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(prompt)}
                          className="px-2.5 py-1 rounded-full border border-border-light text-text-muted text-xs hover:border-primary/50 hover:text-primary transition-colors"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  )}

                  <p
                    className={`text-[11px] text-text-muted px-1 ${
                      msg.sender === "user" ? "text-right" : ""
                    }`}
                  >
                    {formatRelativeTime(msg.timestamp)}
                  </p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {sending && <TypingIndicator />}
      </div>

      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about evidence, entities, or case details..."
            className="flex-1 bg-surface-3 border border-border-light rounded-xl px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary/50 transition-colors"
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSend()}
            disabled={!input.trim() || sending}
            className="p-2.5 rounded-xl bg-primary text-white disabled:bg-surface-3 disabled:text-text-muted transition-colors shadow-lg shadow-primary/20"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
