"use client";

import { db, isFirebaseConfigured } from "./firebase";
import { 
  doc, 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  setDoc, 
  getDoc,
  addDoc, 
  deleteDoc,
  serverTimestamp 
} from "firebase/firestore";
import { JournalEntry } from "@/types/journal";


export interface PlayerStatus {
  id: string;
  name: string;
  className: string;
  maxHp: number;
  currentHp: number;
  ac: number;
  initiative: number;
  passivePerception: number;
  status: "active" | "down" | "hidden";
}

export interface RollLog {
  id: string;
  playerName: string;
  actionName: string;
  rollNotation: string;
  rollTotal: number;
  timestamp: string; // Will store relative time or ISO string
  type: "attack" | "damage" | "stealth" | "heal";
}

export interface CampaignConfig {
  id: string;
  name: string;
  synopsis: string;
  themeColor: string;
  createdAt: string;
}

// -------------------------------------------------------------
// LOCAL BACKEND: BroadcastChannel + LocalStorage Fallback Setup
// -------------------------------------------------------------
const channels: Record<string, BroadcastChannel> = {};

const getChannel = (campaignId: string) => {
  if (typeof window === "undefined") return null;
  if (!channels[campaignId]) {
    channels[campaignId] = new BroadcastChannel(`tt_sync_${campaignId}`);
  }
  return channels[campaignId];
};

// Initial Mock Seed Data (Empty for production)
const DEFAULT_PLAYERS: PlayerStatus[] = [];
const DEFAULT_ROLLS: RollLog[] = [];

// Helper to load localStorage safely
const getLocalData = (key: string, defaultValue: any) => {
  if (typeof window === "undefined") return defaultValue;
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(data);
  } catch {
    return defaultValue;
  }
};

// Helper to save localStorage safely
const setLocalData = (key: string, value: any) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
};

// Local fallback listeners
const playerListeners = new Set<{ campaignId: string; callback: (players: PlayerStatus[]) => void }>();
const rollListeners = new Set<{ campaignId: string; callback: (logs: RollLog[]) => void }>();
const nudgeListeners = new Set<{ campaignId: string; playerId: string; callback: (rollType: string | null) => void }>();
const configListeners = new Set<{ campaignId: string; callback: (config: CampaignConfig | null) => void }>();
const journalListeners = new Set<{ campaignId: string; callback: (entries: JournalEntry[]) => void }>();

function notifyLocalPlayers(campaignId: string) {
  const currentList = getLocalData(`tt_players_${campaignId}`, DEFAULT_PLAYERS);
  playerListeners.forEach((entry) => {
    if (entry.campaignId === campaignId) {
      try {
        entry.callback(currentList);
      } catch (err) {
        console.error("Error in player listener:", err);
      }
    }
  });
}

function notifyLocalRolls(campaignId: string) {
  const currentLogs = getLocalData(`tt_rolls_${campaignId}`, DEFAULT_ROLLS);
  rollListeners.forEach((entry) => {
    if (entry.campaignId === campaignId) {
      try {
        entry.callback(currentLogs);
      } catch (err) {
        console.error("Error in roll listener:", err);
      }
    }
  });
}

function notifyLocalNudge(campaignId: string, playerId: string, rollType: string | null) {
  nudgeListeners.forEach((entry) => {
    if (entry.campaignId === campaignId && entry.playerId === playerId) {
      try {
        entry.callback(rollType);
      } catch (err) {
        console.error("Error in nudge listener:", err);
      }
    }
  });
}

function notifyLocalConfig(campaignId: string) {
  const currentConfig = getLocalData(`tt_config_${campaignId}`, null);
  configListeners.forEach((entry) => {
    if (entry.campaignId === campaignId) {
      try {
        entry.callback(currentConfig);
      } catch (err) {
        console.error("Error in config listener:", err);
      }
    }
  });
}

function notifyLocalJournal(campaignId: string) {
  const currentList = getLocalData(`tt_journal_${campaignId}`, []);
  journalListeners.forEach((entry) => {
    if (entry.campaignId === campaignId) {
      try {
        entry.callback(currentList);
      } catch (err) {
        console.error("Error in journal listener:", err);
      }
    }
  });
}

// -------------------------------------------------------------
// UNIFIED SYNC ENGINE API
// -------------------------------------------------------------

/**
 * 0. Campaign Metadata Management
 */

