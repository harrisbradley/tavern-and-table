"use client";

import { db, isFirebaseConfigured } from "./firebase";

// Import firestore functions if firebase is active
let firestore: any = null;
if (isFirebaseConfigured) {
  firestore = require("firebase/firestore");
}

export interface PlayerStatus {
  id: string;
  name: string;
  className: string;
  maxHp: number;
  currentHp: number;
  ac: number;
  initiative: number;
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

// -------------------------------------------------------------
// LOCAL BACKEND: BroadcastChannel + LocalStorage Fallback Setup
// -------------------------------------------------------------
const CHANNEL_NAME = "tavern_and_table_sync";
let localChannel: BroadcastChannel | null = null;

if (typeof window !== "undefined") {
  localChannel = new BroadcastChannel(CHANNEL_NAME);
}

// Initial Mock Seed Data
const DEFAULT_PLAYERS: PlayerStatus[] = [
  {
    id: "valen",
    name: "Valen Lightshield",
    className: "Level 1 Paladin",
    maxHp: 28,
    currentHp: 22,
    ac: 16,
    initiative: 2,
    status: "active",
  },
  {
    id: "lyra",
    name: "Lyra Whisperwind",
    className: "Level 1 Rogue",
    maxHp: 24,
    currentHp: 18,
    ac: 14,
    initiative: 4,
    status: "hidden",
  },
  {
    id: "elora",
    name: "Elora Stormbringer",
    className: "Level 1 Wizard",
    maxHp: 18,
    currentHp: 7,
    ac: 12,
    initiative: 2,
    status: "active",
  },
];

const DEFAULT_ROLLS: RollLog[] = [
  {
    id: "log-seed-1",
    playerName: "Lyra Whisperwind",
    actionName: "Stealth Check",
    rollNotation: "1d20+4",
    rollTotal: 21,
    timestamp: new Date(Date.now() - 300000).toISOString(),
    type: "stealth",
  }
];

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

// Local fallback listeners to update the current tab synchronously since BroadcastChannel doesn't echo to sender
const playerListeners = new Set<(players: PlayerStatus[]) => void>();
const rollListeners = new Set<(logs: RollLog[]) => void>();
const nudgeListeners = new Set<{ playerId: string; callback: (rollType: string | null) => void }>();

function notifyLocalPlayers() {
  const currentList = getLocalData("tt_players", DEFAULT_PLAYERS);
  playerListeners.forEach((listener) => {
    try {
      listener(currentList);
    } catch (err) {
      console.error("Error in player listener:", err);
    }
  });
}

function notifyLocalRolls() {
  const currentLogs = getLocalData("tt_rolls", DEFAULT_ROLLS);
  rollListeners.forEach((listener) => {
    try {
      listener(currentLogs);
    } catch (err) {
      console.error("Error in roll listener:", err);
    }
  });
}

function notifyLocalNudge(playerId: string, rollType: string | null) {
  nudgeListeners.forEach((entry) => {
    if (entry.playerId === playerId) {
      try {
        entry.callback(rollType);
      } catch (err) {
        console.error("Error in nudge listener:", err);
      }
    }
  });
}

// -------------------------------------------------------------
// UNIFIED SYNC ENGINE API
// -------------------------------------------------------------

/**
 * 1. Subscribe to Player statuses in real-time.
 */
export function subscribeToPlayers(onUpdate: (players: PlayerStatus[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    // Firebase Firestore Listener
    const campaignRef = firestore.doc(db, "campaigns", "lost-mine");
    const playersCol = firestore.collection(campaignRef, "players");
    
    const unsubscribe = firestore.onSnapshot(playersCol, (snapshot: any) => {
      const playersList: PlayerStatus[] = [];
      snapshot.forEach((docSnap: any) => {
        playersList.push({ id: docSnap.id, ...docSnap.data() } as PlayerStatus);
      });
      
      // If Firestore is empty, seed it
      if (playersList.length === 0) {
        DEFAULT_PLAYERS.forEach(async (p) => {
          await firestore.setDoc(firestore.doc(playersCol, p.id), {
            name: p.name,
            className: p.className,
            maxHp: p.maxHp,
            currentHp: p.currentHp,
            ac: p.ac,
            initiative: p.initiative,
            status: p.status,
          });
        });
        onUpdate(DEFAULT_PLAYERS);
      } else {
        onUpdate(playersList);
      }
    });

    return unsubscribe;
  } else {
    // Local BroadcastChannel Listener
    const fetchAndTrigger = () => {
      const currentList = getLocalData("tt_players", DEFAULT_PLAYERS);
      onUpdate(currentList);
    };

    // Trigger initial values
    fetchAndTrigger();
    playerListeners.add(onUpdate);

    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === "PLAYERS_UPDATED") {
        fetchAndTrigger();
      }
    };

    localChannel?.addEventListener("message", handleMessage);

    return () => {
      playerListeners.delete(onUpdate);
      localChannel?.removeEventListener("message", handleMessage);
    };
  }
}

/**
 * 2. Subscribe to Campaign Roll history log in real-time.
 */
