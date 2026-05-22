"use client";

import { useState, useEffect, useRef } from "react";
import { Swords, Flame, Sparkles, Shield, Compass, Heart, Minus, Plus, Footprints, Eye, Wine, MessageSquare } from "lucide-react";
import TutorialOverlay, { TutorialStep } from "./TutorialOverlay";
import DiceBoxCanvas, { triggerDiceRoll } from "./DiceBoxCanvas";
import { updatePlayerHp, addRollLog, subscribeToNudges, clearNudge, subscribeToPlayers } from "@/lib/syncEngine";

interface WeaponOrSpell {
  id: string;
  name: string;
  type: "melee" | "ranged" | "spell";
  toHitModifier: number;
  damageNotation: string;
  damageType: string;
  icon: React.ReactNode;
  bgGlow: string;
  borderColor: string;
}

export default function PlayerDashboard() {
  // Character stats
  const [characterName] = useState("Valen Lightshield");
  const [characterClass] = useState("Level 1 Paladin");
  const [ac] = useState(16);
  const [initiative] = useState(2);
  const [speed] = useState(30);

  // Health state
  const [maxHp] = useState(28);
  const [currentHp, setCurrentHp] = useState(22);

  // Keep a ref to avoid stale closures in async callbacks
  const hpRef = useRef(currentHp);
  useEffect(() => {
    hpRef.current = currentHp;
  }, [currentHp]);

  // Tutorial / Roll State
  const [tutorialStep, setTutorialStep] = useState<TutorialStep>({ type: "idle" });
  
  // DM Nudge State
  const [activeNudge, setActiveNudge] = useState<string | null>(null);

  // Keep a ref to avoid stale closures in async callbacks
  const nudgeRef = useRef(activeNudge);
  useEffect(() => {
    nudgeRef.current = activeNudge;
  }, [activeNudge]);

  // Weapons and Spells Arsenal list
  const arsenal: WeaponOrSpell[] = [
    {
      id: "longsword",
      name: "Longsword Attack",
      type: "melee",
      toHitModifier: 5,
      damageNotation: "1d8+3",
      damageType: "slashing",
      icon: <Swords className="w-6 h-6 text-emerald-400" />,
      bgGlow: "group-hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]",
      borderColor: "hover:border-emerald-500/50",
    },
    {
      id: "firebolt",
      name: "Firebolt Spell",
      type: "spell",
      toHitModifier: 4,
      damageNotation: "1d10",
      damageType: "fire",
      icon: <Flame className="w-6 h-6 text-amber-500" />,
      bgGlow: "group-hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]",
      borderColor: "hover:border-amber-500/50",
    },
  ];

  // Subscribe to real-time DM Nudges and Player updates on mount
  useEffect(() => {
    // 1. Listen for nudges targeted at this player ("valen")
    const unsubscribeNudges = subscribeToNudges("valen", (rollType) => {
      setActiveNudge(rollType);
    });

    // 2. Sync health with database changes (if DM updates health from DM Screen)
    const unsubscribePlayers = subscribeToPlayers((playersList) => {
      const me = playersList.find((p) => p.id === "valen");
      if (me) {
        setCurrentHp(me.currentHp);
      }
    });

    return () => {
      unsubscribeNudges();
      unsubscribePlayers();
    };
  }, []);

  // HP Adjustments
  const adjustHp = async (amount: number) => {
    const latestHp = hpRef.current;
    const targetHp = Math.min(Math.max(0, latestHp + amount), maxHp);
    setCurrentHp(targetHp);

    // Sync to database
    try {
      await updatePlayerHp("valen", targetHp, maxHp);
    } catch (err) {
      console.error("Failed to sync HP adjustment:", err);
    }
  };

  // HP Bar Color Logic
  const hpRatio = currentHp / maxHp;
  let hpColorClass = "bg-emerald-500";
  let hpTextClass = "text-emerald-400";
  if (hpRatio <= 0.25) {
    hpColorClass = "bg-red-500";
    hpTextClass = "text-red-500";
  } else if (hpRatio <= 0.5) {
    hpColorClass = "bg-amber-500";
    hpTextClass = "text-amber-500";
  }

  // Action handlers
  const handleWeaponClick = (weapon: WeaponOrSpell) => {
    setTutorialStep({ type: "rolling", actionName: weapon.name });
    
    // Trigger 3D roll of d20
    triggerDiceRoll("1d20", async (total, rolls) => {
      const dieResult = rolls[0];
      const grandTotal = dieResult + weapon.toHitModifier;
      
      // Log attack to database
      try {
        await addRollLog(
          characterName, 
          `rolled ${grandTotal} to hit with ${weapon.name}`, 
          `1d20+${weapon.toHitModifier} (${dieResult} on die)`, 
          grandTotal, 
          "attack"
        );
      } catch (err) {
        console.error("Failed to log roll:", err);
      }
      
      setTutorialStep({
        type: "attack-rolled",
        weaponName: weapon.name,
        rollTotal: grandTotal,
        modifier: weapon.toHitModifier,
        dieResult: dieResult,
        damageNotation: weapon.damageNotation,
      });
    });
  };

  const handleRollDamage = (weaponName: string, damageNotation: string, damageType: string) => {
    setTutorialStep({ type: "rolling", actionName: `${weaponName} Damage` });

    // Trigger 3D damage roll
    triggerDiceRoll(damageNotation, async (total) => {
      // Log damage to database
      try {
        await addRollLog(
          characterName, 
          `dealt ${total} ${damageType} damage with ${weaponName}`, 
          damageNotation, 
          total, 
          "damage"
        );
      } catch (err) {
        console.error("Failed to log damage roll:", err);
      }

      setTutorialStep({
        type: "damage-rolled",
        weaponName,
        rollTotal: total,
        damageType,
      });
    });
  };

  const handleMoveClick = () => {
    setTutorialStep({ type: "move-clicked", distance: speed });
  };

  const handleHideClick = () => {
    setTutorialStep({ type: "rolling", actionName: "Stealth Check" });
    
    triggerDiceRoll("1d20", async (total, rolls) => {
      const dieResult = rolls[0];
      const finalResult = dieResult + 2; // +2 stealth modifier
      
      // Log stealth to database
      try {
        await addRollLog(
          characterName, 
          `rolled ${finalResult} for Stealth Check`, 
          `1d20+2 (${dieResult} on die)`, 
          finalResult, 
          "stealth"
        );
        
        // If they did this as a result of a DM stealth check nudge, clear the nudge alert!
        const currentNudge = nudgeRef.current;
        if (currentNudge && currentNudge.toLowerCase().includes("stealth")) {
          await clearNudge("valen");
        }
      } catch (err) {
        console.error("Failed to sync stealth roll:", err);
      }
      
      setTutorialStep({
        type: "stealth-rolled",
        rollTotal: finalResult,
      });
    });
  };

  const handleDrinkPotion = () => {
    setTutorialStep({ type: "rolling", actionName: "Drinking Healing Potion" });

    triggerDiceRoll("2d4+2", async (total) => {
      const prevHp = hpRef.current;
      const targetHp = Math.min(prevHp + total, maxHp);
      const actualHealed = targetHp - prevHp;
      setCurrentHp(targetHp);

      // Sync updated health to database
      try {
        await updatePlayerHp("valen", targetHp, maxHp);
        
        // Log healing to database
        await addRollLog(
          characterName, 
          `drank a Potion of Healing and restored ${actualHealed} HP`, 
          "2d4+2", 
          actualHealed, 
          "heal"
        );
      } catch (err) {
        console.error("Failed to sync healing:", err);
      }

      setTutorialStep({
        type: "potion-drank",
        healAmount: actualHealed,
        currentHp: targetHp,
      });
    });
  };

  // Handles completing the DM requested nudge roll directly
  const handleNudgeRoll = async () => {
    const currentNudge = nudgeRef.current;
    if (!currentNudge) return;
    
    if (currentNudge.toLowerCase().includes("stealth")) {
      handleHideClick();
    } else {
      // General d20 roll nudge handler (e.g. Initiative or generic check)
      setTutorialStep({ type: "rolling", actionName: currentNudge });
      
      triggerDiceRoll("1d20", async (total, rolls) => {
        const dieResult = rolls[0];
        
        try {
          await addRollLog(
            characterName, 
            `rolled ${dieResult} for requested ${currentNudge}`, 
            `1d20 (${dieResult} on die)`, 
            dieResult, 
            "stealth"
          );
          
          await clearNudge("valen");
        } catch (err) {
          console.error("Failed to sync nudge roll:", err);
        }

        setTutorialStep({
          type: "stealth-rolled",
          rollTotal: dieResult,
        });
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-between overflow-y-auto relative p-4 pb-24">
      {/* 3D Dice Canvas Element */}
      <DiceBoxCanvas />

      {/* Top Header - Character Summary & Sync Status */}
      <header className="flex justify-between items-center mb-4 z-10 select-none">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-amber-500 shadow-inner">
            V
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 leading-tight">{characterName}</h2>
            <p className="text-[11px] text-slate-400 leading-none">{characterClass}</p>
          </div>
        </div>

        {/* Real-time Sync Indicator */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/60 border border-slate-800 text-[10px] text-emerald-400 font-bold shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          DM Sync Active
        </div>
      </header>

      {/* DM NUDGE ALERT MESSAGE (Displays at the top of the action card) */}
      {activeNudge && (
        <div className="mb-4 z-15 bg-radial from-amber-500/10 to-amber-950/20 border border-amber-500/40 p-4 rounded-2xl animate-shake shadow-[0_0_20px_rgba(245,158,11,0.15)] flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs tracking-wider uppercase">
            <MessageSquare className="w-4 h-4 shrink-0 animate-bounce" />
            DM Requested a Roll!
          </div>
          <p className="text-xs text-slate-200 leading-normal font-medium">
            Your Dungeon Master has requested that you roll a <strong className="text-amber-400">{activeNudge}</strong>.
          </p>
          <button 
            onClick={handleNudgeRoll}
            className="w-full py-2 px-3 rounded-lg bg-gold hover:bg-gold-hover text-slate-950 text-xs font-bold transition-all shadow-[0_2px_8px_rgba(245,158,11,0.2)]"
          >
            Roll {activeNudge}
          </button>
        </div>
      )}

      {/* Core sections */}
      <div className="space-y-4 flex-1 flex flex-col justify-start z-10">
        
        {/* SECTION 1: TOP SECTION (Health Bar) */}
        <section className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-3 select-none">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-red-500" />
              Player Health
            </span>
            <span className="text-xs font-semibold text-slate-300">
              {currentHp === 0 ? (
                <span className="text-red-500 font-bold uppercase tracking-wider animate-pulse">Unconscious</span>
              ) : (
                <>
                  <strong className={`${hpTextClass} text-sm font-extrabold`}>{currentHp}</strong>
                  <span className="text-slate-500"> / {maxHp} HP</span>
                </>
              )}
            </span>
          </div>

          {/* Health Slider Visual */}
          <div className="w-full h-5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800/50">
            <div 
              className={`h-full ${hpColorClass} rounded-full transition-all duration-500`}
              style={{ width: `${(currentHp / maxHp) * 100}%` }}
            />
          </div>

          {/* Giant Adjustment Buttons */}
          <div className="grid grid-cols-2 gap-4 mt-1">
            <button 
              onClick={() => adjustHp(-1)}
              className="py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 border border-slate-800 hover:border-red-500/30 text-red-400 flex items-center justify-center gap-2 transition-all group font-bold"
            >
              <Minus className="w-6 h-6 stroke-[3px]" />
              <span className="text-xs uppercase tracking-wider">Take Damage</span>
            </button>
            <button 
              onClick={() => adjustHp(1)}
              className="py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 border border-slate-800 hover:border-emerald-500/30 text-emerald-400 flex items-center justify-center gap-2 transition-all group font-bold"
            >
              <Plus className="w-6 h-6 stroke-[3px]" />
              <span className="text-xs uppercase tracking-wider">Heal</span>
            </button>
          </div>
        </section>

        {/* Character Core Stats Bar */}
        <section className="grid grid-cols-2 gap-3 select-none">
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-amber-500" />
              Armor (AC)
            </span>
            <strong className="text-base font-extrabold text-slate-200">{ac}</strong>
          </div>
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-semibold flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-indigo-400" />
              Initiative
            </span>
            <strong className="text-base font-extrabold text-slate-200">+{initiative}</strong>
          </div>
        </section>

        {/* SECTION 2: MIDDLE SECTION (The Arsenal) */}
        <section className="flex flex-col gap-3 select-none">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">
            The Arsenal (Tap to Attack)
          </h3>
          
          <div className="grid grid-cols-1 gap-3">
            {arsenal.map((weapon) => (
              <button
                key={weapon.id}
                onClick={() => handleWeaponClick(weapon)}
                className={`group flex items-center justify-between p-4 rounded-2xl bg-slate-900/30 border border-slate-800/80 ${weapon.borderColor} transition-all duration-300 text-left`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-950 flex items-center justify-center border border-slate-850 group-hover:scale-105 transition-all">
                    {weapon.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-200 group-hover:text-slate-100">
                      {weapon.name}
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Damage: <span className="text-slate-400 font-medium">{weapon.damageNotation} {weapon.damageType}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider leading-none">Modifier</span>
                  <span className="text-lg font-extrabold text-amber-500">+{weapon.toHitModifier}</span>
                  <span className="text-[9px] text-slate-400 block font-medium">to hit</span>
                </div>
              </button>
            ))}
          </div>
        </section>
        
      </div>

      {/* SECTION 3: BOTTOM SECTION (Action Menu) */}
      <section className="mt-6 z-10 select-none">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1 mb-2">
          Turn Actions
        </h3>
        
        <div className="grid grid-cols-3 gap-2">
          {/* Move Button */}
          <button 
            onClick={handleMoveClick}
            className="flex flex-col items-center justify-center py-3.5 px-1 rounded-xl bg-slate-900/50 hover:bg-slate-900 border border-slate-800 active:scale-95 text-blue-400 transition-all gap-1.5"
          >
            <Footprints className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Move (30ft)</span>
          </button>

          {/* Hide Button */}
          <button 
            onClick={handleHideClick}
            className="flex flex-col items-center justify-center py-3.5 px-1 rounded-xl bg-slate-900/50 hover:bg-slate-900 border border-slate-800 active:scale-95 text-indigo-400 transition-all gap-1.5"
          >
            <Eye className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Hide (Stealth)</span>
          </button>

          {/* Drink Potion */}
          <button 
            onClick={handleDrinkPotion}
            className="flex flex-col items-center justify-center py-3.5 px-1 rounded-xl bg-slate-900/50 hover:bg-slate-900 border border-slate-800 active:scale-95 text-teal-400 transition-all gap-1.5"
          >
            <Wine className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Drink Potion</span>
          </button>
        </div>
      </section>

      {/* Hand-Holding Tutorial Overlay */}
      <TutorialOverlay 
        step={tutorialStep}
        onClose={() => setTutorialStep({ type: "idle" })}
        onRollDamage={
          tutorialStep.type === "attack-rolled"
            ? () => handleRollDamage(tutorialStep.weaponName, tutorialStep.damageNotation, "slashing")
            : undefined
        }
      />
    </div>
  );
}
