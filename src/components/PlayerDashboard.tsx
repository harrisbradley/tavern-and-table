"use client";

import { useState, useEffect, useRef } from "react";
import { Swords, Flame, Sparkles, Shield, Compass, Heart, Minus, Plus, Footprints, Eye, Wine, MessageSquare, Target, Zap, Music, TrendingUp, Cloud, WifiOff, Bed, Coffee, ChevronRight, Dice5 } from "lucide-react";
import TutorialOverlay, { TutorialStep } from "./TutorialOverlay";
import DiceBoxCanvas, { triggerDiceRoll } from "./DiceBoxCanvas";
import { updatePlayerHp, addRollLog, subscribeToNudges, clearNudge, subscribeToPlayers, syncPlayerProfile, subscribeToCampaignConfig, CampaignConfig } from "@/lib/syncEngine";
import { updateCharacterHp, levelUpCharacter, setTutorialEnabled } from "@/lib/characterEngine";
import { getLevelUpInfo } from "@/lib/levelUpData";
import { isFirebaseConfigured } from "@/lib/firebase";
import LevelUpPanel from "./LevelUpPanel";
import { Character, CharacterClass, CLASS_DISPLAY_NAMES, CLASSES } from "@/types/character";

interface WeaponOrSpell {
  id: string;
  name: string;
  type: "melee" | "ranged" | "spell";
  toHitModifier: number;
  damageNotation: string;
  damageType: string;
  icon: React.ReactNode;
  borderColor: string;
}

function getClassArsenal(className: CharacterClass): WeaponOrSpell[] {
  const arsenals: Record<CharacterClass, WeaponOrSpell[]> = {
    fighter: [
      { id: "longsword", name: "Longsword", type: "melee", toHitModifier: 5, damageNotation: "1d8+3", damageType: "slashing", icon: <Swords className="w-6 h-6 text-emerald-400" />, borderColor: "hover:border-emerald-500/50" },
      { id: "crossbow", name: "Hand Crossbow", type: "ranged", toHitModifier: 5, damageNotation: "1d6+3", damageType: "piercing", icon: <Target className="w-6 h-6 text-blue-400" />, borderColor: "hover:border-blue-500/50" },
    ],
    barbarian: [
      { id: "greataxe", name: "Greataxe", type: "melee", toHitModifier: 6, damageNotation: "1d12+4", damageType: "slashing", icon: <Swords className="w-6 h-6 text-red-400" />, borderColor: "hover:border-red-500/50" },
      { id: "handaxe", name: "Thrown Handaxe", type: "ranged", toHitModifier: 6, damageNotation: "1d6+4", damageType: "slashing", icon: <Zap className="w-6 h-6 text-orange-400" />, borderColor: "hover:border-orange-500/50" },
    ],
    paladin: [
      { id: "longsword", name: "Longsword", type: "melee", toHitModifier: 5, damageNotation: "1d8+3", damageType: "slashing", icon: <Swords className="w-6 h-6 text-amber-400" />, borderColor: "hover:border-amber-500/50" },
      { id: "smite", name: "Divine Smite", type: "spell", toHitModifier: 5, damageNotation: "2d8", damageType: "radiant", icon: <Sparkles className="w-6 h-6 text-yellow-300" />, borderColor: "hover:border-yellow-500/50" },
    ],
    ranger: [
      { id: "longbow", name: "Longbow", type: "ranged", toHitModifier: 6, damageNotation: "1d8+4", damageType: "piercing", icon: <Target className="w-6 h-6 text-emerald-400" />, borderColor: "hover:border-emerald-500/50" },
      { id: "shortsword", name: "Shortsword", type: "melee", toHitModifier: 6, damageNotation: "1d6+4", damageType: "piercing", icon: <Swords className="w-6 h-6 text-teal-400" />, borderColor: "hover:border-teal-500/50" },
    ],
    cleric: [
      { id: "mace", name: "Mace", type: "melee", toHitModifier: 4, damageNotation: "1d6+2", damageType: "bludgeoning", icon: <Shield className="w-6 h-6 text-indigo-400" />, borderColor: "hover:border-indigo-500/50" },
      { id: "sacred-flame", name: "Sacred Flame", type: "spell", toHitModifier: 4, damageNotation: "1d8", damageType: "radiant", icon: <Sparkles className="w-6 h-6 text-yellow-300" />, borderColor: "hover:border-yellow-500/50" },
    ],
    bard: [
      { id: "rapier", name: "Rapier", type: "melee", toHitModifier: 4, damageNotation: "1d8+2", damageType: "piercing", icon: <Swords className="w-6 h-6 text-purple-400" />, borderColor: "hover:border-purple-500/50" },
      { id: "vicious-mockery", name: "Vicious Mockery", type: "spell", toHitModifier: 4, damageNotation: "1d4", damageType: "psychic", icon: <Music className="w-6 h-6 text-pink-400" />, borderColor: "hover:border-pink-500/50" },
    ],
    rogue: [
      { id: "shortsword", name: "Shortsword + Sneak", type: "melee", toHitModifier: 6, damageNotation: "1d6+1d6+4", damageType: "piercing", icon: <Swords className="w-6 h-6 text-teal-400" />, borderColor: "hover:border-teal-500/50" },
      { id: "shortbow", name: "Shortbow", type: "ranged", toHitModifier: 6, damageNotation: "1d6+4", damageType: "piercing", icon: <Target className="w-6 h-6 text-emerald-400" />, borderColor: "hover:border-emerald-500/50" },
    ],
    wizard: [
      { id: "firebolt", name: "Fire Bolt", type: "spell", toHitModifier: 5, damageNotation: "1d10", damageType: "fire", icon: <Flame className="w-6 h-6 text-amber-500" />, borderColor: "hover:border-amber-500/50" },
      { id: "magic-missile", name: "Magic Missile", type: "spell", toHitModifier: 0, damageNotation: "3d4+3", damageType: "force", icon: <Zap className="w-6 h-6 text-violet-400" />, borderColor: "hover:border-violet-500/50" },
    ],
  };
  return arsenals[className];
}

