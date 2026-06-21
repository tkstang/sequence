---
title: 'Rules & Flows — Requirements Decisions'
date: '2026-06-11'
source: oat-brainstorm
---

# Rules & Flows — Requirements Decisions

*Companion to `directional-discovery.md`. Captures the requirements deep-dive brainstorm: official-rules encoding, physical-to-digital adaptation calls, edge-case rulings, and game-lifecycle flows. The official rules PDF (`sequence-game-instructions.pdf`) is the canonical rules source; this doc records only what the PDF can't answer plus deliberate deviations.*

## Overview

A requirements pass over the Sequence game rules and player-facing flows, resolving the gaps that would stall a one-shot build: jack semantics, sequence locking, dead cards, timers, lobby/team formation, concede/rematch, and creation/guest boundaries. All decisions below are settled unless listed under Open Questions.

**Why this matters:** The directional discovery doc settled the stack but left "tighten rules, edge cases, screens, and flows" as its first next step. The legacy codebase has no jack handling, no win condition, and no corner-as-wild logic — these decisions are the spec for writing that logic correctly the first time.

## Decisions

### Rules encoding (from the official PDF — encode faithfully)

- **Sequence:** 5 connected same-color chips — row, column, or diagonal.
- **Corners:** free spaces for all players; only 4 chips needed when using a corner; multiple players/teams may use the same corner. *(Gap in legacy algorithm — must be added.)*
- **Win condition:** 2 players/teams → 2 sequences; 3 players/teams → 1 sequence.
- **Sequence reuse:** one space from your first sequence may be part of your second.
- **Card deal:** 2p → 7 cards, 3p → 6, 4p → 6, 6p → 5.
- **Two-eyed jacks (4 in deck):** wild — place a chip on any open space.
- **One-eyed jacks (4 in deck):** remove an opponent chip not part of a completed sequence; completes the turn; cannot place on the freed space that same turn.
- **Completed sequences are locked:** chips in them can never be removed.
- **Deck depletion:** played cards reshuffle into a new draw deck (automatic, invisible plumbing digitally).
- **Jokers:** not used. Jacks do not appear on the board.

### Player counts & teams

- **Supported: 2, 3, 4, 6.** Official rules allow up to 12 (any count divisible by 2 or 3 — e.g. 8 = 2×4, 9 = 3×3); we cap at 6 deliberately for screen real estate and lobby sanity. The card-deal table makes raising the cap later a config change, not a rearchitect.
- 3-player is free-for-all (3 "teams"); 4 and 6 play as teams. Turn order alternates teams (derived automatically — the digital analog of alternating seats).

### Physical-to-digital adaptations

- **"Loss of Card" rule → auto-draw.** Drawing back to full hand happens automatically after every turn; the forgetting-to-draw penalty is vestigial and dropped.
- **"Table talk" rule → dropped.** Unenforceable digitally; chat is post-MVP anyway.
- **Dealer determination (cut for low card) → dropped.** First player/turn order handled by the lobby.
- **Dead card** (both board spaces covered):
  - *Default mode:* auto-swapped (one per turn) at the start of the player's turn, with a notification.
  - *Hard mode:* the player must notice it themselves and turn it in (select → discard gesture; exact UX designed later).
  - Dead-card status is **evaluated per-turn, never flagged permanently** — a one-eyed jack can free a space and resurrect a previously dead card.
- **Turn timer:** off by default; the game creator may enable one — 30-second increments up to 3 minutes, then 1-minute increments beyond. Timeout = the turn is forfeited outright (no play, no draw). Timer pauses if a player drops (consistent with the disconnect/auto-save model).

### Edge-case rulings

- **Double sequence in one move** (crossing lines): instant win in a 2-sequence game.
- **Run longer than 5:** the placing player taps which 5 chips constitute the locked sequence. (An exactly-5 run locks automatically.)
- **One-eyed jack with no legal target** (no opponent chips, or all locked in sequences): **simply unplayable that turn** — not a dead card. Rationale: it regains value the moment an opponent places a chip, so auto-swapping it would act against the player's interest; and a fully unplayable hand is mathematically impossible (only 4 one-eyed jacks exist, minimum hand size is 5 at our 6-player cap, auto-draw keeps hands full).
- **Chip lock state** (sequence membership) is first-class in the data model — required for one-eyed-jack target validation and sequence-reuse counting.

### Information visibility

- Each player's **last played card** is displayed (doubles as "what just happened").
- **No discard-pile browsing** — not opponents', not your own.
- A **"Round N" indicator** is shown; card-counters can do their own math.
- The full move log still lands in the DB (replays, future chat) — this is purely a UI-exposure decision.

### Play mode

