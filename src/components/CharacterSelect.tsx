"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2, Sparkles, Shield, Zap, Eye, Heart } from "lucide-react";
import { Character, CLASS_DISPLAY_NAMES, RACE_DISPLAY_NAMES } from "@/types/character";
import { deleteCharacter, setLastCharacterId } from "@/lib/characterEngine";
import { deletePlayerProfile } from "@/lib/syncEngine";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";

interface Props {
  characters: Character[];
  onSelect: (character: Character) => void;
  onCharactersChange: (characters: Character[]) => void;
  campaignId?: string;
  isNested?: boolean;
}

function HpBar({ current, max }: { current: number; max: number }) {
  const pct = Math.max(0, Math.min(100, (current / max) * 100));
  const color = pct > 50 ? "bg-emerald-500" : pct > 25 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
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
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete();
  };

  return (
    <div
      onClick={onSelect}
      className="relative group p-4 rounded-2xl border border-theme-card-border bg-theme-card-bg hover:border-amber-500/40 hover:bg-theme-card-bg/90 transition-all cursor-pointer"
    >
      {/* Delete button */}
      <button
        onClick={handleDeleteClick}
        className="absolute top-3 right-3 p-1.5 rounded-lg transition-all z-10 opacity-0 group-hover:opacity-100 text-theme-text-tertiary hover:text-red-400 hover:bg-red-500/20"
        title="Delete character"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      {/* Name and class */}
      <div className="pr-8">
        <div className="text-theme-text-primary font-bold text-base leading-tight mb-0.5">{character.name}</div>
        <div className="text-theme-text-secondary text-xs font-medium mb-3">
          {RACE_DISPLAY_NAMES[character.race]} · Lv{character.level}{" "}
          {CLASS_DISPLAY_NAMES[character.className]}
        </div>
      </div>

      {/* HP bar */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <div className="flex items-center gap-1 text-theme-text-tertiary text-[10px] font-semibold uppercase tracking-wide">
            <Heart className="w-3 h-3" />
            HP
          </div>
          <span className="text-theme-text-secondary text-xs font-mono">
            {character.currentHp}/{character.maxHp}
          </span>
        </div>
        <HpBar current={character.currentHp} max={character.maxHp} />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center bg-theme-input-bg border border-theme-input-border/30 rounded-lg py-1.5">
          <Shield className="w-3 h-3 text-theme-text-tertiary mb-0.5" />
          <span className="text-theme-text-primary text-sm font-bold">{character.ac}</span>
          <span className="text-theme-text-tertiary text-[9px] uppercase tracking-wide">AC</span>
        </div>
        <div className="flex flex-col items-center bg-theme-input-bg border border-theme-input-border/30 rounded-lg py-1.5">
          <Zap className="w-3 h-3 text-theme-text-tertiary mb-0.5" />
          <span className="text-theme-text-primary text-sm font-bold">
            {character.initiative >= 0 ? `+${character.initiative}` : character.initiative}
          </span>
          <span className="text-theme-text-tertiary text-[9px] uppercase tracking-wide">Init</span>
        </div>
        <div className="flex flex-col items-center bg-theme-input-bg border border-theme-input-border/30 rounded-lg py-1.5">
          <Eye className="w-3 h-3 text-theme-text-tertiary mb-0.5" />
          <span className="text-theme-text-primary text-sm font-bold">{character.passivePerception}</span>
          <span className="text-theme-text-tertiary text-[9px] uppercase tracking-wide">PP</span>
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

export default function CharacterSelect({ characters, onSelect, onCharactersChange, campaignId, isNested = false }: Props) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [characterToDelete, setCharacterToDelete] = useState<Character | null>(null);

  const handleDeleteRequest = (char: Character) => {
    setCharacterToDelete(char);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!characterToDelete) return;
    const id = characterToDelete.id;
    deleteCharacter(id);
    if (campaignId) {
      deletePlayerProfile(campaignId, id).catch(err => console.error("Failed to delete player profile sync:", err));
    }
    onCharactersChange(characters.filter((c) => c.id !== id));
    setCharacterToDelete(null);
  };

  const handleSelect = (character: Character) => {
    setLastCharacterId(character.id);
    onSelect(character);
  };

  const gridContent = (
    <div className="max-w-2xl mx-auto w-full pb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {characters.map((char) => (
          <CharacterCard
            key={char.id}
            character={char}
            onSelect={() => handleSelect(char)}
            onDelete={() => handleDeleteRequest(char)}
          />
        ))}
      </div>

      {/* Create new */}
      <Link
        href={campaignId ? `/character/create?join=${campaignId}` : "/character/create"}
        className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl border border-dashed border-theme-card-border text-theme-text-secondary hover:border-amber-500/40 hover:text-amber-500 transition-all font-semibold text-sm"   
      >
        <Plus className="w-4 h-4" />
        Create New Character
      </Link>

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Character"
        description="Are you sure you want to permanently delete your hero"
        itemName={characterToDelete?.name || ""}
      />
    </div>
  );

  if (isNested) {
    return gridContent;
  }

  return (
    <div className="min-h-screen w-full bg-radial from-theme-radial-start via-theme-radial-mid to-theme-radial-end flex flex-col">
      {/* Header */}
      <div className="px-4 pt-8 pb-4 max-w-2xl mx-auto w-full">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span className="text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-widest">Tavern &amp; Table</span>
        </div>
        <h1 className="text-3xl font-extrabold text-theme-text-primary mb-1">Who answers the call?</h1>
        <p className="text-theme-text-secondary text-sm">Choose your hero or forge a new legend.</p>
      </div>

      {/* Character grid */}
      <div className="flex-1 overflow-y-auto px-4">
        {gridContent}
      </div>
    </div>
  );
}