const STEALTH_MOD: Record<CharacterClass, number> = {
  fighter: 1, barbarian: 1, paladin: 0, ranger: 4,
  cleric: 0, bard: 2, rogue: 5, wizard: 2,
};

const THEME_MAP: Record<string, { text: string; bg: string; border: string; accent: string; fill: string; ring: string }> = {
  indigo: { text: "text-indigo-400", bg: "bg-indigo-500", border: "border-indigo-500/20", accent: "indigo", fill: "fill-indigo-500", ring: "ring-indigo-500/20" },
  emerald: { text: "text-emerald-400", bg: "bg-emerald-500", border: "border-emerald-500/20", accent: "emerald", fill: "fill-emerald-500", ring: "ring-emerald-500/20" },
  amber: { text: "text-amber-400", bg: "bg-amber-500", border: "border-amber-500/20", accent: "amber", fill: "fill-amber-500", ring: "ring-amber-500/20" },
  red: { text: "text-red-400", bg: "bg-red-500", border: "border-red-500/20", accent: "red", fill: "fill-red-500", ring: "ring-red-500/20" },
  violet: { text: "text-violet-400", bg: "bg-violet-500", border: "border-violet-500/20", accent: "violet", fill: "fill-violet-500", ring: "ring-violet-500/20" },
  teal: { text: "text-teal-400", bg: "bg-teal-500", border: "border-teal-500/20", accent: "teal", fill: "fill-teal-500", ring: "ring-teal-500/20" },
};

interface Props {
  character: Character;
  campaignId: string;
}

