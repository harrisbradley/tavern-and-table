# Tavern and Table

D&D companion app for dungeon masters and players. Features 3D dice rolling, character tracking, initiative/passive perception management, and shared tables. Early scaffold stage.

## Stack
- Next.js 16 (App Router) — see Next.js warning below
- React 19
- Firebase (Auth + Firestore)
- @3d-dice/dice-box for 3D dice rendering
- Tailwind CSS 4
- TypeScript
- Lucide React for icons

## Dev Commands
```
npm run dev      # local dev server
npm run build    # production build
npm start        # production server
npm run lint     # ESLint
```

## Key Files
- `src/app/` — App Router pages
- `src/app/dm/` — DM Command Center
- `src/app/player/` — Player Dashboard
- `src/components/` — shared UI components
- `src/lib/` — utilities and Firebase config
- `src/types/` — TypeScript type definitions
- `implementation_plan.md` — current feature roadmap

## Current Focus (from implementation_plan.md)
DM Command Center — Passive Perception & Initiative Tracker:
- Add `passivePerception` to PlayerStatus interface in syncEngine.ts
- Update PlayerDashboard to show PP stat (grid-cols-2 → grid-cols-3)
- Initiative tracker with combatant state, turn controls, and monster initiative rolling

## IMPORTANT — Next.js Version Warning
This project uses Next.js 16, which has breaking changes from prior versions. Read `AGENTS.md` before writing any Next.js-specific code. Check `node_modules/next/dist/docs/` for current API docs.

## Notes
- Package name is still `dnd-companion-app-scaffold` — update when the project matures
