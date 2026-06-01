"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Shield, Swords, Sparkles, Clock, ArrowRight } from "lucide-react";

interface RecentCampaign {
  id: string;
  name: string;
  themeColor: string;
}

export default function Home() {
  const [recentCampaigns, setRecentCampaigns] = useState<RecentCampaign[]>([]);

  useEffect(() => {
    // Load recently visited/created DM campaigns from localStorage
    const saved = localStorage.getItem("tt_dm_history");
    if (saved) {
      try {
        setRecentCampaigns(JSON.parse(saved));
      } catch (err) {
        console.error("Failed to parse DM history:", err);
      }
    }
  }, []);

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-radial from-[#1e1135] via-[#090b12] to-[#040508] relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none opacity-20" />
      
      {/* Hero section */}
      <div className="text-center z-10 space-y-4 mb-12 animate-fade-in">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl">
            <Shield className="w-10 h-10 text-indigo-400" />
          </div>
          <div className="h-10 w-px bg-slate-800" />
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl">
            <Swords className="w-10 h-10 text-amber-500" />
          </div>
        </div>
        <h1 className="text-5xl font-black text-white tracking-tighter sm:text-6xl lg:text-7xl">
          Tavern &amp; Table
        </h1>
        <p className="text-slate-400 text-lg sm:text-xl font-medium max-w-md mx-auto leading-relaxed">
          The ultimate mobile-first companion for your D&amp;D campaign. 3D dice, real-time sync, pure adventure.
        </p>
      </div>

      {/* Main Actions */}
      <div className="flex flex-col gap-8 w-full max-w-2xl z-10 animate-slide-up">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
          <Link
            href="/campaign/create"
            className="group relative flex flex-col items-center gap-4 p-8 rounded-[32px] bg-slate-900/40 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900/60 transition-all duration-500 text-center"
          >
            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 group-hover:scale-110 transition-transform duration-500">
              <Shield className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">I am the DM</h3>
              <p className="text-slate-500 text-sm leading-snug">
                Create a new campaign and manage your party's initiative and health.
              </p>
            </div>
            <div className="absolute inset-0 rounded-[32px] bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </Link>

          <div className="group relative flex flex-col items-center gap-4 p-8 rounded-[32px] bg-slate-900/40 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-900/60 transition-all duration-500 text-center cursor-default">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 group-hover:scale-110 transition-transform duration-500">
              <Sparkles className="w-8 h-8 text-amber-500" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">I am a Player</h3>
              <p className="text-slate-500 text-sm leading-snug">
                Join your DM's campaign via invite link to roll dice and track your character.
              </p>
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full px-8">
              <div className="text-[10px] font-black text-amber-500/60 uppercase tracking-[0.2em] animate-pulse">
                Ask your DM for a link
              </div>
            </div>
            <div className="absolute inset-0 rounded-[32px] bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </div>
        </div>

        {/* Recent DM Campaigns */}
        {recentCampaigns.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Clock className="w-4 h-4 text-slate-500" />
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Resume Your Campaigns</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recentCampaigns.map((camp) => (
                <Link
                  key={camp.id}
                  href={`/dm/${camp.id}`}
                  className="group flex items-center justify-between p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full bg-${camp.themeColor}-500 shadow-[0_0_8px_rgba(var(--color-${camp.themeColor}-500),0.5)]`} />
                    <span className="font-bold text-slate-200 group-hover:text-white transition-colors">{camp.name}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-1 transition-all" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="mt-16 text-center text-xs text-slate-600 font-medium tracking-wide z-10 uppercase">
        Optimized for Mobile viewports &bull; Powered by 3D Physics Dice
      </div>
    </main>
  );
}

