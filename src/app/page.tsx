"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, Swords, Sparkles, Clock, ArrowRight, X, Trash2, Heart, Plus, Zap, User, Lock } from "lucide-react";
import { getCharacters, deleteCharacter } from "@/lib/characterEngine";
import { Character, RACE_DISPLAY_NAMES, CLASS_DISPLAY_NAMES } from "@/types/character";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import ThemeToggle from "@/components/ThemeToggle";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";


interface RecentCampaign {
  id: string;
  name: string;
  themeColor: string;
}

export default function Home() {
  const router = useRouter();
  const [recentDmCampaigns, setRecentDmCampaigns] = useState<RecentCampaign[]>([]);
  const [joinedCampaigns, setJoinedCampaigns] = useState<RecentCampaign[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [showJoinInput, setShowJoinInput] = useState(false);
  const [joinId, setJoinId] = useState("");
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Load DM history
    const dmSaved = localStorage.getItem("tt_dm_history");
    if (dmSaved) {
      try { setRecentDmCampaigns(JSON.parse(dmSaved)); } catch (err) { console.error(err); }
    }
    
    // Load Player history
    const playerSaved = localStorage.getItem("tt_player_history");
    if (playerSaved) {
      try { setJoinedCampaigns(JSON.parse(playerSaved)); } catch (err) { console.error(err); }
    }

    // Load Characters
    setCharacters(getCharacters());

    // Listen for Auth changes
    let unsubscribeAuth = () => {};
    if (auth) {
      unsubscribeAuth = onAuthStateChanged(auth, (user) => {
        setFirebaseUser(user);
        setAuthLoading(false);
      });
    } else {
      setAuthLoading(false);
    }
    return () => unsubscribeAuth();
  }, []);

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinId.trim()) {
      router.push(`/join/${joinId.trim().toLowerCase()}`);
    }
  };

  // Delete confirm modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteModalConfig, setDeleteModalConfig] = useState<{
    title: string;
    description: string;
    itemName: string;
    onConfirm: () => void;
  }>({
    title: "",
    description: "",
    itemName: "",
    onConfirm: () => {},
  });

  const handleDeleteCharacter = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const char = characters.find(c => c.id === id);
    const charName = char ? char.name : "this character";
    setDeleteModalConfig({
      title: "Delete Character",
      description: "Are you sure you want to permanently delete your hero",
      itemName: charName,
      onConfirm: () => {
        deleteCharacter(id);
        setCharacters(getCharacters());
      }
    });
    setDeleteModalOpen(true);
  };

  const handleDeleteDmCampaign = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    e.preventDefault();
    setDeleteModalConfig({
      title: "Delete DM Campaign",
      description: "Are you sure you want to delete the campaign registry for",
      itemName: name,
      onConfirm: () => {
        const updated = recentDmCampaigns.filter(c => c.id !== id);
        setRecentDmCampaigns(updated);
        localStorage.setItem("tt_dm_history", JSON.stringify(updated));
      }
    });
    setDeleteModalOpen(true);
  };

  const handleDeletePlayerCampaign = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    e.preventDefault();
    setDeleteModalConfig({
      title: "Delete Player Campaign",
      description: "Are you sure you want to leave and delete references to the campaign",
      itemName: name,
      onConfirm: () => {
        const updated = joinedCampaigns.filter(c => c.id !== id);
        setJoinedCampaigns(updated);
        localStorage.setItem("tt_player_history", JSON.stringify(updated));
        localStorage.removeItem(`tt_campaign_char_${id}`);
      }
    });
    setDeleteModalOpen(true);
  };

  return (
    <main className="min-h-screen w-full flex flex-col items-center justify-center p-6 bg-radial from-theme-radial-start via-theme-radial-mid to-theme-radial-end relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none opacity-20" />
      
      {/* Top Header */}
      <div className="absolute top-6 left-6 right-6 flex justify-end items-center gap-3 z-20 max-w-4xl mx-auto">
        <ThemeToggle />
        {authLoading ? (
          <div className="px-4 py-2.5 rounded-2xl bg-theme-btn-sec-bg border border-theme-btn-sec-border text-theme-text-tertiary text-xs font-bold uppercase tracking-wider animate-pulse">
            Checking status...
          </div>
        ) : firebaseUser ? (
          <Link
            href="/profile"
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-theme-btn-sec-bg border border-theme-btn-sec-border hover:border-amber-500/40 hover:bg-theme-btn-sec-bg/85 text-theme-btn-sec-text hover:text-theme-text-primary transition-all text-xs font-bold uppercase tracking-wider"
          >
            <User className="w-4 h-4 text-amber-500 animate-pulse" />
            Profile
          </Link>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-indigo-500/10 dark:bg-indigo-950/40 border border-indigo-500/20 dark:border-indigo-900/40 hover:border-indigo-550 dark:hover:border-indigo-500/60 hover:bg-indigo-550/15 dark:hover:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all text-xs font-bold uppercase tracking-wider"
          >
            <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-pulse" />
            Sign In
          </Link>
        )}
      </div>

      {/* Hero section */}
      <div className="text-center z-10 space-y-4 mb-12 animate-fade-in">
        <div className="flex items-center justify-center gap-3 mb-2">
          <div className="p-3 rounded-2xl bg-theme-card-bg border border-theme-card-border shadow-2xl">
            <Shield className="w-10 h-10 text-indigo-500 dark:text-indigo-400" />
          </div>
          <div className="h-10 w-px bg-theme-card-border" />
          <div className="p-3 rounded-2xl bg-theme-card-bg border border-theme-card-border shadow-2xl">
            <Swords className="w-10 h-10 text-amber-500" />
          </div>
        </div>
        <h1 className="text-5xl font-black text-theme-text-primary tracking-tighter sm:text-6xl lg:text-7xl">
          Tavern &amp; Table
        </h1>
        <p className="text-theme-text-secondary text-lg sm:text-xl font-medium max-w-md mx-auto leading-relaxed">
          The ultimate mobile-first companion for your D&amp;D campaign. 3D dice, real-time sync, pure adventure.
        </p>
      </div>

      {/* Main Actions */}
      <div className="flex flex-col gap-12 w-full max-w-4xl z-10 animate-slide-up">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full">
          {/* DM Action */}
          <div className="space-y-4 flex flex-col">
            <Link
              href="/campaign/create"
              className="group relative flex flex-col items-center gap-4 p-8 rounded-[32px] bg-theme-card-bg border border-theme-card-border hover:border-indigo-500/50 hover:bg-theme-card-bg/90 transition-all duration-500 text-center flex-1"
            >
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 group-hover:scale-110 transition-transform duration-500">
                <Shield className="w-8 h-8 text-indigo-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-theme-text-primary mb-2">I am the DM</h3>
                <p className="text-theme-text-secondary text-sm leading-snug">
                  Create a new campaign and manage your party's initiative and health.
                </p>
              </div>
              <div className="absolute inset-0 rounded-[32px] bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </Link>

            {/* Recent DM Campaigns */}
            {recentDmCampaigns.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 px-1">
                  <Clock className="w-3.5 h-3.5 text-theme-text-tertiary" />
                  <h4 className="text-[10px] font-black text-theme-text-tertiary uppercase tracking-widest">Resume Your Campaigns</h4>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {recentDmCampaigns.map((camp) => (
                    <div
                      key={camp.id}
                      className="group flex items-center justify-between p-3.5 rounded-2xl bg-theme-btn-sec-bg border border-theme-btn-sec-border text-theme-btn-sec-text hover:bg-theme-btn-sec-bg/85 transition-all"
                    >
                      <Link href={`/dm/${camp.id}`} className="flex items-center gap-3 flex-1">
                        <div className={`w-1.5 h-1.5 rounded-full bg-${camp.themeColor}-500 shadow-[0_0_8px_rgba(var(--color-${camp.themeColor}-500),0.5)]`} />
                        <span className="text-sm font-bold text-theme-text-primary group-hover:text-theme-text-primary/80 transition-colors">{camp.name}</span>
                      </Link>
                      <button
                        onClick={(e) => handleDeleteDmCampaign(e, camp.id, camp.name)}
                        className="p-1 rounded-lg text-theme-text-tertiary hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0 ml-2"
                        title="Remove Campaign"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Player Action */}
          <div className="space-y-4 flex flex-col">
            <div 
              onClick={() => !showJoinInput && setShowJoinInput(true)}
              className={`group relative flex flex-col items-center gap-4 p-8 rounded-[32px] bg-theme-card-bg border transition-all duration-500 text-center flex-1 ${
                showJoinInput ? "border-amber-500/50 bg-theme-card-bg/85" : "border-theme-card-border hover:border-amber-500/50 hover:bg-theme-card-bg/90 cursor-pointer"
              }`}
            >
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 group-hover:scale-110 transition-transform duration-500">
                <Sparkles className="w-8 h-8 text-amber-500" />
              </div>
              
              {!showJoinInput ? (
                <>
                  <div>
                    <h3 className="text-xl font-bold text-theme-text-primary mb-2">I am a Player</h3>
                    <p className="text-theme-text-secondary text-sm leading-snug">
                      Join your DM's campaign via invite link or enter a Campaign ID manually.
                    </p>
                  </div>
                  <div className="mt-2 py-1.5 px-4 rounded-full bg-amber-500/10 border border-amber-500/20">
                    <span className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-[0.15em]">Enter Campaign ID</span>
                  </div>
                </>
              ) : (
                <form onSubmit={handleJoinSubmit} className="w-full space-y-4 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                  <div className="space-y-2">
                    <h3 className="text-sm font-black text-amber-500 uppercase tracking-widest text-center">Joining Adventure</h3>
                    <input
                      autoFocus
                      type="text"
                      placeholder="e.g. CAMP-XYZ123"
                      value={joinId}
                      onChange={(e) => setJoinId(e.target.value)}
                      className="w-full bg-theme-input-bg border border-theme-input-border rounded-xl px-4 py-3 text-theme-text-primary text-center font-bold placeholder:text-theme-text-tertiary focus:outline-none focus:border-amber-500 transition-all uppercase"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowJoinInput(false)}
                      className="p-3 rounded-xl bg-theme-btn-sec-bg border border-theme-btn-sec-border text-theme-text-secondary hover:bg-theme-btn-sec-bg/80 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <button
                      type="submit"
                      disabled={!joinId.trim()}
                      className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:pointer-events-none text-slate-950 font-black text-xs uppercase tracking-widest transition-all active:scale-95"
                    >
                      Join Game
                    </button>
                  </div>
                </form>
              )}
              
              {!showJoinInput && <div className="absolute inset-0 rounded-[32px] bg-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />}
            </div>

            {/* Joined Player Campaigns */}
            {joinedCampaigns.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 px-1">
                  <Swords className="w-3.5 h-3.5 text-theme-text-tertiary" />
                  <h4 className="text-[10px] font-black text-theme-text-tertiary uppercase tracking-widest">Active Adventures</h4>
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {joinedCampaigns.map((camp) => (
                    <div
                      key={camp.id}
                      className="group flex items-center justify-between p-3.5 rounded-2xl bg-theme-btn-sec-bg border border-theme-btn-sec-border text-theme-btn-sec-text hover:bg-theme-btn-sec-bg/85 transition-all"
                    >
                      <Link href={`/player/${camp.id}`} className="flex items-center gap-3 flex-1">
                        <div className={`w-1.5 h-1.5 rounded-full bg-${camp.themeColor}-500 shadow-[0_0_8px_rgba(var(--color-${camp.themeColor}-500),0.5)]`} />
                        <span className="text-sm font-bold text-theme-text-primary group-hover:text-theme-text-primary/80 transition-colors">{camp.name}</span>
                      </Link>
                      <button
                        onClick={(e) => handleDeletePlayerCampaign(e, camp.id, camp.name)}
                        className="p-1 rounded-lg text-theme-text-tertiary hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0 ml-2"
                        title="Remove Campaign"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Characters list section */}
        {characters.length > 0 ? (
          <div className="space-y-4 pt-4 border-t border-theme-card-border/60">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <h4 className="text-[10px] font-black text-theme-text-tertiary uppercase tracking-widest">The Tavern (Your Heroes)</h4>
              </div>
              <Link
                href="/character/create"
                className="text-[10px] font-bold text-amber-600 dark:text-amber-500 hover:text-amber-500 dark:hover:text-amber-400 uppercase tracking-widest flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3px]" />
                Forge a Hero
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {characters.map((char) => (
                <div
                  key={char.id}
                  className="relative group p-5 rounded-3xl border border-theme-card-border bg-theme-card-bg hover:border-amber-500/30 hover:bg-theme-card-bg/90 transition-all duration-300"
                >
                  {/* Delete button */}
                  <button
                    onClick={(e) => handleDeleteCharacter(e, char.id)}
                    className="absolute top-4 right-4 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-theme-text-tertiary hover:text-red-400 hover:bg-red-500/20 transition-all z-10"
                    title="Delete character"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div>
                    <div className="text-theme-text-primary font-bold text-base mb-0.5">{char.name}</div>
                    <div className="text-theme-text-secondary text-xs font-semibold mb-3">
                      {RACE_DISPLAY_NAMES[char.race]} · Level {char.level} {CLASS_DISPLAY_NAMES[char.className]}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="flex flex-col bg-theme-input-bg rounded-xl py-2 border border-theme-input-border/40">
                      <Heart className="w-3.5 h-3.5 text-red-500/70 mx-auto mb-1" />
                      <span className="text-theme-text-primary font-bold font-mono">{char.maxHp}</span>
                      <span className="text-[9px] text-theme-text-tertiary font-semibold uppercase tracking-wider">HP</span>
                    </div>
                    <div className="flex flex-col bg-theme-input-bg rounded-xl py-2 border border-theme-input-border/40">
                      <Shield className="w-3.5 h-3.5 text-blue-500/70 mx-auto mb-1" />
                      <span className="text-theme-text-primary font-bold font-mono">{char.ac}</span>
                      <span className="text-[9px] text-theme-text-tertiary font-semibold uppercase tracking-wider">AC</span>
                    </div>
                    <div className="flex flex-col bg-theme-input-bg rounded-xl py-2 border border-theme-input-border/40">
                      <Zap className="w-3.5 h-3.5 text-amber-500/70 mx-auto mb-1" />
                      <span className="text-theme-text-primary font-bold font-mono">
                        {char.initiative >= 0 ? `+${char.initiative}` : char.initiative}
                      </span>
                      <span className="text-[9px] text-theme-text-tertiary font-semibold uppercase tracking-wider">Init</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="border-t border-theme-card-border/60 pt-4">
            <Link
              href="/character/create"
              className="group relative flex flex-col items-center gap-4 p-8 rounded-[32px] bg-theme-card-bg/40 border border-dashed border-theme-card-border hover:border-amber-500/50 hover:bg-theme-card-bg/70 transition-all duration-500 text-center w-full"
            >
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 group-hover:scale-110 transition-transform duration-500">
                <Plus className="w-8 h-8 text-amber-500 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-theme-text-primary mb-2">Forge a Hero</h3>
                <p className="text-theme-text-secondary text-sm leading-snug max-w-sm mx-auto">
                  Create and customize a character sheet locally to prepare for your next campaign.
                </p>
              </div>
            </Link>
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="mt-16 text-center text-xs text-theme-text-tertiary font-medium tracking-wide z-10 uppercase">
        Optimized for Mobile viewports &bull; Powered by 3D Physics Dice
      </div>

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={deleteModalConfig.onConfirm}
        title={deleteModalConfig.title}
        description={deleteModalConfig.description}
        itemName={deleteModalConfig.itemName}
      />
    </main>
  );
}
