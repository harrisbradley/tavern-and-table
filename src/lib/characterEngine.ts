import { Character, Race, CharacterClass, Background, calculateStats } from "@/types/character";

const CHARS_KEY = "tt_characters";
const LAST_KEY = "tt_last_character";

export function getCharacters(): Character[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(CHARS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function getCharacterById(id: string): Character | null {
  return getCharacters().find((c) => c.id === id) ?? null;
}

export function saveCharacter(char: Character): void {
  const chars = getCharacters();
  const idx = chars.findIndex((c) => c.id === char.id);
  if (idx >= 0) chars[idx] = char;
  else chars.push(char);
  localStorage.setItem(CHARS_KEY, JSON.stringify(chars));
}

export function deleteCharacter(id: string): void {
  const chars = getCharacters().filter((c) => c.id !== id);
  localStorage.setItem(CHARS_KEY, JSON.stringify(chars));
  if (getLastCharacterId() === id) setLastCharacterId(null);
}

export function updateCharacterHp(id: string, currentHp: number): void {
  const chars = getCharacters();
  const char = chars.find((c) => c.id === id);
  if (!char) return;
  char.currentHp = currentHp;
  char.status = currentHp === 0 ? "down" : "active";
  localStorage.setItem(CHARS_KEY, JSON.stringify(chars));
}

export function createCharacter(data: {
  name: string;
  race: Race;
  className: CharacterClass;
  background: Background;
}): Character {
  const stats = calculateStats(data.race, data.className, data.background);
  const char: Character = {
    id: "char-" + Math.random().toString(36).substring(2, 9),
    name: data.name,
    race: data.race,
    className: data.className,
    background: data.background,
    level: 1,
    ...stats,
    currentHp: stats.maxHp,
    status: "active",
    tutorialEnabled: true,
    createdAt: new Date().toISOString(),
  };
  saveCharacter(char);
  return char;
}

export function setTutorialEnabled(id: string, enabled: boolean): void {
  const chars = getCharacters();
  const char = chars.find((c) => c.id === id);
  if (!char) return;
  char.tutorialEnabled = enabled;
  localStorage.setItem(CHARS_KEY, JSON.stringify(chars));
}

export function levelUpCharacter(id: string, hpGain: number): Character | null {
  const chars = getCharacters();
  const char = chars.find((c) => c.id === id);
  if (!char || char.level >= 20) return null;
  char.level += 1;
  char.maxHp += hpGain;
  char.currentHp = Math.min(char.currentHp + hpGain, char.maxHp);
  localStorage.setItem(CHARS_KEY, JSON.stringify(chars));
  return char;
}

export function getLastCharacterId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_KEY);
}

export function setLastCharacterId(id: string | null): void {
  if (typeof window === "undefined") return;
  if (id) localStorage.setItem(LAST_KEY, id);
  else localStorage.removeItem(LAST_KEY);
}
