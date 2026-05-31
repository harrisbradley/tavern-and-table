"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2, Sparkles, Shield, Zap, Eye, Heart } from "lucide-react";
import { Character, CLASS_DISPLAY_NAMES, RACE_DISPLAY_NAMES } from "@/types/character";
import { deleteCharacter, setLastCharacterId } from "@/lib/characterEngine";
import { deletePlayerProfile } from "@/lib/syncEngine";

interface Props {
  characters: Character[];
  onSelect: (character: Character) => void;
  onCharactersChange: (characters: Character[]) => void;
  campaignId?: string;
}

function HpBar({ current, max }: { current: number; max: number }) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  const color = pct > 50 ? "bg-emerald-500" : pct > 25 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function CharacterCard({
  character,
  onSelect,
  onDelete,
}: {
  character: Character;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDelete) {
      onDelete();
    } else {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <div
      onClick={onSelect}
      className="relative group p-4 rounded-2xl border border-slate-800 bg-slate-900/50 hover:border-amber-500/40 hover:bg-slate-900/80 transition-all cursor-pointer"
    >
      {/* Delete button */}
      <button
        onClick={handleDeleteClick}
        className={`absolute top-3 right-3 p-1.5 rounded-lg transition-all z-10 ${
          confirmDelete
            ? "bg-red-500 text-white"
            : "opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 hover:bg-red-900/30"
        }`}
        title={confirmDelete ? "Tap again to confirm delete" : "Delete character"}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      {/* Name and class */}
      <div className="pr-8">
        <div className="text-white font-bold text-base leading-tight mb-0.5">{character.name}</div>
        <div className="text-slate-500 text-xs font-medium mb-3">
          {RACE_DISPLAY_NAMES[character.race]} · Lv{character.level}{" "}
          {CLASS_DISPLAY_NAMES[character.className]}
        </div>
      </div>

      {/* HP bar */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-1 text-slate-500 text-[10px] font-semibold uppercase tracking-wide">
            <Heart className="w-3 h-3" />
            HP
          </div>
          <span className="text-slate-400 text-xs font-mono">
            {character.currentHp}/{character.maxHp}
          </span>
        </div>
        <HpBar current={character.currentHp} max={character.maxHp} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center bg-slate-900/60 rounded-lg py-1.5">
          <Shield className="w-3 h-3 text-slate-600 mb-0.5" />
          <span className="text-white text-sm font-bold">{character.ac}</span>
          <span className="text-slate-600 text-[9px] uppercase tracking-wide">AC</span>
        </div>
        <div className="flex flex-col items-center bg-slate-900/60 rounded-lg py-1.5">
          <Zap className="w-3 h-3 text-slate-600 mb-0.5" />
          <span className="text-white text-sm font-bold">
            {character.initiative >= 0 ? `+${character.initiative}` : character.initiative}
          </span>
          <span className="text-slate-600 text-[9px] uppercase tracking-wide">Init</span>
        </div>
        <div className="flex flex-col items-center bg-slate-900/60 rounded-lg py-1.5">
          <Eye className="w-3 h-3 text-slate-600 mb-0.5" />
          <span className="text-white text-sm font-bold">{character.passivePerception}</span>
          <span className="text-slate-600 text-[9px] uppercase tracking-wide">PP</span>
        </div>
      </div>

      {/* Down state badge */}
      {character.status === "down" && (
        <div className="absolute top-3 left-3 px-2 py-0.5 bg-red-900/60 border border-red-500/40 rounded-full text-red-400 text-[10px] font-bold uppercase tracking-wide">
          Down
        </div>
      )}
    </div>
  );
}

export default function CharacterSelect({ characters, onSelect, onCharactersChange, campaignId }: Props) {
  const handleDelete = (id: string) => {
    deleteCharacter(id);
    if (campaignId) {
      deletePlayerProfile(campaignId, id).catch(err => console.error("Failed to delete player profile sync:", err));
    }
    onCharactersChange(characters.filter((c) => c.id !== id));
  };

  const handleSelect = (character: Character) => {
    setLastCharacterId(character.id);
    onSelect(character);
  };

  return (
    <div className="min-h-screen w-full bg-radial from-[#1e1135] via-[#090b12] to-[#040508] flex flex-col">
      {/* Header */}
      <div className="px-4 pt-8 pb-4 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-amber-400 text-xs font-bold uppercase tracking-widest">Tavern &amp; Table</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white mb-1">Who answers the call?</h1>
        <p className="text-slate-400 text-sm">Choose your hero or forge a new legend.</p>
      </div>

      {/* Character grid */}
      <div className="flex-1 overflow-y-auto px-4 max-w-2xl mx-auto w-full pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {characters.map((char) => (
            <CharacterCard
              key={char.id}
              character={char}
              onSelect={() => handleSelect(char)}
              onDelete={() => handleDelete(char.id)}
            />
          ))}
        </div>

        {/* Create new */}
        <Link
          href="/character/create"
          className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl border border-dashed border-slate-700 text-slate-500 hover:border-amber-500/40 hover:text-amber-400 transition-all font-semibold text-sm"
        >
          <Plus className="w-4 h-4" />
          Create New Character
        </Link>
      </div>
    </div>
  );
}
