"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Plus, Shield, Swords } from "lucide-react";
import Link from "next/link";
import { Character } from "@/types/character";
import { getCharacters, setLastCharacterId } from "@/lib/characterEngine";
import CharacterSelect from "@/components/CharacterSelect";

export default function JoinCampaignPage({ params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = use(params);
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load characters from local storage
    const chars = getCharacters();
    setCharacters(chars);
    setLoading(false);
  }, []);

  const handleSelect = (character: Character) => {
    // Save as last active character
    setLastCharacterId(character.id);
    // Redirect to the player dashboard for this campaign
    router.push(`/player/${campaignId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#040508] flex items-center justify-center">
        <div className="text-slate-600 text-sm animate-pulse">Preparing for adventure...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen w-full bg-radial from-[#1e1135] via-[#090b12] to-[#040508] flex flex-col items-center justify-center p-6">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none opacity-20" />
      
      <div className="z-10 w-full max-w-4xl space-y-8 animate-fade-in">
        {/* Campaign Welcome Header */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shadow-xl">
              <Shield className="w-6 h-6 text-indigo-400" />
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shadow-xl">
              <Swords className="w-6 h-6 text-amber-500" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight sm:text-4xl">
            Join Campaign: <span className="text-indigo-400">{campaignId}</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base font-medium max-w-md mx-auto">
            You've been invited to join an adventure. Choose your hero to enter the battlefield.
          </p>
        </div>

        {characters.length > 0 ? (
          <div className="bg-slate-900/30 border border-slate-800/50 rounded-3xl p-2 sm:p-6 shadow-2xl">
            <CharacterSelect 
              characters={characters} 
              onSelect={handleSelect} 
              onCharactersChange={setCharacters}
              campaignId={campaignId}
            />
          </div>
        ) : (
          <div className="bg-slate-900/40 border border-slate-800 border-dashed rounded-[32px] p-12 text-center space-y-6">
            <div className="w-16 h-16 bg-slate-950 rounded-2xl flex items-center justify-center mx-auto border border-slate-800">
              <Sparkles className="w-8 h-8 text-amber-500" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white mb-2">No Heroes Found</h2>
              <p className="text-slate-500 text-sm max-w-xs mx-auto">
                You haven't created any characters yet on this device. Forge a new legend to join the campaign.
              </p>
            </div>
            <Link
              href={`/character/create?join=${campaignId}`}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm uppercase tracking-wider transition-all shadow-lg active:scale-95"
            >
              <Plus className="w-5 h-5 stroke-[3px]" />
              Create My First Hero
            </Link>
          </div>
        )}

        <div className="text-center">
          <Link href="/" className="text-xs font-bold text-slate-600 hover:text-slate-400 uppercase tracking-widest transition-colors">
            Cancel & Return to Tavern
          </Link>
        </div>
      </div>
    </main>
  );
}
