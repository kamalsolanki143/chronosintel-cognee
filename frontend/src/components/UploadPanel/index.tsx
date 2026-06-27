"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CloudUpload,
  FileText,
  Mail,
  MessageSquare,
  Terminal,
  Code,
  Video,
  File,
  X,
  Upload,
} from "lucide-react";

interface UploadFile {
  id: string;
  name: string;
  size: string;
  type: string;
  progress: number;
  status: "pending" | "uploading" | "complete" | "error";
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  email: <Mail className="w-4 h-4" />,
  chat: <MessageSquare className="w-4 h-4" />,
  document: <FileText className="w-4 h-4" />,
  log: <Terminal className="w-4 h-4" />,
  code: <Code className="w-4 h-4" />,
  meeting: <Video className="w-4 h-4" />,
  other: <File className="w-4 h-4" />,
};

const FILE_TYPE_FILTERS = ["PDF", "DOCX", "TXT", "CSV", "EML", "LOG", "JSON"];

function getFileType(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["pdf", "docx", "doc", "txt", "csv"].includes(ext)) return "document";
  if (["eml", "msg"].includes(ext)) return "email";
  if (["json", "xml", "html"].includes(ext)) return "code";
  if (["log"].includes(ext)) return "log";
  if (["mp4", "webm", "avi"].includes(ext)) return "meeting";
  return "other";
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadPanel() {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((fileList: FileList) => {
    const newFiles: UploadFile[] = Array.from(fileList).map((f, i) => ({
      id: `file-${Date.now()}-${i}`,
      name: f.name,
      size: formatSize(f.size),
      type: getFileType(f.name),
      progress: 0,
      status: "pending" as const,
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      if (e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragging(false);
  }, []);

  const handleClickInput = () => {
    inputRef.current?.click();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
      e.target.value = "";
    }
  };

  const handleUpload = async () => {
    if (files.length === 0 || uploading) return;
    setUploading(true);

    for (const file of files) {
      if (file.status === "complete") continue;
      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id ? { ...f, status: "uploading" as const } : f
        )
      );

      for (let p = 0; p <= 100; p += 10) {
        await new Promise((r) => setTimeout(r, 150));
        setFiles((prev) =>
          prev.map((f) =>
            f.id === file.id ? { ...f, progress: p } : f
          )
        );
      }

      setFiles((prev) =>
        prev.map((f) =>
          f.id === file.id
            ? { ...f, status: "complete" as const, progress: 100 }
            : f
        )
      );
    }

    setUploading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClickInput}
        className={`relative cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-all duration-300 ${
          dragging
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-border-light hover:border-primary/50 hover:bg-surface-2/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.docx,.doc,.txt,.csv,.eml,.log,.json,.xml,.html,.msg,.mp4,.webm"
          onChange={handleInputChange}
          className="hidden"
        />
        <motion.div
          animate={dragging ? { y: -5 } : { y: 0 }}
          className="flex flex-col items-center gap-3"
        >
          <CloudUpload
            className={`w-12 h-12 ${
              dragging ? "text-primary" : "text-text-muted"
            }`}
          />
          <div>
            <p className="text-text font-medium">
              {dragging ? "Drop files here" : "Drag & drop evidence files here"}
            </p>
            <p className="text-sm text-text-muted mt-1">
              or click to browse files
            </p>
          </div>
        </motion.div>
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {FILE_TYPE_FILTERS.map((t) => (
            <span
              key={t}
              className="px-2.5 py-1 text-xs font-medium rounded-md bg-surface-3 text-text-secondary"
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      <AnimatePresence mode="popLayout">
        {files.map((file) => (
          <motion.div
            key={file.id}
            layout
            initial={{ opacity: 0, x: -20, height: 0 }}
            animate={{ opacity: 1, x: 0, height: "auto" }}
            exit={{ opacity: 0, x: 20, height: 0 }}
            transition={{ duration: 0.3 }}
            className="glass-card p-4 flex items-center gap-4"
          >
            <div className="w-9 h-9 rounded-lg bg-surface-3 flex items-center justify-center text-text-secondary shrink-0">
              {TYPE_ICONS[file.type] || TYPE_ICONS.other}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-text truncate">
                  {file.name}
                </span>
                <span className="text-xs text-text-muted shrink-0">{file.size}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-1.5 rounded-full bg-surface-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${file.progress}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className={`h-full rounded-full ${
                      file.status === "complete"
                        ? "bg-success"
                        : file.status === "error"
                          ? "bg-danger"
                          : "bg-primary"
                    }`}
                  />
                </div>
                <span
                  className={`text-xs font-medium shrink-0 ${
                    file.status === "complete"
                      ? "text-success"
                      : file.status === "error"
                        ? "text-danger"
                        : file.status === "uploading"
                          ? "text-primary"
                          : "text-text-muted"
                  }`}
                >
                  {file.status === "pending"
                    ? "Pending"
                    : file.status === "uploading"
                      ? `${Math.round(file.progress)}%`
                      : file.status === "complete"
                        ? "Complete"
                        : "Error"}
                </span>
              </div>
            </div>
            <button
              onClick={() => removeFile(file.id)}
              className="p-1.5 rounded-lg hover:bg-surface-3 text-text-muted hover:text-danger transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      {files.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8"
        >
          <File className="w-8 h-8 text-text-muted mx-auto mb-2" />
          <p className="text-sm text-text-muted">No files selected</p>
        </motion.div>
      )}

      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={handleUpload}
        disabled={files.length === 0 || uploading}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
          files.length === 0 || uploading
            ? "bg-surface-3 text-text-muted cursor-not-allowed"
            : "bg-primary text-white hover:bg-primary-dark shadow-lg shadow-primary/20"
        }`}
      >
        <Upload className="w-4 h-4" />
        {uploading ? "Uploading..." : "Upload Evidence Files"}
      </motion.button>
    </motion.div>
  );
}
