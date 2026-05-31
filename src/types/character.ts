export type Race = "human" | "elf" | "dwarf" | "halfling" | "half-orc" | "tiefling" | "dragonborn";
export type CharacterClass = "fighter" | "barbarian" | "paladin" | "ranger" | "cleric" | "bard" | "rogue" | "wizard";
export type Background = "acolyte" | "soldier" | "criminal" | "sage" | "folk-hero" | "noble";

export interface Character {
  id: string;
  name: string;
  race: Race;
  className: CharacterClass;
  background: Background;
  level: number;
  maxHp: number;
  currentHp: number;
  ac: number;
  initiative: number;
  passivePerception: number;
  speed: number;
  status: "active" | "down" | "hidden";
  tutorialEnabled: boolean;
  createdAt: string;
}

export interface RaceData {
  id: Race;
  name: string;
  description: string;
  lore: string;
  bonuses: { hp?: number; initiative?: number; passivePerception?: number; speed: number };
  accentColor: string;
}

export interface ClassData {
  id: CharacterClass;
  name: string;
  description: string;
  lore: string;
  baseHp: number;
  baseAc: number;
  baseInitiative: number;
  basePassivePerception: number;
  accentColor: string;
}

export interface BackgroundData {
  id: Background;
  name: string;
  description: string;
  bonusDescription: string;
  bonuses: { hp?: number; initiative?: number; passivePerception?: number };
}

export const RACES: RaceData[] = [
  {
    id: "human",
    name: "Human",
    description: "Adaptable and ambitious, humans thrive everywhere.",
    lore: "Driven by boundless ambition, humans have built great civilizations in the span of a single lifetime. Their adaptability makes them excel at nearly anything they put their minds to.",
    bonuses: { initiative: 1, passivePerception: 1, speed: 30 },
    accentColor: "amber",
  },
  {
    id: "elf",
    name: "Elf",
    description: "Graceful, perceptive, and long-lived forest dwellers.",
    lore: "Elves live for centuries, developing a patience and sharpness of senses that other races can only dream of. Their awareness of the world around them borders on the supernatural.",
    bonuses: { initiative: 2, passivePerception: 5, speed: 30 },
    accentColor: "emerald",
  },
  {
    id: "dwarf",
    name: "Dwarf",
    description: "Sturdy, resilient, and built to withstand anything.",
    lore: "Born of stone and iron, dwarves are among the toughest creatures in the world. Their endurance is legendary — they can absorb punishment that would fell any other race.",
    bonuses: { hp: 2, speed: 25 },
    accentColor: "stone",
  },
  {
    id: "halfling",
    name: "Halfling",
    description: "Small, nimble, and impossibly lucky in a pinch.",
    lore: "Halflings move through the world with a lightness of step and spirit. Luck seems to follow them wherever they go, turning near-disasters into narrow victories.",
    bonuses: { initiative: 2, speed: 25 },
    accentColor: "yellow",
  },
  {
    id: "half-orc",
    name: "Half-Orc",
    description: "Powerful and enduring, forged in conflict.",
    lore: "Children of two worlds, half-orcs carry the raw strength of orcish blood and the cunning resilience of humanity. They have survived trials that would break lesser beings.",
    bonuses: { hp: 2, initiative: 1, speed: 30 },
    accentColor: "red",
  },
  {
    id: "tiefling",
    name: "Tiefling",
    description: "Touched by infernal blood, arcane and alluring.",
    lore: "With fiendish ancestry woven into their very soul, tieflings carry a dark charisma and a natural affinity for the arcane. They are often mistrusted — and often underestimated.",
    bonuses: { passivePerception: 1, speed: 30 },
    accentColor: "purple",
  },
  {
    id: "dragonborn",
    name: "Dragonborn",
    description: "Draconic warriors, proud and fearsome.",
    lore: "Born of dragon blood, dragonborn carry the majesty of ancient wyrms in their bearing and the fire of legends in their breath. Their very presence commands respect.",
    bonuses: { hp: 1, speed: 30 },
    accentColor: "orange",
  },
];

