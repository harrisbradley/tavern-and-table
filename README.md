# 🎲 Tavern and Table

### *Tabletop Companion and Real-time Campaign Engine*

**Tavern and Table** is a premium, real-time tabletop roleplaying game (TTRPG) companion application designed to streamline session logistics for Dungeon Masters and players. With an ethereal dark-fantasy design, it replaces spreadsheets with an interactive command center, keeping the focus on storytelling and role play.

---

## ⚔️ Key Features

### 🏰 Dungeon Master Command Center
- **Party Vital Stats Grid**: View all player vital stats at a glance, including Armor Class (AC), Initiative Modifier, Passive Perception, and Current/Max HP.
- **Real-time Combat Initiative Tracker**: 
  - Add players and custom monsters with custom initiative scores.
  - Automatically sorts combatants in initiative order.
  - Interactive turn tracker highlighting the active combatant with a glowing gold aura.
  - Quick-edit controls to adjust turn order, remove combatants, or track monster HP.
- **Live Campaign Log**: View real-time rolls, status changes, and combat updates streamed instantly from the players' dashboards.

### 🛡️ Player Combat Dashboard
- **Character Stat Sync**: Interactive cards to manage AC, Initiative, and Passive Perception.
- **HP & Status Tracker**: Track current health, temporary HP, and toggle common status conditions (e.g., *Blinded*, *Prone*, *Poisoned*) which sync immediately to the DM's command center.
- **Resource Counters**: Easily manage spell slots, class resources (like Ki points or Sorcery points), and hit dice.
- **Interactive Dice Roller**: Roll standard TTRPG dice (d4, d6, d8, d10, d12, d20, d100) with modifiers and push results instantly to the campaign log.

### ⚡ Real-time Sync Engine
- Powered by Firebase Firestore, player updates (HP changes, rolls, status effects) are synced instantly with no manual refresh required.
- Robust local-storage fallback to keep playing offline if connection is lost.

---

## 🎨 Immersive Dark-Fantasy Design
**Tavern and Table** uses a curated visual theme matching the atmospheric setting of a physical gaming table:
- **Ethereal Glassmorphism**: Semi-transparent frosted cards overlaying dark, textured backgrounds.
- **Ambient Glows**: Subtle gold, red, and green highlights representing active turns, critical rolls, and danger states.
- **Responsive Layout**: Designed to run cleanly on tablet screens next to dice trays, laptops behind DM screens, or smartphones.

---

## 🛠️ Technology Stack
- **Framework**: Next.js 15 (React 19, App Router)
- **Language**: TypeScript
- **Sync/Database**: Firebase Firestore (Real-time DB)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

---

## 🚀 Getting Started

### Prerequisites
You will need a [Firebase](https://firebase.google.com/) project with:
- **Firestore** enabled.

### 1. Clone the Repository
```bash
git clone https://github.com/harrisbradley/tavern-and-table.git
cd tavern-and-table
```

### 2. Configure Environment
Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```
Fill in your Firebase project configuration keys:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application:
- DM screen is located at `/dm`
- Player dashboard is located at `/player`

---

## 📜 License
Built for the tabletop community. Roll with advantage!
