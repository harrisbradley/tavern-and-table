export interface JournalEntry {
  id: string;
  title: string;
  content: string;        // Main text recap
  npcNames: string[];     // Key NPCs introduced/mentioned
  questDetails: string;   // Updates on active/completed quests
  published: boolean;     // Draft vs. Published status
  createdAt: string;      // ISO timestamp string
}
