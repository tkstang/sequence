# Sequence Web App — Modernization & Rewrite Plan

_Last updated: 2025-09-21 (America/Chicago)_

---

## 0) Executive Summary

You have a solid prototype:

- **Framework:** Next.js `9.3.6` (Pages Router) with a custom `_document` for styled-components SSR.
- **Runtime:** Node `v14` (`.nvmrc`).
- **Styling:** `styled-components`.
- **Realtime/Data:** Firestore (client SDK v7) + `firebase-admin` v8 in API routes.
- **Game:** Board rendering + snapshot subscription + early rules utilities (`utils/game.js`) including:
  - board map and helpers (`mapBoardDataToArray`, sequence checks, protection logic),
  - “new game” creation,
  - posting a move to `/api/game/board` (transaction not implemented; `nextPlayer` temporarily hardcoded to `1`).

### What’s good
- Board model & positioning logic are on the right track.
- Basic client/server split exists (Next API routes using Admin SDK).
- Firestore + `onSnapshot` is a reasonable realtime base.

### Biggest gaps
- **Game engine completeness:** deck(s), hands, discards, one‑eyed/two‑eyed Jacks, dead cards, turn/order, win conditions, multi‑sequence rules, concurrency and validation on the server.
- **Auth & lobbies:** player identity, joining, team assignment, presence.
- **Server authority:** moves aren’t validated in a transaction—client could cheat.
- **Tech stack age:** Node 14, Next 9, Firebase v7, styled‑components.
- **DX/testing:** no TypeScript, minimal tests/tooling.

### Recommended direction (high‑level)
1. **Runtime:** move to Node **22 (Active LTS)**.
2. **Framework:** upgrade to **Next.js 15.x**; migrate to App Router (`/app`) with client components for game UI; keep Pages during migration if useful.
3. **Firebase:** adopt modular **JS SDK v12** (client) and **Admin SDK v13+** (server).
4. **TypeScript:** full rewrite (strict mode) with clear domain types.
5. **Styling:** replace `styled-components` with **Panda CSS** (tokens + recipes).
6. **Authoritative server moves:** validate turns server‑side with Firestore **transactions** (via Route Handlers/Server Actions).
7. **Security rules:** least privilege; never trust the client.
8. **Testing & CI:** Vitest + Playwright + GitHub Actions.

---

## 1) Current Snapshot (from repo overview)

- **Node**: `.nvmrc` → `v14`.
- **Next**: `9.3.6` (Pages Router). `_app.js`, `_document.js` present.
- **Styling**: `styled-components` components + SSR setup.
- **Firebase (client)**: `firebase@^7` namespaced API in `db/firebase-client.js`.
- **Firebase (server)**: `firebase-admin@^8` in API routes.
- **Firestore data**:
  - `games/{gameName}` doc,
  - `board.<position>` map fields (`{ team: TeamId|null, isProtected: boolean }`),
  - `teams` object with `numberPlayers`, `numberTeams`, and temp player→team map.
- **Pages**:
  - `/` (start),
  - `/game/new` (creates game via `/api/game/new`),
  - `/game/[name]` (subscribes to game doc, shows `Board`, handles clicks).
- **Game utils** (`utils/game.js`):
  - Board definitions & mapping helpers,
  - `generateNewGame`, `checkPlayEligibility`, `checkForSequence`, `checkSequenceProtection`, etc.
- **Known TODOs/partials**:
  - `nextPlayer` hardcoded to `1`,
  - no deck/hands/discard,
  - no one‑eyed/two‑eyed Jack rules,
  - no transaction logic / anti‑cheat,
  - no auth/join/lobby flow.

---

## 2) Target Architecture & Tech Choices

### 2.1 Framework & runtime
- **Node.js:** `22.x` Active LTS (update `.nvmrc` and `engines.node`).
- **Next.js:** `^15.5.x`. Start transitioning new screens to **App Router** (`/app`). Keep Pages for legacy routes during migration if helpful.

### 2.2 Firebase
- **Client SDK:** `firebase@^12` modular API (`initializeApp`, `getFirestore`, `onSnapshot`, etc.).
- **Admin SDK:** `firebase-admin@^13` (Node 18+).
- **Services:** Firestore (authoritative state), optional RTDB for presence; Auth (start with anonymous, allow upgrade).

### 2.3 Styling
- **Panda CSS**:
  - Define **design tokens** (colors, radii, fontSizes, space).
  - Use **recipes** and `styled-system/jsx` for components (Board cell, chip, button).
  - Remove styled‑components SSR; no `_document` customization needed for styles.

