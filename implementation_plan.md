# DM Command Center - Passive Perception & Initiative Tracker Implementation Plan

This plan details the changes required to finish GitHub Issue #4 (DM Command Center) by adding **Passive Perception** stat tracking to player dashboards/cards and implementing a real-time **Initiative Tracker (Combat Sequencer)** on the Dungeon Master dashboard.

## Proposed Changes

We will modify three core files in the codebase to implement these updates.

### 1. Database Sync Schema
We need to add `passivePerception` to the player data model so it can be synchronized between the player and DM screens.

#### [MODIFY] [syncEngine.ts](file:///c:/Users/hopei/Documents/GitHub/tavern-and-table/src/lib/syncEngine.ts)
* Update the `PlayerStatus` interface to include `passivePerception: number`.
* Update the `DEFAULT_PLAYERS` array with mock values:
  * Valen Lightshield: AC 16, Initiative +2, Passive Perception 13
  * Lyra Whisperwind: AC 14, Initiative +4, Passive Perception 15
  * Elora Stormbringer: AC 12, Initiative +2, Passive Perception 11
* Update the Firestore initialization/seeding block inside `subscribeToPlayers` to store the `passivePerception` field in Firestore when creating default documents.

---

### 2. Player Dashboard UI
We will update the player combat dashboard to display their own Passive Perception stat, matching the DM's view.

#### [MODIFY] [PlayerDashboard.tsx](file:///c:/Users/hopei/Documents/GitHub/tavern-and-table/src/components/PlayerDashboard.tsx)
* Add a local state or constant for `passivePerception` (default: 13) matching the database.
* Update the bottom stats grid layout:
  * Change `grid-cols-2` to `grid-cols-3`.
  * Add a third card displaying **Passive Perception** (with a magnifying glass or eye icon, e.g., using Lucide's `Eye` or `Search` icon).

---

### 3. DM Command Center Dashboard
We will update the DM screen to display the players' Passive Perception and implement the Initiative Tracker widget.

#### [MODIFY] [page.tsx](file:///c:/Users/hopei/Documents/GitHub/tavern-and-table/src/app/dm/page.tsx)
* **Player Cards Update:**
  * Update the grid block inside player cards to display AC, Initiative, and **Passive Perception** side-by-side (adjusting the columns or text layout to fit neatly).
* **Initiative Tracker State & Logic:**
  * Define a `Combatant` interface:
    ```typescript
    interface Combatant {
      id: string;
      name: string;
      initiative: number;
      maxHp?: number;
      currentHp?: number;
      isMonster: boolean;
    }
    ```
  * Define state hooks:
    * `combatants`: Array of `Combatant` currently in the tracker.
    * `activeTurnIndex`: Number (or null) representing the index of the combatant whose turn it is.
    * `combatActive`: Boolean to track if combat has started.
  * Implement utility functions:
    * `addToCombat(name, initiative, isMonster, hp)`: Add a player or monster.
    * `removeFromCombat(id)`: Remove a combatant.
    * `startCombat()`: Sort the combatants by initiative descending, set `activeTurnIndex` to 0, and start combat.
    * `nextTurn()`: Advance `activeTurnIndex` (looping back to 0 if it exceeds the length).
    * `prevTurn()`: Go back one turn (looping to the end if index is < 0).
    * `endCombat()`: Clear the active state.
    * `rollMonsterInitiative(bonus)`: Quick d20 + bonus generator for fast monster placement.
* **Initiative Tracker UI Design:**
  * Build a clean card widget alongside the Live Campaign Log or under the Party Grid.
  * Use a premium dark-fantasy glassmorphism design:
    * Glowing gold border/background for the active turn's combatant.
    * Green/Red badge to quickly distinguish between Player and Monster.
    * "Add Custom Combatant" mini-form directly inside the widget (Name, Initiative Roll, HP).
    * Up/Down buttons next to combatants to manually shift their turn order (fine-tuning the initiative sequence).
    * Turn controls: **Start Combat**, **Next Turn**, **Prev Turn**, and **Reset** buttons with clear icons.

---

## Verification Plan

### Manual Verification
1. **Build Verification:** Run `npm run build` locally to ensure there are no TypeScript or compilation errors.
2. **Stat Synchronization:**
   * Open `/player` and `/dm` pages side-by-side.
   * Verify that the player dashboard shows a Passive Perception of 13.
   * Verify that the DM dashboard displays Passive Perception values for all three default players (Valen: 13, Lyra: 15, Elora: 11).
3. **Initiative Tracker Testing:**
   * Add a few players to the Initiative tracker.
   * Add a custom monster (e.g., "Goblin 1", Initiative: 14, HP: 12) using the form.
   * Click **Start Combat** and verify the list sorts descending by initiative.
   * Click **Next Turn** and verify the active turn indicator advances and highlights the active combatant.
   * Use the Up/Down buttons to manually change the sequence of a combatant and ensure the active turn indicator adjusts correctly.
   * Click **Reset** and confirm the list clears.