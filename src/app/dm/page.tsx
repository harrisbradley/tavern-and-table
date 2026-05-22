"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Users, History, Dice5, MessageSquareText } from "lucide-react";
import { subscribeToPlayers, subscribeToRollLogs, updatePlayerHp, addRollLog, sendNudge, PlayerStatus, RollLog } from "@/lib/syncEngine";

export default function DmDashboard() {
  const [players, setPlayers] = useState<PlayerStatus[]>([]);
  const [rollLogs, setRollLogs] = useState<RollLog[]>([]);
  const [nudgeMessage, setNudgeMessage] = useState<string | null>(null);

  // Subscribe to players and logs in real-time
  useEffect(() => {
    const unsubscribePlayers = subscribeToPlayers((playersList) => {
      setPlayers(playersList);
    });

    const unsubscribeRollLogs = subscribeToRollLogs((logsList) => {
      setRollLogs(logsList);
    });

    return () => {
      unsubscribePlayers();
      unsubscribeRollLogs();
    };
  }, []);

  // DM updates player health
  const adjustPlayerHp = async (id: string, amount: number) => {
    const player = players.find((p) => p.id === id);
    if (!player) return;

    const nextHp = Math.min(Math.max(0, player.currentHp + amount), player.maxHp);
    
    try {
      // Sync the health bar change
      await updatePlayerHp(id, nextHp, player.maxHp);

      // Log this DM health change to the log feed
      const actionDescription = amount > 0 
        ? `restored ${amount} HP via DM adjustment` 
        : `took ${Math.abs(amount)} damage via DM adjustment`;
        
      await addRollLog(
        "DM Screen", 
        `${player.name} ${actionDescription}`, 
        `${Math.abs(amount)} HP`, 
        nextHp, 
        amount > 0 ? "heal" : "damage"
      );
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

        {/* Campaign Info */}
        <div className="flex items-center gap-2 text-xs font-medium text-slate-400 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          Campaign: <strong>Lost Mine of Phandelver</strong>
        </div>
      </nav>

      {/* Main Grid Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        
        {/* COL 1 & 2: PLAYER TRACKER */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold flex items-center gap-2 text-slate-200">
                <Users className="w-5 h-5 text-indigo-400" />
                Active Party Members
              </h2>
              <span className="text-xs text-slate-500 font-semibold">{players.length} players connected</span>
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
                      <div>
                        <h3 className="font-bold text-slate-200 text-base leading-tight">{player.name}</h3>
                        <p className="text-xs text-slate-500 font-medium">{player.className}</p>
                      </div>
                      
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
                    </div>

                    {/* Stats summary */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-950/40 p-2 rounded-xl border border-slate-900 text-xs select-none">
                      <div className="text-slate-400 font-medium text-center border-r border-slate-900">
                        Armor Class: <strong className="text-slate-200">{player.ac}</strong>
                      </div>
                      <div className="text-slate-400 font-medium text-center">
                        Initiative: <strong className="text-slate-200">+{player.initiative}</strong>
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

          <div className="bg-slate-900/30 border border-slate-900 rounded-3xl p-6 space-y-4 flex flex-col h-[650px] overflow-hidden">
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
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-200">{log.playerName}</span>
                          <span className="text-[10px] text-slate-600 font-medium">
                            {formatTime(log.timestamp)}
                          </span>
                        </div>
                        <p className="text-slate-400 font-medium">
                          {log.actionName}
                        </p>
                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-950 border border-slate-900 text-[10px] text-slate-500 font-bold tracking-wide">
                          Notation: {log.rollNotation}
                        </div>
                      </div>

                      <div className={`px-3 py-2 rounded-lg border flex flex-col items-center justify-center font-bold min-w-14 shrink-0 ${badgeClass}`}>
                        <span className="text-[9px] uppercase tracking-wider font-semibold opacity-60 leading-none">Result</span>
                        <span className="text-lg font-extrabold tracking-tight mt-0.5">{log.rollTotal}</span>
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