### 2.4 State & data flow
- **Authoritative server writes**:
  - All **moves** executed in server code with **Firestore transactions**:
    1) Load current game doc,
    2) Validate turn & card,
    3) Apply board update, handle Jacks (wild/remove), set protection, advance turn, append `moves` log, update `sequences`/scores,
    4) Commit.
- **Client**:
  - Subscribe to game doc via `onSnapshot`,
  - Send **intents** (e.g., `POST /api/games/{id}/moves` or Server Action).

### 2.5 Data model (Firestore)
```js
games/{gameId} {
  createdAt, createdBy,
  settings: {
    numTeams, playersPerTeam, sequencesToWin, handSize, allowDeadCards
  },
  status: "lobby" | "active" | "finished",
  board: { [PositionId]: { team: TeamId | null, isProtected: boolean } },
  deck: { remainingCount },      // deck lives server-side; not exposed as list
  discardCount: number,
  turn: { playerId, teamId, index }, // active turn pointers
  teams: { numberTeams, team1Score, team2Score, ... },
  players: { [uid]: { displayName, teamId, seatIndex, handCount } },
  winner: TeamId | null
}

games/{gameId}/hands/{uid} { cards: CardId[] }                 // per-user materialized hand
games/{gameId}/moves/{moveId} { by, at, card, action, diff }   // audit/log
```

> Keep **deck/draw** server‑only; clients only see their **own hand** to reduce cheating.

### 2.6 Domain types (TypeScript)
```ts
type Suit = 'C' | 'D' | 'H' | 'S';
type Rank = 'A' | 'K' | 'Q' | 'J' | '10' | '9' | '8' | '7' | '6' | '5' | '4' | '3' | '2';
type CardId = `${Rank}${Suit}`; // e.g., "QS"
type PositionId = `1${Rank}${Suit}` | `2${Rank}${Suit}` | '1WW' | '2WW';
type TeamId = `team${1|2|3}`;
type PlayerId = string;

interface BoardCell { team: TeamId | null; isProtected: boolean }
type Board = Record<PositionId, BoardCell>;

interface GameSettings {
  numTeams: number;
  playersPerTeam: number;
  sequencesToWin: number;   // e.g., 2 in 2-team games
  handSize: number;         // commonly 7 for ≤3 players/team
  allowDeadCards: boolean;
}
```

---

## 3) Game Engine Scope

- **Deck building:** Standard Sequence uses **two 52‑card decks** (no jokers).
- **Jacks:** two‑eyed Jacks = wild/place anywhere; one‑eyed Jacks = remove opponent chip (not protected).
- **Dealing:** on game start; hand size depends on players/teams.
- **Turn flow:** draw → play a card (place/remove; enforce eligibility) → check sequence/protection → discard → advance turn.
- **Dead card:** if no available match on board, allow discard (configurable).
- **Win condition:** first team to `sequencesToWin` (commonly 2 for 2‑team).
- **Board mapping:** reuse your `boardMap`; keep it typed.
- **Validation:** enforce on server (card exists in hand, move legal, Jacks rules, protections, sequence detection).
- **Concurrency:** execute moves inside a Firestore **transaction**; reject stale client state.

> Keep pure rule helpers (eligibility/sequence/protection) shared between server & tests. Final authority is server‑side.

---

## 4) Migration Plan (Phased)

### Phase 0 — Repo hygiene (1–2 hrs)
- Archive current branch (`legacy/js-next9`).
- Create `rewrite/ts-next15` as the main working branch.
- Add **EditorConfig**, update **Prettier**, **ESLint**.

### Phase 1 — Toolchain upgrades (half‑day)
- **Node**: update `.nvmrc` → `v22`, `engines.node` in `package.json` to `>=22`.
- **Next**: bump to `^15.5.x`. Install `react`/`react-dom` to matching majors.
- **TS**: add `typescript@^5`, `@types/node`, `@types/react`.
- **ESLint**: `eslint@^9`, `@typescript-eslint/*`, `eslint-config-next`.
- **Test**: `vitest`, `@vitest/coverage-v8`, `@testing-library/react`, `playwright`.
- **CI**: GitHub Action for lint + typecheck + unit tests.

### Phase 2 — Firebase upgrade (half‑day)
- **Client**: `firebase@^12` (modular). Replace namespaced imports.
- **Server**: `firebase-admin@^13`.
- **Env**:
  - Client keys as `NEXT_PUBLIC_FIREBASE_*`.
  - Admin creds via service account or workload identity (avoid local JSON in repo).

