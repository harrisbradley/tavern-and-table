"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles, ChevronLeft, ChevronRight,
  Swords, Eye, Shield, Zap, Compass, HelpCircle,
  CheckCircle2
} from "lucide-react";
import {
  RACES, CLASSES, BACKGROUNDS,
  Race, CharacterClass, Background,
  RaceData, ClassData, BackgroundData,
  calculateStats, CLASS_DISPLAY_NAMES, RACE_DISPLAY_NAMES,
  Character
} from "@/types/character";
import { createCharacter, setLastCharacterId } from "@/lib/characterEngine";

type Mode = "direct" | "guided";
type Archetype = "warrior" | "striker" | "divine" | "arcane";
type Step = "name" | "archetype" | "refinement" | "race" | "class" | "background" | "bio" | "review" | "success";

const DIRECT_STEPS: Step[] = ["name", "race", "class", "background", "bio", "review"];
const GUIDED_STEPS: Step[] = ["name", "archetype", "refinement", "race", "background", "bio", "review"];
const STEP_LABELS: Record<Step, string> = {
  name: "Name", archetype: "Style", refinement: "Class",
  race: "Race", class: "Class", background: "Background", bio: "Bio", review: "Review", success: "Done"
};

const ACCENT: Record<string, { border: string; bg: string; text: string; selectedBorder: string; selectedBg: string }> = {
  amber:   { border: "border-amber-500/20 dark:border-amber-800/50",   bg: "bg-amber-500/10 dark:bg-amber-900/20",   text: "text-amber-700 dark:text-amber-400",   selectedBorder: "border-amber-500",   selectedBg: "bg-amber-500/20 dark:bg-amber-900/40" },
  emerald: { border: "border-emerald-500/20 dark:border-emerald-800/50", bg: "bg-emerald-500/10 dark:bg-emerald-900/20", text: "text-emerald-700 dark:text-emerald-400", selectedBorder: "border-emerald-500", selectedBg: "bg-emerald-500/20 dark:bg-emerald-900/40" },
  stone:   { border: "border-stone-500/20 dark:border-stone-600/50",   bg: "bg-stone-500/10 dark:bg-stone-900/20",   text: "text-stone-700 dark:text-stone-400",   selectedBorder: "border-stone-500",   selectedBg: "bg-stone-500/20 dark:bg-stone-900/40" },
  yellow:  { border: "border-yellow-500/20 dark:border-yellow-800/50",  bg: "bg-yellow-500/10 dark:bg-yellow-900/20",  text: "text-yellow-750 dark:text-yellow-400",  selectedBorder: "border-yellow-500",  selectedBg: "bg-yellow-500/20 dark:bg-yellow-900/40" },
  red:     { border: "border-red-500/20 dark:border-red-800/50",     bg: "bg-red-500/10 dark:bg-red-900/20",     text: "text-red-700 dark:text-red-400",     selectedBorder: "border-red-500",     selectedBg: "bg-red-500/20 dark:bg-red-900/40" },
  purple:  { border: "border-purple-500/20 dark:border-purple-800/50",  bg: "bg-purple-500/10 dark:bg-purple-900/20",  text: "text-purple-700 dark:text-purple-400",  selectedBorder: "border-purple-500",  selectedBg: "bg-purple-500/20 dark:bg-purple-900/40" },
  orange:  { border: "border-orange-500/20 dark:border-orange-800/50",  bg: "bg-orange-500/10 dark:bg-orange-900/20",  text: "text-orange-700 dark:text-orange-400",  selectedBorder: "border-orange-500",  selectedBg: "bg-orange-500/20 dark:bg-orange-900/40" },
  blue:    { border: "border-blue-500/20 dark:border-blue-800/50",    bg: "bg-blue-500/10 dark:bg-blue-900/20",    text: "text-blue-700 dark:text-blue-400",    selectedBorder: "border-blue-500",    selectedBg: "bg-blue-500/20 dark:bg-blue-900/40" },
  indigo:  { border: "border-indigo-500/20 dark:border-indigo-800/50",  bg: "bg-indigo-500/10 dark:bg-indigo-900/20",  text: "text-indigo-700 dark:text-indigo-400",  selectedBorder: "border-indigo-500",  selectedBg: "bg-indigo-500/20 dark:bg-indigo-900/40" },
  teal:    { border: "border-teal-500/20 dark:border-teal-800/50",    bg: "bg-teal-500/10 dark:bg-teal-900/20",    text: "text-teal-700 dark:text-teal-400",    selectedBorder: "border-teal-500",    selectedBg: "bg-teal-500/20 dark:bg-teal-900/40" },
  violet:  { border: "border-violet-500/20 dark:border-violet-800/50",  bg: "bg-violet-500/10 dark:bg-violet-900/20",  text: "text-violet-700 dark:text-violet-400",  selectedBorder: "border-violet-500",  selectedBg: "bg-violet-500/20 dark:bg-violet-900/40" },
};

