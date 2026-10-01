---
title: "Spades Relax"
summary: "Mobile multiplayer Spades for iOS and Android at GameDuell. I owned a skippable round result flow across client and backend, an event-driven celebration system, a designer-facing effects sequencer with a custom editor tool, and a dynamic round result screen."
date: "2026-09-30"
draft: false
tags:
  - Unity
  - C#
  - Mobile
  - Multiplayer
  - Professional Project
image: "/images/projects/spades-relax/icon.png"
demoUrl: "https://play.google.com/store/apps/details?id=com.gameduell.spades.relax.classic.card.game&hl=gsw"
---

- **Project Type:** Professional project at GameDuell
- **Platforms:** iOS, Android
- **My Role:** Unity Game Programmer
- **Team:** 3 developers, 2 2D artists, 1 product owner, 1 product manager, 1 UX designer, 1 game designer
- **Tech:** Unity, C#, Zenject (DI), MVP, DOTween, ScriptableObjects, custom editor tooling, shader-driven effects
- **Availability:** Currently available in the US only

**Spades Relax** is a live multiplayer Spades game where you play the classic trick-taking card game against real players, in solo or team mode. It is live on both stores:

- [Google Play](https://play.google.com/store/apps/details?id=com.gameduell.spades.relax.classic.card.game&hl=gsw)
- [App Store](https://apps.apple.com/us/app/spades-relax-classic-card-game/id6755433257?l=fr-FR)

<iframe
  src="https://www.youtube.com/embed/gpRkx39kAdE"
  title="Spades Relax — Trailer"
  style="width: 100%; aspect-ratio: 16 / 9; border: 0; border-radius: 0.5rem;"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen
  loading="lazy"
></iframe>

![Spades Relax match table](/images/projects/spades-relax/screenshot-1.jpg)

## What I Worked On

Alongside core gameplay work across the match lifecycle (from setup to round result), tutorials and the first-time user experience, VFX/SFX and animation polish, I owned the following features end to end, from technical design through to shipping.

- **Skippable Round Result Popup (front end and backend).** After every round, all players see a synced round result before the next round starts. I replaced the single shared, fixed-length countdown with per-player readiness confirmation, so players who are ready no longer wait on anyone else. The feature spans the Unity client and the backend.
  - **Backend:** Introduced a simultaneous state to the backend core game state machine, where every player is expected to respond. Each player has an individual timeout, and the round advances once everyone has confirmed or timed out. Fast players aren't held up, and AFK players can't block the game.
  - **Client:** The continue button is active immediately. Tapping it publishes a message on the local message bus, which the gameplay state chart translates into a generic "I'm ready" network message. The countdown runs against a server-provided deadline, so the UI always matches the server.
- **Celebration System.** Designed and built an event-driven system that detects gameplay milestones in real time (for example "Spades Broken" and successful or failed bids) and triggers visual and audio feedback for the right player among four competing seats in a team-based format.
  - **Correct and exact:** Semantic outcomes are derived from raw score and trick state at precise trigger points, such as the moment a winning trick completes, so each celebration reaches the right player or team and fires once.
  - **Decoupled and extensible:** A publish/subscribe pattern separates "when to celebrate" (game logic) from "how to celebrate" (per-seat visual and audio presentation). New celebration types need no changes to the detection logic, and the game rules stay testable and independent of presentation.
  - **Conflict-safe UI:** Guards prevent overlapping animations when several celebration conditions are true at once.
- **Guided Effects Sequencer.** Designed and built a designer-facing system that choreographs subtle shader-driven effects (glows and pulses on buttons and table tiles) to guide the player's eye to the right element at the right time on the home screen. Timing lives in data instead of in each widget.
  - **Designer-editable:** Sequences are ScriptableObject assets, so designers set groups, delays, stagger, sort order and pauses in the Inspector and re-tune without code changes. I also built a custom Unity editor window that gives designers an overview of all effects and setiings as the number grows.
  - **Self-registering effects:** Effects appear and disappear at runtime (screen transitions, pooling, feature flags), so the sequencer holds no hard references. Each effect registers itself with an injected sequencer service on enable and unregisters on disable or destroy, and effects are grouped by a string ID.
  - **DOTween-driven:** I used DOTween Sequences to construct and loop the effects, with one looping Sequence per group instead of per-effect coroutines or Update polling. Groups run on independent cadences and can be enabled or disabled individually. A tween also drives each shader's time property, which gives complete control over the shader's time cycle, including pausing mid-cycle, resuming from the same phase and resetting.
- **Dynamic Round Result Screen.** Built the round result screen that shows game statistics and a full history of the match so far. One presenter serves two structurally different modes, 2 teams of 2 and 4 individual players.
  - **One UI, two data shapes:** The server stores every stat per player, but the screen needs it per team (summed pairs) or per player depending on the mode. I centralised that difference in one dispatch step, so row population stays mode-agnostic and a third mode would be easy to add.
  - **Stable display order and history:** I build a local-player-first display order once per round and index every stat row through it, which keeps all columns consistent. Rows for every previous round are created dynamically through the DI container so each gets its dependencies injected.

## Screenshots

![Spades Broken celebration effect](/images/projects/spades-relax/screenshot-2.jpg)

![Round result screen](/images/projects/spades-relax/screenshot-4.jpg)

![Table selection and leagues](/images/projects/spades-relax/screenshot-3.jpg)

*Store screenshots and trailer © GameDuell GmbH.*
