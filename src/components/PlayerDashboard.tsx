"use client";

import { useState, useEffect, useRef } from "react";
import { Swords, Flame, Sparkles, Shield, Compass, Heart, Minus, Plus, Footprints, Eye, Wine, MessageSquare, Target, Zap, Music, TrendingUp, Cloud, WifiOff, Bed, Coffee, ChevronRight, BookOpen } from "lucide-react";
import TutorialOverlay, { TutorialStep } from "./TutorialOverlay";
import DiceBoxCanvas, { triggerDiceRoll } from "./DiceBoxCanvas";
import { updatePlayerHp, addRollLog, subscribeToNudges, clearNudge, subscribeToPlayers, syncPlayerProfile, subscribeToCampaignConfig, CampaignConfig, subscribeToJournal } from "@/lib/syncEngine";
import { updateCharacterHp, levelUpCharacter, setTutorialEnabled } from "@/lib/characterEngine";
import { getLevelUpInfo } from "@/lib/levelUpData";
import { isFirebaseConfigured } from "@/lib/firebase";
import LevelUpPanel from "./LevelUpPanel";
import { Character, CharacterClass, CLASS_DISPLAY_NAMES, CLASSES } from "@/types/character";
import { JournalEntry } from "@/types/journal";


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

// Stealth modifier proxy per class (DEX-based estimate)
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
  const [campaign, setCampaign] = useState<CampaignConfig | null>(null);

  // Tab State
  const [activeTab, setActiveTab] = useState<"combat" | "journal">("combat");
  
  // Journal entries state
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);


  const hpRef = useRef(currentHp);
  useEffect(() => { hpRef.current = currentHp; }, [currentHp]);

  const nudgeRef = useRef(activeNudge);
  useEffect(() => { nudgeRef.current = activeNudge; }, [activeNudge]);

  const arsenal = getClassArsenal(character.className);
  const stealthMod = STEALTH_MOD[character.className];
  const displayClass = `Level ${currentLevel} ${CLASS_DISPLAY_NAMES[character.className]}`;
  const initial = character.name[0]?.toUpperCase() ?? "?";

  useEffect(() => {
    // Register/sync the character profile with the DM dashboard when it mounts
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

    const unsubscribeJournal = subscribeToJournal(campaignId, (entriesList) => {
      // Show only published entries
      const published = entriesList.filter(e => e.published);
      setJournalEntries(published);
    });

    return () => {
      unsubscribeConfig();
      unsubscribeNudges();
      unsubscribePlayers();
      unsubscribeJournal();
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
    // Magic Missile auto-hits — skip d20, roll damage directly
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
        await addRollLog(
          campaignId,
          character.name, 
          `attacked with ${weapon.name} (rolled ${dieResult} + ${weapon.toHitModifier})`, 
          `1d20 + ${weapon.toHitModifier}`, 
          grandTotal, 
          "attack"
        );
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
        setTutorialStep({ type: "stealth-rolled", rollTotal: dieResult });
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

  const initiativeDisplay = character.initiative >= 0 ? `+${character.initiative}` : `${character.initiative}`;
  return (
    <div className="flex-1 flex flex-col justify-between overflow-y-auto relative p-4 md:p-6 pb-28">
      <DiceBoxCanvas />

      {/* Header */}
      <header className="flex justify-between items-center mb-4 z-10 select-none shrink-0">
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
            <button
              onClick={() => setShowLevelUp(true)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full ${theme.bg}/10 border ${theme.border} text-[10px] ${theme.text} font-bold hover:${theme.bg}/20 transition-colors`}
            >
              <TrendingUp className="w-3 h-3" />
              Level Up
            </button>
          )}
          <button
            onClick={handleToggleTutorial}
            title={tutorialEnabled ? "Guidance on — tap to turn off" : "Guidance off — tap to turn on"}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-bold transition-colors ${
              tutorialEnabled
                ? `${theme.bg}/10 ${theme.border} ${theme.text} hover:${theme.bg}/20`
                : "bg-slate-900/40 border-slate-800 text-slate-600 hover:text-slate-400"
            }`}
          >
            <Sparkles className="w-3 h-3" />
            Guide
          </button>

          {isFirebaseConfigured ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-bold shadow-sm select-none" title="Cloud Sync Active: Syncing across all devices">
              <Cloud className="w-3 h-3" />
              <span>Cloud Sync</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-500 font-bold shadow-sm select-none" title="Local Mode: Syncing only between tabs on this computer">
              <WifiOff className="w-3 h-3" />
              <span>Local Mode</span>
            </div>
          )}
        </div>
      </header>

      {/* DM Nudge Alert */}
      {activeNudge && (
        <div className="mb-4 z-15 bg-radial from-amber-500/10 to-amber-950/20 border border-amber-500/40 p-4 rounded-2xl animate-shake shadow-[0_0_20px_rgba(245,158,11,0.15)] flex flex-col gap-2.5 shrink-0">
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

      {/* Main Content Area */}
      <div className="flex-1 z-10 w-full mb-4">
        {activeTab === "combat" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in w-full">
            
            {/* Left Column: Health, Stats, Turn Actions */}
            <div className="lg:col-span-7 space-y-4 w-full">
              {/* Health */}
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
                        <span className="text-slate-500"> / {character.maxHp} HP</span>
                      </>
                    )}
                  </span>
                </div>
                <div className="w-full h-5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800/50">
                  <div className={`h-full ${hpColorClass} rounded-full transition-all duration-500`} style={{ width: `${(currentHp / character.maxHp) * 100}%` }} />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-1">
                  <button onClick={() => adjustHp(-1)} className="py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 border border-slate-800 hover:border-red-500/30 text-red-400 flex items-center justify-center gap-2 transition-all font-bold">
                    <Minus className="w-6 h-6 stroke-[3px]" />
                    <span className="text-xs uppercase tracking-wider">Take Damage</span>
                  </button>
                  <button onClick={() => adjustHp(1)} className="py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 border border-slate-800 hover:border-emerald-500/30 text-emerald-400 flex items-center justify-center gap-2 transition-all font-bold">
                    <Plus className="w-6 h-6 stroke-[3px]" />
                    <span className="text-xs uppercase tracking-wider">Heal</span>
                  </button>
                </div>
              </section>

              {/* Core stats */}
              <section className="grid grid-cols-3 gap-2 select-none">
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-center items-center text-center">
                  <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mb-1">
                    <Shield className={`w-3.5 h-3.5 ${theme.text}`} />AC
                  </span>
                  <strong className="text-sm font-extrabold text-slate-200">{character.ac}</strong>
                </div>
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-center items-center text-center">
                  <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mb-1">
                    <Compass className={`w-3.5 h-3.5 ${theme.text}`} />Init
                  </span>
                  <strong className="text-sm font-extrabold text-slate-200">{initiativeDisplay}</strong>
                </div>
                <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-2.5 flex flex-col justify-center items-center text-center">
                  <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mb-1">
                    <Eye className={`w-3.5 h-3.5 ${theme.text}`} />Passive
                  </span>
                  <strong className="text-sm font-extrabold text-slate-200">{character.passivePerception}</strong>
                </div>
              </section>

              {/* Turn Actions */}
              <section className="mt-2 z-10 select-none">
                <div className="flex justify-between items-center mb-2 px-1">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Turn Actions</h3>
                  <button 
                    onClick={() => setShowRestMenu(true)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${theme.bg}/10 border ${theme.border} text-[10px] ${theme.text} font-bold hover:${theme.bg}/20 transition-all`}
                  >
                    <Bed className="w-3 h-3" />
                    Take a Rest
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button onClick={handleMoveClick} className="flex flex-col items-center justify-center py-3.5 px-1 rounded-xl bg-slate-900/50 hover:bg-slate-900 border border-slate-800 active:scale-95 text-slate-400 transition-all gap-1.5">
                    <Footprints className={`w-5 h-5 ${theme.text}`} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Move ({character.speed}ft)</span>
                  </button>
                  <button onClick={handleHideClick} className="flex flex-col items-center justify-center py-3.5 px-1 rounded-xl bg-slate-900/50 hover:bg-slate-900 border border-slate-800 active:scale-95 text-slate-400 transition-all gap-1.5">
                    <Eye className={`w-5 h-5 ${theme.text}`} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Hide (Stealth)</span>
                  </button>
                  <button onClick={handleDrinkPotion} className="flex flex-col items-center justify-center py-3.5 px-1 rounded-xl bg-slate-900/50 hover:bg-slate-900 border border-slate-800 active:scale-95 text-slate-400 transition-all gap-1.5">
                    <Wine className={`w-5 h-5 ${theme.text}`} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">Drink Potion</span>
                  </button>
                </div>
              </section>
            </div>

            {/* Right Column: Arsenal */}
            <div className="lg:col-span-5 space-y-4 w-full">
              <section className="flex flex-col gap-3 select-none">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">The Arsenal (Tap to Attack)</h3>
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
                          <h4 className="font-bold text-sm text-slate-200 group-hover:text-slate-100">{weapon.name}</h4>
                          <p className="text-[11px] text-slate-500">
                            Damage: <span className="text-slate-400 font-medium">{weapon.damageNotation} {weapon.damageType}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-550 font-bold block uppercase tracking-wider leading-none">
                          {weapon.id === "magic-missile" ? "Auto" : "Modifier"}
                        </span>
                        <span className="text-lg font-extrabold text-amber-500">
                          {weapon.id === "magic-missile" ? "Hit" : `+${weapon.toHitModifier}`}
                        </span>
                        <span className="text-[9px] text-slate-400 block font-medium">
                          {weapon.id === "magic-missile" ? "no roll" : "to hit"}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            </div>

          </div>
        ) : (
          <div className="max-w-4xl mx-auto w-full animate-fade-in">
            {/* Story Journal Recap Feed */}
            <section className="bg-slate-900/30 border border-slate-900 rounded-3xl p-5 flex flex-col space-y-4 select-none">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1 flex items-center gap-1.5 shrink-0">
                <BookOpen className={`w-4 h-4 ${theme.text}`} />
                Story Journal Recap
              </h3>
              
              <div className="space-y-4">
                {journalEntries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-slate-650 text-xs py-16 text-center">
                    <BookOpen className="w-10 h-10 text-slate-800 mb-3 opacity-40 animate-pulse" />
                    <p>No recaps have been published yet by the DM.</p>
                    <p className="text-[10px] mt-1 text-slate-700">Check back during or after the session!</p>
                  </div>
                ) : (
                  journalEntries.map((entry) => (
                    <div 
                      key={entry.id}
                      className="p-4 rounded-2xl bg-slate-900/50 border border-slate-900/60 text-xs space-y-3 shadow-md"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <h4 className="font-extrabold text-slate-200 text-sm tracking-tight">{entry.title}</h4>
                          <span className="text-[9px] text-slate-550 font-bold uppercase tracking-wider">
                            {new Date(entry.createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                      </div>

                      <p className="text-slate-350 leading-relaxed whitespace-pre-line text-[11px] font-medium">
                        {entry.content}
                      </p>

                      {entry.npcNames.length > 0 && (
                        <div className="flex flex-wrap gap-1 items-center pt-1">
                          <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500 mr-1">NPCs:</span>
                          {entry.npcNames.map((npc) => (
                            <span key={npc} className="px-1.5 py-0.2 rounded bg-slate-950 border border-slate-850 text-[10px] text-slate-400 font-medium">{npc}</span>
                          ))}
                        </div>
                      )}

                      {entry.questDetails && (
                        <div className="pt-2 border-t border-slate-850/60">
                          <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-500 block mb-1">Quests:</span>
                          <p className="text-slate-400 font-semibold text-[10px] leading-relaxed whitespace-pre-line italic">
                            {entry.questDetails}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}
      </div>

      {showRestMenu && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-[32px] p-6 shadow-2xl animate-in slide-in-from-bottom-8 duration-300">
            <div className="text-center space-y-2 mb-6">
              <div className={`w-14 h-14 rounded-2xl ${theme.bg}/10 border ${theme.border} flex items-center justify-center mx-auto mb-2`}>
                <Bed className={`w-7 h-7 ${theme.text}`} />
              </div>
              <h2 className="text-xl font-bold text-white">Time for a Rest?</h2>
              <p className="text-slate-400 text-sm">Recover your strength before the next encounter.</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleShortRest}
                className="w-full group flex items-center justify-between p-4 rounded-2xl bg-slate-850 border border-slate-700 hover:border-emerald-500/50 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Coffee className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm">Short Rest</div>
                    <div className="text-slate-500 text-[10px]">Spend 1 Hit Die ({CLASSES.find(c => c.id === character.className)?.hitDie}+2)</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
              </button>

              <button
                onClick={handleLongRest}
                className="w-full group flex items-center justify-between p-4 rounded-2xl bg-slate-850 border border-slate-700 hover:border-indigo-500/50 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <Bed className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-white font-bold text-sm">Long Rest</div>
                    <div className="text-slate-500 text-[10px]">Restore full health and resources</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
              </button>

              <button
                onClick={() => setShowRestMenu(false)}
                className="w-full py-3 text-slate-500 hover:text-slate-300 font-bold text-xs uppercase tracking-widest transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showLevelUp && (
        <LevelUpPanel
          character={{ ...character, level: currentLevel }}
          onConfirm={handleConfirmLevelUp}
          onCancel={() => setShowLevelUp(false)}
        />
      )}

      {(tutorialEnabled || tutorialStep.type !== "idle") && (
        <TutorialOverlay
          step={tutorialStep}
          compact={!tutorialEnabled}
          onClose={() => setTutorialStep({ type: "idle" })}
          onRollDamage={
            tutorialStep.type === "attack-rolled"
              ? () => handleRollDamage(tutorialStep.weaponName, tutorialStep.damageNotation, "slashing")
              : undefined
          }
        />
      )}

      {/* Bottom Navigation Tabs */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-slate-950/95 backdrop-blur-md border-t border-slate-900 px-6 py-2.5 flex justify-around select-none md:max-w-md md:mx-auto md:rounded-t-2xl md:border-x">
        <button
          onClick={() => setActiveTab("combat")}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === "combat" ? theme.text : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <Swords className="w-5 h-5" />
          <span className="text-[9px] font-bold uppercase tracking-widest">Combat</span>
        </button>
        <button
          onClick={() => setActiveTab("journal")}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === "journal" ? theme.text : "text-slate-500 hover:text-slate-300"
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[9px] font-bold uppercase tracking-widest">Journal</span>
        </button>
      </div>
    </div>
  );
}
