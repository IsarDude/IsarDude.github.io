---
title: "GameDuell WebGL Card Games: FreeCell, Spider & Solitaire"
summary: "Three competitive browser card games for GameDuell.com, built in Unity WebGL on a shared Robotlegs framework."
order: 3
draft: false
tags:
  - Unity
  - C#
  - WebGL
  - Robotlegs
  - Professional Project
image: "/images/projects/gameduell-webgl-card-games/cover.jpg"
demoUrl: ""
repoUrl: ""
---

- **Project Type:** Professional project at GameDuell (GameDuell.com)
- **Platforms:** WebGL, desktop and mobile browsers
- **My Role:** Unity Game Programmer
- **Team Size:** 3
- **Games:** FreeCell, Spider (Spider, Spider Pro, Spider Light) and Solitaire (SO3 and SH2 variants)
- **Tech:** Unity, C#, Robotlegs (MVCS), in-house ClassicFramework, DOTween, WebGL JS bridge

FreeCell, Spider and Solitaire are three card games for GameDuell.com. Each is a competitive 1v1 game in which two players race to clear the same shuffled deck. Spider and Solitaire are Unity rewrites of legacy Haxe/Flash clients. The games run in desktop and mobile browsers and share one architecture and one in-house framework, so I treat them as a single project. All three are live on GameDuell:

- [FreeCell](https://www.gameduell.de/gd/s03.do?gametype=fr2&ref=gamespage_search#/fr2)
- [Spider](https://www.gameduell.de/gd/s03.do?gametype=s2i&ref=gamespage_search#/s2i)
- [Solitaire](https://www.gameduell.de/gd/s03.do?gametype=so3&ref=gamespage_search#/so3)

<video src="/videos/gameduell-webgl-card-games/showreel.mp4" poster="/videos/gameduell-webgl-card-games/poster.jpg" width="1920" height="1080" controls preload="metadata" playsinline class="w-full h-auto rounded-lg" aria-label="Showreel of FreeCell, Spider and Solitaire gameplay"></video>

## What I worked on

### Shared foundation

- **Robotlegs MVCS architecture.** All three games are built on Robotlegs (Command, Event, Mediator, Model, with dependency injection) on top of a shared in-house "ClassicFramework". Game rules go through a command pipeline of guards, commands and events, which keeps View, Model and Command layers cleanly separated and testable.
- **Card engine with pile guards.** Pile and card abstractions with Strategy-pattern pile guards that enforce each game's stacking and sequence rules per pile type (tableau, foundation, stock, discard, freecell, joker).
- **Card factory.** A two-layer factory splits the card model from its Unity view. The model layer translates raw card codes into the framework's type-safe rank enum and fails loudly on a malformed deal. The view layer caches card views by card ID instead of re-instantiating them, and switches skins live at runtime without rebuilding the board.
- **Drag-and-drop interaction system.** Pointer-driven dragging via Begin/Drag/End commands, with multi-card sequence dragging, drop-zone validation, hit-area and drop-area recalculation, highlight and interactable-state management, double-click interactions, and animated snap-back on invalid drops.
- **Auto-complete.** An automove command scans the relevant piles after each move and promotes safe cards to the foundations. It is animation-aware and chains consecutive automoves.
- **Undo system.** Built on the framework's checkpoint-based undo log. Every completed player action passes through a move-finished command, which saves one checkpoint, so a logical move (for example a sequence move that also reveals a face-down card) reverts as a single unit. The log supports multi-step rollback and is cleared at game start so no state leaks between rounds.
- **Identical card sets for both players.** Both competing players receive the same encrypted game set (deck, set ID, solver name, play time), so they play the exact same deal, which makes head-to-head scoring fair.
- **Hook-based animation/logic synchronization.** A generic hook service with animation, movement and default hook types acts as a lightweight lock for async UI state. It defers game logic such as automoves, input, undo and turn transitions until in-flight DOTween animations finish.
- **Scoring and bonuses.** Event-driven scoring decoupled from game logic via Robotlegs commands and events, covering foundation and clear-tableau bonuses, joker bonuses, reveal-card scoring and undo penalties.
- **JS-to-Unity communication layer.** A communication abstraction with a WebGL/JS-bridge implementation for production (init, game start, resize, abort, forced game start and game options), decoupling the embedding web page from game logic. An editor-only fake implementation replays the same message sequence locally, so each game can be built and tested without the backend.
- **Responsive layout.** A zoom-level system plus container-resize handling adapts layouts to viewport size, including desktop landscape and mobile portrait in the same WebGL build.
- **Localization.** A live localization pipeline driven by a translation tool and an automated update script, including per-locale card rank glyphs (for example Jack is "J" in English, "B" in German, "V" in French).
- **Theming and skinning.** Runtime-switchable table themes, card backs and card fronts, with automatic sprite fallback to the base asset so an incomplete skin degrades gracefully.

### FreeCell

- **Card marking.** A rank-marking module lets players highlight every card of a rank to speed up planning.

### Spider

- **Three variants, one codebase.** Spider, Spider Pro and Spider Light differ only in their rule config.
- **Stock preview.** Spider Pro's "peek before dealing" UI, built on the same hit-area pattern as the drag-and-drop challenge below.

### Solitaire

- **Klondike-style engine, two variants.** SO3 and SH2 with foundation, tableau, stock and discard pile logic.
- **Demo mode.** Scripted fake game sets provide onboarding for first-time players.
- **SDK integrations.** Facebook SDK, Braze (Appboy) events, Lunar Console, Unity Ads iOS support and Apple App Tracking Transparency, implemented for an unpublished mobile app version of the game.
- **Custom iOS build pipeline.** A custom build tool editor package drives Jenkins pipelines for automated iOS builds and archiving.

## Engineering Challenges

### Animation and game-logic race conditions

**The problem.** In a Robotlegs architecture, game-state changes (card moves, automoves, scoring, turn transitions) are dispatched as discrete, synchronous commands. Their visual representation (DOTween card moves, UI transitions) plays out asynchronously over many frames. In FreeCell, if the automove command triggered the next move while a card was still in flight to the foundation, the result was overlapping visuals and snapping cards. Fixed delays are fragile, because animation duration varies with zoom level, card distance and device performance.

**The solution.** I built a generic, identifier-based hook/lock system on the shared ClassicFramework, wired into FreeCell through a FreeCell-specific hook service:

- Animating views (card movers, UI panels) raise an event when an animation starts and another when it ends, tagged with a hook type.
- A custom mediator forwards these events to the central hook service, which tracks active hooks per type and identifier. It is essentially a reference-counted semaphore per animation category.
- Game-logic commands never poll or sleep. They hand a callback to the hook service, which runs it immediately if no relevant hook is active, or defers it until the last matching hook is released.

The automove command uses this to re-run only after all movement hooks clear.

**The result.** Game logic waits for the presentation without blocking the main thread or polling. The hook service is generic over an enum, so any view can hook into it and the logic layer never needs to know how an animation works. Animation timing can vary freely.

### Precise drag-and-drop on an overlapping fan-of-cards layout

**The problem.** In Spider the 10 tableau piles sit edge-to-edge, and at zoomed-out layouts each card is only a thin sliver. With default Unity UI raycasting this caused two usability failures:

- **Overlapping hit areas.** Neighboring piles' colliders can overlap at the shared border, so a drop near one pile's right edge may register on the next pile, and the cards land somewhere the player didn't intend.
- **Dead zones on concealed cards.** A pile's bottom unconcealed (draggable) card is often a thin strip on top of a wall of face-down cards. The natural hit area for starting a drag is tiny, which makes dragging sequences fiddly, especially for touch input.

**The solution: a two-part dynamic hit-area system.**

- **Drag-start hit-area extension.** Instead of the literal card bounds, the system finds the bottom-most unconcealed card in each tableau pile and enlarges its draggable region to cover the concealed cards beneath it. A sequence can be grabbed from anywhere in that visual stack.
- **Conflict-aware drop-target extension.** When a drag begins, every tableau and joker pile's guard is asked whether it is a valid drop target for the dragged sequence. Only valid targets get a hit area enlarged to both sides, and invalid ones are marked non-interactable. This alone prevents drops onto piles that couldn't accept the cards.

The hard part is resolving conflicts between neighbors. If two adjacent piles are both valid, they can't both expand into the gap between them, or the ambiguous-overlap bug returns with larger zones. A single left-to-right sweep over the ordered pile list adjusts each pile's growth direction based on its neighbor. If a pile's left neighbor is a valid target, the pile may only grow rightward, and the neighbor loses its rightward growth (it then grows only in height, or only to the left). The expanded zones can never touch. It's one O(n) pass over at most 10 piles, re-run on every drag start and update.

**The result.** Drops only land on piles that can legally take them, and sequences are easy to grab even on a touch screen. The same growth-direction pattern also drives Spider Pro's stock preview.

### Making a generic undo system reverse game-specific side effects

**The problem.** The ClassicFramework provides a game-agnostic undo log: one call commits a checkpoint and another rolls back to it. Systems opt in by dispatching undoable events that can produce their own inverse. Making it behave correctly for Solitaire took more than plugging it in:

- **Side effects don't always reverse by replay.** Undoing a move must cancel whatever score it produced, while a real player undo must also apply a separate penalty, without double-counting.
- **One undo call serves two features.** The explicit Undo button costs points. Snapping a card back after an illegal drop must not cost points or look like an undo.
- **What counts as one step.** A single card placement can cascade into several automatic foundation moves, but undo should reverse "my last move", not the last atomic card transfer.
- **A "single undo per game" rule** without building a second system to track it.

**The solution.**

- The score event carries a reverse flag instead of a raw delta, and its inverse is the same event with the flag flipped. The handler that applies a score change also reverses it, with no special undo logic in the scoring system.
- The two use cases are separated at the call site. The invalid-drop command calls undo with no bookkeeping. A separate undo-penalty command wraps the player-facing undo with the undo counter and the penalty score event. The engine never knows which caller it serves.
- The checkpoint is saved in the move-finished command, which runs only after hooks confirm that all animations and automove cascades for the move have settled. One checkpoint equals one player-perceived move.
- The single-undo rule is declarative: a clear-after-undo flag on the undo log is set once at game start, so a second undo has nothing left to roll back, and game code keeps no extra state.

**The result.** The framework's undo log stays game-agnostic and reusable, and every Solitaire-specific rule lives in the commands that call it.
