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
  | { type: "potion-drank"; healAmount: number; currentHp: number }
  | { type: "rest-completed"; healAmount: number; currentHp: number; isLongRest: boolean }
  | { type: "check-rolled"; checkName: string; rollTotal: number; modifier: number; dieResult: number; notation: string };

interface TutorialOverlayProps {
  step: TutorialStep;
  onClose: () => void;
  onRollDamage?: () => void;
  compact?: boolean;
}

export default function TutorialOverlay({ step, onClose, onRollDamage, compact }: TutorialOverlayProps) {
  // Compact mode — veterans see the result number, none of the tutorial text
  if (compact) {
    if (step.type === "idle") return null;

    if (step.type === "rolling") {
      return (
        <div className="absolute inset-x-0 bottom-0 z-45 p-4 bg-theme-card-bg/95 backdrop-blur-md border-t border-theme-card-border rounded-t-3xl">
          <div className="w-12 h-1.5 bg-theme-btn-sec-border rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-center gap-3 py-3">
            <div className="w-5 h-5 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
            <span className="text-sm font-semibold text-theme-text-secondary">Rolling {step.actionName}…</span>
          </div>
        </div>
      );
    }

    const resultValue =
      step.type === "attack-rolled" ? step.rollTotal :
      step.type === "damage-rolled" ? step.rollTotal :
      step.type === "stealth-rolled" ? step.rollTotal :
      step.type === "check-rolled" ? step.rollTotal :
      step.type === "potion-drank" ? `+${step.healAmount}` :
      step.type === "rest-completed" ? (step.isLongRest ? "Full" : `+${step.healAmount}`) :
      step.type === "move-clicked" ? `${step.distance}ft` : null;

    const resultLabel =
      step.type === "attack-rolled" ? "To Hit" :
      step.type === "damage-rolled" ? "Damage" :
      step.type === "stealth-rolled" ? "Stealth" :
      step.type === "check-rolled" ? "Result" :
      step.type === "potion-drank" ? "Healed" :
      step.type === "move-clicked" ? "Movement" : "";

    const resultDetail =
      step.type === "attack-rolled" ? `${step.dieResult} on d20 + ${step.modifier} modifier` :
      step.type === "damage-rolled" ? `${step.damageType} · ${step.weaponName}` :
      step.type === "check-rolled" ? `${step.checkName} (${step.dieResult} on die + ${step.modifier})` :
      step.type === "move-clicked" ? `${step.distance / 5} squares on a grid` : null;

    return (
      <div className="absolute inset-x-0 bottom-0 z-45 p-4 bg-theme-card-bg/95 backdrop-blur-md border-t border-theme-card-border shadow-[0_-10px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_-10px_30px_rgba(0,0,0,0.5)] rounded-t-3xl transition-all duration-300 animate-slide-up">
        <div className="w-12 h-1.5 bg-theme-btn-sec-border rounded-full mx-auto mb-4" />
        <div className="flex items-center gap-4 bg-theme-btn-sec-bg border border-theme-btn-sec-border p-4 rounded-2xl mb-4">
          <div className="text-center">
            <span className="text-xs text-theme-text-tertiary block font-bold uppercase tracking-wider mb-1">{resultLabel}</span>
            <span className="text-4xl font-extrabold text-amber-500">{resultValue}</span>
          </div>
          {resultDetail && (
            <div className="text-xs text-theme-text-secondary border-l border-theme-btn-sec-border/60 pl-4 leading-relaxed">{resultDetail}</div>
          )}
        </div>
        {step.type === "attack-rolled" && onRollDamage && (
          <button
            onClick={onRollDamage}
            className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm tracking-wide transition-all mb-3 flex items-center justify-center gap-2"
          >
            Roll {step.damageNotation} Damage
          </button>
        )}
        <button
          onClick={onClose}
          className="w-full py-3 px-4 rounded-xl bg-theme-btn-sec-bg border border-theme-btn-sec-border text-theme-btn-sec-text hover:text-theme-text-primary font-semibold text-sm transition-all"
        >
          {step.type === "attack-rolled" && onRollDamage ? "Skip Damage" : "Dismiss"}
        </button>
      </div>
    );
  }

  if (step.type === "idle") {
    // Show a subtle tutorial tip bar at the bottom instead of a full screen blocking dialog
    return (
      <div className="bg-theme-card-bg/95 border-t border-theme-card-border p-4 text-center select-none animate-pulse-glow flex items-center justify-center gap-2">
        <Sparkles className="w-4.5 h-4.5 text-amber-500 shrink-0" />
        <span className="text-sm font-semibold text-theme-text-primary">
          Tip: Tap any card in <strong className="text-amber-600 dark:text-amber-500">The Arsenal</strong> to roll!
        </span>
      </div>
    );
  }

  return (
    <div className="absolute inset-x-0 bottom-0 z-45 p-4 bg-theme-card-bg/95 backdrop-blur-md border-t border-theme-card-border shadow-[0_-10px_30px_rgba(0,0,0,0.15)] dark:shadow-[0_-10px_30px_rgba(0,0,0,0.5)] rounded-t-3xl transition-all duration-300 animate-slide-up">
      
      {/* Top indicator bar */}
      <div className="w-12 h-1.5 bg-theme-btn-sec-border rounded-full mx-auto mb-4" />

      {/* Main card header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {step.type === "rolling" && (
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
          )}
          {step.type === "attack-rolled" && (
            <div className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
              Attack Roll
            </div>
          )}
          {step.type === "damage-rolled" && (
            <div className="px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-650 dark:text-red-400 text-xs font-bold uppercase tracking-wider">
              Damage Roll
            </div>
          )}
          {step.type === "stealth-rolled" && (
            <div className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
              Stealth Roll
            </div>
          )}
          {step.type === "check-rolled" && (
            <div className="px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
              {step.checkName}
            </div>
          )}
          {step.type === "move-clicked" && (
            <div className="px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider">
              Movement
            </div>
          )}
          {step.type === "potion-drank" && (
            <div className="px-2.5 py-0.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-600 dark:text-teal-400 text-xs font-bold uppercase tracking-wider">
              Item Used
            </div>
          )}
          <span className="text-xs font-bold text-theme-text-tertiary uppercase tracking-wide">
            {step.type === "rolling" ? "Action in progress" : "What to do next"}
          </span>
        </div>
        <button 
          onClick={onClose}
          className="p-1 rounded-full bg-theme-btn-sec-bg hover:bg-theme-btn-sec-bg/85 border border-theme-btn-sec-border text-theme-text-tertiary hover:text-theme-text-primary transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main body content */}
      <div className="space-y-4 mb-6">
        {step.type === "rolling" && (
          <div className="py-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full border-4 border-amber-500/30 border-t-amber-500 animate-spin mx-auto" />
            <h3 className="text-lg font-bold text-theme-text-primary">
              Rolling 3D Physics Dice...
            </h3>
            <p className="text-xs text-theme-text-tertiary max-w-xs mx-auto">
              Watch the dice roll across your screen! We are calculating your results.
            </p>
          </div>
        )}

        {step.type === "attack-rolled" && (
          <div className="space-y-3.5">
            <div className="flex items-center gap-4 bg-theme-btn-sec-bg border border-theme-btn-sec-border p-4 rounded-2xl">
              <div className="text-center">
                <span className="text-xs text-theme-text-tertiary block font-bold uppercase tracking-wider">Total</span>
                <span className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">{step.rollTotal}</span>
              </div>
              <div className="text-xs text-theme-text-secondary border-l border-theme-btn-sec-border/60 pl-4 py-1 leading-relaxed">
                Dice Result: <span className="text-theme-text-primary font-bold">{step.dieResult}</span> on d20 <br/>
                Attack Modifier: <span className="text-theme-text-primary font-bold">+{step.modifier}</span>
              </div>
            </div>
            
            <div className="bg-emerald-550/5 dark:bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl space-y-2">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <h4 className="font-bold text-theme-text-primary text-sm">Step 1: Tell your Dungeon Master</h4>
              </div>
              <p className="text-sm text-theme-text-secondary leading-relaxed font-medium pl-7">
                Say: <strong className="text-emerald-600 dark:text-emerald-400 text-base">"I got a {step.rollTotal} to hit!"</strong>
              </p>
              <p className="text-xs text-theme-text-tertiary leading-relaxed pl-7">
                If {step.rollTotal} matches or beats the monster's Armor Class (AC), you hit them!
              </p>
            </div>

            <div className="bg-theme-btn-sec-bg border border-theme-btn-sec-border p-4 rounded-2xl space-y-3">
              <div className="flex gap-2">
                <Play className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <h4 className="font-bold text-theme-text-primary text-xs uppercase tracking-wider">Step 2: Roll your damage</h4>
              </div>
              <p className="text-xs text-theme-text-secondary leading-relaxed">
                Once the DM confirms that your attack hit, tap this button to roll damage:
              </p>
              <button
                onClick={onRollDamage}
                className="w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm tracking-wide transition-all shadow-[0_4px_12px_rgba(245,158,11,0.2)] flex items-center justify-center gap-2 hover:scale-[1.02]"
              >
                <span>Roll {step.damageNotation} Damage</span>
              </button>
            </div>
          </div>
        )}

        {step.type === "damage-rolled" && (
          <div className="space-y-3.5">
            <div className="flex items-center gap-4 bg-theme-btn-sec-bg border border-theme-btn-sec-border p-4 rounded-2xl">
              <div className="text-center">
                <span className="text-xs text-theme-text-tertiary block font-bold uppercase tracking-wider">Damage</span>
                <span className="text-4xl font-extrabold text-red-600 dark:text-red-400">{step.rollTotal}</span>
              </div>
              <div className="text-xs text-theme-text-secondary border-l border-theme-btn-sec-border/60 pl-4 py-1 leading-relaxed">
                Type: <span className="text-theme-text-primary font-bold capitalize">{step.damageType}</span> <br/>
                Weapon: <span className="text-theme-text-primary font-bold">{step.weaponName}</span>
              </div>
            </div>

            <div className="bg-red-550/5 dark:bg-red-500/5 border border-red-500/10 p-4 rounded-2xl space-y-2">
              <div className="flex gap-2">
                <CheckCircle2 className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                <h4 className="font-bold text-theme-text-primary text-sm">Tell your Dungeon Master</h4>
              </div>
              <p className="text-sm text-theme-text-secondary leading-relaxed font-medium pl-7">
                Say: <strong className="text-red-650 dark:text-red-400 text-base">"I deal {step.rollTotal} {step.damageType} damage!"</strong>
              </p>
              <p className="text-xs text-theme-text-tertiary leading-relaxed pl-7">
                The DM will subtract this from the monster's health. Nice hit!
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl bg-theme-btn-sec-bg border border-theme-btn-sec-border text-theme-btn-sec-text hover:text-theme-text-primary font-semibold text-sm tracking-wide transition-all text-center block"
            >
              End Turn / Reset
            </button>
          </div>
        )}

        {step.type === "stealth-rolled" && (
          <div className="space-y-3.5">
            <div className="flex items-center gap-4 bg-theme-btn-sec-bg border border-theme-btn-sec-border p-4 rounded-2xl">
              <div className="text-center">
                <span className="text-xs text-theme-text-tertiary block font-bold uppercase tracking-wider">Total</span>
                <span className="text-4xl font-extrabold text-indigo-650 dark:text-indigo-400">{step.rollTotal}</span>
              </div>
              <div className="text-xs text-theme-text-secondary border-l border-theme-btn-sec-border/60 pl-4 py-1 leading-relaxed">
                Check: <span className="text-theme-text-primary font-bold">Stealth (Dexterity)</span> <br/>
                Notation: <span className="text-theme-text-primary font-bold">1d20 + 2</span>
              </div>
            </div>

            <div className="bg-indigo-550/5 dark:bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-2xl space-y-2">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-indigo-650 dark:text-indigo-400 shrink-0 mt-0.5" />
                <h4 className="font-bold text-theme-text-primary text-sm">Tell your Dungeon Master</h4>
              </div>
              <p className="text-sm text-theme-text-secondary leading-relaxed font-medium pl-7">
                Say: <strong className="text-indigo-650 dark:text-indigo-400 text-base">"I got a {step.rollTotal} for Stealth!"</strong>
              </p>
              <p className="text-xs text-theme-text-tertiary leading-relaxed pl-7">
                The DM will compare this to the monster's Passive Perception. If your roll is higher, you are hidden!
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl bg-theme-btn-sec-bg border border-theme-btn-sec-border text-theme-btn-sec-text hover:text-theme-text-primary font-semibold text-sm tracking-wide transition-all text-center block"
            >
              Finish Action
            </button>
          </div>
        )}

        {step.type === "check-rolled" && (
          <div className="space-y-3.5">
            <div className="flex items-center gap-4 bg-theme-btn-sec-bg border border-theme-btn-sec-border p-4 rounded-2xl">
              <div className="text-center">
                <span className="text-xs text-theme-text-tertiary block font-bold uppercase tracking-wider">Total</span>
                <span className="text-4xl font-extrabold text-amber-500">{step.rollTotal}</span>
              </div>
              <div className="text-xs text-theme-text-secondary border-l border-theme-btn-sec-border/60 pl-4 py-1 leading-relaxed">
                Check: <span className="text-theme-text-primary font-bold">{step.checkName}</span> <br/>
                Notation: <span className="text-theme-text-primary font-bold">{step.notation}</span>
              </div>
            </div>

            <div className="bg-amber-550/5 dark:bg-amber-500/5 border border-amber-500/10 p-4 rounded-2xl space-y-2">
              <div className="flex gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                <h4 className="font-bold text-theme-text-primary text-sm">Tell your Dungeon Master</h4>
              </div>
              <p className="text-sm text-theme-text-secondary leading-relaxed font-medium pl-7">
                Say: <strong className="text-amber-650 dark:text-amber-500 text-base">"I got a {step.rollTotal} for {step.checkName}!"</strong>
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl bg-theme-btn-sec-bg border border-theme-btn-sec-border text-theme-btn-sec-text hover:text-theme-text-primary font-semibold text-sm tracking-wide transition-all text-center block"
            >
              Okay
            </button>
          </div>
        )}

        {step.type === "move-clicked" && (
          <div className="space-y-3.5">
            <div className="flex items-center gap-4 bg-theme-btn-sec-bg border border-theme-btn-sec-border p-4 rounded-2xl">
              <Footprints className="w-10 h-10 text-blue-600 dark:text-blue-400 shrink-0" />
              <div className="text-xs text-theme-text-secondary leading-relaxed">
                Speed: <span className="text-theme-text-primary font-bold">{step.distance} feet</span> <br/>
                Grid Squares: <span className="text-theme-text-primary font-bold">{step.distance / 5} squares</span>
              </div>
            </div>

            <div className="bg-blue-550/5 dark:bg-blue-500/5 border border-blue-500/10 p-4 rounded-2xl space-y-2">
              <h4 className="font-bold text-theme-text-primary text-sm">Movement Instructions</h4>
              <p className="text-sm text-theme-text-secondary leading-relaxed pl-1">
                You can move up to <strong className="text-blue-600 dark:text-blue-400">{step.distance} feet</strong> on your turn. 
              </p>
              <ul className="text-xs text-theme-text-tertiary leading-relaxed pl-5 list-disc space-y-1">
                <li>On a grid map, this is exactly <strong className="text-theme-text-primary">{step.distance / 5} squares</strong>.</li>
                <li>You can move, attack, and then move again if you have feet remaining!</li>
                <li>Moving past enemies may trigger an "opportunity attack" against you, so be careful.</li>
              </ul>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl bg-theme-btn-sec-bg border border-theme-btn-sec-border text-theme-btn-sec-text hover:text-theme-text-primary font-semibold text-sm tracking-wide transition-all text-center block"
            >
              Done Moving
            </button>
          </div>
        )}

        {step.type === "potion-drank" && (
          <div className="space-y-3.5">
            <div className="flex items-center gap-4 bg-theme-btn-sec-bg border border-theme-btn-sec-border p-4 rounded-2xl">
              <div className="text-center">
                <span className="text-xs text-theme-text-tertiary block font-bold uppercase tracking-wider">Healed</span>
                <span className="text-4xl font-extrabold text-teal-600 dark:text-teal-400">+{step.healAmount}</span>
              </div>
              <div className="text-xs text-theme-text-secondary border-l border-theme-btn-sec-border/60 pl-4 py-1 leading-relaxed">
                Item: <span className="text-theme-text-primary font-bold">Potion of Healing</span> <br/>
                New HP: <span className="text-theme-text-primary font-bold">{step.currentHp} HP</span>
              </div>
            </div>

            <div className="bg-teal-550/5 dark:bg-teal-500/5 border border-teal-500/10 p-4 rounded-2xl space-y-1">
              <h4 className="font-bold text-theme-text-primary text-sm">Health Restored!</h4>
              <p className="text-sm text-theme-text-secondary leading-relaxed">
                You rolled <strong className="text-teal-600 dark:text-teal-450">2d4 + 2</strong> and restored <strong className="text-teal-600 dark:text-teal-450">{step.healAmount} hit points</strong>.
              </p>
              <p className="text-xs text-theme-text-tertiary leading-relaxed">
                Your health bar has been updated. Tell your DM: <strong className="text-theme-text-primary">"I drank a potion and healed for {step.healAmount} HP!"</strong>
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl bg-theme-btn-sec-bg border border-theme-btn-sec-border text-theme-btn-sec-text hover:text-theme-text-primary font-semibold text-sm tracking-wide transition-all text-center block"
            >
              Okay!
            </button>
          </div>
        )}
        {/* Rest Completed */}
        {step.type === "rest-completed" && (
          <div className="space-y-3.5">
            <div className="flex items-center gap-4 bg-theme-btn-sec-bg border border-theme-btn-sec-border p-4 rounded-2xl">
              <div className="text-center">
                <span className="text-xs text-theme-text-tertiary block font-bold uppercase tracking-wider">
                  {step.isLongRest ? "Status" : "Healed"}
                </span>
                <span className={`text-4xl font-extrabold ${step.isLongRest ? "text-emerald-600 dark:text-emerald-400" : "text-indigo-600 dark:text-indigo-400"}`}>
                  {step.isLongRest ? "Full" : `+${step.healAmount}`}
                </span>
              </div>
              <div className="text-xs text-theme-text-secondary border-l border-theme-btn-sec-border/60 pl-4 py-1 leading-relaxed">
                Type: <span className="text-theme-text-primary font-bold">{step.isLongRest ? "Long Rest" : "Short Rest"}</span> <br/>
                Current HP: <span className="text-theme-text-primary font-bold">{step.currentHp} HP</span>
              </div>
            </div>

            <div className="bg-indigo-550/5 dark:bg-indigo-500/5 border border-indigo-500/10 p-4 rounded-2xl space-y-2">
              <h4 className="font-bold text-theme-text-primary text-sm">
                {step.isLongRest ? "Full Recovery!" : "Breath Caught!"}
              </h4>
              <p className="text-sm text-theme-text-secondary leading-relaxed font-medium">
                {step.isLongRest 
                  ? "You have completed a long rest. Your hit points and resources are fully restored."
                  : `You spent a hit die and restored ${step.healAmount} hit points.`}
              </p>
              <p className="text-xs text-theme-text-tertiary leading-relaxed italic">
                Tell your DM: <strong className="text-theme-text-primary">
                  {step.isLongRest 
                    ? "I took a long rest and am fully restored." 
                    : `I took a short rest and healed ${step.healAmount} HP.`}
                </strong>
              </p>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 px-4 rounded-xl bg-theme-btn-sec-bg border border-theme-btn-sec-border text-theme-btn-sec-text hover:text-theme-text-primary font-semibold text-sm tracking-wide transition-all text-center block"
            >
              Back to Adventure
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
