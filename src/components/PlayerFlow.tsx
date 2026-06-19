"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Character } from "@/types/character";
import { getCharacters, getLastCharacterId, getCharacterById, setLastCharacterId } from "@/lib/characterEngine";
import CharacterSelect from "./CharacterSelect";
import PlayerDashboard from "./PlayerDashboard";
import ThemeToggle from "./ThemeToggle";

type View = "loading" | "select" | "playing";

export default function PlayerFlow({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [view, setView] = useState<View>("loading");
  const [characters, setCharacters] = useState<Character[]>([]);
  const [activeCharacter, setActiveCharacter] = useState<Character | null>(null);

  useEffect(() => {
    const chars = getCharacters();
    if (chars.length === 0) {
      router.push("/character/create");
      return;
    }

    setCharacters(chars);

    const lastId = localStorage.getItem(`tt_campaign_char_${campaignId}`) || getLastCharacterId();
    const last = lastId ? getCharacterById(lastId) : null;
    if (last) {
      setActiveCharacter(last);
      setView("playing");
    } else {
      setView("select");
    }
  }, [router, campaignId]);

  const handleSelect = (character: Character) => {
    localStorage.setItem(`tt_campaign_char_${campaignId}`, character.id);
    setActiveCharacter(character);
    setView("playing");
  };

  const handleSwitchCharacter = () => {
    setLastCharacterId(null);
    setActiveCharacter(null);
    setCharacters(getCharacters());
    setView("select");
  };

  if (view === "loading") {
    return (
      <div className="min-h-screen w-full bg-theme-bg flex items-center justify-center">
        <div className="text-slate-600 text-sm animate-pulse">Loading...</div>
      </div>
    );
  }

  if (view === "select") {
    return (
      <CharacterSelect
        characters={characters}
        onSelect={handleSelect}
        onCharactersChange={setCharacters}
        campaignId={campaignId}
      />
    );
  }

  if (view === "playing" && activeCharacter) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-radial from-theme-radial-start via-theme-radial-mid to-theme-radial-end relative overflow-hidden sm:p-6">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-40" />

        {/* Dashboard wrapper - acts as a phone frame on small/medium screens, and expands to a full dashboard panel on tablet/desktop */}
        <div className="w-full h-screen sm:h-[840px] sm:w-[390px] sm:rounded-[44px] sm:border-[10px] sm:border-slate-950 sm:shadow-[0_0_80px_rgba(0,0,0,0.8)] sm:bg-theme-bg md:w-full md:h-[calc(100vh-3rem)] md:max-w-6xl md:rounded-[32px] md:border md:border-theme-card-border md:bg-theme-card-bg md:backdrop-blur-md md:p-0 relative overflow-hidden flex flex-col flex-shrink-0 animate-fade-in">
          
          {/* Desktop status bar sim (only visible on sm screen phone frames, hidden on mobile <sm and tablet/desktop >=md) */}
          <div className="hidden sm:flex md:hidden justify-between items-center px-6 pt-3 pb-2 text-[10px] font-bold text-theme-text-tertiary bg-theme-bg select-none shrink-0 z-20">
            <span>T&T Mobile Companion</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-1.5 border border-theme-text-tertiary/40 rounded-xs flex items-center justify-center p-0.5">
                <span className="w-full h-full bg-theme-text-tertiary rounded-2xs" />
              </span>
              <span>9:41 AM</span>
            </div>
          </div>

          {/* Phone notch sim (only visible on sm screen phone frames) */}
          <div className="hidden sm:block md:hidden absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4.5 bg-slate-950 rounded-full z-30" />

          {/* Mobile header (Exit, Title, Switch) - visible on mobile < md */}
          <div className="flex md:hidden justify-between items-center px-4 py-3 bg-theme-card-bg/60 backdrop-blur-md border-b border-theme-card-border select-none shrink-0">
            <Link href="/" className="text-theme-text-secondary flex items-center gap-1 text-xs font-bold">
              <ArrowLeft className="w-3.5 h-3.5" />
              Exit
            </Link>
            <span className="text-xs font-extrabold text-theme-text-primary uppercase tracking-wider">Combat Dashboard</span>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={handleSwitchCharacter}
                className="text-theme-text-secondary hover:text-amber-500 text-xs font-bold transition-colors ml-1"
              >
                ⇄ Switch
              </button>
            </div>
          </div>

          {/* Desktop/Tablet Header - visible on >= md */}
          <div className="hidden md:flex justify-between items-center px-6 py-4 bg-theme-card-bg/60 backdrop-blur-md border-b border-theme-card-border select-none z-20 shrink-0">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-theme-btn-sec-bg border border-theme-btn-sec-border text-theme-btn-sec-text hover:text-theme-text-primary transition-all text-xs font-semibold hover:border-theme-card-border/80"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Tavern
              </Link>
              <h1 className="text-sm font-extrabold text-theme-text-primary uppercase tracking-wider">
                Campaign Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <button
                onClick={handleSwitchCharacter}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-theme-btn-sec-bg border border-theme-btn-sec-border text-theme-btn-sec-text hover:text-amber-500 transition-all text-xs font-semibold hover:border-amber-500/30"
              >
                ⇄ Switch Hero
              </button>
            </div>
          </div>

          {/* Main Dashboard Panel */}
          <div className="flex-1 flex flex-col bg-theme-bg relative overflow-hidden">
            <PlayerDashboard character={activeCharacter} campaignId={campaignId} />
          </div>

          {/* Phone home indicator sim (only visible on sm screen phone frames) */}
          <div className="hidden sm:block md:hidden w-32 h-1 bg-slate-300 dark:bg-slate-800 rounded-full mx-auto my-2 shrink-0 z-20" />
        </div>
      </div>
    );
  }

  return null;
}