export const CLASSES: ClassData[] = [
  {
    id: "fighter",
    name: "Fighter",
    description: "Master of weapons and the art of war.",
    lore: "Fighters study the craft of battle above all else. They are the most versatile combatants — capable of turning any weapon into a deadly extension of their will.",
    baseHp: 12, baseAc: 16, baseInitiative: 1, basePassivePerception: 11,
    accentColor: "blue",
  },
  {
    id: "barbarian",
    name: "Barbarian",
    description: "A primal warrior who channels rage into power.",
    lore: "When fury takes hold, few forces can match a Barbarian's raw devastation. Their rage is not a weakness — it is the most honest weapon in any arsenal.",
    baseHp: 14, baseAc: 13, baseInitiative: 1, basePassivePerception: 10,
    accentColor: "red",
  },
  {
    id: "paladin",
    name: "Paladin",
    description: "A holy warrior bound by a sacred oath.",
    lore: "Paladins combine martial prowess with divine power, serving as living instruments of justice. Their oaths are unbreakable — and their conviction makes them terrifying in battle.",
    baseHp: 12, baseAc: 18, baseInitiative: 0, basePassivePerception: 11,
    accentColor: "amber",
  },
  {
    id: "ranger",
    name: "Ranger",
    description: "Hunter and tracker, master of the wilderness.",
    lore: "At home in the wilds, rangers stalk their quarry with unmatched patience. They blend martial skill with nature magic, striking from distance before enemies even know they are there.",
    baseHp: 12, baseAc: 14, baseInitiative: 2, basePassivePerception: 14,
    accentColor: "emerald",
  },
  {
    id: "cleric",
    name: "Cleric",
    description: "A divine conduit — healer and holy warrior.",
    lore: "Clerics are more than priests — they are soldiers of faith, channeling the power of their deity to mend the broken and smite the wicked. Their god fights beside them.",
    baseHp: 10, baseAc: 17, baseInitiative: 0, basePassivePerception: 13,
    accentColor: "indigo",
  },
  {
    id: "bard",
    name: "Bard",
    description: "A magical performer who inspires, enchants, and deceives.",
    lore: "Bards weave magic through music, words, and sheer force of personality. They know a little of everything and make the impossible seem effortless — usually while someone else is in danger.",
    baseHp: 10, baseAc: 13, baseInitiative: 2, basePassivePerception: 12,
    accentColor: "purple",
  },
  {
    id: "rogue",
    name: "Rogue",
    description: "A cunning master of stealth, skill, and precision.",
    lore: "Rogues achieve through cunning what others attempt by brute force. They are invaluable in any situation — striking from the shadows before their enemies can react.",
    baseHp: 10, baseAc: 14, baseInitiative: 3, basePassivePerception: 15,
    accentColor: "teal",
  },
  {
    id: "wizard",
    name: "Wizard",
    description: "An arcane scholar of devastating magical power.",
    lore: "Wizards spend their lives bending the laws of reality. Fragile in body but limitless in magical potential, a prepared wizard can unravel an army before it reaches the gate.",
    baseHp: 8, baseAc: 12, baseInitiative: 2, basePassivePerception: 11,
    accentColor: "violet",
  },
];

export const BACKGROUNDS: BackgroundData[] = [
  {
    id: "acolyte",
    name: "Acolyte",
    description: "You spent your youth in devoted service to a temple, learning its rites and secrets.",
    bonusDescription: "+2 Passive Perception",
    bonuses: { passivePerception: 2 },
  },
  {
    id: "soldier",
    name: "Soldier",
    description: "You trained and fought in an organized military force, learning discipline under fire.",
    bonusDescription: "+1 Initiative",
    bonuses: { initiative: 1 },
  },
  {
    id: "criminal",
    name: "Criminal",
    description: "You made a living outside the law, developing sharp instincts and quick reflexes.",
    bonusDescription: "+1 Initiative",
    bonuses: { initiative: 1 },
  },
  {
    id: "sage",
    name: "Sage",
    description: "You devoted years to learning the lore of the world — libraries and scrolls were your battlefield.",
    bonusDescription: "+1 Passive Perception",
    bonuses: { passivePerception: 1 },
  },
  {
    id: "folk-hero",
    name: "Folk Hero",
    description: "You rose from humble origins, but fate — and the people around you — always believed you were destined for more.",
    bonusDescription: "+1 Max HP",
    bonuses: { hp: 1 },
  },
  {
    id: "noble",
    name: "Noble",
    description: "You were born into wealth and privilege. You understand power — how to wield it, and how to survive losing it.",
    bonusDescription: "No stat bonus — but doors open for those with a title",
    bonuses: {},
  },
];

export const CLASS_DISPLAY_NAMES: Record<CharacterClass, string> = {
  fighter: "Fighter",
  barbarian: "Barbarian",
  paladin: "Paladin",
  ranger: "Ranger",
  cleric: "Cleric",
  bard: "Bard",
  rogue: "Rogue",
  wizard: "Wizard",
};

export const RACE_DISPLAY_NAMES: Record<Race, string> = {
  human: "Human",
  elf: "Elf",
  dwarf: "Dwarf",
  halfling: "Halfling",
  "half-orc": "Half-Orc",
  tiefling: "Tiefling",
  dragonborn: "Dragonborn",
};

export function calculateStats(
  race: Race,
  className: CharacterClass,
  background: Background,
): { maxHp: number; ac: number; initiative: number; passivePerception: number; speed: number } {
  const raceData = RACES.find((r) => r.id === race)!;
  const classData = CLASSES.find((c) => c.id === className)!;
  const bgData = BACKGROUNDS.find((b) => b.id === background)!;

  return {
    maxHp: classData.baseHp + (raceData.bonuses.hp ?? 0) + (bgData.bonuses.hp ?? 0),
    ac: classData.baseAc,
    initiative: classData.baseInitiative + (raceData.bonuses.initiative ?? 0) + (bgData.bonuses.initiative ?? 0),
    passivePerception:
      classData.basePassivePerception +
      (raceData.bonuses.passivePerception ?? 0) +
      (bgData.bonuses.passivePerception ?? 0),
    speed: raceData.bonuses.speed,
  };
}