const ARCHETYPES: Array<{ id: Archetype; label: string; description: string; icon: React.ReactNode; accentColor: string }> = [
  { id: "warrior", label: "Warrior",  description: "Charge into battle. Take hits. Deal massive damage up close.",         icon: <Swords className="w-6 h-6" />,   accentColor: "red"    },
  { id: "striker", label: "Striker",  description: "Move unseen. Pick your moment. Vanish after you strike.",               icon: <Eye className="w-6 h-6" />,      accentColor: "teal"   },
  { id: "divine",  label: "Divine",   description: "Channel holy power to shield your allies and smite evil.",              icon: <Shield className="w-6 h-6" />,   accentColor: "amber"  },
  { id: "arcane",  label: "Arcane",   description: "Bend reality with spells — the most powerful force in any room.",       icon: <Zap className="w-6 h-6" />,      accentColor: "violet" },
];

const ARCHETYPE_REFINEMENTS: Record<Archetype, {
  question: string;
  options: Array<{ classId: CharacterClass; label: string; description: string }>;
}> = {
  warrior: {
    question: "What fuels your fighting spirit?",
    options: [
      { classId: "barbarian", label: "Pure Fury",         description: "Primal rage makes me unstoppable. The angrier I get, the harder I hit." },
      { classId: "fighter",   label: "Tactical Mastery",  description: "I've trained with every weapon. I win through technique and timing, not just strength." },
    ],
  },
  striker: {
    question: "How do you prefer to strike?",
    options: [
      { classId: "rogue",   label: "From the Shadows",   description: "I slip close, wait for the perfect opening, and hit once — devastatingly." },
      { classId: "ranger",  label: "From a Distance",    description: "I track, trap, and shoot before they close the gap. The wilderness is my best weapon." },
    ],
  },
  divine: {
    question: "How does your faith shape your role?",
    options: [
      { classId: "paladin", label: "Holy Warrior",       description: "I wear armor and swear sacred oaths. My conviction makes every strike righteous." },
      { classId: "cleric",  label: "Divine Conduit",     description: "I channel my god's power to heal, protect, and — when needed — destroy." },
    ],
  },
  arcane: {
    question: "Where does your magic come from?",
    options: [
      { classId: "wizard",  label: "Ancient Study",      description: "I earned my power through years memorizing spells from tomes. Knowledge made manifest." },
      { classId: "bard",    label: "Natural Talent",     description: "My magic flows through music and charm. I make the impossible look effortless." },
    ],
  },
};

