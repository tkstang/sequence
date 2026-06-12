# Wireframe Decisions — web-mvp

Visual-companion session, 2026-06-12. The HTML files are self-contained mockups (open in any browser); each shows the option set presented — the decisions below record which option was approved. These resolve the design's "Wireframes" open question and feed Phase 6 (Game UI) tasks.

## Decisions

1. **Mobile game screen** (`game-screen-mobile.html`) → **A: Peeking hand.**
   Board maximized; hand fans up from the bottom edge, partially overlapping the board's bottom rows. Tap hand to raise fully, tap away to drop back to a peek. Top player rail: per-player chip color + last-played card (FR13), round + timer on the right. Desktop: same elements, board centered, hand below, rail to the side (uncontested — not separately wireframed).

2. **Pass-and-play handoff (FR16)** (`handoff-interstitial.html`) → **B: Hand veil only.**
   Board stays visible during the pass (public information); only the hand area is veiled. The veil drops automatically the instant a move commits (no accidental-flash window); the incoming player taps the veil to fan their cards up. Veil shows last move + whose turn.

3. **Lobby** (`lobby-teams-v4.html`) → **A2: Stacked team rows.**
   Each team is a full-width band (Blue/Green/Red stacked), slots side-by-side within the band; "tap to join" empty slots double as the waiting indicator. Iterated from side-by-side columns (v1/v3), which cramped at three teams. Header: invite code + copy link + settings summary; derived turn-order preview; creator gets kick (✕) + randomize; start button enables only when slots validly filled. 3-player FFA = three single-slot bands.

4. **Dashboard** (`dashboard.html`) → approved as proposed.
   Actions first (Create game primary; Pass & play secondary), then "Your games" with status badges (FROZEN/SAVED) and **expiry countdowns** + the all-must-return note, then recent-results strip (W/L markers, local games labeled) linking to full history/head-to-head.

## Deliberately not wireframed

Auth screens, landing, join page, history page, game-over — conventional layouts; build follows the established visual language (dark slate `#2d3142` chrome, felt-green board, cream surface, team colors blue `#3a6ea5` / green `#2e9e5b` / red `#c0453c`). The mockups' palette is directional, not final design polish.

## Still open for Phase 6

- Hard-mode gesture details: dead-card turn-in gesture, misdrop feedback animation (wire contract unaffected).
