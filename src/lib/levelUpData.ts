import { CharacterClass } from "@/types/character";

export interface LevelFeature {
  name: string;
  description: string;
}

export interface LevelUpInfo {
  hpGain: number;
  newProficiencyBonus: number;
  oldProficiencyBonus: number;
  features: LevelFeature[];
}

const HP_PER_LEVEL: Record<CharacterClass, number> = {
  barbarian: 7,
  fighter: 6,
  paladin: 6,
  ranger: 6,
  cleric: 5,
  bard: 5,
  rogue: 5,
  wizard: 4,
};

export const PROFICIENCY_BONUS: Record<number, number> = {
  1: 2, 2: 2, 3: 2, 4: 2,
  5: 3, 6: 3, 7: 3, 8: 3,
  9: 4, 10: 4, 11: 4, 12: 4,
  13: 5, 14: 5, 15: 5, 16: 5,
  17: 6, 18: 6, 19: 6, 20: 6,
};

const ASI: LevelFeature = {
  name: "Ability Score Improvement",
  description: "Add +2 to one ability score or +1 to two — or take a Feat instead. Tell your DM what you choose.",
};

const CLASS_FEATURES: Record<CharacterClass, Record<number, LevelFeature[]>> = {
  barbarian: {
    2: [
      { name: "Reckless Attack", description: "Advantage on attack rolls this turn — but enemies also gain advantage against you until your next turn." },
      { name: "Danger Sense", description: "Advantage on DEX saving throws against effects you can see (traps, spells, etc.)." },
    ],
    3: [
      { name: "Primal Path", description: "Choose your Barbarian subclass — talk to your DM about which path fits your character." },
    ],
    4: [ASI],
    5: [
      { name: "Extra Attack", description: "Attack twice whenever you take the Attack action." },
      { name: "Fast Movement", description: "+10 ft to your speed while not wearing heavy armor." },
    ],
    6: [{ name: "Path Feature", description: "Your Primal Path grants a new ability — check with your DM." }],
    7: [
      { name: "Feral Instinct", description: "Advantage on initiative rolls. If surprised, you can still act normally if you rage before doing anything." },
    ],
    8: [ASI],
    9: [{ name: "Brutal Critical", description: "Roll one extra weapon damage die on a critical hit." }],
    10: [{ name: "Path Feature", description: "Your Primal Path grants another ability — check with your DM." }],
  },

  fighter: {
    2: [
      { name: "Action Surge", description: "Once per rest, take one additional action on your turn. Spend it wisely." },
    ],
    3: [
      { name: "Martial Archetype", description: "Choose your Fighter subclass — talk to your DM about which archetype fits your style." },
    ],
    4: [ASI],
    5: [
      { name: "Extra Attack", description: "Attack twice whenever you take the Attack action." },
    ],
    6: [ASI],
    7: [{ name: "Archetype Feature", description: "Your Martial Archetype grants a new ability — check with your DM." }],
    8: [ASI],
    9: [{ name: "Indomitable", description: "Reroll a failed saving throw once per rest. You must use the new roll." }],
    10: [{ name: "Archetype Feature", description: "Your Martial Archetype grants another ability — check with your DM." }],
  },

  paladin: {
    2: [
      { name: "Divine Smite", description: "After a hit, spend a spell slot to deal extra radiant damage (2d8 for 1st level, +1d8 per slot level above 1st)." },
      { name: "Spellcasting", description: "You can now prepare and cast Paladin spells. Ask your DM about your spell list." },
    ],
    3: [
      { name: "Divine Health", description: "Immune to disease." },
      { name: "Sacred Oath", description: "Choose your Paladin subclass. You gain Oath spells and Channel Divinity options." },
    ],
    4: [ASI],
    5: [
      { name: "Extra Attack", description: "Attack twice whenever you take the Attack action." },
    ],
    6: [
      { name: "Aura of Protection", description: "Allies within 10 ft add your CHA modifier to saving throws (minimum +1)." },
    ],
    7: [{ name: "Sacred Oath Feature", description: "Your Sacred Oath grants a new ability — check with your DM." }],
    8: [ASI],
    9: [{ name: "Improved Divine Smite", description: "All melee weapon attacks deal an extra 1d8 radiant damage." }],
    10: [{ name: "Aura of Courage", description: "Allies within 10 ft can't be frightened while you're conscious." }],
  },

  ranger: {
    2: [
      { name: "Fighting Style", description: "Choose a fighting style specialty — Archery (+2 to ranged attacks), Defense (+1 AC in armor), or Two-Weapon Fighting." },
      { name: "Spellcasting", description: "You can now prepare and cast Ranger spells. Ask your DM about your spell list." },
    ],
    3: [
      { name: "Primeval Awareness", description: "Spend a spell slot to sense the presence of certain creature types within 1 mile." },
      { name: "Ranger Conclave", description: "Choose your Ranger subclass. Grants a new set of abilities." },
    ],
    4: [ASI],
    5: [
      { name: "Extra Attack", description: "Attack twice whenever you take the Attack action." },
    ],
    6: [
      { name: "Favored Enemy Improvement", description: "Add a second favored enemy type and another language." },
    ],
    7: [{ name: "Conclave Feature", description: "Your Ranger Conclave grants a new ability — check with your DM." }],
    8: [ASI, { name: "Land's Stride", description: "Moving through non-magical difficult terrain costs no extra movement." }],
    9: [{ name: "Conclave Feature", description: "Your Ranger Conclave grants another ability — check with your DM." }],
    10: [
      { name: "Natural Explorer Improvement", description: "Add a third favored terrain type." },
      { name: "Hide in Plain Sight", description: "Spend 1 minute camouflaging yourself — gain +10 to Stealth checks while motionless." },
    ],
  },

  cleric: {
    2: [
      { name: "Channel Divinity", description: "Harness divine energy to fuel special effects. Recharges on a short or long rest. Exact effect depends on your Divine Domain." },
      { name: "Divine Domain Feature", description: "Your chosen Domain grants a new Channel Divinity option — check with your DM." },
    ],
    3: [],
    4: [ASI],
    5: [
      { name: "Destroy Undead", description: "When you turn undead, creatures of CR 1/2 or lower are destroyed outright instead of just turned." },
    ],
    6: [
      { name: "Channel Divinity (2/rest)", description: "You can now use Channel Divinity twice before needing a rest." },
      { name: "Divine Domain Feature", description: "Your Domain grants another ability — check with your DM." },
    ],
    7: [{ name: "Divine Domain Feature", description: "Your Domain grants another ability — check with your DM." }],
    8: [ASI, { name: "Destroy Undead (CR 1)", description: "Undead of CR 1 or lower are destroyed when turned." }],
    9: [],
    10: [
      { name: "Divine Intervention", description: "Call on your deity for aid — roll percentile dice. If you roll equal to or lower than your cleric level, your deity intervenes." },
    ],
  },

  bard: {
    2: [
      { name: "Jack of All Trades", description: "Add half your proficiency bonus (round down) to any ability check you aren't already proficient in." },
      { name: "Song of Rest", description: "During a short rest, allies who hear your performance regain an extra 1d6 HP when spending Hit Dice." },
    ],
    3: [
      { name: "Bard College", description: "Choose your Bard subclass — grants new abilities and a different performance specialty." },
      { name: "Expertise", description: "Double your proficiency bonus for two skills of your choice." },
    ],
    4: [ASI],
    5: [
      { name: "Font of Inspiration", description: "You now regain all Bardic Inspiration uses on a short rest, not just a long rest." },
    ],
    6: [
      { name: "Countercharm", description: "Use your action to start a performance that grants advantage on saves against being frightened or charmed to nearby allies." },
      { name: "Bard College Feature", description: "Your College grants a new ability — check with your DM." },
    ],
    7: [],
    8: [ASI],
    9: [{ name: "Song of Rest (d8)", description: "Song of Rest now restores 1d8 HP instead of 1d6." }],
    10: [
      { name: "Magical Secrets", description: "Learn 2 spells from any class spell list. These count as Bard spells for you." },
      { name: "Expertise", description: "Double your proficiency bonus for two more skills." },
    ],
  },

  rogue: {
    2: [
      { name: "Cunning Action", description: "Bonus action to Dash, Disengage, or Hide each turn. Huge mobility and stealth upgrade." },
    ],
    3: [
      { name: "Roguish Archetype", description: "Choose your Rogue subclass — grants a specialty and new abilities." },
    ],
    4: [ASI],
    5: [
      { name: "Uncanny Dodge", description: "Use your reaction to halve the damage from an attack that hits you (must be able to see the attacker)." },
    ],
    6: [
      { name: "Expertise", description: "Double your proficiency bonus for two more skills." },
    ],
    7: [
      { name: "Evasion", description: "If a DEX save would deal half damage, you take none on a success and half on a failure." },
    ],
    8: [ASI],
    9: [{ name: "Roguish Archetype Feature", description: "Your Archetype grants a new ability — check with your DM." }],
    10: [ASI],
  },

  wizard: {
    2: [
      { name: "Arcane Recovery", description: "Once per day after a short rest, recover spell slots totaling half your wizard level (rounded up)." },
      { name: "Arcane Tradition", description: "Choose your Wizard subclass — your school of magic specialization." },
    ],
    3: [],
    4: [ASI],
    5: [],
    6: [{ name: "Arcane Tradition Feature", description: "Your school of magic grants a new ability — check with your DM." }],
    7: [],
    8: [ASI],
    9: [],
    10: [{ name: "Arcane Tradition Feature", description: "Your school grants another ability — check with your DM." }],
  },
};

export function getLevelUpInfo(className: CharacterClass, currentLevel: number): LevelUpInfo {
  const nextLevel = currentLevel + 1;
  return {
    hpGain: HP_PER_LEVEL[className],
    oldProficiencyBonus: PROFICIENCY_BONUS[currentLevel] ?? 2,
    newProficiencyBonus: PROFICIENCY_BONUS[nextLevel] ?? 2,
    features: CLASS_FEATURES[className]?.[nextLevel] ?? [],
  };
}
