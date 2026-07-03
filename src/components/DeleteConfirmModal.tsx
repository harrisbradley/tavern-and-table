"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  itemName: string;
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
}: DeleteConfirmModalProps) {
  const [typedConfirm, setTypedConfirm] = useState("");

  // Reset text when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setTypedConfirm("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (typedConfirm === "DELETE") {
      onConfirm();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Box */}
      <div className="relative z-10 w-full max-w-md bg-theme-card-bg border border-theme-card-border rounded-[32px] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col space-y-6">
        
        {/* Header */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-theme-text-primary">{title}</h3>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Warning Action</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-500/10 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <p className="text-theme-text-secondary text-sm leading-relaxed">
            {description}{" "}
            <span className="font-bold text-theme-text-primary">"{itemName}"</span>? This action is permanent and cannot be undone.
          </p>
          <div className="p-3.5 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-450 dark:text-red-400 text-xs leading-relaxed font-semibold">
            To proceed, type <span className="underline font-black text-red-700 dark:text-red-300">DELETE</span> in the confirmation input box below.
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleConfirmSubmit} className="space-y-4">
          <input
            autoFocus
            type="text"
            required
            placeholder="Type DELETE to confirm"
            value={typedConfirm}
            onChange={(e) => setTypedConfirm(e.target.value)}
            className="w-full bg-theme-input-bg border border-theme-input-border rounded-xl px-4 py-3 text-center text-sm font-bold text-theme-text-primary focus:outline-none focus:border-red-500/60 focus:ring-1 focus:ring-red-500/20 transition-all uppercase placeholder:text-slate-550"
          />

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-theme-btn-sec-bg border border-theme-btn-sec-border text-theme-btn-sec-text hover:text-theme-text-primary font-bold text-xs uppercase tracking-widest transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={typedConfirm !== "DELETE"}
              className="flex-1 py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:pointer-events-none text-white font-black text-xs uppercase tracking-widest transition-all shadow-md active:scale-95"
            >
              Delete Permanently
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
