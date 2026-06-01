"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Plus, Shield, Swords } from "lucide-react";
import Link from "next/link";
import { Character } from "@/types/character";
import { getCharacters, setLastCharacterId } from "@/lib/characterEngine";
import CharacterSelect from "@/components/CharacterSelect";
import { fetchCampaignConfig, CampaignConfig } from "@/lib/syncEngine";

const THEME_MAP: Record<string, { text: string; bg: string; border: string; accent: string }> = {
  indigo: { text: "text-indigo-400", bg: "bg-indigo-500", border: "border-indigo-500/20", accent: "indigo" },
  emerald: { text: "text-emerald-400", bg: "bg-emerald-500", border: "border-emerald-500/20", accent: "emerald" },
  amber: { text: "text-amber-400", bg: "bg-amber-500", border: "border-amber-500/20", accent: "amber" },
  red: { text: "text-red-400", bg: "bg-red-500", border: "border-red-500/20", accent: "red" },
  violet: { text: "text-violet-400", bg: "bg-violet-500", border: "border-violet-500/20", accent: "violet" },
  teal: { text: "text-teal-400", bg: "bg-teal-500", border: "border-teal-500/20", accent: "teal" },
};

export default function JoinCampaignPage({ params }: { params: Promise<{ campaignId: string }> }) {
  const { campaignId } = use(params);
  const router = useRouter();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [campaign, setCampaign] = useState<CampaignConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      // Load characters from local storage
      const chars = getCharacters();
      setCharacters(chars);

      // Load campaign config
      const config = await fetchCampaignConfig(campaignId);
      setCampaign(config);
      
      setLoading(false);
    }
    init();
  }, [campaignId]);

  const handleSelect = (character: Character) => {
    // Save as last active character
    setLastCharacterId(character.id);
    // Redirect to the player dashboard for this campaign
    router.push(`/player/${campaignId}`);
  };

  const theme = campaign?.themeColor ? THEME_MAP[campaign.themeColor] || THEME_MAP.indigo : THEME_MAP.indigo;

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#040508] flex items-center justify-center">
        <div className="text-slate-600 text-sm animate-pulse uppercase tracking-[0.2em] font-black">Brewing Adventure...</div>
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
              <Shield className={`w-6 h-6 ${theme.text}`} />
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 shadow-xl">
              <Swords className="w-6 h-6 text-amber-500" />
            </div>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight sm:text-4xl">
            {campaign?.name || `Join Campaign: ${campaignId}`}
          </h1>
          <p className="text-slate-400 text-sm sm:text-base font-medium max-w-md mx-auto">
            {campaign?.synopsis || "You've been invited to join an adventure. Choose your hero to enter the battlefield."}
          </p>
        </div>

        {characters.length > 0 ? (
          <div className={`bg-slate-900/30 border ${theme.border} rounded-3xl p-2 sm:p-6 shadow-2xl transition-colors`}>
            <div className="px-4 pt-2 pb-6 text-center">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Select Your Hero</p>
            </div>
            <CharacterSelect 
              characters={characters} 
              onSelect={handleSelect} 
              onCharactersChange={setCharacters}
              campaignId={campaignId}
            />
          </div>
        ) : (
          <div className={`bg-slate-900/40 border-2 ${theme.border} border-dashed rounded-[32px] p-12 text-center space-y-6`}>
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
              className={`inline-flex items-center gap-2 px-8 py-4 rounded-2xl ${theme.bg} hover:brightness-110 text-slate-950 font-black text-sm uppercase tracking-wider transition-all shadow-lg active:scale-95`}
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