export function saveToDmHistory(config: CampaignConfig) {
  if (typeof window === "undefined") return;
  const history: CampaignConfig[] = getLocalData("tt_dm_history", []);
  
  // Remove existing if same ID, then add new to top
  const filtered = history.filter(c => c.id !== config.id);
  const updated = [{ id: config.id, name: config.name, themeColor: config.themeColor, synopsis: config.synopsis, createdAt: config.createdAt }, ...filtered].slice(0, 4); // Keep last 4
  
  setLocalData("tt_dm_history", updated);
}

export function saveToPlayerHistory(config: CampaignConfig) {
  if (typeof window === "undefined") return;
  const history: CampaignConfig[] = getLocalData("tt_player_history", []);
  
  const filtered = history.filter(c => c.id !== config.id);
  const updated = [{ id: config.id, name: config.name, themeColor: config.themeColor, synopsis: config.synopsis, createdAt: config.createdAt }, ...filtered].slice(0, 4);
  
  setLocalData("tt_player_history", updated);
}

export async function createCampaign(config: CampaignConfig): Promise<void> {
  saveToDmHistory(config);
  
  if (isFirebaseConfigured && db) {
    const campaignRef = doc(db, "campaigns", config.id);
    await setDoc(campaignRef, {
      name: config.name,
      synopsis: config.synopsis,
      themeColor: config.themeColor,
      createdAt: serverTimestamp(),
    });
  } else {
    setLocalData(`tt_config_${config.id}`, config);
    
    const channel = getChannel(config.id);
    channel?.postMessage({ type: "CONFIG_UPDATED" });
    notifyLocalConfig(config.id);
    channel?.close();
  }
}

export async function fetchCampaignConfig(campaignId: string): Promise<CampaignConfig | null> {
  if (isFirebaseConfigured && db) {
    const campaignRef = doc(db, "campaigns", campaignId);
    const docSnap = await getDoc(campaignRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: campaignId,
        name: data.name,
        synopsis: data.synopsis,
        themeColor: data.themeColor,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      };
    }
    return null;
  } else {
    return getLocalData(`tt_config_${campaignId}`, null);
  }
}

export function subscribeToCampaignConfig(campaignId: string, onUpdate: (config: CampaignConfig | null) => void): () => void {
  if (isFirebaseConfigured && db) {
    const campaignRef = doc(db, "campaigns", campaignId);
    return onSnapshot(campaignRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        onUpdate({
          id: campaignId,
          name: data.name,
          synopsis: data.synopsis,
          themeColor: data.themeColor,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        });
      } else {
        onUpdate(null);
      }
    });
  } else {
    const fetchAndTrigger = () => {
      const config = getLocalData(`tt_config_${campaignId}`, null);
      onUpdate(config);
    };

    fetchAndTrigger();
    const entry = { campaignId, callback: onUpdate };
    configListeners.add(entry);

    const channel = getChannel(campaignId);
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === "CONFIG_UPDATED") {
        fetchAndTrigger();
      }
    };

    channel?.addEventListener("message", handleMessage);

    return () => {
      configListeners.delete(entry);
      channel?.removeEventListener("message", handleMessage);
      channel?.close();
    };
  }
}

/**
 * 1. Subscribe to Player statuses in real-time.
 */
export function subscribeToPlayers(campaignId: string, onUpdate: (players: PlayerStatus[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    // Firebase Firestore Listener
    const campaignRef = doc(db, "campaigns", campaignId);
    const playersCol = collection(campaignRef, "players");
    
    const unsubscribe = onSnapshot(playersCol, (snapshot: any) => {
      const playersList: PlayerStatus[] = [];
      snapshot.forEach((docSnap: any) => {
        const data = docSnap.data();
        playersList.push({ id: docSnap.id, ...data } as PlayerStatus);
      });
      
      onUpdate(playersList);
    }, (err: any) => {
      console.error("Firestore subscribeToPlayers error:", err);
    });

    return unsubscribe;
  } else {
    // Local BroadcastChannel Listener
    const fetchAndTrigger = () => {
      const currentList: PlayerStatus[] = getLocalData(`tt_players_${campaignId}`, []);
      onUpdate(currentList);
    };

    // Trigger initial values
    fetchAndTrigger();
    const entry = { campaignId, callback: onUpdate };
    playerListeners.add(entry);

    const channel = getChannel(campaignId);
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === "PLAYERS_UPDATED") {
        fetchAndTrigger();
      }
    };

    channel?.addEventListener("message", handleMessage);

    return () => {
      playerListeners.delete(entry);
      channel?.removeEventListener("message", handleMessage);
      channel?.close();
    };
  }
}

