### Cloud9 Draft — Competitive Drafting Simulator

Cloud9 Draft is a Next.js app for simulating competitive League of Legends drafts with a smooth UI, multi‑game series flow, fearless bans tracking, and a built‑in Library to save, organize, and review drafts.

This README focuses on a clear, comprehensive feature list first, followed by quick setup and technical notes.

---

### Key Features

- Team selection and series setup
  - Pick Blue and Red teams from a curated teams list with players and branding.
  - Choose match format: `BO1`, `BO3`, or `BO5`.
  - Start the drafting phase from the Home screen.

- Authentic drafting workflow
  - Standard competitive snake order with two ban phases and two pick phases (5 bans + 5 picks per team).
  - Live status indicator and turn highlighting per side and slot.
  - Availability rules: once picked or banned, champions are unavailable.

- Fearless Bans support (multi‑game series)
  - Automatically aggregates previously picked champions across the series and displays them as restricted in subsequent games (hidden in BO1).
  - Visual “Fearless Bans” strip with champion tooltips.

- Alternatives (optional champions)
  - Per‑game, per‑team “Alternatives” pools to note backup champion options.
  - Add during live draft or later in review.
  - Simple chips UI with Add/Remove; ignores draft availability/bans on purpose.
  - Prevents duplicates and prevents adding a team’s own main picks for the same game.
  - UX cap of 5 alternatives per team per game.

- Save drafts as Series
  - Save at any time; final game can be saved even if you don’t step through `completeGame`.
  - Each saved series stores: format, teams, timestamp, games with picks/bans, winners, and Alternatives.

- Draft Library (organize & find)
  - Card grid of saved drafts: each shows only “Blue vs Red” (no scores in list view), format badge, and game count.
  - Name drafts: inline rename any series; custom name is searchable.
  - Search filter: matches series name and team names/short names.
  - Sorting: Newest, Oldest, Name (A–Z), Name (Z–A).
  - Folders: create, rename, delete. Move series in/out of folders. “Unfiled” view included.
  - Delete series with confirmation.

- Review saved series
  - Series header shows teams and result summary context.
  - Per‑game view with bans and picks by side.
  - Edit Alternatives inline: search, add, remove chips (still capped at 5 and de‑duped; cannot add a champ that was a main pick for that side in that game).
  - Changes persist instantly to storage.

- Smooth, modern UI/UX
  - Framer Motion animations, subtle glows, and readable typography.
  - Responsive layout with a focused drafting board and optional AI UI placeholders.

---

### Quick Start

Prerequisites: Node 18+ recommended.

Install dependencies and run dev server:

```bash
npm install
npm run dev
```

Open http://localhost:3000 and start by selecting teams and a match format.

Production build:

```bash
npm run build
npm start
```

---

### How It Works (High‑level)

- Draft engine
  - `lib/draft/types.ts` defines the draft order and state types.
  - `lib/draft/draft-context.tsx` manages live draft state and turn progression.
  - `components/features/ChampionGrid.tsx` lists champions, enforces availability during draft, and supports an Alternatives add mode.

- Series engine
  - `lib/draft/series-context.tsx` manages series format, current game index, fearless bans, and per‑game Alternatives while drafting.
  - Games are appended via `completeGame(...)` with the current `DraftState`; pending Alternatives are stored.

- Persistence
  - `lib/persistence/storage.ts` persists series and folders in `localStorage`.
  - Includes a mock series for first‑run demo if storage is empty.

- Pages
  - `app/page.tsx`: Home (team/format selection → start draft).
  - `app/draft/page.tsx`: Draft board, bans/picks, Alternatives add panels, fearless bans strip.
  - `app/library/page.tsx`: Saved drafts grid with search, sort, folders, rename, move, delete.
  - `app/review/[id]/page.tsx`: Per‑series review with per‑game Alternatives editing.

---

### Data Model Notes

- `SavedSeries`:
  - `games[]` items include `draftState`, `winner`, and optional `alternatives?: { blue: Champion[]; red: Champion[] }`.
  - Alternatives are per game, per team; capped at 5 for UX; cannot duplicate or overlap with same‑team main picks.

- Backward compatibility
  - Older saved items without `alternatives` remain valid; UI handles missing fields gracefully.

---

### Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Framer Motion for animations
- Tailwind (v4 config) styles
- lucide‑react icons

---

### Limitations & Notes

- Storage is browser `localStorage` — data is device‑local and cleared if you wipe site data.
- Fearless bans apply for multi‑game formats; strip is hidden in BO1.
- Alternatives intentionally do not respect availability rules (can include any champion) but are de‑duped and limited to 5.
- Library list view intentionally hides scores and shows only “Team vs Team”, as requested.

---

### Roadmap Ideas

- Export/import drafts (JSON) for sharing across devices.
- Role‑aware Alternatives (optional per‑lane suggestion buckets).
- Keyboard shortcuts for faster drafting.
- Better team assets and branding.
- Server‑side persistence or user accounts.

---

### Scripts

```bash
npm run dev    # start development server
npm run build  # production build
npm start      # run production build
npm run lint   # lint the project
```

---

### License

Internal prototype for hackathon/demo use. Replace with your chosen license if open‑sourcing.

### Startup Commands

```bash
 source /Users/yassersalem/skyisthelimithackathon/venv/bin/activate
```

**1. Frontend Application:**
```bash
npm run dev
```

**2. Drafting Agent Backend:**
```bash
source venv/bin/activate
python TheDraftingAgent/server.py
```

**3. Draft Predictor Backend:**
```bash
source venv/bin/activate
python DraftPredictor/server.py





```
