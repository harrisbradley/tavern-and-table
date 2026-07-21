"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, ChevronLeft, Sparkles, Layout, Type, FileText, Palette, ArrowRight } from "lucide-react";
import Link from "next/link";
import { createCampaign } from "@/lib/syncEngine";

const THEME_COLORS = [
  { id: "indigo", label: "Indigo", bg: "bg-indigo-500", border: "border-indigo-500/30" },
  { id: "emerald", label: "Emerald", bg: "bg-emerald-500", border: "border-emerald-500/30" },
  { id: "amber", label: "Amber", bg: "bg-amber-500", border: "border-amber-500/30" },
  { id: "red", label: "Crimson", bg: "bg-red-500", border: "border-red-500/30" },
  { id: "violet", label: "Violet", bg: "bg-violet-500", border: "border-violet-500/30" },
  { id: "teal", label: "Teal", bg: "bg-teal-500", border: "border-teal-500/30" },
];

export default function CreateCampaignPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [themeColor, setThemeColor] = useState("indigo");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-slugify name into ID
  useEffect(() => {
    if (name) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setId(slug);
    }
  }, [name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !id) return;

    setIsSubmitting(true);
    try {
      await createCampaign({
        id,
        name,
        synopsis,
        themeColor,
        createdAt: new Date().toISOString(),
      });
      router.push(`/dm/${id}`);
    } catch (err) {
      console.error("Failed to create campaign:", err);
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-radial from-theme-radial-start via-theme-radial-mid to-theme-radial-end flex flex-col items-center p-6 sm:p-12">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-20" />

      <div className="z-10 w-full max-w-2xl space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1 text-theme-text-secondary hover:text-theme-text-primary transition-colors text-sm font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Tavern
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            <span className="text-indigo-500 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest">DM Workshop</span>
          </div>
        </div>

        <div className="space-y-2 text-center sm:text-left">
          <h1 className="text-4xl font-black text-theme-text-primary tracking-tight sm:text-5xl">
            Forge Your Campaign
          </h1>
          <p className="text-theme-text-secondary font-medium leading-relaxed max-w-lg">
            Create a dedicated space for your party to track their heroes and roll their destiny.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campaign Name */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-bold text-theme-text-tertiary uppercase tracking-widest ml-1">
              <Type className="w-3.5 h-3.5" />
              Campaign Title
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Lost Mine of Phandelver"
              className="w-full bg-theme-input-bg border border-theme-input-border rounded-2xl px-5 py-4 text-theme-text-primary text-lg placeholder:text-theme-text-tertiary focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          {/* Custom URL ID */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-bold text-theme-text-tertiary uppercase tracking-widest ml-1">
              <Layout className="w-3.5 h-3.5" />
              Invite Slug (URL)
            </label>
            <div className="relative group">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 text-theme-text-tertiary text-sm font-medium pointer-events-none select-none">
                tavern-and-table.app/dm/
              </div>
              <input
                type="text"
                required
                value={id}
                onChange={(e) => setId(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                placeholder="campaign-url-slug"
                className="w-full bg-theme-input-bg border border-theme-input-border rounded-2xl pl-[175px] pr-5 py-4 text-indigo-600 dark:text-indigo-400 font-bold placeholder:text-theme-text-tertiary focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all"
              />
            </div>
            <p className="text-[10px] text-theme-text-tertiary font-medium ml-1">
              This will be the permanent address of your campaign dashboard.
            </p>
          </div>

          {/* Synopsis */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-bold text-theme-text-tertiary uppercase tracking-widest ml-1">
              <FileText className="w-3.5 h-3.5" />
              Adventure Synopsis (Optional)
            </label>
            <textarea
              value={synopsis}
              onChange={(e) => setSynopsis(e.target.value)}
              placeholder="A short hook for your players..."
              rows={3}
              className="w-full bg-theme-input-bg border border-theme-input-border rounded-2xl px-5 py-4 text-theme-text-secondary text-sm placeholder:text-theme-text-tertiary focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/20 transition-all resize-none"
            />
          </div>

          {/* Theme Color */}
          <div className="space-y-3">
            <label className="flex items-center gap-2 text-xs font-bold text-theme-text-tertiary uppercase tracking-widest ml-1">
              <Palette className="w-3.5 h-3.5" />
              Visual Branding
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {THEME_COLORS.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => setThemeColor(color.id)}
                  className={`relative group flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
                    themeColor === color.id
                      ? "border-indigo-500/50 bg-indigo-500/10 dark:border-white/40 dark:bg-white/5"
                      : "border-theme-card-border bg-theme-card-bg/40 hover:border-indigo-500/30 hover:bg-theme-card-bg/80"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full ${color.bg} shadow-lg group-hover:scale-110 transition-transform`} />
                  <span className={`text-[10px] font-bold uppercase tracking-tight ${themeColor === color.id ? "text-theme-text-primary" : "text-theme-text-tertiary"}`}>
                    {color.label}
                  </span>
                  {themeColor === color.id && (
                    <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-indigo-500 dark:bg-white rounded-full flex items-center justify-center border-2 border-theme-radial-start">
                      <Sparkles className="w-2 h-2 text-white dark:text-indigo-600" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={!name || !id || isSubmitting}
              className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-2xl ${
                !name || !id || isSubmitting
                  ? "bg-theme-btn-sec-bg border border-theme-btn-sec-border text-theme-text-tertiary cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20 active:scale-95"
              }`}
            >
              {isSubmitting ? "Brewing Campaign..." : "Unleash Adventure"}
              {!isSubmitting && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