/**
 * 2. Subscribe to Campaign Roll history log in real-time.
 */
export function subscribeToRollLogs(campaignId: string, onUpdate: (logs: RollLog[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    const campaignRef = doc(db, "campaigns", campaignId);
    const rollsCol = collection(campaignRef, "rolls");
    const q = query(rollsCol, orderBy("timestamp", "desc"), limit(30));

    const unsubscribe = onSnapshot(q, (snapshot: any) => {
      const logsList: RollLog[] = [];
      snapshot.forEach((docSnap: any) => {
        const data = docSnap.data();
        // Convert firestore timestamp to string
        const ts = data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : new Date().toISOString();
        logsList.push({
          id: docSnap.id,
          playerName: data.playerName,
          actionName: data.actionName,
          rollNotation: data.rollNotation,
          rollTotal: data.rollTotal,
          timestamp: ts,
          type: data.type,
        });
      });
      onUpdate(logsList);
    }, (err: any) => {
      console.error("Firestore subscribeToRollLogs error:", err);
    });

    return unsubscribe;
  } else {
    const fetchAndTrigger = () => {
      const currentLogs = getLocalData(`tt_rolls_${campaignId}`, DEFAULT_ROLLS);
      onUpdate(currentLogs);
    };

    fetchAndTrigger();
    const entry = { campaignId, callback: onUpdate };
    rollListeners.add(entry);

    const channel = getChannel(campaignId);
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === "ROLLS_UPDATED") {
        fetchAndTrigger();
      }
    };

    channel?.addEventListener("message", handleMessage);

    return () => {
      rollListeners.delete(entry);
      channel?.removeEventListener("message", handleMessage);
      channel?.close();
    };
  }
}

/**
 * 3. Subscribe to active Nudges/Roll requests for a specific player.
 */
export function subscribeToNudges(campaignId: string, playerId: string, onNudge: (rollType: string | null) => void): () => void {
  if (isFirebaseConfigured && db) {
    const campaignRef = doc(db, "campaigns", campaignId);
    const nudgeRef = doc(campaignRef, "nudges", playerId);

    const unsubscribe = onSnapshot(nudgeRef, (docSnap: any) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        onNudge(data.active ? data.rollType : null);
      } else {
        onNudge(null);
      }
    }, (err: any) => {
      console.error("Firestore subscribeToNudges error:", err);
    });

    return unsubscribe;
  } else {
    const fetchAndTrigger = () => {
      const nudges = getLocalData(`tt_nudges_${campaignId}`, {});
      onNudge(nudges[playerId] || null);
    };

    fetchAndTrigger();
    const entry = { campaignId, playerId, callback: onNudge };
    nudgeListeners.add(entry);

    const channel = getChannel(campaignId);
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === "NUDGE_UPDATED" && e.data?.playerId === playerId) {
        onNudge(e.data?.rollType || null);
      }
    };

    channel?.addEventListener("message", handleMessage);

    return () => {
      nudgeListeners.delete(entry);
      channel?.removeEventListener("message", handleMessage);
      channel?.close();
    };
  }
}

/**
 * 4. Sync a player's entire profile (used for new characters or level ups).
 */
export async function syncPlayerProfile(campaignId: string, player: PlayerStatus): Promise<void> {
  if (isFirebaseConfigured && db) {
    const campaignRef = doc(db, "campaigns", campaignId);
    const playerRef = doc(campaignRef, "players", player.id);
    
    await setDoc(playerRef, {
      name: player.name,
      className: player.className,
      maxHp: player.maxHp,
      currentHp: player.currentHp,
      ac: player.ac,
      initiative: player.initiative,
      passivePerception: player.passivePerception,
      status: player.status,
    }, { merge: true });
  } else {
    const currentList: PlayerStatus[] = getLocalData(`tt_players_${campaignId}`, []);
    const exists = currentList.some((p) => p.id === player.id);
    
    let updatedList: PlayerStatus[];
    if (exists) {
      updatedList = currentList.map((p) => (p.id === player.id ? player : p));
    } else {
      updatedList = [...currentList, player];
    }

    setLocalData(`tt_players_${campaignId}`, updatedList);
    
    // Notify other tabs
    const channel = getChannel(campaignId);
    channel?.postMessage({ type: "PLAYERS_UPDATED" });
    notifyLocalPlayers(campaignId);
  }
}

/**
 * 5. Update Player's health and core stats.
 */