function RaceCard({ data, selected, onSelect }: { data: RaceData; selected: boolean; onSelect: () => void }) {  
  const a = ACCENT[data.accentColor];
  const bonuses = Object.entries(data.bonuses)
    .filter(([k]) => k !== "speed")
    .map(([k, v]) => {
      if (k === "hp") return `+${v} HP`;
      if (k === "initiative") return `+${v} Initiative`;
      if (k === "passivePerception") return `+${v} Perception`;
      return "";
    })
    .filter(Boolean);
  bonuses.push(`${data.bonuses.speed} ft speed`);
  return (
    <button
      onClick={onSelect}
      className={`text-left p-4 rounded-xl border transition-all duration-150 ${
        selected ? `${a.selectedBorder} ${a.selectedBg}` : `${a.border} ${a.bg} hover:${a.selectedBorder}`      
      }`}
    >
      <div className={`text-base font-bold mb-1 ${a.text}`}>{data.name}</div>
      <div className="text-slate-400 text-xs leading-relaxed mb-3">{data.description}</div>
      <div className="flex flex-wrap gap-1">
        {bonuses.map((b) => (
          <span key={b} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${a.bg} ${a.text} border ${a.border}`}>
            {b}
          </span>
        ))}
      </div>
    </button>
  );
}

function ClassCard({ data, selected, onSelect }: { data: ClassData; selected: boolean; onSelect: () => void }) {
  const a = ACCENT[data.accentColor];
  return (
    <button
      onClick={onSelect}
      className={`text-left p-4 rounded-xl border transition-all duration-150 ${
        selected ? `${a.selectedBorder} ${a.selectedBg}` : `${a.border} ${a.bg} hover:${a.selectedBorder}`      
      }`}
    >
      <div className={`text-base font-bold mb-1 ${a.text}`}>{data.name}</div>
      <div className="text-slate-400 text-xs leading-relaxed mb-3">{data.description}</div>
      <div className="flex gap-3 text-[10px] font-semibold text-slate-500">
        <span>{data.baseHp} HP</span>
        <span>AC {data.baseAc}</span>
        <span>+{data.baseInitiative} Init</span>
      </div>
    </button>
  );
}

function BackgroundCard({ data, selected, onSelect }: { data: BackgroundData; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`text-left p-4 rounded-xl border transition-all duration-150 ${
        selected ? "border-amber-500 bg-amber-500/20 dark:bg-amber-900/30" : "border-theme-card-border bg-theme-card-bg/50 hover:border-theme-card-border/80"
      }`}
    >
      <div className={`text-base font-bold mb-1 ${selected ? "text-amber-600 dark:text-amber-400" : "text-theme-text-primary"}`}>{data.name}</div>
      <div className="text-theme-text-secondary text-xs leading-relaxed mb-2">{data.description}</div>
      <div className="text-amber-650 dark:text-amber-500/70 text-[10px] font-semibold">{data.bonusDescription}</div>
    </button>
  );
}

function ReviewStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center bg-theme-input-bg border border-theme-input-border/30 rounded-xl px-3 py-3">   
      <span className="text-theme-text-tertiary text-[10px] uppercase tracking-widest font-semibold mb-1">{label}</span>  
      <span className="text-theme-text-primary text-xl font-bold">{value}</span>
    </div>
  );
}

interface CharacterWizardProps {
  campaignId?: string;
}

export default function CharacterWizard({ campaignId }: CharacterWizardProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode | null>(null);
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [archetype, setArchetype] = useState<Archetype | null>(null);
  const [race, setRace] = useState<Race | null>(null);
  const [characterClass, setCharacterClass] = useState<CharacterClass | null>(null);
  const [background, setBackground] = useState<Background | null>(null);
  const [publicBio, setPublicBio] = useState("");
  const [privateBio, setPrivateBio] = useState("");
  const [createdCharacter, setCreatedCharacter] = useState<Character | null>(null);

  const steps = mode === "guided" ? GUIDED_STEPS : DIRECT_STEPS;
  const stepIndex = steps.indexOf(step);
  const refinementData = archetype ? ARCHETYPE_REFINEMENTS[archetype] : null;
  const reviewStats =
    race && characterClass && background
      ? calculateStats(race, characterClass, background)
      : null;

  const canContinue = () => {
    if (step === "name") return name.trim().length > 0;
    if (step === "archetype") return archetype !== null;
    if (step === "refinement") return characterClass !== null;
    if (step === "race") return race !== null;
    if (step === "class") return characterClass !== null;
    if (step === "background") return background !== null;
    if (step === "bio") return true;
    return true;
  };

  const goNext = () => {
    const next = steps[stepIndex + 1];
    if (next) setStep(next);
  };

  const goBack = () => {
    if (step === "success") return; // Cannot go back from success
    if (stepIndex === 0) {
      setMode(null);
      return;
    }
    if (step === "refinement") setCharacterClass(null);
    const prev = steps[stepIndex - 1];
    if (prev) setStep(prev);
  };

  const handleCreate = () => {
    if (!name.trim() || !race || !characterClass || !background) return;
    const char = createCharacter({
      name: name.trim(),
      race,
      className: characterClass,
      background,
      publicBio: publicBio.trim(),
      privateBio: privateBio.trim(),
    });
    setLastCharacterId(char.id);
    setCreatedCharacter(char);
    
    if (campaignId) {
      setStep("success");
    } else {
      router.push("/");
    }
  };

  const handleJoinCampaign = () => {
    if (!campaignId) return;
    router.push(`/player/${campaignId}`);
  };

  // Success Step (Prompt to join campaign)
  if (step === "success" && createdCharacter) {
    return (
      <div className="min-h-screen w-full bg-radial from-theme-radial-start via-theme-radial-mid to-theme-radial-end flex flex-col items-center justify-center p-6 text-center">
        <div className="z-10 space-y-8 animate-fade-in max-w-md">
          <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-[32px] flex items-center justify-center mx-auto shadow-2xl">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-theme-text-primary tracking-tight">Hero Created!</h2>
            <p className="text-theme-text-secondary font-medium leading-relaxed px-4">
              Your legend as <span className="text-indigo-600 dark:text-indigo-300 font-bold">{createdCharacter.name}</span> begins now.
            </p>
          </div>

          <div className="bg-theme-card-bg border border-theme-card-border rounded-3xl p-6 space-y-4">
            <p className="text-theme-text-primary text-sm font-semibold uppercase tracking-widest">Joining Campaign</p>
            <div className="text-2xl font-black text-amber-500">{campaignId}</div>
            <p className="text-theme-text-tertiary text-xs leading-relaxed">
              Would you like to enter the battlefield with your new hero?
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={handleJoinCampaign}
              className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 active:scale-95"
            >
              Join Campaign Now
            </button>
            <button
              onClick={() => router.push("/")}
              className="w-full py-4 rounded-2xl bg-theme-btn-sec-bg border border-theme-btn-sec-border text-theme-btn-sec-text hover:text-theme-text-primary font-bold text-xs uppercase tracking-widest transition-colors"
            >
              Later, Return Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Mode selection — shown before the stepped wizard begins
  if (!mode) {
    return (
      <div className="min-h-screen w-full bg-radial from-theme-radial-start via-theme-radial-mid to-theme-radial-end flex flex-col">
        <div className="flex items-center px-4 pt-6 pb-4 max-w-2xl mx-auto w-full">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1 text-theme-text-secondary hover:text-theme-text-primary transition-colors text-sm"   
          >
            <ChevronLeft className="w-4 h-4" />
            Home
          </button>
        </div>

        <div className="flex-1 px-4 max-w-2xl mx-auto w-full flex flex-col justify-center pb-16">
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-widest">Character Creator</span>
            </div>
            <h2 className="text-3xl font-bold text-theme-text-primary mb-2">How would you like to build your character?</h2> 
            <p className="text-theme-text-secondary text-sm leading-relaxed">
              Both paths produce the same character — choose whichever feels right.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <button
              onClick={() => setMode("direct")}
              className="text-left p-6 rounded-2xl border border-theme-card-border bg-theme-card-bg hover:border-amber-500/50 hover:bg-theme-card-bg/90 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 group-hover:bg-amber-500/20 transition-colors">
                  <Compass className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-theme-text-primary font-bold text-lg mb-1 group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors">
                    I know what I want
                  </div>
                  <div className="text-theme-text-secondary text-sm leading-relaxed">
                    Direct path. Pick your race, class, and background directly from lists. Recommended for experienced players.
                  </div>
                </div>
              </div>
            </button>

            <button
              onClick={() => setMode("guided")}
              className="text-left p-6 rounded-2xl border border-theme-card-border bg-theme-card-bg hover:border-emerald-500/50 hover:bg-theme-card-bg/90 transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-theme-text-primary font-bold text-lg mb-1 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                    Guided path
                  </div>
                  <div className="text-theme-text-secondary text-sm leading-relaxed">
                    Answer questions about your playstyle. We will recommend the perfect race and class. Recommended for beginners.
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-radial from-theme-radial-start via-theme-radial-mid to-theme-radial-end flex flex-col">     
      {/* Header */}
      <div className="flex justify-between items-center px-4 pt-6 pb-4 max-w-2xl mx-auto w-full mb-2">
        <button
          onClick={goBack}
          className="flex items-center gap-1 text-theme-text-secondary hover:text-theme-text-primary transition-colors text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span className="text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-widest">Character Creator</span> 
        </div>
        <div className="w-16" />
      </div>

      {/* Progress bar */}
      <div className="px-4 max-w-2xl mx-auto w-full mb-6">
        <div className="flex gap-1 mb-2">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full transition-all duration-300 ${
                i <= stepIndex ? "bg-amber-500" : "bg-slate-200 dark:bg-slate-800"
              }`}
            />
          ))}
        </div>
        <div className="flex justify-between">
          {steps.map((s, i) => (
            <span
              key={s}
              className={`text-[10px] font-semibold uppercase tracking-wide transition-colors ${
                i === stepIndex ? "text-amber-600 dark:text-amber-400" : i < stepIndex ? "text-theme-text-secondary" : "text-theme-text-tertiary"        
              }`}
            >
              {STEP_LABELS[s]}
            </span>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto px-4 max-w-2xl mx-auto w-full pb-32">

        {/* Name */}
        {step === "name" && (
          <div>
            <p className="text-amber-650 dark:text-amber-400/70 text-xs font-semibold uppercase tracking-widest mb-3">Your Legend Begins</p>
            <h2 className="text-3xl font-bold text-theme-text-primary mb-2">What is your name, hero?</h2>
            <p className="text-theme-text-secondary text-sm leading-relaxed mb-8">
              Every great tale begins with a name — one that will be spoken in whispers and sung in taverns for years to come.
            </p>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && canContinue() && goNext()}
              placeholder="e.g. Theron Ashveil..."
              autoFocus
              className="w-full bg-theme-input-bg border border-theme-input-border rounded-xl px-5 py-4 text-theme-text-primary text-lg placeholder:text-theme-text-tertiary focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 transition-all"
            />
          </div>
        )}

        {/* Archetype — guided mode only */}
        {step === "archetype" && (
          <div>
            <p className="text-amber-650 dark:text-amber-400/70 text-xs font-semibold uppercase tracking-widest mb-3">Your Playstyle</p>
            <h2 className="text-3xl font-bold text-theme-text-primary mb-2">How do you want to approach danger?</h2>
            <p className="text-theme-text-secondary text-sm leading-relaxed mb-6">
              Pick the style that appeals to you. There are no wrong answers.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {ARCHETYPES.map((arch) => {
                const a = ACCENT[arch.accentColor];
                const selected = archetype === arch.id;
                return (
                  <button
                    key={arch.id}
                    onClick={() => setArchetype(arch.id)}
                    className={`text-left p-4 rounded-xl border transition-all duration-150 ${
                      selected
                        ? `${a.selectedBorder} ${a.selectedBg}`
                        : `${a.border} ${a.bg} hover:${a.selectedBorder}`
                    }`}
                  >
                    <div className={`mb-3 ${a.text}`}>{arch.icon}</div>
                    <div className={`text-base font-bold mb-1 ${a.text}`}>{arch.label}</div>
                    <div className="text-theme-text-secondary text-xs leading-relaxed">{arch.description}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Refinement — guided mode only */}
        {step === "refinement" && refinementData && (
          <div>
            <p className="text-amber-650 dark:text-amber-400/70 text-xs font-semibold uppercase tracking-widest mb-3">Your Class</p>
            <h2 className="text-3xl font-bold text-theme-text-primary mb-2">{refinementData.question}</h2>
            <p className="text-theme-text-secondary text-sm leading-relaxed mb-6">
              These two match your style best. Or scroll down to choose from every class.
            </p>

            {characterClass && (
              <div className="mb-6 p-4 rounded-xl border border-theme-card-border bg-theme-card-bg/40">
                <p className="text-theme-text-secondary text-sm leading-relaxed italic">
                  &ldquo;{CLASSES.find((c) => c.id === characterClass)?.lore}&rdquo;
                </p>
              </div>
            )}

            {/* Recommended options */}
            <div className="space-y-3 mb-8">
              {refinementData.options.map((opt) => {
                const classData = CLASSES.find((c) => c.id === opt.classId)!;
                const a = ACCENT[classData.accentColor];
                const selected = characterClass === opt.classId;
                return (
                  <button
                    key={opt.classId}
                    onClick={() => setCharacterClass(opt.classId)}
                    className={`text-left w-full p-5 rounded-xl border transition-all duration-150 ${
                      selected
                        ? `${a.selectedBorder} ${a.selectedBg}`
                        : `${a.border} ${a.bg} hover:${a.selectedBorder}`
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className={`text-base font-bold ${a.text}`}>{classData.name}</div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${a.bg} ${a.text} border ${a.border} shrink-0 ml-2`}>
                        Recommended
                      </span>
                    </div>
                    <div className="text-theme-text-primary text-sm font-semibold mb-2">{opt.label}</div>
                    <div className="text-theme-text-secondary text-xs leading-relaxed mb-3">{opt.description}</div>        
                    <div className="flex gap-3 text-[10px] font-semibold text-theme-text-tertiary">
                      <span>{classData.baseHp} HP</span>
                      <span>AC {classData.baseAc}</span>
                      <span>+{classData.baseInitiative} Init</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Full class list fallback */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-theme-card-border" />
                <span className="text-theme-text-tertiary text-xs font-semibold uppercase tracking-wider whitespace-nowrap">
                  Or choose from all classes
                </span>
                <div className="flex-1 h-px bg-theme-card-border" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {CLASSES.map((c) => (
                  <ClassCard
                    key={c.id}
                    data={c}
                    selected={characterClass === c.id}
                    onSelect={() => setCharacterClass(c.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Race */}
        {step === "race" && (
          <div>
            <p className="text-amber-655 dark:text-amber-400/70 text-xs font-semibold uppercase tracking-widest mb-3">Your Heritage</p>
            <h2 className="text-3xl font-bold text-theme-text-primary mb-2">Choose your race.</h2>
            <p className="text-theme-text-secondary text-sm leading-relaxed mb-6">
              Your ancestry shapes your instincts, your resilience, and how the world sees you before you speak a word.
            </p>
            {race && (
              <div className="mb-6 p-4 rounded-xl border border-theme-card-border bg-theme-card-bg/40">
                <p className="text-theme-text-secondary text-sm leading-relaxed italic">
                  &ldquo;{RACES.find((r) => r.id === race)?.lore}&rdquo;
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {RACES.map((r) => (
                <RaceCard key={r.id} data={r} selected={race === r.id} onSelect={() => setRace(r.id)} />        
              ))}
            </div>
          </div>
        )}

        {/* Class — direct mode only */}
        {step === "class" && (
          <div>
            <p className="text-amber-655 dark:text-amber-400/70 text-xs font-semibold uppercase tracking-widest mb-3">Your Calling</p>
            <h2 className="text-3xl font-bold text-theme-text-primary mb-2">What is your class?</h2>
            <p className="text-theme-text-secondary text-sm leading-relaxed mb-6">
              Your class defines how you face danger — whether through steel, sorcery, divine will, or cunning.
            </p>
            {characterClass && (
              <div className="mb-6 p-4 rounded-xl border border-theme-card-border bg-theme-card-bg/40">
                <p className="text-theme-text-secondary text-sm leading-relaxed italic">
                  &ldquo;{CLASSES.find((c) => c.id === characterClass)?.lore}&rdquo;
                </p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              {CLASSES.map((c) => (
                <ClassCard
                  key={c.id}
                  data={c}
                  selected={characterClass === c.id}
                  onSelect={() => setCharacterClass(c.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Background */}
        {step === "background" && (
          <div>
            <p className="text-amber-655 dark:text-amber-400/70 text-xs font-semibold uppercase tracking-widest mb-3">Your Origin</p>
            <h2 className="text-3xl font-bold text-theme-text-primary mb-2">What was your life before?</h2>
            <p className="text-theme-text-secondary text-sm leading-relaxed mb-6">
              Before the adventure called, you were someone else. That life left its mark — and its skills.   
            </p>
            <div className="grid grid-cols-2 gap-3">
              {BACKGROUNDS.map((b) => (
                <BackgroundCard key={b.id} data={b} selected={background === b.id} onSelect={() => setBackground(b.id)} />
              ))}
            </div>
          </div>
        )}

        {/* Bio */}
        {step === "bio" && (
          <div>
            <p className="text-amber-655 dark:text-amber-400/70 text-xs font-semibold uppercase tracking-widest mb-3">Your Backstory</p>
            <h2 className="text-3xl font-bold text-theme-text-primary mb-2">Who were you before?</h2>
            <p className="text-theme-text-secondary text-sm leading-relaxed mb-6">
              Write a few details about your character&apos;s history. You can edit this later.
            </p>

            <div className="space-y-6">
              {/* Public Bio */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-theme-text-primary uppercase tracking-wider">
                  Public Backstory (Visible to Everyone)
                </label>
                <textarea
                  value={publicBio}
                  onChange={(e) => setPublicBio(e.target.value)}
                  placeholder="e.g. A former city watch guard who left the city after witnessing corruption..."
                  rows={4}
                  className="w-full bg-theme-input-bg border border-theme-input-border rounded-xl px-4 py-3 text-theme-text-primary text-sm placeholder:text-theme-text-tertiary focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 transition-all resize-none"
                />
                <p className="text-[10px] text-theme-text-tertiary leading-normal">
                  This bio will be shared with the DM and all other players in the campaign.
                </p>
              </div>

              {/* Private Bio */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-theme-text-primary uppercase tracking-wider">
                  Private Secrets (Visible Only to You & DM)
                </label>
                <textarea
                  value={privateBio}
                  onChange={(e) => setPrivateBio(e.target.value)}
                  placeholder="e.g. Actually carrying a cursed locket containing a dormant shadow demon..."
                  rows={4}
                  className="w-full bg-theme-input-bg border border-theme-input-border rounded-xl px-4 py-3 text-theme-text-primary text-sm placeholder:text-theme-text-tertiary focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/20 transition-all resize-none"
                />
                <p className="text-[10px] text-theme-text-tertiary leading-normal">
                  Use this to share hidden motives, secrets, or plot hooks directly with the DM.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Review */}
        {step === "review" && reviewStats && (
          <div>
            <p className="text-amber-655 dark:text-amber-400/70 text-xs font-semibold uppercase tracking-widest mb-3">Ready to Adventure</p>
            <h2 className="text-3xl font-bold text-theme-text-primary mb-1">{name}</h2>
            <p className="text-theme-text-secondary text-sm mb-6">
              {RACE_DISPLAY_NAMES[race!]} · Level 1 {CLASS_DISPLAY_NAMES[characterClass!]} ·{" "}
              {BACKGROUNDS.find((b) => b.id === background)?.name}
            </p>
            <div className="mb-6 p-4 rounded-xl border border-amber-500/20 bg-amber-500/10 dark:border-amber-800/30 dark:bg-amber-900/10">
              <p className="text-amber-700/80 dark:text-amber-200/70 text-sm leading-relaxed italic">
                &ldquo;{CLASSES.find((c) => c.id === characterClass)?.lore}&rdquo;
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <ReviewStat label="Max HP" value={reviewStats.maxHp} />
              <ReviewStat label="Armor Class" value={reviewStats.ac} />
              <ReviewStat label="Initiative" value={reviewStats.initiative >= 0 ? `+${reviewStats.initiative}` : reviewStats.initiative} />
              <ReviewStat label="Passive PP" value={reviewStats.passivePerception} />
              <ReviewStat label="Speed" value={`${reviewStats.speed} ft`} />
              <ReviewStat label="Level" value={1} />
            </div>
            <div className="text-center text-theme-text-tertiary text-xs mt-6">
              Stats are calculated from your race, class, and background choices.
            </div>
          </div>
        )}
      </div>

      {/* Fixed bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-theme-bg via-theme-bg/95 to-transparent">
        <div className="max-w-2xl mx-auto">
          {step === "review" ? (
            <button
              onClick={handleCreate}
              className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-lg transition-all shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:shadow-[0_0_40px_rgba(245,158,11,0.5)]"
            >
              Begin Your Adventure →
            </button>
          ) : step === "success" ? null : (
            <button
              onClick={goNext}
              disabled={!canContinue()}
              className={`w-full py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
                canContinue()
                  ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.2)]"     
                  : "bg-theme-btn-sec-bg border border-theme-btn-sec-border text-theme-text-tertiary cursor-not-allowed"
              }`}
            >
              Continue
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