**Before (client v7):**
```js
import firebase from 'firebase/app';
import 'firebase/firestore';
const app = !firebase.apps.length ? firebase.initializeApp(config) : firebase.app();
export default app.firestore();
```

**After (client v12):**
```ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const app = getApps().length ? getApp() : initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID!,
});

export const db = getFirestore(app);
```

**Server (Admin v13) route handler:**
```ts
// app/api/games/[id]/moves/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';
import { initAdminApp } from '@/lib/firebase-admin'; // singleton init

export async function POST(req: NextRequest, { params }: { params: { id: string }}) {
  await initAdminApp();
  const db = getFirestore();
  const gameRef = db.collection('games').doc(params.id);
  const intent = await req.json(); // { playerId, card, action, position }

  await db.runTransaction(async (tx) => {
    const snap = await tx.get(gameRef);
    const game = snap.data() as GameDoc;

    validateTurn(game, intent);                // throws on invalid
    const diff = computeDiff(game, intent);    // pure

    tx.update(gameRef, diff.update);
    tx.set(gameRef.collection('moves').doc(), makeMoveLog(intent));
  });

  return NextResponse.json({ ok: true });
}
```

### Phase 3 — App Router + TS skeleton (1 day)
- Create `/app/layout.tsx`, `/app/page.tsx` with providers.
- Migrate `/game/new` → `/app/game/new/page.tsx`.
- Keep `/pages` during transition or fully migrate now.
- Mark interactive components with `"use client"`; split server/client code.

### Phase 4 — Panda CSS adoption (0.5–1 day)
- `npx panda init -p` → generate config & tokens.
- Replace `styled-components`:
  - Convert `Board` styles into **recipes** (board grid, cell, chip).
  - Replace Button via `styled-system/jsx` recipe.
- Remove `_document` SSR for styled‑components.

**Example recipe (chip):**
```ts
// pseudo Panda recipe (cva-like)
export const chip = cva({
  base: { borderRadius: 'full', transition: 'common', boxShadow: 'md' },
  variants: {
    team: { team1: { bg: 'blue.600' }, team2: { bg: 'green.600' } },
    protected: { true: { outline: '2px solid token(colors.yellow.500)' } },
  },
});
```

### Phase 5 — TypeScript rewrite of game core (1–2 days)
- Port `utils/game.js` → `utils/game.ts` with strict types (see §2.6).
- Add **unit tests** for:
  - eligibility, Jacks logic, sequence detection, protection marking.
- Extract a pure `computeNextState(prev, intent): diff` engine for server use.

### Phase 6 — Server‑authoritative moves (1 day)
- Implement `POST /api/games/{id}/moves` (or Server Action) calling a transaction:
  - Load doc → validate → apply diff → record move.
- Update client to send **intents** only (e.g., `{ card, position, kind: 'place'|'remove' }`).

### Phase 7 — Auth, lobby & seats (0.5–1 day)
- Anonymous Auth + username in profile; allow upgrade path.
- Lobby flow:
  - Create game → invite link → join → choose team/seat → host starts.
- Server guards: prevent overfilled teams; lock seats on start.

### Phase 8 — Deck/hand materialization (1 day)
- Server stores deck state & draws into per‑user `hands/{uid}` docs.
- Clients subscribe only to their hand (rules: owner readable).
- Discard handled server‑side after successful move.

### Phase 9 — Rules & settings (0.5 day)
- `sequencesToWin`, `handSize`, dead‑card allowance, team count.
- Enforce corners as wilds; refine protection rules.

### Phase 10 — UX polish & accessibility (0.5 day)
- Keyboard interaction for cards/cells.
- Loading/skeleton states.
- Mobile layout (board pan/zoom or responsive sizing).
- Confetti/toasts on sequence/win.

### Phase 11 — Testing & CI (ongoing)
- **Vitest** for pure logic (engine).
- **Playwright** for e2e (2 players in 2 tabs).
- CI: typecheck, lint, unit, e2e (smoke).

### Phase 12 — Deploy
- Vercel for app; Firebase project for Firestore/Auth.
- Secrets via Vercel env; Admin creds via workload identity or encrypted key.
- Set Firestore **rules** for game & hands.

---

## 5) Concrete To‑Dos (checklist)

### Upgrade & setup
- [ ] Bump Node to `22.x`; update `.nvmrc`, `engines.node`.
- [ ] Upgrade Next to `^15.5.x` (+ React).
- [ ] Add `typescript`, `@types/*`, strict `tsconfig.json`.
- [ ] Swap ESLint config to `eslint-config-next` + `@typescript-eslint`.
- [ ] Replace `styled-components` with Panda (config + tokens + recipes).
- [ ] Upgrade Firebase client to `^12`, Admin to `^13`.
- [ ] Migrate `db/firebase-client.js` → `db/client.ts` (modular).
- [ ] Migrate `db/firebase-server.js` → `lib/firebase-admin.ts`.