export async function updatePlayerHp(
  campaignId: string,
  playerId: string,
  currentHp: number,
  maxHp: number,
  additionalFields: Partial<PlayerStatus> = {}
): Promise<void> {
  const status = currentHp === 0 ? "down" : additionalFields.status || "active";
  
  if (isFirebaseConfigured && db) {
    const campaignRef = doc(db, "campaigns", campaignId);
    const playerRef = doc(campaignRef, "players", playerId);
    
    await setDoc(
      playerRef, 
      { currentHp, maxHp, status, ...additionalFields }, 
      { merge: true }
    );
  } else {
    const currentList: PlayerStatus[] = getLocalData(`tt_players_${campaignId}`, []);
    const updatedList = currentList.map((p) => {
      if (p.id === playerId) {
        return { ...p, currentHp, maxHp, status, ...additionalFields };
      }
      return p;
    });

    setLocalData(`tt_players_${campaignId}`, updatedList);
    
    // Notify other tabs
    const channel = getChannel(campaignId);
    channel?.postMessage({ type: "PLAYERS_UPDATED" });
    notifyLocalPlayers(campaignId);
  }
}

/**
 * 6. Remove a player's profile from the campaign (used when character is deleted).
 */
export async function deletePlayerProfile(campaignId: string, playerId: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    const campaignRef = doc(db, "campaigns", campaignId);
    const playerRef = doc(campaignRef, "players", playerId);
    await deleteDoc(playerRef);
  } else {
    const currentList: PlayerStatus[] = getLocalData(`tt_players_${campaignId}`, []);
    const updatedList = currentList.filter((p) => p.id !== playerId);
    setLocalData(`tt_players_${campaignId}`, updatedList);
    
    // Notify other tabs
    const channel = getChannel(campaignId);
    channel?.postMessage({ type: "PLAYERS_UPDATED" });
    notifyLocalPlayers(campaignId);
  }
}

/**
 * 7. Push a roll result to the campaign log.
 */
export async function addRollLog(
  campaignId: string,
  playerName: string,
  actionName: string,
  rollNotation: string,
  rollTotal: number,
  type: "attack" | "damage" | "stealth" | "heal"
): Promise<void> {
  if (isFirebaseConfigured && db) {
    const campaignRef = doc(db, "campaigns", campaignId);
    const rollsCol = collection(campaignRef, "rolls");
    
    await addDoc(rollsCol, {
      playerName,
      actionName,
      rollNotation,
      rollTotal,
      timestamp: serverTimestamp(),
      type,
    });
  } else {
    const currentLogs: RollLog[] = getLocalData(`tt_rolls_${campaignId}`, DEFAULT_ROLLS);
    const newLog: RollLog = {
      id: "log-" + Math.random().toString(36).substring(2, 9),
      playerName,
      actionName,
      rollNotation,
      rollTotal,
      timestamp: new Date().toISOString(),
      type,
    };

    const updatedLogs = [newLog, ...currentLogs].slice(0, 50); // Keep last 50
    setLocalData(`tt_rolls_${campaignId}`, updatedLogs);
    
    const channel = getChannel(campaignId);
    channel?.postMessage({ type: "ROLLS_UPDATED" });
    notifyLocalRolls(campaignId);
  }
}

/**
 * 8. Send Nudge (request roll) to player.
 */
export async function sendNudge(campaignId: string, playerId: string, rollType: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    const campaignRef = doc(db, "campaigns", campaignId);
    const nudgeRef = doc(campaignRef, "nudges", playerId);
    
    await setDoc(nudgeRef, {
      rollType,
      active: true,
      timestamp: serverTimestamp(),
    });
  } else {
    const nudges = getLocalData(`tt_nudges_${campaignId}`, {});
    nudges[playerId] = rollType;
    setLocalData(`tt_nudges_${campaignId}`, nudges);
    
    const channel = getChannel(campaignId);
    channel?.postMessage({ type: "NUDGE_UPDATED", playerId, rollType });
    notifyLocalNudge(campaignId, playerId, rollType);
  }
}

/**
 * 9. Clear Nudge (hide popup once roll is complete).
 */
export async function clearNudge(campaignId: string, playerId: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    const campaignRef = doc(db, "campaigns", campaignId);
    const nudgeRef = doc(campaignRef, "nudges", playerId);
    
    await setDoc(nudgeRef, { active: false }, { merge: true });
  } else {
    const nudges = getLocalData(`tt_nudges_${campaignId}`, {});
    nudges[playerId] = null;
    setLocalData(`tt_nudges_${campaignId}`, nudges);
    
    const channel = getChannel(campaignId);
    channel?.postMessage({ type: "NUDGE_UPDATED", playerId, rollType: null });
    notifyLocalNudge(campaignId, playerId, null);
  }
}

