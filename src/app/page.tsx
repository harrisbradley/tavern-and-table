import Link from "next/link";
import { Shield, Swords, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-radial from-[#1e1135] via-[#090b12] to-[#040508] relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-indigo-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] rounded-full bg-amber-900/10 blur-[120px] pointer-events-none" />

      {/* Header */}
      <div className="text-center z-10 max-w-xl mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold mb-6 animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          D&D 5e Beginner Companion
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 via-amber-200 to-slate-100 mb-4 font-sans">
          Tavern & Table
        </h1>
        <p className="text-slate-400 text-lg md:text-xl font-medium">
          D&D is for everyone. Choose your screen and start your adventure without the math or the headache.
        </p>
      </div>

      {/* Choose your path cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl z-10">
        
        {/* Player Card */}
        <Link 
          href="/player"
          className="group relative flex flex-col justify-between p-8 rounded-3xl bg-slate-900/40 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900/60 transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] text-left"
        >
          <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-emerald-500 animate-ping group-hover:scale-150 transition-all" />
          
          <div>
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all duration-300">
              <Swords className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-slate-100 group-hover:text-emerald-400 transition-colors mb-3">
              I am a Player
            </h2>
            <p className="text-slate-400 group-hover:text-slate-300 transition-colors text-sm leading-relaxed mb-8">
              Open your combat screen. Manage your health, tap your arsenal to roll 3D dice instantly, and get step-by-step guides on what to do next.
            </p>
          </div>
          
          <div className="flex items-center text-emerald-400 font-semibold text-sm group-hover:translate-x-2 transition-transform duration-300">
            Enter Player Screen &rarr;
          </div>
        </Link>

        {/* DM Card */}
        <Link 
          href="/dm"
          className="group relative flex flex-col justify-between p-8 rounded-3xl bg-slate-900/40 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-900/60 transition-all duration-300 hover:shadow-[0_0_30px_rgba(99,102,241,0.15)] text-left"
        >
          <div>
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-slate-950 transition-all duration-300">
              <Shield className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-slate-100 group-hover:text-indigo-400 transition-colors mb-3">
              I am the DM
            </h2>
            <p className="text-slate-400 group-hover:text-slate-300 transition-colors text-sm leading-relaxed mb-8">
              Open the Dungeon Master dashboard. Monitor player health in real-time, see live dice rolls, and nudge beginners through their turns.
            </p>
          </div>
          
          <div className="flex items-center text-indigo-400 font-semibold text-sm group-hover:translate-x-2 transition-transform duration-300">
            Open DM Dashboard &rarr;
          </div>
        </Link>
        
      </div>

      {/* Footer info */}
      <div className="mt-16 text-center text-xs text-slate-600 font-medium tracking-wide z-10 uppercase">
        Optimized for Mobile viewports &bull; Powered by 3D Physics Dice
      </div>
    </main>
  );
}
