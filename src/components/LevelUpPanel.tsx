"use client";

import { TrendingUp, Heart, Shield, Sparkles, ChevronRight, X } from "lucide-react";
import { Character } from "@/types/character";
import { getLevelUpInfo } from "@/lib/levelUpData";

interface Props {
  character: Character;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function LevelUpPanel({ character, onConfirm, onCancel }: Props) {
  const nextLevel = character.level + 1;
  const info = getLevelUpInfo(character.className, character.level);
  const profChanged = info.newProficiencyBonus !== info.oldProficiencyBonus;

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-gradient-to-b from-theme-radial-start via-theme-radial-mid to-theme-radial-end overflow-y-auto">
      {/* Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-48 rounded-full bg-amber-500/10 blur-[80px] pointer-events-none" />

      {/* Header */}
      <div className="relative px-4 pt-8 pb-6 text-center">
        <button
          onClick={onCancel}
          className="absolute top-6 right-4 p-2 rounded-full text-theme-text-tertiary hover:text-theme-text-primary transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-widest mb-4">
          <TrendingUp className="w-3.5 h-3.5" />
          Level Up!
        </div>
        <h2 className="text-4xl font-extrabold text-theme-text-primary mb-1">
          Level {character.level} → <span className="text-amber-500 dark:text-amber-400">{nextLevel}</span>
        </h2>
        <p className="text-theme-text-secondary text-sm">{character.name} grows stronger.</p>
      </div>

      {/* Stat changes */}
      <div className="px-4 mb-6">
        <p className="text-theme-text-tertiary text-[10px] font-bold uppercase tracking-widest mb-3">What changes</p>
        <div className={`grid gap-3 ${profChanged ? "grid-cols-2" : "grid-cols-1"}`}>
          {/* HP gain */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/5 dark:bg-red-900/10 border border-red-500/20 dark:border-red-800/30">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 text-red-500 dark:text-red-400" />
            </div>
            <div>
              <div className="text-red-600 dark:text-red-400 text-2xl font-extrabold leading-none">+{info.hpGain}</div>
              <div className="text-theme-text-secondary text-xs font-semibold mt-0.5">Max HP</div>
            </div>
          </div>

          {/* Proficiency bonus — only if it changes */}
          {profChanged && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-indigo-500/5 dark:bg-indigo-900/10 border border-indigo-500/20 dark:border-indigo-800/30">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
              </div>
              <div>
                <div className="text-indigo-600 dark:text-indigo-400 text-2xl font-extrabold leading-none">
                  +{info.oldProficiencyBonus} → +{info.newProficiencyBonus}
                </div>
                <div className="text-theme-text-secondary text-xs font-semibold mt-0.5">Prof. Bonus</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New features */}
      {info.features.length > 0 && (
        <div className="px-4 mb-8">
          <p className="text-theme-text-tertiary text-[10px] font-bold uppercase tracking-widest mb-3">New abilities</p>
          <div className="space-y-3">
            {info.features.map((feature) => (
              <div
                key={feature.name}
                className="flex gap-3 p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-900/10 border border-amber-500/20 dark:border-amber-800/20"
              >
                <div className="mt-0.5 shrink-0">
                  <Sparkles className="w-4 h-4 text-amber-550 dark:text-amber-400" />
                </div>
                <div>
                  <div className="text-amber-700 dark:text-amber-300 text-sm font-bold mb-1">{feature.name}</div>
                  <div className="text-theme-text-secondary text-xs leading-relaxed">{feature.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No new features at this level */}
      {info.features.length === 0 && (
        <div className="px-4 mb-8">
          <div className="p-4 rounded-2xl bg-theme-card-bg border border-theme-card-border text-theme-text-secondary text-sm text-center">
            No new class features at this level — your stats improve and you gain HP.
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="px-4 pb-10 mt-auto space-y-3">
        <button
          onClick={onConfirm}
          className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-lg transition-all shadow-[0_0_30px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2"
        >
          Confirm Level Up
          <ChevronRight className="w-5 h-5" />
        </button>
        <button
          onClick={onCancel}
          className="w-full py-3 text-theme-text-secondary hover:text-theme-text-primary text-sm font-semibold transition-colors"
        >
          Not yet
        </button>
      </div>
    </div>
  );
}