- **Per-game setting, chosen by the creator** at game creation, with an in-UI explanation of the difference. Everyone in a game plays under the same mode — mixed modes would handicap hard-mode players.
- *Default (tap-to-reveal):* tap a card → valid squares highlight → tap to confirm.
- *Hard mode (drag-with-validation):* no pre-highlighting; drag a **generic chip** (not a card), hover shows a confirm highlight, invalid placement rejected with feedback. Dead cards must be self-noticed (see above).
- **Card consumption on drop (hard mode):** the system auto-consumes the natural matching card; a two-eyed jack is only spent when it's the *only* way to make the placement — never implicitly. One-eyed jack removal is its own gesture (e.g. drag the opponent's chip off the board).

### Lobby & team formation

- **Players pick their own team slot on join** — lobby shows team slots (e.g. Blue ●●○ / Green ●●○); friends self-sort.
- Creator can move/kick players and hit **randomize** as a tiebreaker.
- Turn order (alternating teams) is derived automatically once teams are set.

### Game lifecycle

- **Creation requires login; guests can only join** (via invite link, ephemeral per the discovery doc). The creator anchors settings, the invite link, and rejoin/rematch identity.
- **Creator-owned game settings:** player/team count, play mode (default/hard), turn timer (off | increments as above).
- **Concede:** any player may concede; their team takes the recorded loss and the game ends immediately. Works uniformly for 2-player, free-for-all, and team games.
- **Game over:** winning sequence highlighted; win/loss recorded for logged-in players.
- **Rematch:** one tap — new game, same roster, same settings; first player rotates between rematches. (No series scoring in MVP — win-loss records cover bragging rights.)
- Disconnect/auto-save (1-hour rejoin window), save & exit (1 week), and the all-original-players resume rule are per the discovery doc.

### Screens & flows (MVP inventory)

1. **Landing/marketing** — the only server-rendered route
2. **Auth** — sign up / log in (email+password and/or social)
3. **Home/dashboard** — create game, resumable games, recent results strip
4. **Create game** — settings: player/team count, play mode (with explanation), turn timer
5. **Lobby** — team slots (self-sort), creator controls (move/kick/randomize), invite link/code, start
6. **Game** — board, hand, last-played-per-player, Round N, turn indicator, timer if enabled, concede / save & exit
7. **Game over** — winning sequence highlighted, result, rematch, back to home
8. **Join flow** — invite link landing: game preview + join as guest or log in
9. **History/Profile** — aggregate win-loss record, completed-games list, **head-to-head per-opponent records**

Deliberately not MVP screens: settings page, spectator view, replay viewer (the move log supports replays later).

### Offline / connection handling

- **Server-authoritative, fail-and-retry.** A move commits only on server confirmation; during a connection blip the UI blocks input with a "reconnecting…" state. Turn-based play, pause-on-drop timers, and auto-save make this nearly free.
- Optimistic UI with rollback for the single in-flight move is a **later, purely client-side layer** — no protocol change required.

## Open Questions

*(Design-phase material — requirements are settled.)*

- Exact UX for hard-mode dead-card turn-in gesture.
- Mobile drag ergonomics and move-rejection feedback animation.

## Next Steps

- Pressure-test the stack & architecture decisions (brainstorm bucket B) before they harden.
- Fold these decisions into the full requirements doc that precedes the design pass (data model + API surface).
- Sequence-logic spec for the rewrite must include: corner-as-wild, jack handling, win-by-count, sequence locking, per-turn dead-card evaluation — all absent from the legacy algorithm.

---

<details>
<summary>Transcript Session Note</summary>

Session 2026-06-11 (oat-brainstorm). Oriented via `directional-discovery.md`, `code-organization.md`, and two codebase-exploration subagents (legacy asset inventory: pure game logic in `utils/game.js` worth referencing, boardMap and 52 SVG cards extract as-is, no jack/win/corner logic exists, zero tests; repo still single-app layout, 2025 modernization superseded, committed GCP service key flagged for scrubbing). User added the official rules PDF. Chose requirements deep-dive (option A) over stack pressure-testing or project structuring. Decisions landed in order: player cap 2/3/4/6 (corrected 8-player team math — 8 = 2×4 — but capped anyway); auto-draw; dead-card handling by mode; creator-set turn timer with forfeit-on-timeout and pause-on-drop; untimed by default; double-sequence instant win; tap-to-choose lock for >5 runs; last-played-card + Round N visibility (no pile browsing, including your own); per-game creator-set play mode with explanation; self-sort team slots with creator randomize/kick; concede ends game with team loss; rematch same-roster/settings with rotating first player; login required to create, guests join-only; one-eyed jack with no targets is unplayable-not-dead (user spotted the no-stuck-state proof: 4 one-eyed jacks < minimum hand of 5); dead-card status evaluated per-turn since one-eyed jacks can resurrect dead cards. Continued: 9-screen MVP inventory confirmed with History/Profile promoted to a full screen (option C) scoped to aggregate W-L + games list + head-to-head (option B); offline handling settled as server-authoritative fail-and-retry (option A) with optimistic-rollback as a later client-only layer; hard-mode drag settled as generic-chip drag with natural-card auto-consumption, jacks never spent implicitly (option A). Session continues into stack pressure-testing.

</details>
