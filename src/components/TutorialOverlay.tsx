"use client";

import { X, Sparkles, AlertCircle, Play, CheckCircle2, Footprints } from "lucide-react";

export type TutorialStep =
  | { type: "idle" }
  | { type: "rolling"; actionName: string }
  | { 
      type: "attack-rolled"; 
      weaponName: string; 
      rollTotal: number; 
      modifier: number; 
      dieResult: number;
      damageNotation: string; 
    }
  | { 
      type: "damage-rolled"; 
      weaponName: string; 
      rollTotal: number; 
      damageType: string; 
    }
  | { type: "move-clicked"; distance: number }
  | { type: "stealth-rolled"; rollTotal: number }
  | { type: "potion-drank"; healAmount: number; currentHp: number };

interface TutorialOverlayProps {
  step: TutorialStep;
  onClose: () => void;
  onRollDamage?: () => void;
}

export default function TutorialOverlay({ step, onClose, onRollDamage }: TutorialOverlayProps) {
  if (step.type === "idle") {
    // Show a subtle tutorial tip bar at the bottom instead of a full screen blocking dialog
    return (
      <div className="bg-slate-900/90 border-t border-slate-800 p-4 text-center select-none animate-pulse-glow flex items-center justify-center gap-2">
        <Sparkles className="w-4.5 h-4.5 text-gold shrink-0" />
        <span className="text-sm font-semibold text-slate-200">
          Tip: Tap any card in <strong className="text-gold">The Arsenal</strong> to roll!
        </span>
      </div>
    );
  }

  return (
    <div className="absolute inset-x-0 bottom-0 z-45 p-4 bg-gradient-to-t from-slate-950 via-slate-950/95 to-slate-950/90 border-t border-slate-800 shadow-[0_-10px_30px_rgba(0,0,0,0.5)] rounded-t-3xl transition-all duration-300 animate-slide-up">
      
      {/* Top indicator bar */}
      <div className="w-12 h-1.5 bg-slate-800 rounded-full mx-auto mb-4" />

      {/* Main card header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {step.type === "rolling" && (
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
          )}
          {step.type === "attack-rolled" && (
            <div className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
              Attack Roll
            </div>
          )}
          {step.type === "damage-rolled" && (
            <div className="px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider">
              Damage Roll
            </div>
          )}
          {step.type === "stealth-rolled" && (
            <div className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider">
              Stealth Roll
            </div>
          )}
          {step.type === "move-clicked" && (
            <div className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
              Movement
            </div>
          )}
          {step.type === "potion-drank" && (
            <div className="px-2.5 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold uppercase tracking-wider">
              Item Used
            </div>
          )}
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">
            {step.type === "rolling" ? "Action in progress" : "What to do next"}
          </span>
        </div>
        <button 
          onClick={onClose}
          className="p-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main body content */}
      <div className="space-y-4 mb-6">
        {step.type === "rolling" && (
          <div className="py-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full border-4 border-amber-500/30 border-t-amber-500 animate-spin mx-auto" />
            <h3 className="text-lg font-bold text-slate-200">
              Rolling 3D Physics Dice...
            </h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Watch the dice roll across your screen! We are calculating your results.
            </p>
          </div>
        )}

        {step.type === "attack-rolled" && (
          <div className="space-y-3.5">
            <div className="flex items-center gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
              <div className="text-center">
                <span className="text-xs text-slate-500 block font-bold uppercase tracking-wider">Total</span>
                <span className="text-4xl font-extrabold text-emerald-400">{step.rollTotal}</span>
              </div>
              <div className="text-xs text-slate-400 border-l border-slate-800 pl-4 py-1 leading-relaxed">
                Dice Result: <span className="text-slate-200 font-bold">{step.dieResult}</span> on d20 <br/>
                Attack Modifier: <span className="text-slate-200 font-bold">+{step.modifier}</span>
              </div>
            </div>
            
            <div className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl space-y-2">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <h4 className="font-bold text-slate-100 text-sm">Step 1: Tell your Dungeon Master</h4>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed font-medium pl-7">
                Say: <strong className="text-emerald-400 text-base">"I got a {step.rollTotal} to hit!"</strong>
              </p>
              <p className="text-xs text-slate-400 leading-relaxed pl-7">
                If {step.rollTotal} matches or beats the monster's Armor Class (AC), you hit them!
              </p>
            </div>

            <div className="bg-slate-900/80 p-4 rounded-2xl space-y-3">
              <div className="flex gap-2">
                <Play className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <h4 className="font-bold text-slate-200 text-xs uppercase tracking-wider">Step 2: Roll your damage</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Once the DM confirms that your attack hit, tap this button to roll damage:
              </p>
              <button
                onClick={onRollDamage}
                className="w-full py-3 px-4 rounded-xl bg-gold hover:bg-gold-hover text-slate-950 font-bold text-sm tracking-wide transition-all shadow-[0_4px_12px_rgba(245,158,11,0.2)] flex items-center justify-center gap-2 hover:scale-[1.02]"
              >
                <span>Roll {step.damageNotation} Damage</span>
              </button>
            </div>
          </div>
        )}

        {step.type === "damage-rolled" && (
          <div className="space-y-3.5">
            <div className="flex items-center gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
              <div className="text-center">
                <span className="text-xs text-slate-500 block font-bold uppercase tracking-wider">Damage</span>
                <span className="text-4xl font-extrabold text-red-400">{step.rollTotal}</span>
              </div>
              <div className="text-xs text-slate-400 border-l border-slate-800 pl-4 py-1 leading-relaxed">
                Type: <span className="text-slate-200 font-bold capitalize">{step.damageType}</span> <br/>
                Weapon: <span className="text-slate-200 font-bold">{step.weaponName}</span>
              </div>
            </div>

            <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-2xl space-y-2">
              <div className="flex gap-2">
                <CheckCircle2 className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <h4 className="font-bold text-slate-100 text-sm">Tell your Dungeon Master</h4>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed font-medium pl-7">
                Say: <strong className="text-red-400 text-base">"I deal {step.rollTotal} {step.damageType} damage!"</strong>
              </p>
              <p className="text-xs text-slate-400 leading-relaxed pl-7">
                The DM will subtract this from the monster's health. Nice hit!
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-sm tracking-wide transition-all text-center block"
            >
              End Turn / Reset
            </button>
          </div>
        )}

        {step.type === "stealth-rolled" && (
          <div className="space-y-3.5">
            <div className="flex items-center gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
              <div className="text-center">
                <span className="text-xs text-slate-500 block font-bold uppercase tracking-wider">Total</span>
                <span className="text-4xl font-extrabold text-indigo-400">{step.rollTotal}</span>
              </div>
              <div className="text-xs text-slate-400 border-l border-slate-800 pl-4 py-1 leading-relaxed">
                Check: <span className="text-slate-200 font-bold">Stealth (Dexterity)</span> <br/>
                Notation: <span className="text-slate-200 font-bold">1d20 + 2</span>
              </div>
            </div>

            <div className="bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-2xl space-y-2">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <h4 className="font-bold text-slate-100 text-sm">Tell your Dungeon Master</h4>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed font-medium pl-7">
                Say: <strong className="text-indigo-400 text-base">"I got a {step.rollTotal} for Stealth!"</strong>
              </p>
              <p className="text-xs text-slate-400 leading-relaxed pl-7">
                The DM will compare this to the monster's Passive Perception. If your roll is higher, you are hidden!
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-sm tracking-wide transition-all text-center block"
            >
              Finish Action
            </button>
          </div>
        )}

        {step.type === "move-clicked" && (
          <div className="space-y-3.5">
            <div className="flex items-center gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
              <Footprints className="w-10 h-10 text-blue-400 shrink-0" />
              <div className="text-xs text-slate-400 leading-relaxed">
                Speed: <span className="text-slate-200 font-bold">{step.distance} feet</span> <br/>
                Grid Squares: <span className="text-slate-200 font-bold">{step.distance / 5} squares</span>
              </div>
            </div>

            <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-2xl space-y-2">
              <h4 className="font-bold text-slate-100 text-sm">Movement Instructions</h4>
              <p className="text-sm text-slate-300 leading-relaxed pl-1">
                You can move up to <strong className="text-blue-400">{step.distance} feet</strong> on your turn. 
              </p>
              <ul className="text-xs text-slate-400 leading-relaxed pl-5 list-disc space-y-1">
                <li>On a grid map, this is exactly <strong className="text-slate-200">{step.distance / 5} squares</strong>.</li>
                <li>You can move, attack, and then move again if you have feet remaining!</li>
                <li>Moving past enemies may trigger an "opportunity attack" against you, so be careful.</li>
              </ul>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-sm tracking-wide transition-all text-center block"
            >
              Done Moving
            </button>
          </div>
        )}

        {step.type === "potion-drank" && (
          <div className="space-y-3.5">
            <div className="flex items-center gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
              <div className="text-center">
                <span className="text-xs text-slate-500 block font-bold uppercase tracking-wider">Healed</span>
                <span className="text-4xl font-extrabold text-teal-400">+{step.healAmount}</span>
              </div>
              <div className="text-xs text-slate-400 border-l border-slate-800 pl-4 py-1 leading-relaxed">
                Item: <span className="text-slate-200 font-bold">Potion of Healing</span> <br/>
                New HP: <span className="text-slate-200 font-bold">{step.currentHp} HP</span>
              </div>
            </div>

            <div className="bg-teal-500/5 border border-teal-500/10 p-4 rounded-2xl space-y-1">
              <h4 className="font-bold text-slate-100 text-sm">Health Restored!</h4>
              <p className="text-sm text-slate-300 leading-relaxed">
                You rolled <strong className="text-teal-400">2d4 + 2</strong> and restored <strong className="text-teal-400">{step.healAmount} hit points</strong>.
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                Your health bar has been updated. Tell your DM: <strong className="text-slate-200">"I drank a potion and healed for {step.healAmount} HP!"</strong>
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 font-semibold text-sm tracking-wide transition-all text-center block"
            >
              Okay!
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
