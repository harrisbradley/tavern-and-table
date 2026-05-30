"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Character } from "@/types/character";
import { getCharacters, getLastCharacterId, getCharacterById, setLastCharacterId } from "@/lib/characterEngine";
import CharacterSelect from "./CharacterSelect";
import PlayerDashboard from "./PlayerDashboard";

type View = "loading" | "select" | "playing";

export default function PlayerFlow() {
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

    const lastId = getLastCharacterId();
    const last = lastId ? getCharacterById(lastId) : null;
    if (last) {
      setActiveCharacter(last);
      setView("playing");
    } else {
      setView("select");
    }
  }, [router]);

  const handleSelect = (character: Character) => {
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
      <div className="min-h-screen w-full bg-[#040508] flex items-center justify-center">
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
      />
    );
  }

  if (view === "playing" && activeCharacter) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-radial from-[#131722] via-[#090b11] to-[#040508] relative overflow-hidden sm:p-6">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-40" />

        {/* Desktop back/switch buttons */}
        <div className="absolute top-4 left-4 z-20 hidden md:flex flex-col gap-2">
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200 transition-all text-xs font-semibold hover:border-slate-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tavern
          </Link>
          <button
            onClick={handleSwitchCharacter}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-amber-400 transition-all text-xs font-semibold hover:border-amber-800/50"
          >
            ⇄ Switch Hero
          </button>
        </div>

        {/* Phone frame */}
        <div className="w-full h-screen sm:h-[840px] sm:w-[390px] sm:rounded-[44px] sm:border-[10px] sm:border-slate-950 sm:shadow-[0_0_80px_rgba(0,0,0,0.8)] sm:bg-slate-950 relative overflow-hidden flex flex-col flex-shrink-0 animate-fade-in">
          {/* Desktop status bar sim */}
          <div className="hidden sm:flex justify-between items-center px-6 pt-3 pb-2 text-[10px] font-bold text-slate-500 bg-slate-950 select-none shrink-0 z-20">
            <span>T&T Mobile Companion</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-1.5 border border-slate-600 rounded-xs flex items-center justify-center p-0.5">
                <span className="w-full h-full bg-slate-500 rounded-2xs" />
              </span>
              <span>9:41 AM</span>
            </div>
          </div>

          <div className="hidden sm:block absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4.5 bg-slate-950 rounded-full z-30" />

          {/* Mobile header */}
          <div className="flex sm:hidden justify-between items-center px-4 py-3 bg-[#0d1322] border-b border-slate-900 select-none">
            <Link href="/" className="text-slate-400 flex items-center gap-1 text-xs font-bold">
              <ArrowLeft className="w-3.5 h-3.5" />
              Exit
            </Link>
            <span className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">Combat Dashboard</span>
            <button
              onClick={handleSwitchCharacter}
              className="text-slate-500 hover:text-amber-400 text-xs font-bold transition-colors"
            >
              ⇄ Switch
            </button>
          </div>

          <div className="flex-1 flex flex-col bg-slate-950 relative overflow-hidden">
            <PlayerDashboard character={activeCharacter} />
          </div>

          <div className="hidden sm:block w-32 h-1 bg-slate-800 rounded-full mx-auto my-2 shrink-0 z-20" />
        </div>
      </div>
    );
  }

  return null;
}