/**
 * 10. Subscribe to campaign Story Journal entries in real-time.
 */
export function subscribeToJournal(campaignId: string, onUpdate: (entries: JournalEntry[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    const campaignRef = doc(db, "campaigns", campaignId);
    const journalCol = collection(campaignRef, "journal");
    const q = query(journalCol, orderBy("createdAt", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot: any) => {
      const list: JournalEntry[] = [];
      snapshot.forEach((docSnap: any) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as JournalEntry);
      });
      onUpdate(list);
    }, (err: any) => {
      console.error("Firestore subscribeToJournal error:", err);
    });

    return unsubscribe;
  } else {
    const fetchAndTrigger = () => {
      const currentList: JournalEntry[] = getLocalData(`tt_journal_${campaignId}`, []);
      // Sort by createdAt descending
      currentList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      onUpdate(currentList);
    };

    fetchAndTrigger();
    const entry = { campaignId, callback: onUpdate };
    journalListeners.add(entry);

    const channel = getChannel(campaignId);
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === "JOURNAL_UPDATED") {
        fetchAndTrigger();
      }
    };

    channel?.addEventListener("message", handleMessage);

    return () => {
      journalListeners.delete(entry);
      channel?.removeEventListener("message", handleMessage);
    };
  }
}

/**
 * 11. Create or update a Story Journal entry.
 */
export async function saveJournalEntry(
  campaignId: string,
  entry: Omit<JournalEntry, "id" | "createdAt"> & { id?: string }
): Promise<void> {
  if (isFirebaseConfigured && db) {
    const campaignRef = doc(db, "campaigns", campaignId);
    const journalCol = collection(campaignRef, "journal");
    
    if (entry.id) {
      const entryRef = doc(journalCol, entry.id);
      const existing = await getDoc(entryRef);
      const existingData = existing.exists() ? existing.data() : {};
      
      await setDoc(entryRef, {
        title: entry.title,
        content: entry.content,
        npcNames: entry.npcNames,
        questDetails: entry.questDetails,
        published: entry.published,
        createdAt: existingData?.createdAt || new Date().toISOString(),
      }, { merge: true });
    } else {
      const newId = "journal-" + Math.random().toString(36).substring(2, 9);
      const entryRef = doc(journalCol, newId);
      
      await setDoc(entryRef, {
        title: entry.title,
        content: entry.content,
        npcNames: entry.npcNames,
        questDetails: entry.questDetails,
        published: entry.published,
        createdAt: new Date().toISOString(),
      });
    }
  } else {
    const currentList: JournalEntry[] = getLocalData(`tt_journal_${campaignId}`, []);
    
    if (entry.id) {
      const idx = currentList.findIndex((e) => e.id === entry.id);
      if (idx !== -1) {
        currentList[idx] = {
          ...currentList[idx],
          title: entry.title,
          content: entry.content,
          npcNames: entry.npcNames,
          questDetails: entry.questDetails,
          published: entry.published,
        };
      }
    } else {
      const newEntry: JournalEntry = {
        id: "journal-" + Math.random().toString(36).substring(2, 9),
        title: entry.title,
        content: entry.content,
        npcNames: entry.npcNames,
        questDetails: entry.questDetails,
        published: entry.published,
        createdAt: new Date().toISOString(),
      };
      currentList.push(newEntry);
    }
    
    setLocalData(`tt_journal_${campaignId}`, currentList);
    
    const channel = getChannel(campaignId);
    channel?.postMessage({ type: "JOURNAL_UPDATED" });
    notifyLocalJournal(campaignId);
  }
}

/**
 * 12. Delete a Story Journal entry.
 */
export async function deleteJournalEntry(campaignId: string, entryId: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    const campaignRef = doc(db, "campaigns", campaignId);
    const journalCol = collection(campaignRef, "journal");
    await deleteDoc(doc(journalCol, entryId));
  } else {
    const currentList: JournalEntry[] = getLocalData(`tt_journal_${campaignId}`, []);
    const updated = currentList.filter((e) => e.id !== entryId);
    
    setLocalData(`tt_journal_${campaignId}`, updated);
    
    const channel = getChannel(campaignId);
    channel?.postMessage({ type: "JOURNAL_UPDATED" });
    notifyLocalJournal(campaignId);
  }
}
