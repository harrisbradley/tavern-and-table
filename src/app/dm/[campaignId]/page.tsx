"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Shield, 
  Users, 
  History, 
  Dice5, 
  MessageSquareText, 
  Swords, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Play, 
  RotateCcw, 
  Heart, 
  Plus, 
  Minus, 
  Zap,
  Eye,
  Cloud,
  WifiOff,
  Link as LinkIcon,
  Check
} from "lucide-react";
import { 
  subscribeToPlayers, 
  subscribeToRollLogs, 
  updatePlayerHp, 
  deletePlayerProfile,
  addRollLog, 
  sendNudge, 
  PlayerStatus, 
  RollLog 
} from "@/lib/syncEngine";
import { isFirebaseConfigured } from "@/lib/firebase";

interface Combatant {
  id: string;
  name: string;
  initiative: number;
  currentHp: number;
  maxHp: number;
  isMonster: boolean;
}

export default function DmDashboard({ params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = use(params);
  const [players, setPlayers] = useState<PlayerStatus[]>([]);
  const [rollLogs, setRollLogs] = useState<RollLog[]>([]);
  const [nudgeMessage, setNudgeMessage] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);

  // Initiative Tracker States
...
  // Helper to copy join link
  const handleCopyInvite = () => {
    if (typeof window === "undefined") return;
    const joinUrl = `${window.location.origin}/join/${campaignId}`;
    navigator.clipboard.writeText(joinUrl).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    });
  };
  const [combatants, setCombatants] = useState<Combatant[]>([]);
  const [activeTurnIndex, setActiveTurnIndex] = useState<number | null>(null);
  const [combatActive, setCombatActive] = useState<boolean>(false);

  // Form states for adding custom combatant
  const [newCombatantName, setNewCombatantName] = useState("");
  const [newCombatantInitiative, setNewCombatantInitiative] = useState("");
  const [newCombatantHp, setNewCombatantHp] = useState("");
  const [newCombatantIsMonster, setNewCombatantIsMonster] = useState(true);

  // Subscribe to players and logs in real-time
  useEffect(() => {
    const unsubscribePlayers = subscribeToPlayers(campaignId, (playersList) => {
      setPlayers(playersList);
    });

    const unsubscribeRollLogs = subscribeToRollLogs(campaignId, (logsList) => {
      setRollLogs(logsList);
    });

    return () => {
      unsubscribePlayers();
      unsubscribeRollLogs();
    };
  }, [campaignId]);

  // Keep combatant HP in sync with live player state
  useEffect(() => {
    setCombatants(prev => prev.map(c => {
      if (c.isMonster) return c;
      const live = players.find(p => `player-${p.id}` === c.id);
      return live ? { ...c, currentHp: live.currentHp, maxHp: live.maxHp } : c;
    }));
  }, [players]);

  // DM updates player health
  const adjustPlayerHp = async (id: string, amount: number) => {
    const player = players.find((p) => p.id === id);
    if (!player) return;

    const nextHp = Math.min(Math.max(0, player.currentHp + amount), player.maxHp);
    
    try {
      // Sync the health bar change
      await updatePlayerHp(campaignId, id, nextHp, player.maxHp);

      // Log this DM health change to the log feed
      const actionDescription = amount > 0 
        ? `restored ${amount} HP via DM adjustment` 
        : `took ${Math.abs(amount)} damage via DM adjustment`;
        
      await addRollLog(
        campaignId,
        "DM Screen", 
        `${player.name} ${actionDescription}`, 
        `${Math.abs(amount)} HP`, 
        nextHp, 
        amount > 0 ? "heal" : "damage"
      );

      // Update in initiative tracker too if they exist
      setCombatants(prev => prev.map(c => {
        if (c.id === `player-${id}`) {
          return { ...c, currentHp: nextHp };
        }
        return c;
      }));
    } catch (err) {
      console.error("Failed to update player HP from DM screen:", err);
    }
  };

  // DM requested roll nudge
  const handleSendNudge = async (playerId: string, playerName: string, rollType: string) => {
    try {
      await sendNudge(playerId, rollType);
      
      setNudgeMessage(`Alert sent to ${playerName}: "Please roll a ${rollType}!"`);
      setTimeout(() => {
        setNudgeMessage(null);
      }, 4000);
    } catch (err) {
      console.error("Failed to send nudge:", err);
    }
  };

  // -------------------------------------------------------------
  // INITIATIVE TRACKER / COMBAT SEQUENCER LOGIC
  // -------------------------------------------------------------

  // Populate from connected players and roll initiative for them
  const handleAddPartyToInitiative = () => {
    const partyCombatants = players.map(p => {
      const d20 = Math.floor(Math.random() * 20) + 1;
      return {
        id: `player-${p.id}`,
        name: p.name,
        initiative: d20 + p.initiative,
        currentHp: p.currentHp,
        maxHp: p.maxHp,
        isMonster: false
      };
    });

    // Merge into list, avoiding duplicates
    const currentIds = new Set(combatants.map(c => c.id));
    const uniqueParty = partyCombatants.filter(c => !currentIds.has(c.id));
    const merged = [...combatants, ...uniqueParty];

    if (!combatActive) {
      merged.sort((a, b) => b.initiative - a.initiative);
    }
    setCombatants(merged);
  };

  // Roll d20 initiative helper in the form
  const handleRollFormInitiative = () => {
    const roll = Math.floor(Math.random() * 20) + 1;
    setNewCombatantInitiative(roll.toString());
  };

  // Add custom monster or player
  const handleAddCombatant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCombatantName) return;

    const initScore = parseInt(newCombatantInitiative) || 0;
    const hpVal = parseInt(newCombatantHp) || 10;
    const randomId = "comb-" + Math.random().toString(36).substring(2, 9);

    const newC: Combatant = {
      id: randomId,
      name: newCombatantName,
      initiative: initScore,
      currentHp: hpVal,
      maxHp: hpVal,
      isMonster: newCombatantIsMonster
    };

    const updated = [...combatants, newC];
    if (!combatActive) {
      updated.sort((a, b) => b.initiative - a.initiative);
    }
    setCombatants(updated);

    // Reset Form
    setNewCombatantName("");
    setNewCombatantInitiative("");
    setNewCombatantHp("");
  };

  // Delete combatant
  const handleRemoveCombatant = (id: string) => {
    const index = combatants.findIndex(c => c.id === id);
    if (index === -1) return;

    const updated = combatants.filter(c => c.id !== id);
    setCombatants(updated);

    if (combatActive && activeTurnIndex !== null) {
      if (updated.length === 0) {
        setCombatActive(false);
        setActiveTurnIndex(null);
      } else if (activeTurnIndex >= updated.length) {
        setActiveTurnIndex(0);
      } else if (activeTurnIndex > index) {
        setActiveTurnIndex(activeTurnIndex - 1);
      }
    }
  };

  // Reorder up/down (Manual Override)
  const handleMoveCombatant = (index: number, direction: "up" | "down") => {
    const swapTarget = direction === "up" ? index - 1 : index + 1;
    if (swapTarget < 0 || swapTarget >= combatants.length) return;

    const list = [...combatants];
    const temp = list[index];
    list[index] = list[swapTarget];
    list[swapTarget] = temp;

    setCombatants(list);

    if (combatActive && activeTurnIndex !== null) {
      if (activeTurnIndex === index) {
        setActiveTurnIndex(swapTarget);
      } else if (activeTurnIndex === swapTarget) {
        setActiveTurnIndex(index);
      }
    }
  };

  // Adjust health of tracker combatant (especially for monsters)
  const handleAdjustCombatantHp = (id: string, amount: number) => {
    setCombatants(prev => prev.map(c => {
      if (c.id === id) {
        const nextHp = Math.min(Math.max(0, c.currentHp + amount), c.maxHp);
        // If it's a player, mirror to database too
        if (!c.isMonster && id.startsWith("player-")) {
          const playerId = id.replace("player-", "");
          adjustPlayerHp(playerId, amount);
        }
        return { ...c, currentHp: nextHp };
      }
      return c;
    }));
  };

  // Combat Cycle Controls
  const handleStartCombat = () => {
    if (combatants.length === 0) return;
    const sorted = [...combatants].sort((a, b) => b.initiative - a.initiative);
    setCombatants(sorted);
    setCombatActive(true);
    setActiveTurnIndex(0);
  };

  const handleNextTurn = () => {
    if (combatants.length === 0 || activeTurnIndex === null) return;
    setActiveTurnIndex((activeTurnIndex + 1) % combatants.length);
  };

  const handlePrevTurn = () => {
    if (combatants.length === 0 || activeTurnIndex === null) return;
    setActiveTurnIndex((activeTurnIndex - 1 + combatants.length) % combatants.length);
  };

  const handleResetCombat = () => {
    setCombatActive(false);
    setActiveTurnIndex(null);
    setCombatants([]);
  };

  // Helper to format ISO timestamp into simple readable local time
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return "Just now";
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <nav className="border-b border-slate-900 bg-slate-950/60 backdrop-blur-md sticky top-0 z-20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/" 
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-indigo-400" />
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-indigo-300">
              Tavern & Table Screen
            </h1>
            <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider">
              Dungeon Master Mode
            </span>
          </div>
        </div>

        {/* Connection Status & Campaign Info */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyInvite}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold transition-all select-none ${
              copySuccess 
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" 
                : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20"
            }`}
          >
            {copySuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Invite Players</span>
              </>
            )}
          </button>

          {isFirebaseConfigured ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold shadow-sm select-none" title="Cloud Sync Active: Syncing across all devices">
              <Cloud className="w-3.5 h-3.5" />
              <span>Cloud Sync</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs font-bold shadow-sm select-none" title="Local Mode: Syncing only between tabs on this computer">
              <WifiOff className="w-3.5 h-3.5" />
              <span>Local Mode</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
            Campaign ID: <strong>{campaignId}</strong>
          </div>
        </div>
      </nav>

      {/* Main Grid Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        
        {/* COL 1 & 2: DM MANAGEMENT CONTROLS */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* PARTY STATUS BOARD */}
          <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold flex items-center gap-2 text-slate-200">
                <Users className="w-5 h-5 text-indigo-400" />
                Active Party Members
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 font-semibold">{players.length} players connected</span>
                <button
                  onClick={async () => {
                    if (confirm("Clear ALL connected players from the DM dashboard? Players will reappear when they next load their dashboard.")) {
                      try {
                        for (const p of players) {
                          await deletePlayerProfile(campaignId, p.id);
                        }
                      } catch (err) {
                        console.error("Failed to clear players:", err);
                      }
                    }
                  }}
                  className="px-2 py-1 rounded bg-red-950/20 border border-red-900/30 text-[10px] font-bold text-red-400 hover:bg-red-950/40 transition-all uppercase tracking-wider"
                >
                  Purge All
                </button>
              </div>
            </div>

            {/* Players list cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {players.map((player) => {
                const ratio = player.currentHp / player.maxHp;
                let barColor = "bg-emerald-500";
                let textHpColor = "text-emerald-400";
                if (ratio <= 0.25) {
                  barColor = "bg-red-500";
                  textHpColor = "text-red-500";
                } else if (ratio <= 0.5) {
                  barColor = "bg-amber-500";
                  textHpColor = "text-amber-500";
                }

                return (
                  <div 
                    key={player.id}
                    className="p-5 rounded-2xl bg-slate-900/40 border border-slate-850/80 hover:border-slate-800 transition-colors space-y-4 shadow-sm"
                  >
                    {/* Character Card Header */}
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0 pr-2">
                        <h3 className="font-bold text-slate-200 text-base leading-tight truncate">{player.name}</h3>
                        <p className="text-xs text-slate-500 font-medium truncate">{player.className}</p>
                      </div>
                      
                      <div className="flex flex-col items-end gap-1.5">
                        {player.status === "down" ? (
                          <span className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                            Down!
                          </span>
                        ) : player.status === "hidden" ? (
                          <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                            Hidden
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                            Active
                          </span>
                        )}

                        <button
                          onClick={async () => {
                            if (confirm(`Remove ${player.name} from the campaign?`)) {
                              try {
                                await deletePlayerProfile(player.id);
                              } catch (err) {
                                console.error("Failed to remove player:", err);
                              }
                            }
                          }}
                          className="p-1 rounded bg-slate-950 border border-slate-900 text-slate-600 hover:text-red-400 hover:border-red-900/50 transition-all group/del"
                          title="Remove from campaign"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Stats summary (Armor, Initiative, Passive Perception) */}
                    <div className="grid grid-cols-3 gap-1 bg-slate-950/40 p-2 rounded-xl border border-slate-900 text-[10px] sm:text-[11px] select-none">
                      <div className="text-slate-400 font-semibold text-center border-r border-slate-850">
                        AC: <span className="text-slate-200 font-extrabold">{player.ac}</span>
                      </div>
                      <div className="text-slate-400 font-semibold text-center border-r border-slate-850">
                        Init: <span className="text-slate-200 font-extrabold">+{player.initiative}</span>
                      </div>
                      <div className="text-slate-400 font-semibold text-center">
                        Passive: <span className="text-slate-200 font-extrabold">{player.passivePerception}</span>
                      </div>
                    </div>

                    {/* HP Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold select-none">
                        <span className="text-slate-400">Health Points</span>
                        <span className="text-slate-300">
                          <span className={`${textHpColor} font-bold`}>{player.currentHp}</span> / {player.maxHp} HP
                        </span>
                      </div>
                      <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-900/60">
                        <div 
                          className={`h-full ${barColor} rounded-full transition-all duration-300`}
                          style={{ width: `${(player.currentHp / player.maxHp) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Quick DM Health Adjusters */}
                    <div className="flex items-center justify-between gap-2 pt-1 select-none">
                      <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">DM Health Adjust:</span>
                      <div className="flex gap-1.5">
                        <button 
                          onClick={() => adjustPlayerHp(player.id, -5)}
                          className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-900 text-red-400 hover:bg-slate-900 transition-colors text-xs font-extrabold"
                          title="Apply 5 damage"
                        >
                          -5 HP
                        </button>
                        <button 
                          onClick={() => adjustPlayerHp(player.id, -1)}
                          className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-900 text-red-500 hover:bg-slate-900 transition-colors text-xs font-extrabold"
                          title="Apply 1 damage"
                        >
                          -1 HP
                        </button>
                        <button 
                          onClick={() => adjustPlayerHp(player.id, 1)}
                          className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-900 text-emerald-500 hover:bg-slate-900 transition-colors text-xs font-extrabold"
                          title="Heal 1 HP"
                        >
                          +1 HP
                        </button>
                        <button 
                          onClick={() => adjustPlayerHp(player.id, 5)}
                          className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-900 text-emerald-400 hover:bg-slate-900 transition-colors text-xs font-extrabold"
                          title="Heal 5 HP"
                        >
                          +5 HP
                        </button>
                      </div>
                    </div>

                    {/* DM Nudge Buttons */}
                    <div className="border-t border-slate-850 pt-3 flex gap-2">
                      <button
                        onClick={() => handleSendNudge(player.id, player.name, "Initiative Check")}
                        className="flex-1 py-2 rounded-lg bg-slate-900 hover:bg-slate-850 active:scale-98 border border-slate-800 text-[10px] font-bold text-slate-300 tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Dice5 className="w-3.5 h-3.5 text-indigo-400" />
                        Ask Init
                      </button>
                      <button
                        onClick={() => handleSendNudge(player.id, player.name, "Stealth Check")}
                        className="flex-1 py-2 rounded-lg bg-slate-900 hover:bg-slate-850 active:scale-98 border border-slate-800 text-[10px] font-bold text-slate-300 tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Dice5 className="w-3.5 h-3.5 text-indigo-400" />
                        Ask Stealth
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* INITIATIVE TRACKER / COMBAT SEQUENCER */}
          <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <div className="flex items-center gap-2">
                <Swords className="w-5 h-5 text-amber-500 animate-pulse" />
                <h2 className="text-lg font-bold text-slate-200">
                  Combat Initiative Sequencer
                </h2>
                {combatActive && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[9px] font-bold uppercase tracking-wider animate-pulse flex items-center gap-1">
                    <Zap className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> Active
                  </span>
                )}
              </div>

              {/* Top Quick Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleAddPartyToInitiative}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-bold text-indigo-400 tracking-wider uppercase flex items-center gap-1.5 transition-all"
                >
                  <Users className="w-3.5 h-3.5" />
                  Add Connected Party
                </button>
                <button
                  onClick={handleResetCombat}
                  className="px-3 py-1.5 rounded-lg bg-red-950/20 hover:bg-red-955/30 border border-red-900/30 text-xs font-bold text-red-400 tracking-wider uppercase flex items-center gap-1.5 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Clear List
                </button>
              </div>
            </div>

            {/* Combatants List */}
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {combatants.length === 0 ? (
                <div className="py-12 text-center rounded-2xl border border-dashed border-slate-850/80 bg-slate-950/10 select-none">
                  <p className="text-slate-500 text-sm font-semibold">No combatants added to the order yet.</p>
                  <p className="text-slate-650 text-xs mt-1">Use the quick "Add Connected Party" button or add a monster below!</p>
                </div>
              ) : (
                combatants.map((c, index) => {
                  const isActiveTurn = combatActive && activeTurnIndex === index;
                  const ratio = c.currentHp / c.maxHp;
                  let hpBarColor = "bg-emerald-500";
                  if (ratio <= 0.25) hpBarColor = "bg-red-500";
                  else if (ratio <= 0.5) hpBarColor = "bg-amber-500";

                  return (
                    <div
                      key={c.id}
                      className={`flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-3 rounded-xl border transition-all duration-300 ${
                        isActiveTurn 
                          ? "border-amber-500/50 bg-radial from-amber-500/10 via-amber-950/5 to-slate-950/40 shadow-[0_0_20px_rgba(245,158,11,0.15)] scale-[1.01]" 
                          : "border-slate-850/80 bg-slate-900/10 hover:border-slate-800"
                      }`}
                    >
                      {/* Left: Indicator, Initiative Score, Name & HP */}
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        {/* Initiative Score Badge */}
                        <div className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center font-extrabold border shrink-0 text-center leading-none ${
                          isActiveTurn 
                            ? "bg-gold border-gold-hover text-slate-950 shadow-[0_0_10px_rgba(245,158,11,0.3)] animate-pulse" 
                            : "bg-slate-950 border-slate-850 text-slate-200"
                        }`}>
                          <span className="text-[9px] uppercase font-bold opacity-60 leading-none">Init</span>
                          <span className="text-lg font-black tracking-tight mt-0.5">{c.initiative}</span>
                        </div>

                        {/* Name, Type & HP stats */}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 select-none">
                            <span className={`font-bold text-sm truncate ${isActiveTurn ? "text-amber-400" : "text-slate-200"}`}>
                              {c.name}
                            </span>
                            {c.isMonster ? (
                              <span className="px-1.5 py-0.2 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-[9px] font-bold uppercase tracking-wider">
                                Monster
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-bold uppercase tracking-wider">
                                Player
                              </span>
                            )}
                            {isActiveTurn && (
                              <span className="px-2 py-0.2 rounded bg-gold/10 border border-gold/30 text-gold text-[9px] font-black uppercase tracking-wider animate-bounce select-none">
                                Active Turn
                              </span>
                            )}
                          </div>

                          {/* HP Tracker row */}
                          <div className="flex items-center gap-2 select-none">
                            <div className="w-16 h-1.5 bg-slate-950 border border-slate-900 rounded-full overflow-hidden p-0.2 shrink-0">
                              <div 
                                className={`h-full ${hpBarColor} rounded-full transition-all`}
                                style={{ width: `${(c.currentHp / c.maxHp) * 100}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">
                              HP: <strong className="text-slate-300 font-semibold">{c.currentHp}</strong>/{c.maxHp}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Side Controls: HP adjustment, Move order, Delete */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 mt-3 sm:mt-0 pt-2.5 sm:pt-0 border-t border-slate-850/50 sm:border-t-0 select-none">
                        {/* HP Quick Adjusters (Monster damage/heal) */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleAdjustCombatantHp(c.id, -5)}
                            className="w-7 h-7 rounded bg-slate-950 border border-slate-900 text-red-400 hover:bg-slate-900 transition-colors text-[10px] font-black flex items-center justify-center"
                            title="Subtract 5 HP"
                          >
                            -5
                          </button>
                          <button
                            onClick={() => handleAdjustCombatantHp(c.id, -1)}
                            className="w-7 h-7 rounded bg-slate-950 border border-slate-900 text-red-500 hover:bg-slate-900 transition-colors text-[10px] font-black flex items-center justify-center"
                            title="Subtract 1 HP"
                          >
                            -1
                          </button>
                          <button
                            onClick={() => handleAdjustCombatantHp(c.id, 1)}
                            className="w-7 h-7 rounded bg-slate-950 border border-slate-900 text-emerald-500 hover:bg-slate-900 transition-colors text-[10px] font-black flex items-center justify-center"
                            title="Add 1 HP"
                          >
                            +1
                          </button>
                          <button
                            onClick={() => handleAdjustCombatantHp(c.id, 5)}
                            className="w-7 h-7 rounded bg-slate-950 border border-slate-900 text-emerald-400 hover:bg-slate-900 transition-colors text-[10px] font-black flex items-center justify-center"
                            title="Add 5 HP"
                          >
                            +5
                          </button>
                        </div>

                        {/* Move order up/down (Manual Reorder) */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleMoveCombatant(index, "up")}
                            disabled={index === 0}
                            className="w-7 h-7 rounded bg-slate-950 border border-slate-900 text-slate-400 hover:bg-slate-900 disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center justify-center"
                            title="Move Up"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleMoveCombatant(index, "down")}
                            disabled={index === combatants.length - 1}
                            className="w-7 h-7 rounded bg-slate-950 border border-slate-900 text-slate-400 hover:bg-slate-900 disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center justify-center"
                            title="Move Down"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Delete from combat */}
                        <button
                          onClick={() => handleRemoveCombatant(c.id)}
                          className="w-7 h-7 rounded bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-red-400 transition-colors flex items-center justify-center"
                          title="Remove from Combat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Combat Cycle Trigger buttons */}
            <div className="border-t border-slate-850/80 pt-4 flex gap-3">
              {!combatActive ? (
                <button
                  onClick={handleStartCombat}
                  disabled={combatants.length === 0}
                  className="flex-1 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-98 disabled:opacity-40 disabled:pointer-events-none text-slate-950 font-bold text-sm tracking-wide uppercase transition-all shadow-[0_4px_12px_rgba(16,185,129,0.15)] flex items-center justify-center gap-2 hover:scale-[1.01]"
                >
                  <Play className="w-4 h-4 fill-slate-950 text-slate-950" />
                  Start Combat Run
                </button>
              ) : (
                <>
                  <button
                    onClick={handlePrevTurn}
                    className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-850 active:scale-98 border border-slate-800 text-xs font-bold text-slate-300 tracking-wider uppercase transition-all"
                  >
                    Prev Turn
                  </button>
                  <button
                    onClick={handleNextTurn}
                    className="flex-1 py-3.5 rounded-xl bg-gold hover:bg-gold-hover active:scale-98 text-slate-950 font-extrabold text-sm tracking-wide uppercase transition-all shadow-[0_4px_12px_rgba(245,158,11,0.2)] flex items-center justify-center gap-2 hover:scale-[1.01]"
                  >
                    Next Turn
                    <Play className="w-4 h-4 fill-slate-950 text-slate-950" />
                  </button>
                </>
              )}
            </div>

            {/* Add Custom Combatant Mini-Form */}
            <form onSubmit={handleAddCombatant} className="border-t border-slate-850/80 pt-4 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-0.5">
                Add Custom Combatant (Monster/NPC)
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                {/* Name */}
                <input
                  type="text"
                  placeholder="Combatant Name (e.g. Goblin 1)"
                  value={newCombatantName}
                  onChange={(e) => setNewCombatantName(e.target.value)}
                  className="sm:col-span-2 px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 focus:outline-hidden text-slate-100 placeholder:text-slate-600 transition-colors"
                />

                {/* HP */}
                <div className="relative">
                  <input
                    type="number"
                    placeholder="HP"
                    value={newCombatantHp}
                    onChange={(e) => setNewCombatantHp(e.target.value)}
                    className="w-full px-3 py-2 pr-7 text-xs rounded-lg bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 focus:outline-hidden text-slate-100 placeholder:text-slate-600 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <Heart className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-red-500/60" />
                </div>

                {/* Initiative */}
                <div className="relative flex gap-1">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      placeholder="Init"
                      value={newCombatantInitiative}
                      onChange={(e) => setNewCombatantInitiative(e.target.value)}
                      className="w-full px-3 py-2 pr-7 text-xs rounded-lg bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 focus:outline-hidden text-slate-100 placeholder:text-slate-600 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <Dice5 className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-indigo-400/60" />
                  </div>
                  
                  {/* Roll button inside form */}
                  <button
                    type="button"
                    onClick={handleRollFormInitiative}
                    className="px-2 rounded-lg bg-indigo-950/20 hover:bg-indigo-950/40 border border-indigo-900/30 text-indigo-400 text-xs transition-colors flex items-center justify-center"
                    title="Quick roll d20"
                  >
                    Roll
                  </button>
                </div>
              </div>

              {/* Type Toggle & Submit button */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                {/* Type Selection Tabs */}
                <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-850 select-none">
                  <button
                    type="button"
                    onClick={() => setNewCombatantIsMonster(true)}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${
                      newCombatantIsMonster 
                        ? "bg-red-500/10 border border-red-500/20 text-red-400" 
                        : "text-slate-500 hover:text-slate-350"
                    }`}
                  >
                    Monster/NPC
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCombatantIsMonster(false)}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wide transition-all ${
                      !newCombatantIsMonster 
                        ? "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400" 
                        : "text-slate-500 hover:text-slate-350"
                    }`}
                  >
                    Player
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={!newCombatantName}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none active:scale-98 text-slate-950 font-bold text-xs uppercase tracking-wide transition-all"
                >
                  Add to Queue
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* COL 3: REAL-TIME DICE ROLL LOGS */}
        <div className="space-y-6">
          
          {/* Notification bar for nudges */}
          {nudgeMessage && (
            <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-2xl p-4 flex items-center gap-3 animate-slide-up shadow-md">
              <MessageSquareText className="w-5 h-5 text-indigo-400 shrink-0" />
              <p className="text-xs font-semibold text-slate-200">{nudgeMessage}</p>
            </div>
          )}

          <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 space-y-4 flex flex-col h-[750px] overflow-hidden">
            <div className="flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold flex items-center gap-2 text-slate-200">
                <History className="w-5 h-5 text-indigo-400" />
                Live Campaign Log
              </h2>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            
            <p className="text-xs text-slate-500 leading-normal shrink-0">
              Real-time logs of rolls and status changes sync here automatically from connected player devices.
            </p>

            {/* Log Feed */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 pt-1 scrollbar-thin">
              {rollLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 text-xs py-10">
                  <p>No rolls made yet in this campaign.</p>
                </div>
              ) : (
                rollLogs.map((log) => {
                  let badgeClass = "bg-slate-950 border-slate-850 text-slate-400";
                  if (log.type === "attack") badgeClass = "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
                  if (log.type === "damage") badgeClass = "bg-red-500/10 border-red-500/20 text-red-400";
                  if (log.type === "heal") badgeClass = "bg-teal-500/10 border-teal-500/20 text-teal-400";
                  if (log.type === "stealth") badgeClass = "bg-indigo-500/10 border-indigo-500/20 text-indigo-400";

                  return (
                    <div 
                      key={log.id}
                      className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-900/60 text-xs flex justify-between items-start gap-4 transition-all hover:bg-slate-900"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200">{log.playerName}</span>
                          <span className="text-[10px] text-slate-600 font-medium">
                            {formatTime(log.timestamp)}
                          </span>
                        </div>
                        <p className="text-slate-400 font-medium leading-relaxed">
                          {log.actionName}
                        </p>
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-950 border border-slate-900 text-[10px] text-slate-500 font-bold tracking-wide">
                          Formula: {log.rollNotation}
                        </div>
                      </div>

                      <div className={`px-3 py-2 rounded-lg border flex flex-col items-center justify-center font-bold min-w-14 shrink-0 shadow-sm ${badgeClass}`}>
                        <span className="text-[9px] uppercase tracking-wider font-bold opacity-70 leading-none">Total</span>
                        <span className="text-lg font-black tracking-tight mt-0.5">{log.rollTotal}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
