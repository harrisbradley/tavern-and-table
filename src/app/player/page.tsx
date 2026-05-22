import Link from "next/link";
import PlayerDashboard from "@/components/PlayerDashboard";
import { ArrowLeft } from "lucide-react";

export default function PlayerPage() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-radial from-[#131722] via-[#090b11] to-[#040508] relative overflow-hidden sm:p-6">
      
      {/* Subtle fantasy grid background effect for desktop */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-40" />

      {/* Floating back button for desktop users */}
      <div className="absolute top-4 left-4 z-20 hidden md:block">
        <Link 
          href="/" 
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200 transition-all text-xs font-semibold hover:border-slate-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Tavern
        </Link>
      </div>

      {/* Responsive Simulated 6-inch Mobile viewport container */}
      <div className="w-full h-screen sm:h-[840px] sm:w-[390px] sm:rounded-[44px] sm:border-[10px] sm:border-slate-950 sm:shadow-[0_0_80px_rgba(0,0,0,0.8)] sm:bg-slate-950 relative overflow-hidden flex flex-col flex-shrink-0 animate-fade-in">
        
        {/* Mobile Status Bar Simulation (shows only on desktop/simulated frame) */}
        <div className="hidden sm:flex justify-between items-center px-6 pt-3 pb-2 text-[10px] font-bold text-slate-500 bg-slate-950 select-none shrink-0 z-20">
          <span>T&T Mobile Companion</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-1.5 border border-slate-600 rounded-xs flex items-center justify-center p-0.5"><span className="w-full h-full bg-slate-500 rounded-2xs" /></span>
            <span>9:41 AM</span>
          </div>
        </div>

        {/* Dynamic Mobile Notch / Island */}
        <div className="hidden sm:block absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4.5 bg-slate-950 rounded-full z-30" />

        {/* Header bar for mobile screen containing a tiny exit button for true mobile users */}
        <div className="flex sm:hidden justify-between items-center px-4 py-3 bg-[#0d1322] border-b border-slate-900 select-none">
          <Link href="/" className="text-slate-400 flex items-center gap-1 text-xs font-bold">
            <ArrowLeft className="w-3.5 h-3.5" />
            Exit
          </Link>
          <span className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">Combat Dashboard</span>
          <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Real player dashboard content container */}
        <div className="flex-1 flex flex-col bg-slate-950 relative overflow-hidden">
          <PlayerDashboard />
        </div>

        {/* Mobile home indicator simulation */}
        <div className="hidden sm:block w-32 h-1 bg-slate-800 rounded-full mx-auto my-2 shrink-0 z-20" />
      </div>
    </div>
  );
}