export function subscribeToRollLogs(onUpdate: (logs: RollLog[]) => void): () => void {
  if (isFirebaseConfigured && db) {
    const campaignRef = firestore.doc(db, "campaigns", "lost-mine");
    const rollsCol = firestore.collection(campaignRef, "rolls");
    const q = firestore.query(rollsCol, firestore.orderBy("timestamp", "desc"), firestore.limit(30));

    const unsubscribe = firestore.onSnapshot(q, (snapshot: any) => {
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
    });

    return unsubscribe;
  } else {
    const fetchAndTrigger = () => {
      const currentLogs = getLocalData("tt_rolls", DEFAULT_ROLLS);
      onUpdate(currentLogs);
    };

    fetchAndTrigger();
    rollListeners.add(onUpdate);

    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === "ROLLS_UPDATED") {
        fetchAndTrigger();
      }
    };

    localChannel?.addEventListener("message", handleMessage);

    return () => {
      rollListeners.delete(onUpdate);
      localChannel?.removeEventListener("message", handleMessage);
    };
  }
}

/**
 * 3. Subscribe to active Nudges/Roll requests for a specific player.
 */
export function subscribeToNudges(playerId: string, onNudge: (rollType: string | null) => void): () => void {
  if (isFirebaseConfigured && db) {
    const campaignRef = firestore.doc(db, "campaigns", "lost-mine");
    const nudgeRef = firestore.doc(campaignRef, "nudges", playerId);

    const unsubscribe = firestore.onSnapshot(nudgeRef, (docSnap: any) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        onNudge(data.active ? data.rollType : null);
      } else {
        onNudge(null);
      }
    });

    return unsubscribe;
  } else {
    const fetchAndTrigger = () => {
      const nudges = getLocalData("tt_nudges", {});
      onNudge(nudges[playerId] || null);
    };

    fetchAndTrigger();
    const entry = { playerId, callback: onNudge };
    nudgeListeners.add(entry);

    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === "NUDGE_UPDATED" && e.data?.playerId === playerId) {
        onNudge(e.data?.rollType || null);
      }
    };

    localChannel?.addEventListener("message", handleMessage);

    return () => {
      nudgeListeners.delete(entry);
      localChannel?.removeEventListener("message", handleMessage);
    };
  }
}

/**
 * 4. Update Player's health and core stats.
 */
export async function updatePlayerHp(
  playerId: string,
  currentHp: number,
  maxHp: number,
  additionalFields: Partial<PlayerStatus> = {}
): Promise<void> {
  const status = currentHp === 0 ? "down" : additionalFields.status || "active";
  
  if (isFirebaseConfigured && db) {
    const campaignRef = firestore.doc(db, "campaigns", "lost-mine");
    const playerRef = firestore.doc(campaignRef, "players", playerId);
    
    await firestore.setDoc(
      playerRef, 
      { currentHp, maxHp, status, ...additionalFields }, 
      { merge: true }
    );
  } else {
    const currentList: PlayerStatus[] = getLocalData("tt_players", DEFAULT_PLAYERS);
    const updatedList = currentList.map((p) => {
      if (p.id === playerId) {
        return { ...p, currentHp, maxHp, status, ...additionalFields };
      }
      return p;
    });

    setLocalData("tt_players", updatedList);
    
    // Notify other tabs
    localChannel?.postMessage({ type: "PLAYERS_UPDATED" });
    notifyLocalPlayers();
  }
}

/**
 * 5. Push a roll result to the campaign log.
 */
export async function addRollLog(
  playerName: string,
  actionName: string,
  rollNotation: string,
  rollTotal: number,
  type: "attack" | "damage" | "stealth" | "heal"
): Promise<void> {
  if (isFirebaseConfigured && db) {
    const campaignRef = firestore.doc(db, "campaigns", "lost-mine");
    const rollsCol = firestore.collection(campaignRef, "rolls");
    
    await firestore.addDoc(rollsCol, {
      playerName,
      actionName,
      rollNotation,
      rollTotal,
      timestamp: firestore.serverTimestamp(),
      type,
    });
  } else {
    const currentLogs: RollLog[] = getLocalData("tt_rolls", DEFAULT_ROLLS);
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
    setLocalData("tt_rolls", updatedLogs);
    
    localChannel?.postMessage({ type: "ROLLS_UPDATED" });
    notifyLocalRolls();
  }
}

/**
 * 6. Send Nudge (request roll) to player.
 */
export async function sendNudge(playerId: string, rollType: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    const campaignRef = firestore.doc(db, "campaigns", "lost-mine");
    const nudgeRef = firestore.doc(campaignRef, "nudges", playerId);
    
    await firestore.setDoc(nudgeRef, {
      rollType,
      active: true,
      timestamp: firestore.serverTimestamp(),
    });
  } else {
    const nudges = getLocalData("tt_nudges", {});
    nudges[playerId] = rollType;
    setLocalData("tt_nudges", nudges);
    
    localChannel?.postMessage({ type: "NUDGE_UPDATED", playerId, rollType });
    notifyLocalNudge(playerId, rollType);
  }
}

/**
 * 7. Clear Nudge (hide popup once roll is complete).
 */
export async function clearNudge(playerId: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    const campaignRef = firestore.doc(db, "campaigns", "lost-mine");
    const nudgeRef = firestore.doc(campaignRef, "nudges", playerId);
    
    await firestore.setDoc(nudgeRef, { active: false }, { merge: true });
  } else {
    const nudges = getLocalData("tt_nudges", {});
    nudges[playerId] = null;
    setLocalData("tt_nudges", nudges);
    
    localChannel?.postMessage({ type: "NUDGE_UPDATED", playerId, rollType: null });
    notifyLocalNudge(playerId, null);
  }
}
