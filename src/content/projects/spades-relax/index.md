---
title: "Spades Relax"
summary: "Mobile multiplayer Spades for iOS and Android at GameDuell. I owned a skippable round result flow across client and backend, an event-driven celebration system, a designer-facing effects sequencer with a custom editor tool, and a dynamic round result screen."
order: 1
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

Spades Relax is a live multiplayer Spades game where you play the classic trick-taking card game against real players, in solo or team mode. It is live on both stores:

- [Google Play](https://play.google.com/store/apps/details?id=com.gameduell.spades.relax.classic.card.game&hl=gsw)
- [App Store](https://apps.apple.com/us/app/spades-relax-classic-card-game/id6755433257?l=fr-FR)

<iframe
  src="https://www.youtube.com/embed/gpRkx39kAdE"
  title="Spades Relax trailer"
  style="width: 100%; aspect-ratio: 16 / 9; border: 0; border-radius: 0.5rem;"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen
  loading="lazy"
></iframe>

![Spades Relax match table](/images/projects/spades-relax/screenshot-1.jpg)

## What I worked on

I worked on core gameplay across the whole match, from setup to round result, on tutorials and the first-time user experience, and on VFX, SFX and animation polish. I owned the features below from technical design through to release.

- **Skippable round result popup (front end and backend).** After every round, all players see a synced round result before the next round starts. I replaced the single shared, fixed-length countdown with per-player readiness confirmation, so players who are ready no longer wait on anyone else.
  - **Backend:** Added a simultaneous state to the backend's core game state machine in which every player is expected to respond. Each player has their own timeout, and the round advances once everyone has confirmed or timed out, so fast players don't wait and AFK players can't block the game.
  - **Client:** The continue button is active immediately. Tapping it publishes a message on the local message bus, which the gameplay state chart translates into a generic "I'm ready" network message. The countdown runs against a deadline from the server, so the UI always matches the server.
- **Celebration system.** An event-driven system that detects gameplay milestones in real time (for example "Spades Broken" and successful or failed bids) and plays visual and audio feedback for the right seat out of four, in a team-based format.
  - Outcomes are worked out from the raw score and trick state at fixed trigger points, such as the moment a winning trick completes, so each celebration goes to the right player or team and fires exactly once.
  - A publish/subscribe pattern separates "when to celebrate" (game logic) from "how to celebrate" (per-seat visual and audio presentation). New celebration types need no changes to the detection logic, and the game rules stay testable without any presentation code.
  - Guards prevent overlapping animations when several celebration conditions are true at once.
- **Guided effects sequencer.** A system that lets designers choreograph subtle shader effects (glows and pulses on buttons and table tiles) that lead the player's eye to the right element on the home screen at the right time. The timing lives in data, not in each widget.
  - Sequences are ScriptableObject assets, so designers set groups, delays, stagger, sort order and pauses in the Inspector and re-tune them without code changes. I also built a custom Unity editor window that lists every effect and its settings, which helps as the number of effects grows.
  - Effects appear and disappear at runtime (screen transitions, pooling, feature flags), so the sequencer holds no hard references. Each effect registers itself with an injected sequencer service on enable and unregisters on disable or destroy. Effects are grouped by a string ID.
  - The effects run on DOTween Sequences, one looping Sequence per group rather than a coroutine or Update poll per effect. Groups run on their own cadence and can be switched on or off individually. A tween also drives each shader's time property, so a shader can be paused mid-cycle, resumed from the same phase or reset.
- **Dynamic round result screen.** The round result screen shows game statistics and the full history of the match so far. One presenter serves two structurally different modes: 2 teams of 2, and 4 individual players.
  - The server stores every stat per player, but depending on the mode the screen needs it per team (summed pairs) or per player. I centralised that difference in one dispatch step, so filling the rows doesn't depend on the mode and a third mode would be easy to add.
  - I build a local-player-first display order once per round and index every stat row through it, which keeps all columns consistent. Rows for previous rounds are created dynamically through the DI container, so each one gets its dependencies injected.

## Screenshots

![Spades Broken celebration effect](/images/projects/spades-relax/screenshot-2.jpg)

![Round result screen](/images/projects/spades-relax/screenshot-4.jpg)

![Table selection and leagues](/images/projects/spades-relax/screenshot-3.jpg)

*Store screenshots and trailer © GameDuell GmbH.*