export default function PlayerDashboard({ character, campaignId }: Props) {
  const [currentHp, setCurrentHp] = useState(character.currentHp);
  const [currentLevel, setCurrentLevel] = useState(character.level);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [tutorialEnabled, setTutorialEnabledState] = useState(character.tutorialEnabled !== false);
  const [tutorialStep, setTutorialStep] = useState<TutorialStep>({ type: "idle" });
  const [activeNudge, setActiveNudge] = useState<string | null>(null);
  const [showRestMenu, setShowRestMenu] = useState(false);
  const [showCheckMenu, setShowCheckMenu] = useState(false);
  const [customMod, setCustomMod] = useState(0);
  const [campaign, setCampaign] = useState<CampaignConfig | null>(null);

  const hpRef = useRef(currentHp);
  useEffect(() => { hpRef.current = currentHp; }, [currentHp]);

  const nudgeRef = useRef(activeNudge);
  useEffect(() => { nudgeRef.current = activeNudge; }, [activeNudge]);

  const arsenal = getClassArsenal(character.className);
  const stealthMod = STEALTH_MOD[character.className];
  const displayClass = `Level ${currentLevel} ${CLASS_DISPLAY_NAMES[character.className]}`;
  const initial = character.name[0]?.toUpperCase() ?? "?";

  useEffect(() => {
    syncPlayerProfile(campaignId, {
      id: character.id,
      name: character.name,
      className: displayClass,
      maxHp: character.maxHp,
      currentHp: currentHp,
      ac: character.ac,
      initiative: character.initiative,
      passivePerception: character.passivePerception,
      status: currentHp === 0 ? "down" : character.status,
    });
  }, [campaignId, character.id, character.name, displayClass, character.maxHp, character.ac, character.initiative, character.passivePerception]);

  useEffect(() => {
    const unsubscribeConfig = subscribeToCampaignConfig(campaignId, (config) => {
      setCampaign(config);
    });

    const unsubscribeNudges = subscribeToNudges(campaignId, character.id, (rollType) => {
      setActiveNudge(rollType);
    });

    const unsubscribePlayers = subscribeToPlayers(campaignId, (playersList) => {
      const me = playersList.find((p) => p.id === character.id);
      if (me) setCurrentHp(me.currentHp);
    });

    return () => {
      unsubscribeConfig();
      unsubscribeNudges();
      unsubscribePlayers();
    };
  }, [campaignId, character.id]);

  const theme = campaign?.themeColor ? THEME_MAP[campaign.themeColor] || THEME_MAP.indigo : THEME_MAP.indigo;

  const adjustHp = async (amount: number) => {
    const latestHp = hpRef.current;
    const targetHp = Math.min(Math.max(0, latestHp + amount), character.maxHp);
    setCurrentHp(targetHp);
    updateCharacterHp(character.id, targetHp);
    try {
      await updatePlayerHp(campaignId, character.id, targetHp, character.maxHp);
    } catch (err) {
      console.error("Failed to sync HP:", err);
    }
  };

  const hpRatio = currentHp / character.maxHp;
  let hpColorClass = "bg-emerald-500";
  let hpTextClass = "text-emerald-400";
  if (hpRatio <= 0.25) { hpColorClass = "bg-red-500"; hpTextClass = "text-red-500"; }
  else if (hpRatio <= 0.5) { hpColorClass = "bg-amber-500"; hpTextClass = "text-amber-500"; }

  const handleWeaponClick = (weapon: WeaponOrSpell) => {
    if (weapon.id === "magic-missile") {
      setTutorialStep({ type: "rolling", actionName: "Magic Missile Damage" });
      triggerDiceRoll(weapon.damageNotation, async (dmgTotal) => {
        try {
          await addRollLog(campaignId, character.name, `cast Magic Missile for ${dmgTotal} force damage`, weapon.damageNotation, dmgTotal, "damage");
        } catch (err) { console.error("Failed to log roll:", err); }
        setTutorialStep({ type: "damage-rolled", weaponName: weapon.name, rollTotal: dmgTotal, damageType: "force" });
      });
      return;
    }

    setTutorialStep({ type: "rolling", actionName: weapon.name });
    triggerDiceRoll("1d20", async (total, rolls) => {
      const dieResult = rolls[0];
      const grandTotal = dieResult + weapon.toHitModifier;
      try {
        await addRollLog(campaignId, character.name, `attacked with ${weapon.name} (rolled ${dieResult} + ${weapon.toHitModifier})`, `1d20 + ${weapon.toHitModifier}`, grandTotal, "attack");
      } catch (err) { console.error("Failed to log roll:", err); }
      setTutorialStep({ type: "attack-rolled", weaponName: weapon.name, rollTotal: grandTotal, modifier: weapon.toHitModifier, dieResult, damageNotation: weapon.damageNotation });
    });
  };

  const handleRollDamage = (weaponName: string, damageNotation: string, damageType: string) => {
    setTutorialStep({ type: "rolling", actionName: `${weaponName} Damage` });
    triggerDiceRoll(damageNotation, async (total) => {
      try {
        await addRollLog(campaignId, character.name, `dealt ${total} ${damageType} damage with ${weaponName}`, damageNotation, total, "damage");
      } catch (err) { console.error("Failed to log damage:", err); }
      setTutorialStep({ type: "damage-rolled", weaponName, rollTotal: total, damageType });
    });
  };

  const handleMoveClick = () => {
    setTutorialStep({ type: "move-clicked", distance: character.speed });
  };

  const handleHideClick = () => {
    setTutorialStep({ type: "rolling", actionName: "Stealth Check" });
    triggerDiceRoll("1d20", async (total, rolls) => {
      const dieResult = rolls[0];
      const finalResult = dieResult + stealthMod;
      try {
        await addRollLog(campaignId, character.name, `rolled ${finalResult} for Stealth Check`, `1d20+${stealthMod} (${dieResult} on die)`, finalResult, "stealth");
        await updatePlayerHp(campaignId, character.id, hpRef.current, character.maxHp, { status: "hidden" });
        if (nudgeRef.current?.toLowerCase().includes("stealth")) await clearNudge(campaignId, character.id);
      } catch (err) { console.error("Failed to sync stealth:", err); }
      setTutorialStep({ type: "stealth-rolled", rollTotal: finalResult });
    });
  };

  const handleDrinkPotion = () => {
    setTutorialStep({ type: "rolling", actionName: "Drinking Healing Potion" });
    triggerDiceRoll("2d4+2", async (total) => {
      const prevHp = hpRef.current;
      const targetHp = Math.min(prevHp + total, character.maxHp);
      const actualHealed = targetHp - prevHp;
      setCurrentHp(targetHp);
      updateCharacterHp(character.id, targetHp);
      try {
        await updatePlayerHp(campaignId, character.id, targetHp, character.maxHp);
        await addRollLog(campaignId, character.name, `drank a Potion of Healing and restored ${actualHealed} HP`, "2d4+2", actualHealed, "heal");
      } catch (err) { console.error("Failed to sync healing:", err); }
      setTutorialStep({ type: "potion-drank", healAmount: actualHealed, currentHp: targetHp });
    });
  };

  const handleNudgeRoll = async () => {
    const currentNudge = nudgeRef.current;
    if (!currentNudge) return;
    if (currentNudge.toLowerCase().includes("stealth")) {
      handleHideClick();
    } else {
      setTutorialStep({ type: "rolling", actionName: currentNudge });
      triggerDiceRoll("1d20", async (total, rolls) => {
        const dieResult = rolls[0];
        try {
          await addRollLog(campaignId, character.name, `rolled ${dieResult} for ${currentNudge}`, `1d20 (${dieResult} on die)`, dieResult, "stealth");
          await clearNudge(campaignId, character.id);
        } catch (err) { console.error("Failed to sync nudge:", err); }
        setTutorialStep({ type: "idle" });
      });
    }
  };

  const handleToggleTutorial = () => {
    const next = !tutorialEnabled;
    setTutorialEnabledState(next);
    setTutorialEnabled(character.id, next);
    if (!next) setTutorialStep({ type: "idle" });
  };

  const handleConfirmLevelUp = () => {
    const info = getLevelUpInfo(character.className, currentLevel);
    const updated = levelUpCharacter(character.id, info.hpGain);
    if (updated) {
      setCurrentLevel(updated.level);
      setCurrentHp(updated.currentHp);
    }
    setShowLevelUp(false);
  };

  const handleLongRest = async () => {
    setCurrentHp(character.maxHp);
    updateCharacterHp(character.id, character.maxHp);
    try {
      await updatePlayerHp(campaignId, character.id, character.maxHp, character.maxHp, { status: "active" });
      await addRollLog(campaignId, character.name, "took a Long Rest and is fully restored!", "Long Rest", character.maxHp, "heal");
    } catch (err) { console.error("Failed to sync long rest:", err); }
    setShowRestMenu(false);
    setTutorialStep({ type: "rest-completed", healAmount: character.maxHp, currentHp: character.maxHp, isLongRest: true });
  };

  const handleShortRest = () => {
    const classData = CLASSES.find(c => c.id === character.className);
    const hitDie = classData?.hitDie || "d8";
    const notation = `1${hitDie}+2`;
    setTutorialStep({ type: "rolling", actionName: "Short Rest (Hit Die)" });
    triggerDiceRoll(notation, async (total) => {
      const prevHp = hpRef.current;
      const targetHp = Math.min(prevHp + total, character.maxHp);
      const actualHealed = targetHp - prevHp;
      setCurrentHp(targetHp);
      updateCharacterHp(character.id, targetHp);
      try {
        await updatePlayerHp(campaignId, character.id, targetHp, character.maxHp);
        await addRollLog(campaignId, character.name, `took a Short Rest and healed ${actualHealed} HP`, notation, actualHealed, "heal");
      } catch (err) { console.error("Failed to sync short rest:", err); }
      setTutorialStep({ type: "rest-completed", healAmount: actualHealed, currentHp: targetHp, isLongRest: false });
    });
    setShowRestMenu(false);
  };

  const handleAdHocRoll = (notation: string, label: string) => {
    setTutorialStep({ type: "rolling", actionName: label });
    triggerDiceRoll(notation, async (total, rolls) => {
      const dieResult = rolls[0];
      const modifier = total - dieResult;
      try {
        await addRollLog(campaignId, character.name, `rolled a ${total} for ${label}`, notation, total, "stealth");
      } catch (err) { console.error("Failed to log ad-hoc roll:", err); }
      setTutorialStep({ type: "check-rolled", checkName: label, rollTotal: total, modifier, dieResult, notation });
    });
    setShowCheckMenu(false);
  };

  const initiativeDisplay = character.initiative >= 0 ? `+${character.initiative}` : `${character.initiative}`;

  return (
    <div className="flex-1 flex flex-col justify-between overflow-y-auto relative p-4 pb-24">
      <DiceBoxCanvas />

      <header className="flex justify-between items-center mb-4 z-10 select-none">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full ${theme.bg}/20 border ${theme.border} flex items-center justify-center font-black ${theme.text} shadow-inner`}>
            {initial}
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-slate-100 leading-tight truncate">{character.name}</h2>
            <p className="text-[11px] text-slate-400 leading-none truncate">{displayClass}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {currentLevel < 20 && (
            <button onClick={() => setShowLevelUp(true)} className={`flex items-center gap-1 px-2.5 py-1 rounded-full ${theme.bg}/10 border ${theme.border} text-[10px] ${theme.text} font-bold hover:${theme.bg}/20 transition-colors`}>
              <TrendingUp className="w-3 h-3" /> Level Up
            </button>
          )}
          <button onClick={handleToggleTutorial} className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold transition-colors ${tutorialEnabled ? `${theme.bg}/10 ${theme.border} ${theme.text} hover:${theme.bg}/20` : "bg-slate-900/40 border-slate-800 text-slate-600 hover:text-slate-400"}`}>
            <Sparkles className="w-3 h-3" /> Guide
          </button>
          {isFirebaseConfigured ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-bold shadow-sm">
              <Cloud className="w-3 h-3" /> Cloud Sync
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-500 font-bold shadow-sm">
              <WifiOff className="w-3 h-3" /> Local Mode
            </div>
          )}
        </div>
      </header>

      {activeNudge && (
        <div className="mb-4 z-15 bg-radial from-amber-500/10 to-amber-950/20 border border-amber-500/40 p-4 rounded-2xl animate-shake shadow-md flex flex-col gap-2.5">
          <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs tracking-wider uppercase">
            <MessageSquare className="w-4 h-4 shrink-0 animate-bounce" /> DM Requested a Roll!
          </div>
          <p className="text-xs text-slate-200 font-medium">Your DM requested a <strong className="text-amber-400">{activeNudge}</strong>.</p>
          <button onClick={handleNudgeRoll} className="w-full py-2 px-3 rounded-lg bg-gold hover:bg-gold-hover text-slate-950 text-xs font-bold transition-all">Roll {activeNudge}</button>
        </div>
      )}

      <div className="space-y-4 flex-1 flex flex-col justify-start z-10">
        <section className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 flex flex-col gap-3 select-none">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Heart className="w-3.5 h-3.5 text-red-500" /> Player Health</span>
            <span className="text-xs font-semibold text-slate-300">
              {currentHp === 0 ? <span className="text-red-500 font-bold uppercase tracking-wider animate-pulse">Unconscious</span> : <><strong className={`${hpTextClass} text-sm font-extrabold`}>{currentHp}</strong><span className="text-slate-500"> / {character.maxHp} HP</span></>}
            </span>
          </div>
          <div className="w-full h-5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800/50">
            <div className={`h-full ${hpColorClass} rounded-full transition-all duration-500`} style={{ width: `${(currentHp / character.maxHp) * 100}%` }} />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-1">
            <button onClick={() => adjustHp(-1)} className="py-3.5 rounded-xl bg-slate-900 border border-slate-800 text-red-400 flex items-center justify-center gap-2 font-bold transition-all active:scale-95"><Minus className="w-6 h-6 stroke-[3px]" /> <span className="text-xs uppercase">Take Damage</span></button>
            <button onClick={() => adjustHp(1)} className="py-3.5 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400 flex items-center justify-center gap-2 font-bold transition-all active:scale-95"><Plus className="w-6 h-6 stroke-[3px]" /> <span className="text-xs uppercase">Heal</span></button>
          </div>
        </section>

        <section className="grid grid-cols-3 gap-2 select-none">
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-2.5 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mb-1"><Shield className={`w-3.5 h-3.5 ${theme.text}`} /> AC</span>
            <strong className="text-sm font-extrabold text-slate-200">{character.ac}</strong>
          </div>
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-2.5 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mb-1"><Compass className={`w-3.5 h-3.5 ${theme.text}`} /> Init</span>
            <strong className="text-sm font-extrabold text-slate-200">{initiativeDisplay}</strong>
          </div>
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-2.5 flex flex-col items-center">
            <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mb-1"><Eye className={`w-3.5 h-3.5 ${theme.text}`} /> Passive</span>
            <strong className="text-sm font-extrabold text-slate-200">{character.passivePerception}</strong>
          </div>
        </section>

        <section className="flex flex-col gap-3 select-none">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">The Arsenal (Tap to Attack)</h3>
          <div className="grid grid-cols-1 gap-3">
            {arsenal.map((weapon) => (
              <button key={weapon.id} onClick={() => handleWeaponClick(weapon)} className={`group flex items-center justify-between p-4 rounded-2xl bg-slate-900/30 border border-slate-800/80 ${weapon.borderColor} transition-all text-left`}>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-950 flex items-center justify-center border border-slate-850 group-hover:scale-105 transition-all">{weapon.icon}</div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-200">{weapon.name}</h4>
                    <p className="text-[11px] text-slate-500">Damage: <span className="text-slate-400">{weapon.damageNotation} {weapon.damageType}</span></p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 font-bold block uppercase leading-none">{weapon.id === "magic-missile" ? "Auto" : "Modifier"}</span>
                  <span className="text-lg font-extrabold text-amber-500">{weapon.id === "magic-missile" ? "Hit" : `+${weapon.toHitModifier}`}</span>
                  <span className="text-[9px] text-slate-400 block">{weapon.id === "magic-missile" ? "no roll" : "to hit"}</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-6 z-10 select-none">
        <div className="flex justify-between items-center mb-2 px-1">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Turn Actions</h3>
          <div className="flex gap-2">
            <button onClick={() => setShowCheckMenu(true)} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${theme.bg}/10 border ${theme.border} text-[10px] ${theme.text} font-bold hover:${theme.bg}/20 transition-all`}>
              <Dice5 className="w-3 h-3" /> Roll Check
            </button>
            <button onClick={() => setShowRestMenu(true)} className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${theme.bg}/10 border ${theme.border} text-[10px] ${theme.text} font-bold hover:${theme.bg}/20 transition-all`}>
              <Bed className="w-3 h-3" /> Take a Rest
            </button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={handleMoveClick} className="flex flex-col items-center justify-center py-3.5 px-1 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-400 transition-all gap-1.5 active:scale-95">
            <Footprints className={`w-5 h-5 ${theme.text}`} />
            <span className="text-[10px] font-bold uppercase text-slate-300">Move ({character.speed}ft)</span>
          </button>
          <button onClick={handleHideClick} className="flex flex-col items-center justify-center py-3.5 px-1 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-400 transition-all gap-1.5 active:scale-95">
            <Eye className={`w-5 h-5 ${theme.text}`} />
            <span className="text-[10px] font-bold uppercase text-slate-300">Hide (Stealth)</span>
          </button>
          <button onClick={handleDrinkPotion} className="flex flex-col items-center justify-center py-3.5 px-1 rounded-xl bg-slate-900/50 border border-slate-800 text-slate-400 transition-all gap-1.5 active:scale-95">
            <Wine className={`w-5 h-5 ${theme.text}`} />
            <span className="text-[10px] font-bold uppercase text-slate-300">Drink Potion</span>
          </button>
        </div>
      </section>

      {showCheckMenu && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
            <div className="text-center space-y-2 mb-6">
              <div className={`w-14 h-14 rounded-2xl ${theme.bg}/10 border ${theme.border} flex items-center justify-center mx-auto mb-2`}><Dice5 className={`w-7 h-7 ${theme.text}`} /></div>
              <h2 className="text-xl font-bold text-white">Ability Check / Save</h2>
              <p className="text-slate-400 text-sm">Roll a d20 with a custom modifier.</p>
            </div>
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Modifier</label>
                <div className="flex items-center justify-center gap-6 bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  <button onClick={() => setCustomMod(prev => prev - 1)} className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-red-400 transition-all"><Minus className="w-6 h-6" /></button>
                  <div className="text-center min-w-16"><span className="text-4xl font-black text-white">{customMod >= 0 ? `+${customMod}` : customMod}</span></div>
                  <button onClick={() => setCustomMod(prev => prev + 1)} className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-emerald-400 transition-all"><Plus className="w-6 h-6" /></button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleAdHocRoll(`1d20${customMod >= 0 ? "+" : ""}${customMod}`, "Ability Check")} className={`py-4 rounded-2xl ${theme.bg} text-slate-950 font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg`}>Roll Check</button>
                <button onClick={() => handleAdHocRoll(`1d20${customMod >= 0 ? "+" : ""}${customMod}`, "Saving Throw")} className={`py-4 rounded-2xl border ${theme.border} ${theme.text} hover:${theme.bg}/10 font-black text-xs uppercase tracking-widest transition-all active:scale-95`}>Roll Save</button>
              </div>
              <button onClick={() => setShowCheckMenu(false)} className="w-full py-2 text-slate-500 hover:text-slate-300 font-bold text-[10px] uppercase tracking-[0.2em] transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showRestMenu && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
            <div className="text-center space-y-2 mb-6">
              <div className={`w-14 h-14 rounded-2xl ${theme.bg}/10 border ${theme.border} flex items-center justify-center mx-auto mb-2`}><Bed className={`w-7 h-7 ${theme.text}`} /></div>
              <h2 className="text-xl font-bold text-white">Time for a Rest?</h2>
              <p className="text-slate-400 text-sm">Recover your strength before the next encounter.</p>
            </div>
            <div className="space-y-3">
              <button onClick={handleShortRest} className="w-full group flex items-center justify-between p-4 rounded-2xl bg-slate-850 border border-slate-700 hover:border-emerald-500/50 transition-all text-left">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"><Coffee className="w-5 h-5" /></div>
                  <div><div className="text-white font-bold text-sm">Short Rest</div><div className="text-slate-500 text-[10px]">Spend 1 Hit Die ({CLASSES.find(c => c.id === character.className)?.hitDie}+2)</div></div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
              </button>
              <button onClick={handleLongRest} className="w-full group flex items-center justify-between p-4 rounded-2xl bg-slate-850 border border-slate-700 hover:border-indigo-500/50 transition-all text-left">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400"><Bed className="w-5 h-5" /></div>
                  <div><div className="text-white font-bold text-sm">Long Rest</div><div className="text-slate-500 text-[10px]">Restore full health and resources</div></div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
              </button>
              <button onClick={() => setShowRestMenu(false)} className="w-full py-3 text-slate-500 hover:text-slate-300 font-bold text-xs uppercase tracking-widest transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showLevelUp && <LevelUpPanel character={{ ...character, level: currentLevel }} onConfirm={handleConfirmLevelUp} onCancel={() => setShowLevelUp(false)} />}

      {(tutorialEnabled || tutorialStep.type !== "idle") && (
        <TutorialOverlay
          step={tutorialStep}
          compact={!tutorialEnabled}
          onClose={() => setTutorialStep({ type: "idle" })}
          onRollDamage={tutorialStep.type === "attack-rolled" ? () => handleRollDamage(tutorialStep.weaponName, tutorialStep.damageNotation, "slashing") : undefined}
        />
      )}
    </div>
  );
}