### App Router & structure
- [ ] Add `/app/layout.tsx`, base theme/providers.
- [ ] Move `/game/new` → `/app/game/new/page.tsx` (client).
- [ ] Create route handler `/app/api/games/[id]/moves/route.ts`.

### TypeScript & domain model
- [ ] Port `utils/game.js` → TS with typed `boardMap`, `Board`, `PositionId`.
- [ ] Add unit tests for eligibility, sequence, protection, Jacks.

### Server authority
- [ ] Implement transaction‑based move application on server.
- [ ] Create `moves` subcollection audit.
- [ ] Prevent client writes to protected fields via rules.

### Auth & lobby
- [ ] Enable Firebase Auth (anonymous).
- [ ] Create “Create/Join” flow + team seating.
- [ ] Enforce team sizes & start conditions on server.

### Deck/hand/discard
- [ ] Build deck (two decks), shuffle server‑side.
- [ ] Deal hands; store per‑user hand docs.
- [ ] Implement discard pipeline; hand counts on player doc.

### UX & A11y
- [ ] Board keyboard nav; focus rings via tokens.
- [ ] Mobile responsive board.

### Testing & CI
- [ ] Vitest unit pipeline.
- [ ] Playwright smoke test (two tabs simulate two users).
- [ ] GitHub Actions: lint/type/test.

---

## 6) Migration Notes & Code Patterns

### Firebase modular import patterns (client)
```ts
import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/db/client';

const gamesRef = collection(db, 'games');
const gameRef = doc(gamesRef, gameId);

const unsub = onSnapshot(gameRef, (snap) => {
  const data = snap.data();
  // set state...
});

await updateDoc(gameRef, {
  [`board.${position}`]: { team, isProtected: false }
});
```

### Firestore transaction pattern (server)
```ts
await db.runTransaction(async (tx) => {
  const snap = await tx.get(gameRef);
  const game = snap.data() as GameDoc;

  validateTurn(game, intent);                // throws on invalid
  const diff = computeDiff(game, intent);    // pure

  tx.update(gameRef, diff.update);
  tx.set(gameRef.collection('moves').doc(), makeMoveLog(intent, playerId));
});
```

### Panda CSS migration (example)
```tsx
// Replace styled.button with Panda:
import { styled } from 'styled-system/jsx';

export const Button = styled('button', {
  base: { px: '5', py: '3', rounded: 'xl', fontWeight: '600' },
  variants: {
    color: { primary: { bg: 'blue.600', color: 'white' } },
    size: { md: { fontSize: 'md' }, lg: { fontSize: 'lg' } },
  }
});
```

---

## 7) Security & Fair Play

- **Never trust the client.** All moves are server‑validated.
- **Rules:** Disallow writes to `board`, `deck`, `players.*.handCount`, `turn`, `teams.*` from clients; server‑only updates.
- **AuthZ:** Players can read the game; hand docs readable by **owner only**.
- **Anti‑replay:** Check `turn.index` monotonic in transaction; reject stale intents.

---

## 8) Open Decisions

1. **App Router now vs. later**  
   _Recommendation:_ move now while footprint is small; keep a thin compatibility layer if needed.

2. **Presence** (who’s online/typing)  
   - Firestore only (simpler) vs. RTDB onDisconnect (better presence semantics).  
   _Recommendation:_ start with Firestore; add RTDB later if needed.

3. **Hosting**  
   - Vercel (app) + Firebase (Auth/Firestore) is straightforward.

4. **State management**  
   - Local React state or lightweight store (Zustand) for UI only.  
   _Recommendation:_ keep it simple; server is source of truth.

5. **Rule variants**  
   - Configure `sequencesToWin`, hand size, dead cards in settings.

---

## 9) Definition of Done (v1)

- Create/join/start game works with auth.
- Hands dealt; per‑turn play with draw/place/remove, sequence detection, protection.
- Win condition enforced; game ends cleanly.
- Mobile‑friendly board; basic accessibility.
- Transactions for moves; rules prevent cheating.
- Unit + e2e smoke passing; deployed.

---

## 10) References (high‑level, for later linking)

- Node.js 22 (Active LTS timeline / releases).
- Next.js 15.x (release notes and migration guide).
- Firebase JS SDK v12 (modular) docs.
- Firebase Admin SDK v13 docs.
- Panda CSS docs (getting started & concepts).
