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
  addDoc, 
  deleteDoc,
  serverTimestamp 
} from "firebase/firestore";

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

// -------------------------------------------------------------
// LOCAL BACKEND: BroadcastChannel + LocalStorage Fallback Setup
// -------------------------------------------------------------
const CHANNEL_NAME = "tavern_and_table_sync";
let localChannel: BroadcastChannel | null = null;

const CURRENT_CAMPAIGN_ID = "lost-mine"; // TODO: Pull from URL or config

if (typeof window !== "undefined") {
  localChannel = new BroadcastChannel(CHANNEL_NAME);
}

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
    const campaignRef = doc(db, "campaigns", CURRENT_CAMPAIGN_ID);
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
      const currentList: PlayerStatus[] = getLocalData("tt_players", []);
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
    const campaignRef = doc(db, "campaigns", CURRENT_CAMPAIGN_ID);
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
    const campaignRef = doc(db, "campaigns", CURRENT_CAMPAIGN_ID);
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
 * 4. Sync a player's entire profile (used for new characters or level ups).
 */
export async function syncPlayerProfile(player: PlayerStatus): Promise<void> {
  if (isFirebaseConfigured && db) {
    const campaignRef = doc(db, "campaigns", CURRENT_CAMPAIGN_ID);
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
    const currentList: PlayerStatus[] = getLocalData("tt_players", []);
    const exists = currentList.some((p) => p.id === player.id);
    
    let updatedList: PlayerStatus[];
    if (exists) {
      updatedList = currentList.map((p) => (p.id === player.id ? player : p));
    } else {
      updatedList = [...currentList, player];
    }

    setLocalData("tt_players", updatedList);
    
    // Notify other tabs
    localChannel?.postMessage({ type: "PLAYERS_UPDATED" });
    notifyLocalPlayers();
  }
}

/**
 * 5. Update Player's health and core stats.
 */
export async function updatePlayerHp(
  playerId: string,
  currentHp: number,
  maxHp: number,
  additionalFields: Partial<PlayerStatus> = {}
): Promise<void> {
  const status = currentHp === 0 ? "down" : additionalFields.status || "active";
  
  if (isFirebaseConfigured && db) {
    const campaignRef = doc(db, "campaigns", CURRENT_CAMPAIGN_ID);
    const playerRef = doc(campaignRef, "players", playerId);
    
    await setDoc(
      playerRef, 
      { currentHp, maxHp, status, ...additionalFields }, 
      { merge: true }
    );
  } else {
    const currentList: PlayerStatus[] = getLocalData("tt_players", []);
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
 * 6. Remove a player's profile from the campaign (used when character is deleted).
 */
export async function deletePlayerProfile(playerId: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    const campaignRef = doc(db, "campaigns", CURRENT_CAMPAIGN_ID);
    const playerRef = doc(campaignRef, "players", playerId);
    await deleteDoc(playerRef);
  } else {
    const currentList: PlayerStatus[] = getLocalData("tt_players", []);
    const updatedList = currentList.filter((p) => p.id !== playerId);
    setLocalData("tt_players", updatedList);
    
    // Notify other tabs
    localChannel?.postMessage({ type: "PLAYERS_UPDATED" });
    notifyLocalPlayers();
  }
}

/**
 * 7. Push a roll result to the campaign log.
 */
export async function addRollLog(
  playerName: string,
  actionName: string,
  rollNotation: string,
  rollTotal: number,
  type: "attack" | "damage" | "stealth" | "heal"
): Promise<void> {
  if (isFirebaseConfigured && db) {
    const campaignRef = doc(db, "campaigns", CURRENT_CAMPAIGN_ID);
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
 * 8. Send Nudge (request roll) to player.
 */
export async function sendNudge(playerId: string, rollType: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    const campaignRef = doc(db, "campaigns", CURRENT_CAMPAIGN_ID);
    const nudgeRef = doc(campaignRef, "nudges", playerId);
    
    await setDoc(nudgeRef, {
      rollType,
      active: true,
      timestamp: serverTimestamp(),
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
 * 9. Clear Nudge (hide popup once roll is complete).
 */
export async function clearNudge(playerId: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    const campaignRef = doc(db, "campaigns", CURRENT_CAMPAIGN_ID);
    const nudgeRef = doc(campaignRef, "nudges", playerId);
    
    await setDoc(nudgeRef, { active: false }, { merge: true });
  } else {
    const nudges = getLocalData("tt_nudges", {});
    nudges[playerId] = null;
    setLocalData("tt_nudges", nudges);
    
    localChannel?.postMessage({ type: "NUDGE_UPDATED", playerId, rollType: null });
    notifyLocalNudge(playerId, null);
  }
}
